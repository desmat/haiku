import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { syllable } from 'syllable'
import useUser from './user';
import { listToMap, mapToSearchParams, uuid } from '@/utils/misc';
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

const normalizeWord = (word: string) => {
  return word && word.replace(/[.,]/, "").toLowerCase();
}

const checkCorrect = (inProgress: any, solution: any) => {
  // console.log("*** checkCorrect", { inProgress, solution });
  inProgress
    .forEach((line: any[], lineNum: number) => line
      .forEach((w: any, wordNum: number) => {
        w.correct = normalizeWord(w.word) == normalizeWord(solution[lineNum][wordNum]);
      }));


  // console.log("*** checkCorrect returning", { inProgress });
  return inProgress;
}

const isSolved = (words: any, inProgress: any, solution: any) => {
  // console.log("*** isSolved", { wordsInProcess, solution });

  checkCorrect(inProgress, solution); // side effects yuk!
  return inProgress.flat().reduce((a: boolean, m: any, i: number) => a && m.correct, true);
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
    let words = haikudle?.inProgress || haiku.poem
      .join(" ")
      .split(/\s/)
      .map((w: string, i: number) => {
        const word = w.toLowerCase().replace(/[]/, "")
        return {
          id: uuid(),
          word: word,
          syllables: syllable(word),
          picked: false,
          correct: false,
        }
      });

    if (!cheat && process.env.EXPERIENCE_MODE == "haikudle" && !haikudle?.inProgress) {
      words = shuffleArray(words);
    }

    const numWords = words.length;

    const solution = haiku.poem
      .map((line: string) => line
        .split(/\s/)
        .map((w: string) => w.toLowerCase().replace(/[]/, "")));

    const inProgress = haikudle?.inProgress || [
      words.slice(0, (numWords / 3)),
      words.slice((numWords / 3), (2 * numWords / 3)),
      words.slice((2 * numWords / 3)),
    ];

    checkCorrect(inProgress, solution);

    set({
      haiku,
      haikudleId: haikudle.id,
      inProgress,
      solution,
      solved: false,
    });

    trackEvent("haikudle-started", {
      id: haiku.id,
      userId: (await useUser.getState()).user.id,
    });
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

  move: async (haikudleId: string, word: any, fromLine: number, fromOffset: number, toLine: number, toOffset: number) => {
    // console.log(">> hooks.haikudle.move", { haikudleId, word, fromLine, fromOffset, toLine, toOffset });
    const { haiku, inProgress, words, solution } = get();

    const [spliced] = inProgress[fromLine].splice(fromOffset, 1);
    inProgress[toLine].splice(toOffset, 0, spliced);

    checkCorrect(inProgress, solution); // side effects yuk!
    const solved = isSolved(words, inProgress, solution);

    if (solved) {
      trackEvent("haikudle-solved", {
        haikuId: haiku.id,
        userId: (await useUser.getState()).user.id,
      });
    }

    set({
      inProgress,
      solved,
    });

    // console.log(">> hooks.haikudle.move", { inProgress: JSON.stringify(inProgress) });

    fetch(`/api/haikudles/${haikudleId}`, {
        ...await fetchOpts(),
        method: "PUT",
        body: JSON.stringify({ haikudle: {
          id: haikudleId, 
          haikudId: haiku.id,
          inProgress,
        } }),
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
    const { haiku, inProgress, words, solution } = get();

    // move(word, fromLine, fromOffset, toLine, toOffset);
    const [spliced] = inProgress[toLine].splice(toOffset, 1, word);
    inProgress[fromLine].splice(fromOffset, 1, spliced);

    checkCorrect(inProgress, solution); // side effects yuk!
    const solved = isSolved(words, inProgress, solution);

    if (solved) {
      trackEvent("haikudle-solved", {
        haikuId: haiku.id,
        userId: (await useUser.getState()).user.id,
      })
    }

    set({
      inProgress,
      solved,
    });

    fetch(`/api/haikudles/${haikudleId}`, {
      ...await fetchOpts(),
      method: "PUT",
      body: JSON.stringify({ haikudle: {
        id: haikudleId, 
        haikudId: haiku.id,
        inProgress,
      } }),
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

  load: async (queryOrId?: string) => {
    const { setLoaded } = get();
    const query = typeof (queryOrId) == "object" && queryOrId;
    const id = typeof (queryOrId) == "string" && queryOrId;
    console.log(">> hooks.haikudle.load", { id, query });

    if (id) {
      fetch(`/api/haikudles/${id}`, await fetchOpts()).then(async (res) => {
        const { _haikudles } = get();
        setLoaded(id);

        if (res.status != 200) {
          useAlert.getState().error(`Error fetching haikudle ${id}: ${res.status} (${res.statusText})`);
          await get().init(notFoundHaiku, notFoundHaikudle);
          return;
        }

        const data = await res.json();
        const haikudle = data.haikudle;

        set({
          _haikudles: { ..._haikudles, [haikudle.id]: haikudle },
        });

        await get().init(haikudle?.haiku, haikudle);
        setLoaded([haikudle]);
      });
    } else {
      const params = query && mapToSearchParams(query);
      fetch(`/api/haikudles${params ? `?${params}` : ""}`, await fetchOpts()).then(async (res) => {
        const { _haikudles } = get();
        setLoaded(query);

        if (res.status != 200) {
          useAlert.getState().error(`Error fetching haikudles: ${res.status} (${res.statusText})`);
          await get().init(notFoundHaiku, notFoundHaikudle);
          return;
        }

        const data = await res.json();
        // const haikus = data.haikus;
        const haikudles = data.haikudles; // TODO fix this junk

        set({
          _haikudles: { ..._haikudles, ...listToMap(haikudles) }
        });

        // TODO bleh
        await get().init(haikudles[0]?.haiku, haikudles[0]);
        setLoaded(haikudles);
      });
    }
  },

  create: async (user: User, haikudle: Haikudle) => {
    console.log(">> hooks.haiku.create", { user, haikudle });
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
