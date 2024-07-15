import { getReasonPhrase } from 'http-status-codes';
import moment from 'moment';
import { syllable } from 'syllable';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { error429Haiku, error4xxHaiku, notFoundHaiku, serverErrorHaiku } from '@/services/stores/samples';
import { Haiku, HaikuAction } from '@/types/Haiku';
import { User } from '@/types/User';
import { formatActionInProgress, formatPastAction } from '@/utils/format';
import { listToMap, mapToList, mapToSearchParams, uuid } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from "./alert";
import useHaikudle from './haikudle';
import useUser from './user';

async function fetchOpts() {
  const token = await useUser.getState().getToken();
  // console.log(">> hooks.haiku.fetchOpts", { token });
  return token && { headers: { Authorization: `Bearer ${token}` } } || {};
}

async function handleErrorResponse(res: any, resourceType: string, resourceId: string | undefined, message?: string | undefined) {
  trackEvent("error", {
    type: resourceType,
    code: res.status,
    userId: (await useUser.getState()).user.id,
    id: resourceId,
  });

  const errorMessage = res.status == 429
    ? `Exceeded daily limit: please try again later`
    : res.status == 404
      ? `${message || "An error occured"}: ${res.status} (${res.statusText || getReasonPhrase(res.status)})`
      : `${message || "An error occured"}: ${res.status} (${res.statusText || getReasonPhrase(res.status)})`;

  // smooth out the the alert pop-up
  setTimeout(
    [429, 404].includes(res.status)
      ? () => useAlert.getState().warning(errorMessage)
      : () => useAlert.getState().error(errorMessage)
    , 500);

  const errorHaiku =
    res.status == 404
      ? notFoundHaiku
      : res.status == 429
        ? error429Haiku
        : res.status >= 400 && res.status < 500
          ? error4xxHaiku(res.status, res.statusText || getReasonPhrase(res.status))
          : serverErrorHaiku(res.status, res.statusText || getReasonPhrase(res.status));

  errorHaiku.error = errorMessage;

  return errorHaiku;
}

type HaikuMap = { [key: string]: Haiku | undefined; };
type StatusMap = { [key: string]: boolean };

const initialState = {
  _mode: "haiku",

  // access via get(id) or find(query?)
  _haikus: <HaikuMap>{},

  // to smooth out UX when deleting,
  _deleted: <StatusMap>{},

  // access via loaded(queryOrId?),
  // stored as id->bool or query->bool, 
  // where id refers to the loaded haiku 
  // and query is stringyfied json from loaded
  // list of haikus
  _loaded: <StatusMap>{},
}

