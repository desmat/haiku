import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { syllable } from 'syllable'
import useUser from './user';
import { hashCode, listToMap, mapToSearchParams, normalizeWord, uuid } from '@/utils/misc';
import { Haiku } from '@/types/Haiku';
import trackEvent from '@/utils/trackEvent';
import shuffleArray from "@/utils/shuffleArray";
import { Haikudle } from '@/types/Haikudle';
import useAlert from './alert';
import moment from 'moment';
import { User } from '@/types/User';
import { notFoundHaiku, notFoundHaikudle } from "@/services/stores/samples";

async function fetchOpts() {
  const token = await useUser.getState().getToken();
  // console.log(">> hooks.haiku.fetchOpts", { token });
  return token && { headers: { Authorization: `Bearer ${token}` } } || {};
}

const checkCorrect = (inProgress: any, solution: any) => {
  // console.log("*** checkCorrect", { inProgress, solution });
  inProgress
    .forEach((line: any[], lineNum: number) => line
      .forEach((w: any, wordNum: number) => {
        if (w) {
          w.correct = hashCode(normalizeWord(w.word)) == solution[lineNum][wordNum];
        }
      }));


  // console.log("*** checkCorrect returning", { inProgress });
  return inProgress;
}

const isSolved = (inProgress: any, solution: any) => {
  // console.log("*** isSolved", { inProgress });

  checkCorrect(inProgress, solution); // side effects yuk!
  const ret = inProgress.flat().reduce((a: boolean, m: any, i: number) => a && m.correct, true);
  // console.log("*** isSolved", { ret });
  return ret;
}

type HaikudleMap = { [key: string]: Haikudle | undefined; };
type StatusMap = { [key: string]: boolean };

