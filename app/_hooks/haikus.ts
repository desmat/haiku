import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Haiku } from '@/types/Haiku';
import { User } from '@/types/User';
import { listToMap, mapToList, mapToSearchParams, uuid } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from "./alert";
import useHaikudle from './haikudle';
import useUser from './user';
import { error429Haiku, error4xxHaiku, notFoundHaiku, serverErrorHaiku } from '@/services/stores/samples';

async function fetchOpts() {
  const token = await useUser.getState().getToken();
  // console.log(">> hooks.haiku.fetchOpts", { token });
  return token && { headers: { Authorization: `Bearer ${token}` } } || {};
}

async function handleErrorResponse(res: any, resourceType: string, resourceId: string | undefined, message?: string) {
  trackEvent("error", {
    type: resourceType,
    code: res.status,
    userId: (await useUser.getState()).user.id,
    id: resourceId,
  });

  // smooth out the the alert pop-up
  setTimeout(
    res.status == 429
      ? () => useAlert.getState().warning(`Exceeded daily limit: please try again later`)
      : res.status == 404
        ? () => useAlert.getState().warning(`${message || "An error occured"}: ${res.status} (${res.statusText || "Unknown Error"})`)
        : () => useAlert.getState().error(`${message || "An error occured"}: ${res.status} (${res.statusText || "Unknown Error"})`)
    , 500);

  const errorHaiku =
    res.status == 404
      ? notFoundHaiku
      : res.status == 429
        ? error429Haiku
        : res.status >= 400 && res.status < 500
          ? error4xxHaiku(res.status, res.statusText)
          : serverErrorHaiku(res.status, res.statusText);

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

  load: async (queryOrId?: object | string, mode?: string): Promise<Haiku | Haiku[]> => {
    const { setLoaded, _mode } = get();
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    // console.log(">> hooks.haiku.load", { mode, id, query: JSON.stringify(query) });

    return new Promise(async (resolve, reject) => {
      if (id) {
        fetch(`/api/haikus/${id}${mode ? `?mode=${mode || _mode}` : ""}`, await fetchOpts()).then(async (res) => {
          const { _haikus } = get();

          if (res.status != 200) {
            const errorHaiku = await handleErrorResponse(res, "fetch-haiku", id, `Error fetching haiku ${id}`);
            useHaikus.setState({ _haikus: { [errorHaiku.id]: errorHaiku } });
            setLoaded(errorHaiku.id);
            return resolve(errorHaiku);
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

          set({
            mode: mode || _mode,
            _haikus: { ..._haikus, [haiku.id]: haiku },
          });
          setLoaded(id);

          resolve(haiku);
        });
      } else {
        const modeParams = mode && `mode=${mode || _mode}`;
        const queryParams = query && mapToSearchParams(query);
        const params = `${queryParams || modeParams ? "?" : ""}${queryParams}${queryParams && modeParams ? "&" : ""}${modeParams}`;

        fetch(`/api/haikus${params}`, await fetchOpts()).then(async (res) => {
          const { _haikus } = get();
          setLoaded(query);

          if (res.status != 200) {
            const errorHaiku = await handleErrorResponse(res, "fetch-haikus", undefined, `Error fetching haikus`);
            useHaikus.setState({ _haikus: { [errorHaiku.id]: errorHaiku } });
            setLoaded(errorHaiku.id);
            return resolve(errorHaiku);
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
            return resolve(haikus[0]);
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

          resolve(haikus);
        });
      }
    });
  },

  create: async (user: User, name: string) => {
    // console.log(">> hooks.haiku.create", { name });
    const { _haikus, setLoaded } = get();

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

        const data = await res.json();
        const created = data.haiku;

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
        return resolve(created);
      });
    });
  },

  save: async (user: User, haiku: Haiku) => {
    // console.log(">> hooks.haiku.save", { haiku });
    const { _haikus } = get();

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
        body: JSON.stringify({ haiku }),
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
        return resolve(saved);
      });
    });
  },

  generate: async (user: User, request: any) => {
    // console.log(">> hooks.haiku.generate", { request });
    const { _haikus } = get();

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

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus`, {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ request }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          handleErrorResponse(res, "generate-haiku", undefined, `Error generating haiku`);
          return reject(res.statusText);
        }

        const data = await res.json();
        const generated = data.haiku;

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
        (await useHaikus.getState()).addUserHaiku({
          id: generated.id,
          createdBy: generated.createdBy,
          createdAt: generated.createdAt,
          generatedAt: generated.createdAt,
          theme: generated.theme,
        });

        return resolve(generated);
      });
    });
  },

  regenerate: async (user: User, haiku: Haiku) => {
    // console.log(">> hooks.haiku.regenerate", { haiku });
    const { _haikus } = get();

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
        body: JSON.stringify({ haiku }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          handleErrorResponse(res, "regenerate-haiku", haiku.id, `Error regenerating haiku`);
          return reject(res.statusText);
        }

        const data = await res.json();
        const regenerated = data.haiku;

        trackEvent("haiku-regenerated", {
          id: regenerated.id,
          name: regenerated.name,
          userId: regenerated.updatedBy,
        });

        // replace optimistic 
        set({
          _haikus: { ..._haikus, [regenerated.id]: regenerated },
        });
        // also sync up haikudle store 
        useHaikudle.setState({ haiku: regenerated });

        return resolve(regenerated);
      });
    });
  },

  delete: async (id: string) => {
    // console.log(">> hooks.haiku.delete id:", id);

    if (!id) {
      throw `Cannot delete haiku with null id`;
    }

    const { _haikus, _deleted, userHaikus, get: _get } = get();
    const deleting = _get(id);

    if (!deleting) {
      // throw `Haikudle not found: ${id}`;
      useAlert.getState().error(`Error deleting haiku ${id}: Haiku not found`);
    }

    // optimistic
    set({
      _haikus: { ..._haikus, [id]: undefined },
      _deleted: { ..._deleted, [id]: true },
      userHaikus: { ...userHaikus, [id]: undefined },
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
        userHaikus: { ...userHaikus, [id]: deleting },
      });
      return deleting;
    }

    const data = await res.json();
    const deleted = data.haiku;

    return deleted;
  },

  addUserHaiku: async (userHaiku: any) => {
    // console.log(">> hooks.haiku.addUserHaiku", { userHaiku });
    const { userHaikus } = get();

    set({
      userHaikus: { ...userHaikus, [userHaiku.id]: userHaiku },
    });
  },

  createDailyHaiku: async (dateCode: string, haikuId: string) => {
    // console.log(">> hooks.haiku.createDailyHaiku", { dateCode, haikuId });

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
  }

})));

export default useHaikus;