const useHaikus: any = create(devtools((set: any, get: any) => ({
  ...initialState,

  reset: () => {
    // console.log(">> hooks.haiku.reset", {});
    return new Promise(async (resolve) => {
      set(initialState);
      resolve(true);
    })
  },

  get: (id: string) => {
    const { _haikus } = get();
    // console.log(">> hooks.haiku.get", { id, _haikus });
    return _haikus[id];
  },

  getRandom: () => {
    const { _haikus } = get();
    // console.log(">> hooks.haiku.getRandom", { _haikus });
    const haikus = mapToList(_haikus);
    const haiku = haikus[Math.floor(Math.random() * haikus.length)];
    // console.log(">> hooks.haiku.getRandom", { haiku });

    return haiku;
  },

  find: (query?: object) => {
    const { _haikus, _deleted } = get();
    const [k, v] = Object.entries(query || {})[0] || [];

    return mapToList(_haikus)
      .filter(Boolean)
      .filter((e: any) => !_deleted[e?.id])
      .filter((e: any) => !k || !v && !e[k] || v && e[k] == v);
  },

  loaded: (idOrQuery?: object | string) => {
    const { _loaded } = get();
    // console.log(">> hooks.haiku.loaded", { idOrQuery, _loaded });

    if (!idOrQuery) {
      return _loaded[JSON.stringify({})];
    }

    if (typeof (idOrQuery) == "string") {
      return _loaded[idOrQuery];
    }

    if (typeof (idOrQuery) == "object") {
      return _loaded[JSON.stringify(idOrQuery || {})];
    }
  },

  setLoaded: (entitiesOrQueryOrId: any, loaded: boolean = true) => {
    const { _loaded } = get();

    if (!entitiesOrQueryOrId) {
      return set({
        _loaded: {
          ..._loaded,
          [JSON.stringify({})]: loaded
        }
      });
    }

    if (Array.isArray(entitiesOrQueryOrId)) {
      return set({
        _loaded: {
          ..._loaded,
          ...listToMap(entitiesOrQueryOrId, { valFn: () => true })
        }
      });
    }

    if (typeof (entitiesOrQueryOrId) == "string") {
      return set({
        _loaded: {
          ..._loaded,
          [entitiesOrQueryOrId]: loaded,
        }
      });
    }

    if (typeof (entitiesOrQueryOrId) == "object") {
      return set({
        _loaded: {
          ..._loaded,
          [JSON.stringify(entitiesOrQueryOrId)]: loaded
        }
      });
    }
  },

  init: async (haiku: Haiku, queryOrId?: object | string, mode?: string): Promise<Haiku | Haiku[]> => {
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    // console.log(">> hooks.haiku.init", { mode, id, query: JSON.stringify(query), haiku });

    const { setLoaded, _mode, _haikus } = get();
    const { dailyHaikus, dailyHaikudles } = useUser.getState();

    // console.log(">> hooks.haiku.init", { dailyHaikus, dailyHaikudles });

    haiku.dailyHaikuId = dailyHaikus[haiku.id]?.id;
    haiku.dailyHaikudleId = dailyHaikudles[haiku.id]?.id;

    if ((haiku.lang || "en") == "en") {
      const syllables = haiku.poem
        .map((line: string) => line.split(/\s/)
          .map((word: string) => syllable(word))
          .reduce((a: number, v: number) => a + v, 0))
      haiku.isIncorrect = !(syllables[0] == 5 && syllables[1] == 7 && syllables[2] == 5)
        ? `does not follow the correct form of 5/7/5 syllables: ${syllables.join("/")}`
        : undefined;
    }

    set({
      mode: mode || _mode,
      _haikus: { ..._haikus, [haiku.id]: haiku },
    });
    setLoaded(id);

    return haiku;
  },

  load: async (queryOrId?: object | string, mode?: string, version?: string): Promise<Haiku | Haiku[]> => {
    const { setLoaded, _mode, init } = get();
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    // console.log(">> hooks.haiku.load", { mode, id, query: JSON.stringify(query) });

    return new Promise(async (resolve, reject) => {
      if (id) {
        const params = mapToSearchParams({ mode, version });
        fetch(`/api/haikus/${id}${params ? `?${params}` : ""}`, await fetchOpts()).then(async (res) => {
          const { _haikus } = get();

          if (res.status != 200) {
            const errorHaiku = await handleErrorResponse(res, "fetch-haiku", id, `Error fetching haiku ${id}`);
            useHaikus.setState({ _haikus: { [errorHaiku.id]: errorHaiku } });
            setLoaded(errorHaiku.id);
            return resolve(init(errorHaiku, queryOrId, mode));
          }

          const data = await res.json();
          const haiku = data.haiku;

          // race condition: /api/haikus/:id returned a haiku but /api/user 
          // didn't see that haiku as viewed yet: fake it locally
          if (haiku) {
            const userState = await useUser.getState();
            if (!userState?.user?.isAdmin && !userState.haikus[haiku.id]) {
              useUser.setState({
                haikus: {
                  ...userState.haikus,
                  [haiku.id]: {
                    ...haiku,
                    viewedAt: moment().valueOf(),
                  }
                }
              })
            }
          }

          return resolve(init(haiku, queryOrId, mode));
        });
      } else {
        // const modeParams = mode && `mode=${mode || _mode}`;
        // const queryParams = query && mapToSearchParams(query);
        // const params = `${queryParams || modeParams ? "?" : ""}${queryParams}${queryParams && modeParams ? "&" : ""}${modeParams}`;
        // const params = // "?mode=haiku";

        const params = mapToSearchParams({
          ...query
          // ..._mode(mode ? { mode } : {}),
        });

        fetch(`/api/haikus${params ? "?" : ""}${params}`, await fetchOpts()).then(async (res) => {
          const { _haikus } = get();
          setLoaded(query);

          if (res.status != 200) {
            const errorHaiku = await handleErrorResponse(res, "fetch-haikus", undefined, `Error fetching haikus`);
            useHaikus.setState({ _haikus: { [errorHaiku.id]: errorHaiku } });
            setLoaded(errorHaiku.id);
            return resolve(init(errorHaiku, queryOrId, mode));
          }

          const data = await res.json();
          const haikus = data.haikus;
          setLoaded(haikus);

          // special case for random fetch: only keep the last one
          // @ts-ignore
          if (query.random) {
            // race condition: make sure that initial load we have at least have the one haiku in the side panel
            const { userHaikus } = get();
            const viewedHaiku = {
              ...haikus[0],
              viewedAt: moment().valueOf(),
            };

            set({
              mode: mode || _mode,
              _haikus: { ..._haikus, ...listToMap(haikus) },
              userHaikus: { ...userHaikus, ...listToMap([viewedHaiku]) },
            });
            return resolve(init(haikus[0], queryOrId, mode));
          } else {
            // race condition: /api/haikus returned today's haiku but /api/user 
            // didn't see today's haiku as viewed yet: fake it locally
            if (haikus.length == 1) {
              const userState = await useUser.getState();
              if (!userState?.user?.isAdmin && !userState.haikus[haikus[0].id]) {
                useUser.setState({
                  haikus: {
                    ...userState.haikus,
                    [haikus[0].id]: {
                      ...haikus[0],
                      viewedAt: moment().valueOf(),
                    }
                  }
                })
              }
            }

            set({
              mode: mode || _mode,
              _haikus: { ..._haikus, ...listToMap(haikus) },
            });
          }

          return resolve(init(haikus[0], queryOrId, mode));
        });
      }
    });
  },

  create: async (user: User, name: string) => {
    // console.log(">> hooks.haiku.create", { name });
    const { _haikus, setLoaded, init } = get();

    // optimistic
    const creating = {
      id: `interim-${uuid()}`,
      createdBy: user.id,
      createdAt: moment().valueOf(),
      status: "creating",
      name,
      optimistic: true,
    }

    setLoaded(creating.id);
    set({
      _haikus: { ..._haikus, [creating.id]: creating },
    });

    return new Promise(async (resolve, reject) => {
      fetch('/api/haikus', {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ name }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          handleErrorResponse(res, "create-haiku", creating.id, `Error adding haiku`);
          set({
            _haikus: { ..._haikus, [creating.id]: undefined },
          });
          return reject(res.statusText);
        }

        const { haiku: created } = await res.json();

        trackEvent("haiku-created", {
          id: created.id,
          userId: created.createdBy,
          theme: created.theme,
        });

        // replace optimistic 
        setLoaded(creating.id, false);
        setLoaded(created.id);
        set({
          _haikus: { ..._haikus, [creating.id]: undefined, [created.id]: created },
        });
        return resolve(init(created));
      });
    });
  },

  save: async (user: User, haiku: Haiku, options: {}) => {
    // console.log(">> hooks.haiku.save", { haiku });
    const { _haikus, init } = get();

    // optimistic
    const saving = {
      ...haiku,
      status: "saving",
    };

    set({
      _haikus: { ..._haikus, [haiku.id]: saving },
    });

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haiku.id}`, {
        ...await fetchOpts(),
        method: "PUT",
        body: JSON.stringify({ haiku, options }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          handleErrorResponse(res, "save-haiku", haiku.id, `Error saving haiku`);
          trackEvent("error", {
            type: "save-haiku",
            code: res.status,
            userId: (await useUser.getState()).user.id,
            id: haiku.id,
          });
          // revert
          set({
            _haikus: { ..._haikus, [haiku.id]: haiku },
          });
          return reject(res.statusText);
        }

        const data = await res.json();
        const saved = data.haiku;

        trackEvent("haiku-updated", {
          id: saved.id,
          userId: saved.createdBy,
        });

        set({
          _haikus: { ..._haikus, [saved.id]: saved },
        });
        return resolve(init(saved));
      });
    });
  },

  generate: async (user: User, request: any) => {
    // console.log(">> hooks.haiku.generate", { request });
    const { _haikus, init } = get();

    // optimistic
    // const generating = {
    //   // id: haiku.id,
    //   // name: haiku.name,
    //   // createdBy: haiku.createdBy,
    //   status: "generating",
    // };

    // set({
    //   _haikus: { ..._haikus, [haiku.id ]: generating },
    // });

    // sometimes we don't get the haiku-generated event...
    trackEvent("generate-haiku", {
      userId: user?.id,
      request: JSON.stringify(request),
    });

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus`, {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ request }),
      }).then(async (res) => {
        const { _haikus } = get();
        const { addUserHaiku } = useUser.getState();

        if (res.status != 200) {
          handleErrorResponse(res, "generate-haiku", undefined, `Error generating haiku`);
          return reject(res.statusText);
        }

        const { haiku: generated, reachedUsageLimit } = await res.json();
        // console.log(">> hooks.haiku.create", { generated, reachedUsageLimit });

        trackEvent("haiku-generated", {
          id: generated.id,
          userId: generated.createdBy,
          theme: generated.theme,
        });

        // replace optimistic 
        set({
          _haikus: { ..._haikus, [generated.id]: generated },
        });

        // also update the side bar
        addUserHaiku(generated, "generated");

        if (reachedUsageLimit) {
          trackEvent("warning", {
            type: "reached-usage-limit-create-haiku",
            userId: generated.createdBy,
          });
          useAlert.getState().warning("Daily limit reached: you can create more haikus tomorrow.");
        }

        return resolve(init(generated));
      });
    });
  },

  regenerate: async (user: User, haiku: Haiku, part: undefined | "poem" | "image", options: any = {}) => {
    // console.log(">> hooks.haiku.regenerate", { haiku });
    const { _haikus, init } = get();

    const regenerating = {
      ...haiku,
      status: "generating",
    }
    set({
      _haikus: { ..._haikus, [haiku.id]: regenerating },
    });

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haiku.id}/regenerate`, {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ haiku, part, ...options }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          handleErrorResponse(res, "regenerate-haiku", haiku.id, `Error regenerating haiku`);
          return reject(res.statusText);
        }

        const { haiku: regenerated, reachedUsageLimit } = await res.json();

        trackEvent("haiku-regenerated", {
          id: regenerated.id,
          theme: regenerated.theme,
          userId: regenerated.updatedBy,
          part,
        });

        // replace optimistic 
        set({
          _haikus: { ..._haikus, [regenerated.id]: regenerated },
        });
        // also sync up haikudle store 
        useHaikudle.setState({ haiku: regenerated });

        if (reachedUsageLimit) {
          trackEvent("warning", {
            type: "reached-usage-limit-regenerate-haiku",
            userId: regenerated.updatedBy,
          });

          useAlert.getState().warning("Daily limit reached: you can re-generate more haikus tomorrow.");
        }

        return resolve(init(regenerated));
      });
    });
  },

  delete: async (id: string) => {
    // console.log(">> hooks.haiku.delete id:", id);

    if (!id) {
      throw `Cannot delete haiku with null id`;
    }

    const { _haikus, _deleted, get: _get } = get();
    const deleting = _get(id);

    if (!deleting) {
      // throw `Haikudle not found: ${id}`;
      useAlert.getState().error(`Error deleting haiku ${id}: Haiku not found`);
    }

    // optimistic
    set({
      _haikus: { ..._haikus, [id]: undefined },
      _deleted: { ..._deleted, [id]: true },
    });

    const res = await fetch(`/api/haikus/${id}`, {
      ...await fetchOpts(),
      method: "DELETE",
    });

    if (res.status != 200) {
      handleErrorResponse(res, "delete-haiku", deleting.id, `Error deleting haiku`);
      const { _haikus, _deleted } = get();
      // revert
      set({
        _haikus: { ..._haikus, [id]: deleting },
        _deleted: { ..._deleted, [id]: false },
      });
      return deleting;
    }

    const data = await res.json();
    const deleted = data.haiku;

    // update side panel
    const { haikus: userHaikus, allHaikus, dailyHaikus, dailyHaikudles } = useUser.getState();
    delete userHaikus[id];
    delete allHaikus[id];
    delete dailyHaikus[id];
    delete dailyHaikudles[id];

    useUser.setState({
      haikus: userHaikus,
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
    });

    return deleted;
  },

  createDailyHaiku: async (dateCode: string, haikuId: string) => {
    // console.log(">> hooks.haiku.createDailyHaiku", { dateCode, haikuId });
    const { init } = get();

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haikuId}/daily`, {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ dateCode, haikuId }),
      }).then(async (res) => {
        if (res.status != 200) {
          handleErrorResponse(res, "create-daily-haiku", haikuId, `Error creating daily haiku`);
          return reject(res.statusText);
        }

        const { dailyHaiku, nextDailyHaikuId } = await res.json();

        // update side panel content
        useUser.setState((state: any) => {
          return {
            dailyHaikus: { ...state.dailyHaikus, [dailyHaiku.id]: dailyHaiku },
            nextDailyHaikuId,
          }
        });

        return resolve(dailyHaiku);
      });
    });
  },

  action: async (haikuId: string, action: HaikuAction, value?: any) => {
    // console.log(">> hooks.haiku.action", { haikuId, action, value });
    const { _haikus, init } = get();
    const haiku = _haikus[haikuId];
    const userState = await useUser.getState();
    const userHaikus = userState.haikus
    const userHaiku = userHaikus[haikuId];

    // const userHaiku = userHaikus[haikuId] || { haikuId };

    if (!haiku) {
      // console.error(">> hooks.haiku.action: haiku not found", { haikuId, action, value });
    }

    set({
      _haikus: {
        ..._haikus,
        [haikuId]: {
          ...haiku,
          [`${action}dAt`]: moment().valueOf(),
        }
      },
    });

    userHaiku && useUser.setState({
      haikus: {
        ...userState.haikus,
        [haikuId]: {
          ...userHaiku,
          [`${action}dAt`]: moment().valueOf(),
        }
      }
    });

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haiku.id}/${action}`, {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ value }),
      }).then(async (res) => {
        const event = `haiku-${formatPastAction(action)}`;

        if (res.status != 200) {
          const actionVerb = formatActionInProgress(action);
          handleErrorResponse(res, event, haikuId, `Error ${actionVerb} haiku`);

          // roll back optimistic
          set({ _haikus });
          if (!userState?.user?.isAdmin && userHaiku) {
            useUser.setState({
              haikus: userHaikus,
            });
          }

          return reject(res.statusText);
        }

        const data = await res.json();
        const actedOn = data.haiku;

        trackEvent(event, {
          id: actedOn.id,
          userId: userState?.user?.id,
          value,
        });

        return resolve(init(actedOn));
      });
    });
  },

  uploadImage: async (haikuId: string, file: File) => {
    // console.log(">> hooks.haiku.uploadImage", { haikuId, file });
    const { _haikus, init } = get();
    const haiku = _haikus[haikuId];
    const userState = await useUser.getState();
    const userHaikus = userState.haikus
    const userHaiku = userHaikus[haikuId];
    const updatedAt = moment().valueOf();

    set({
      _haikus: {
        ..._haikus,
        [haikuId]: {
          ...haiku,
          updatedAt,
        }
      },
    });

    userHaiku && useUser.setState({
      haikus: {
        ...userState.haikus,
        [haikuId]: {
          ...userHaiku,
          updatedAt,
        }
      }
    });

    const data = new FormData();
    data.append("file", file);

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haiku.id}/uploadImage`, {
        ...await fetchOpts(),
        method: "POST",
        body: data,
      }).then(async (res) => {
        if (res.status != 200) {
          handleErrorResponse(res, "uploaded-haiku-image", haikuId, `Error uploaded haiku image`);

          // roll back optimistic
          set({ _haikus });
          if (!userState?.user?.isAdmin && userHaiku) {
            useUser.setState({
              haikus: userHaikus,
            });
          }

          return reject(res.statusText);
        }

        const data = await res.json();
        const actedOn = data.haiku;

        trackEvent("uploaded-haiku-image", {
          id: actedOn.id,
          userId: userState?.user?.id,
        });

        return resolve(init(actedOn));
      });
    });
  },

})));

export default useHaikus;