const useHaikudle: any = create(devtools((set: any, get: any) => ({

  // access via get(id) or find(query?)
  haiku: undefined,
  haikudleId: undefined,
  solution: [[], [], []],
  inProgress: [[], [], []],
  solved: false,
  moves: 0,
  onSolved: (id: string, moves: number) => {
    setTimeout(() => {
      useAlert.getState().plain(`
        <div style="display: flex; flex-direction: column; gap: 0.4rem">
          <div>Solved in ${moves} move${moves > 1 ? "s" : ""}! <b><a href="https://haikudle.art/${id}" target="_blank">Share</a></b> on your social networks and come back tomorrow for a new Haiku puzzle.</div>
          <div>Until then try the generate button above and see what AI comes up with!</div>
        </div>`);
    }, 250);
  },

  // 
  // regular crud stuff

  // access via get(id) or find(query?)
  _haikudles: <HaikudleMap>{},

  // TODO maybe remove this 
  // to smooth out UX when deleting,
  _deleted: <StatusMap>{},

  // access via loaded(queryOrId?),
  // stored as id->bool or query->bool, 
  // where id refers to the loaded haiku 
  // and query is stringyfied json from loaded
  // list of haikus
  _loaded: <StatusMap>{},

  init: async (haiku: Haiku, haikudle: Haikudle, cheat = false) => {
    // console.log(">> hooks.haikudle.init", { haiku, haikudle, cheat });

    const solution = haiku.poem;

    const inProgress = haikudle?.inProgress

    checkCorrect(inProgress, solution);
    const solved = isSolved(inProgress, solution);

    set({
      haiku,
      haikudleId: haikudle.id,
      inProgress,
      solution,
      solved,
      moves: haikudle?.moves || 0,
    });

    // get().onSolved(haikudle.id, 42);
  },

  solve: () => {
    const { inProgress, words, solution } = get();
    console.log(">> hooks.haikudle.solve", { words, solution, inProgress });

    const solvedInProgress = [
      solution[0].map((w: string) => {
        return {
          word: w,
          picked: true,
          correct: true,
        }
      }),
      solution[1].map((w: string) => {
        return {
          word: w,
          picked: true,
          correct: true,
        }
      }),
      solution[2].map((w: string) => {
        return {
          word: w,
          picked: true,
          correct: true,
        }
      }),
    ];

    const solvedWords = words.map((w: any) => {
      return {
        ...w,
        picked: true,
        correct: true,
      }
    });

    set({
      inProgress: solvedInProgress,
      words: solvedWords,
      solved: true
    });
  },

  move: async (haikudleId: string, fromLine: number, fromOffset: number, toLine: number, toOffset: number) => {
    // console.log(">> hooks.haikudle.move", { haikudleId, word, fromLine, fromOffset, toLine, toOffset });
    const { haiku, inProgress, solution, onSolved, moves } = get();

    if (moves == 0) {
      trackEvent("haikudle-started", {
        id: haiku.id,
        userId: (await useUser.getState()).user.id,
      });
    }

    const [spliced] = inProgress[fromLine].splice(fromOffset, 1);
    inProgress[toLine].splice(toOffset, 0, spliced);

    checkCorrect(inProgress, solution); // side effects yuk!
    const solved = isSolved(inProgress, solution);

    if (solved) {
      onSolved(haikudleId, moves + 1);

      trackEvent("haikudle-solved", {
        haikuId: haiku.id,
        userId: (await useUser.getState()).user.id,
      });
    }

    set({
      inProgress,
      solved,
      moves: moves + 1,
    });

    // console.log(">> hooks.haikudle.move", { inProgress: JSON.stringify(inProgress) });

    fetch(`/api/haikudles/${haikudleId}`, {
      ...await fetchOpts(),
      method: "PUT",
      body: JSON.stringify({
        haikudle: {
          id: haikudleId,
          haikuId: haiku.id,
          solved,
          moves: moves + 1,
          inProgress,
        }
      }),
    }).then(async (res) => {
      if (res.status != 200) {
        useAlert.getState().error(`Error saving haikudle: ${res.status} (${res.statusText})`);
        return;
      }

      // console.log(">> hooks.haikudle.move", { res });
    });
  },

  swap: async (haikudleId: string, word: any, fromLine: number, fromOffset: number, toLine: number, toOffset: number) => {
    // console.log(">> hooks.haikudle.swap", { fromLine, fromOffset, toLine, toOffset });
    const { haiku, inProgress, solution, onSolved, moves } = get();

    if (moves == 0) {
      trackEvent("haikudle-started", {
        id: haiku.id,
        userId: (await useUser.getState()).user.id,
      });
    }

    // move(word, fromLine, fromOffset, toLine, toOffset);
    const [spliced] = inProgress[toLine].splice(toOffset, 1, word);
    inProgress[fromLine].splice(fromOffset, 1, spliced);

    checkCorrect(inProgress, solution); // side effects yuk!
    const solved = isSolved(inProgress, solution);

    if (solved) {
      onSolved(haikudleId, moves + 1);

      trackEvent("haikudle-solved", {
        haikuId: haiku.id,
        userId: (await useUser.getState()).user.id,
      })
    }

    set({
      inProgress,
      solved,
      moves: moves + 1,
    });

    fetch(`/api/haikudles/${haikudleId}`, {
      ...await fetchOpts(),
      method: "PUT",
      body: JSON.stringify({
        haikudle: {
          id: haikudleId,
          haikuId: haiku.id,
          inProgress,
        }
      }),
    }).then(async (res) => {
      if (res.status != 200) {
        useAlert.getState().error(`Error saving haikudle: ${res.status} (${res.statusText})`);
        return;
      }

      // console.log(">> hooks.haikudle.swap", { res });
    });
  },

  // 
  // regular crud stuff below

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

  load: async (queryOrId?: string, onSolved = () => undefined): Promise<Haikudle> => {
    const { setLoaded } = get();
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    // console.log(">> hooks.haikudle.load", { id, query });

    return new Promise(async (resolve, reject) => {
      if (id) {
        fetch(`/api/haikudles/${id}`, await fetchOpts()).then(async (res) => {
          const { _haikudles } = get();
          setLoaded(id);

          if (res.status != 200) {
            useAlert.getState().error(`Error fetching haikudle ${id}: ${res.status} (${res.statusText})`);
            await get().init(notFoundHaiku, notFoundHaikudle);
            return resolve(res.statusText);
          }

          const data = await res.json();
          const haikudle = data.haikudle;

          setLoaded([haikudle]);
          set({
            _haikudles: { ..._haikudles, [haikudle.id]: haikudle },
          });

          await get().init(haikudle?.haiku, haikudle);
          resolve(haikudle);
        });
      } else {
        const params = query && mapToSearchParams(query);
        fetch(`/api/haikudles${params ? `?${params}` : ""}`, await fetchOpts()).then(async (res) => {
          const { _haikudles } = get();
          setLoaded(query);

          if (res.status != 200) {
            useAlert.getState().error(`Error fetching haikudles: ${res.status} (${res.statusText})`);
            await get().init(notFoundHaiku, notFoundHaikudle);
            return resolve(res.statusText);
          }

          const data = await res.json();
          // const haikus = data.haikus;
          const haikudles = data.haikudles; // TODO fix this junk

          setLoaded(haikudles);
          set({
            _haikudles: { ..._haikudles, ...listToMap(haikudles) }
          });

          // TODO bleh
          await get().init(haikudles[0]?.haiku, haikudles[0]);
          resolve(haikudles[0]);
        });
      }
    });
  },

  create: async (user: User, haikudle: Haikudle) => {
    // console.log(">> hooks.haikudle.create", { user, haikudle });
    const { _haikudles, setLoaded } = get();

    // optimistic
    const creating = {
      ...haikudle,
      createdBy: user.id,
      createdAt: moment().valueOf(),
      status: "creating",
      optimistic: true,
    }

    setLoaded(creating.id);
    set({
      _haikudles: { ..._haikudles, [creating.id]: creating },
    });

    return new Promise(async (resolve, reject) => {
      fetch('/api/haikudles', {
        ...await fetchOpts(),
        method: "POST",
        body: JSON.stringify({ haikudle: creating }),
      }).then(async (res) => {
        const { _haikudles } = get();

        if (res.status != 200) {
          useAlert.getState().error(`Error adding haikudle: ${res.status} (${res.statusText})`);
          set({
            _haikudles: { ..._haikudles, [creating.id]: undefined },
          });
          return reject(res.statusText);
        }

        const data = await res.json();
        const created = data.haikudle;

        trackEvent("haikudle-created", {
          id: created.id,
          name: created.name,
          createdBy: created.createdBy,
        });

        // replace optimistic 
        setLoaded(creating.id, false);
        setLoaded(created.id);
        set({
          _haikudles: { ..._haikudles, [creating.id]: undefined, [created.id]: created },
        });
        return resolve(created);
      });
    });
  },

})));

export default useHaikudle;
