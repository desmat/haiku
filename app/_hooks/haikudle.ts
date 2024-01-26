import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { syllable } from 'syllable'
import useUser from './user';
import { uuid } from '@/utils/misc';
import { Haiku } from '@/types/Haiku';
import trackEvent from '@/utils/trackEvent';
import shuffleArray from "@/utils/shuffleArray";

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

const useHaikudle: any = create(devtools((set: any, get: any) => ({

  // access via get(id) or find(query?)
  haiku: undefined,
  solution: [[], [], []],
  inProgress: [[], [], []],
  solved: false,

  init: async (haiku: Haiku, cheat = false) => {
    console.log(">> hooks.haikudle.init", { haiku, cheat });
    let words = haiku.poem
      .join(" ")
      .split(/\s/)
      .map((w: string, i: number) => {
        const word = w.toLowerCase().replace(/[]/, "")
        return {
          id: uuid(),
          offset: i,
          word: word,
          syllables: syllable(word),
          picked: false,
          correct: false,
        }
      });

    if (!cheat) {
      words = shuffleArray(words);
    }

    const numWords = words.length;

    const solution = haiku.poem
      .map((line: string) => line
        .split(/\s/)
        .map((w: string) => w.toLowerCase().replace(/[]/, "")));

    const inProgress = [
      words.slice(0, (numWords / 3)),
      words.slice((numWords / 3), (2 * numWords / 3)),
      words.slice((2 * numWords / 3)),
    ];

    checkCorrect(inProgress, solution);

    set({
      haiku,
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

  move: async (word: any, fromLine: number, fromOffset: number, toLine: number, toOffset: number) => {
    console.log(">> hooks.haikudle.move", { word, fromLine, fromOffset, toLine, toOffset });
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
  },

  swap: async (word: any, fromLine: number, fromOffset: number, toLine: number, toOffset: number) => {
    console.log(">> hooks.haikudle.swap", { fromLine, fromOffset, toLine, toOffset });
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
  },

})));

export default useHaikudle;
