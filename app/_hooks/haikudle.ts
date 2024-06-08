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
import useHaikus from './haikus';

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

const initialState = {
  // access via get(id) or find(query?)
  ready: false,
  haiku: undefined,
  haikudleId: undefined,
  previousDailyHaikudle: undefined,
  solution: [[], [], []],
  inProgress: [[], [], []],
  solved: false,
  solvedJustNow: false,
  moves: 0,
  onSolved: async (id: string, moves: number) => {
    // add solved haiku to side panel (backend record already created) 
    const currentHaiku = useHaikudle.getState().haiku;
    useUser.getState().addUserHaiku(currentHaiku, "solved");

    setTimeout(() => {
      const shareContent = "Solved today\\'s haiku puzzle in " + moves + " moves! https://haikudle.art/\\n\\n"
        + "#haiku #haikuoftheday #haikuchallenge #haikudle #puzzle #dailypuzzle #AI #aiart #dalle #dalle3 #chatgpt ";
      useAlert.getState().plain(`
        <div style="display: flex; flex-direction: column; gap: 0.4rem">
          <div>Solved in ${moves} move${moves > 1 ? "s" : ""}! <b><span class="clickable" style="cursor: copy;" onClick="navigator.clipboard.writeText('${shareContent}');">Copy</span></b> and share your result on your social networks and come back tomorrow for a new haiku puzzle.</div>
          <div>Until then try the generate button above and see what AI comes up with!</div>
          <div>Want more haiku poems? Try <b><a href="https://haikugenius.io/" target="_blank">Haiku Genius</a></b>!</div>
        </div>`);
    }, 250);
  },

  // 
  // regular crud stuff

  // access via get(id) or find(query?)
  _haikudles: <HaikudleMap>{},

  // access via loaded(queryOrId?),
  // stored as id->bool or query->bool, 
  // where id refers to the loaded haiku 
  // and query is stringyfied json from loaded
  // list of haikus
  _loaded: <StatusMap>{},
};

