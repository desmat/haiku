import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Haiku } from '@/types/Haiku';
import { User } from '@/types/User';
import { listToMap, mapToList, mapToSearchParams, uuid } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from "./alert";
import useUser from './user';

async function fetchOpts() {
  const token = await useUser.getState().getToken();
  // console.log(">> hooks.haiku.fetchOpts", { token });
  return token && { headers: { Authorization: `Bearer ${token}` } } || {};
}  


type HaikuMap = { [key: string]: Haiku | undefined; };
type StatusMap = { [key: string]: boolean };

const useHaikus: any = create(devtools((set: any, get: any) => ({

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

  get: (id: string) => {
    return get()._haikus[id];
  },

  getRandom: () => {
    const { _haikus } = get();
    console.log(">> hooks.haiku.getRandom", { _haikus });
    const haikus = mapToList(_haikus);
    const haiku = haikus[Math.floor(Math.random() * haikus.length)];
    console.log(">> hooks.haiku.getRandom", { haiku });

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

  load: async (queryOrId?: object | string) => {
    const { setLoaded } = get();
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    // console.log(">> hooks.haiku.load", { id, query });

    if (id) {
      fetch(`/api/haikus/${id}`, await fetchOpts()).then(async (res) => {
        const { _haikus } = get();
        setLoaded(id);

        if (res.status != 200) {
          useAlert.getState().error(`Error fetching haiku ${id}: ${res.status} (${res.statusText})`);
          return;
        }

        const data = await res.json();
        const haiku = data.haiku;

        set({
          _haikus: { _haikus, [haiku.id]: haiku },
        });
      });
    } else {
      const params = query && mapToSearchParams(query);
      fetch(`/api/haikus${params ? `?${params}` : ""}`, await fetchOpts()).then(async (res) => {
        const { _haikus } = get();
        setLoaded(query);

        if (res.status != 200) {
          useAlert.getState().error(`Error fetching haikus: ${res.status} (${res.statusText})`);
          return;
        }

        const data = await res.json();
        const haikus = data.haikus;

        setLoaded(haikus);
        set({
          _haikus: { ..._haikus, ...listToMap(haikus) }
        });
      });
    }
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
          useAlert.getState().error(`Error adding haiku: ${res.status} (${res.statusText})`);
          set({
            _haikus: { ..._haikus, [creating.id]: undefined },
          });
          return reject(res.statusText);
        }

        const data = await res.json();
        const created = data.haiku;

        trackEvent("haiku-created", {
          id: created.id,
          name: created.name,
          createdBy: created.createdBy,
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
      _haikus: { ..._haikus, [haiku.id || ""]: saving }, // TODO: update type to make id mandatory
    });

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haiku.id}`, {
        ...await fetchOpts(),
        method: "PUT",
        body: JSON.stringify({ haiku }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          useAlert.getState().error(`Error saving haiku: ${res.status} (${res.statusText})`);
          // revert
          set({
            _haikus: { ..._haikus, [haiku.id || ""]: haiku }, // TODO: update type to make id mandatory
          });
          return reject(res.statusText);
        }

        const data = await res.json();
        const saved = data.haiku;

        set({
          _haikus: { ..._haikus, [saved.id || ""]: saved },
        });
        return resolve(saved);
      });
    });
  },

  generate: async (user: User, haiku: Haiku) => {
    console.log(">> hooks.haiku.generate", { haiku });
    const { _haikus } = get();

    // optimistic
    // const generating = {
    //   // id: haiku.id,
    //   // name: haiku.name,
    //   // createdBy: haiku.createdBy,
    //   status: "generating",
    // };

    // set({
    //   _haikus: { ..._haikus, [haiku.id || ""]: generating },
    // });

    return new Promise(async (resolve, reject) => {
      fetch(`/api/haikus/${haiku.id}/generate`, {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ haiku }),
      }).then(async (res) => {
        const { _haikus } = get();

        if (res.status != 200) {
          useAlert.getState().error(`Error generating haiku: ${res.status} (${res.statusText})`);
          // revert
          set({
            _haikus: { ..._haikus, [haiku.id || ""]: haiku },
          });
          return reject(res.statusText);
        }

        const data = await res.json();
        const generated = data.haiku;

        trackEvent("haiku-generated", {
          id: generated.id,
          name: generated.name,
          createdBy: generated.createdBy,
        });

        // replace optimistic 
        set({
          _haikus: { ..._haikus, [generated.id || ""]: generated },
        });
        return resolve(generated);
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
      throw `Haiku not found: ${id}`;
    }

    // optimistic
    set({
      _haikus: { ..._haikus, [id]: undefined },
      _deleted: { ..._deleted, [id]: true },
    });

    fetch(`/api/haikus/${id}`, {
      ...await fetchOpts(),
      method: "DELETE",
    }).then(async (res) => {
      if (res.status != 200) {
        const { _haikus, _deleted } = get();
        useAlert.getState().error(`Error deleting haikus ${id}: ${res.status} (${res.statusText})`);
        // revert
        set({
          _haikus: { ..._haikus, [id]: deleting },
          _deleted: { ..._deleted, [id]: false },
        });
        return;
      }
    });
  },
})));

export default useHaikus;
