import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Haiku } from '@/types/Haiku';
import { User } from '@/types/User';
import { listToMap, mapToList, mapToSearchParams, uuid } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from "./alert";
import useUser from './user';
import { syllable } from 'syllable'
import shuffleArray from "@/utils/shuffleArray";

const countSyllables = (lines: string[][]) => {
  const r = lines.map((line: any[]) => {
    // console.log('>> app._components.HaikuPage.countSyllables()', { line });
    return line.reduce((total: number, w: any) => {
      const v = w.word.toLowerCase().replace(/[,.]/, "");
      // console.log('>> app._components.HaikuPage.countSyllables()', { v, c: syllable(v) });
      return total + (syllable(v) || 0);
    }, 0);
  });

  // console.log('>> app._components.HaikuPage.countSyllables()', { r });
  return r;
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

const isSolved = (inProgress: any, solution: any) => {
  const wordsInProcess = inProgress.flat().map((w: any) => w.word).join(" ").split(/\s/);
  // console.log("*** isSolved", { wordsInProcess, solution });

  if (wordsInProcess.length == solution.flat().length) {
    checkCorrect(inProgress, solution); // side effects yuk!
    return inProgress.flat().reduce((a: boolean, m: any, i: number) => a && m.correct, true);
  }

  return false;
}

const useHaikudle: any = create(devtools((set: any, get: any) => ({

  // access via get(id) or find(query?)
  haiku: undefined,
  solution: [[], [], []],
  inProgress: [[], [], []],
  words: [],
  solved: false,

  init: (haiku: Haiku) => {
    console.log(">> hooks.haikudle.init", { haiku });
    const words = [haiku.poem[1], haiku.poem[2]]
      .join(" ")
      .split(/\s/)
      .map((w: string) => w.toLowerCase().replace(/[]/, ""))

    set({
      haiku,
      inProgress: [
        haiku.poem[0].split(/\s/)
          .map((word: string, offset: number) => {
            return {
              word: word.toLowerCase(),
              offset,
              correct: false,
            }
          }),
        [],
        [],
      ],
      solution: haiku.poem
        .map((line: string) => line
          .split(/\s/)
          .map((w: string) => w.toLowerCase().replace(/[]/, ""))),

      words:
        shuffleArray(
          words.map((w: string, i: number) => {
            return {
              offset: i,
              word: w,
              picked: false,
              correct: false,
            }
          })
        )
      ,
      solved: false,
    });
  },

  pick: (offset: number) => {
    console.log(">> hooks.haikudle.pick", { offset });

    const { haiku, inProgress, solution, words } = get();
    const w = words.find((w: any) => w.offset == offset);
    // const lw = w.toLowerCase();
    w.picked = true;

    const syllableCounts = countSyllables(inProgress);
    const syllableCount = syllable(w.word);

    const updatedInProgress = [
      inProgress[0],
      syllableCounts[1] + syllableCount <= 7
        ? [...inProgress[1], w /* + (syllableCounts[1] + syllableCount >= 7 || left.length == 0 ? "," : "") */]
        : inProgress[1],
      syllableCounts[1] + syllableCount <= 7
        ? inProgress[2]
        : [...inProgress[2], w /* + (left.length == 0 ? "." : "") */]
    ];

    set({
      inProgress: updatedInProgress, //checkCorrect(updatedInProgress, solution),
      words,
      solved: isSolved(updatedInProgress, solution),
    });
  },

  remove: (lineNum: number, wordNum: number, word: any) => {
    const { haiku, inProgress, words, solution } = get();
    console.log(">> hooks.haikudle.remove", { lineNum, wordNum, word });

    const [spliced] = inProgress[lineNum].splice(wordNum, 1);
    console.log(">> hooks.haikudle.remove", { spliced });

    // const w = words.find((w: any) => w.picked && w.word == spliced)
    // console.log(">> hooks.haikudle.remove", { w, words });

    if (spliced) {
      spliced.picked = false;
      spliced.correct = false;
    }

    set({
      words,
      inProgress,
      solved: isSolved(inProgress, solution),
    })
  },

})));

export default useHaikudle;