const useHaikudle: any = create(devtools((set: any, get: any) => ({
  ...initialState,

  reset: () => {
    // console.log(">> hooks.haiku.reset", {});
    return new Promise(async (resolve) => {
      set(initialState);
      resolve(true);
    })
  },

  init: async (haikudle: Haikudle, hashSolution?: boolean) => {
    const haiku = haikudle?.haiku;
    // console.log(">> hooks.haikudle.init", { haiku, haikudle, hashSolution });

    const solution = hashSolution && haiku.poem
      .map((line: string) => line.split(/\s+/)
        .map((word: string) => hashCode(normalizeWord(word))))
      || haiku.poem;

    const inProgress = haikudle?.inProgress;

    checkCorrect(inProgress, solution);
    const solved = haikudle.solved || isSolved(inProgress, solution);

    set({
      ready: true,
      haiku,
      haikudleId: haikudle.id,
      previousDailyHaikudleId: haikudle.previousDailyHaikudleId,
      inProgress,
      solution,
      solved,
      moves: haikudle?.moves || 0,
    });

    return haikudle;
  },

  solve: () => {
    const { inProgress, words, solution } = get();
    // console.log(">> hooks.haikudle.solve", { words, solution, inProgress });

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
      solved: true,
      solvedJustNow: true,
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
        id: haiku.id,
        userId: (await useUser.getState()).user.id,
      });
    }

    set({
      inProgress,
      solved,
      solvedJustNow: true,
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
        trackEvent("error", {
          type: "save-haikudle",
          code: res.status,
          id: haikudleId,
          userId: (await useUser.getState()).user.id,
        });
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
        id: haiku.id,
        userId: (await useUser.getState()).user.id,
      })
    }

    set({
      inProgress,
      solved,
      solvedJustNow: true,
      moves: moves + 1,
    });

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
        trackEvent("error", {
          type: "save-haikudle",
          code: res.status,
          id: haikudleId,
          userId: (await useUser.getState()).user.id,
        });
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
    // console.log(">> hooks.haikudle.loaded", { idOrQuery, _loaded });

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

  load: async (queryOrId?: string): Promise<Haikudle> => {
    const { setLoaded } = get();
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    // console.log(">> hooks.haikudle.load", { id, query: JSON.stringify(query) });

    set({ ready: false});

    return new Promise(async (resolve, reject) => {
      if (id) {
        fetch(`/api/haikudles/${id}`, await fetchOpts()).then(async (res) => {
          const { _haikudles } = get();

          if (res.status != 200) {
            setLoaded(id);
            trackEvent("error", {
              type: "fetch-haikudle",
              code: res.status,
              id,
              userId: (await useUser.getState()).user.id,
            });
            // smooth out the the alert pop-up
            setTimeout(() => useAlert.getState().error(`Error fetching haikudle ${id}: ${res.status} (${res.statusText})`), 500)
            const errorHaiku = { ...notFoundHaikudle, id, haiku: { ...notFoundHaiku, id } };
            await get().init(errorHaiku, true);
            return resolve(errorHaiku);
          }

          const data = await res.json();
          const haikudle = data.haikudle;

          // race condition: /api/haikus/:id returned a haiku but /api/user 
          // didn't see that haiku as viewed yet: fake it locally          
          if (haikudle?.previousDailyHaikudleId) {
            const userState = await useUser.getState();
            if (!userState?.user?.isAdmin && !userState.haikus[haikudle.haikuId]) {
              useUser.setState({
                haikus: {
                  ...userState.haikus,
                  [haikudle.haikuId]: {
                    ...haikudle.haiku,
                    viewedAt: moment().valueOf(),
                  }
                }
              })
            }
          }

          set({
            _haikudles: { ..._haikudles, [haikudle.id]: haikudle },
          });
          setLoaded([haikudle]);

          await get().init(haikudle);
          resolve(haikudle);
        });
      } else {
        const params = query && mapToSearchParams(query);
        fetch(`/api/haikudles${params ? `?${params}` : ""}`, await fetchOpts()).then(async (res) => {
          const { _haikudles } = get();
          setLoaded(query);

          if (res.status != 200) {
            trackEvent("error", {
              type: "fetch-haikudles",
              code: res.status,
              query: JSON.stringify(query),
              userId: (await useUser.getState()).user.id,
            });
            useAlert.getState().error(`Error fetching haikudles: ${res.status} (${res.statusText})`);
            get().init(notFoundHaikudle, true);
            return resolve(notFoundHaikudle);
          }

          const data = await res.json();
          // const haikus = data.haikus;
          const haikudles = data.haikudles; // TODO fix this junk

          set({ _haikudles: { ..._haikudles, ...listToMap(haikudles) } });
          setLoaded(haikudles);

          // TODO bleh
          await get().init(haikudles[0]);
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
          trackEvent("error", {
            type: "create-haikudle",
            code: res.status,
            userId: (await useUser.getState()).user.id,
          });
          useAlert.getState().error(`Error adding haikudle: ${res.status} (${res.statusText})`);
          set({
            _haikudles: { ..._haikudles, [creating.id]: undefined },
          });
          return reject(res.statusText);
        }

        const {
          haikudle: created,
          dailyHaikudle,
          nextDailyHaikudleId
        } = await res.json();

        trackEvent("haikudle-created", {
          id: created.id,
          name: created.name,
          userId: created.createdBy,
        });

        // replace optimistic 
        setLoaded(creating.id, false);
        setLoaded(created.id);
        set({
          _haikudles: { ..._haikudles, [creating.id]: undefined, [created.id]: created },
        });
        // also update side panel content
        useUser.setState((state: any) => {
          return {
            dailyHaikudles: { ...state.dailyHaikudles, [dailyHaikudle.id]: dailyHaikudle },
            nextDailyHaikudleId,
          }
        });

        return resolve(created);
      });
    });
  },

  delete: async (id: string) => {
    // console.log(">> hooks.haikudle.delete id:", id);

    if (!id) {
      throw `Cannot delete haikudle with null id`;
    }

    const res = await fetch(`/api/haikudles/${id}`, {
      ...await fetchOpts(),
      method: "DELETE",
    });

    if (res.status != 200) {
      trackEvent("error", {
        type: "delete-haikudle",
        code: res.status,
        userId: (await useUser.getState()).user.id,
      });
      useAlert.getState().error(`Error deleting haikudle: ${res.status} (${res.statusText})`);
    }

    const data = await res.json();
    const deleted = data.haikudle;

    // remove from side panel
    const { dailyHaikudles } = useUser.getState();
    delete dailyHaikudles[id];
    useUser.setState({ dailyHaikudles });

    return deleted;
  },

})));

export default useHaikudle;
