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

const isSolved = (words: any, inProgress: any, solution: any) => {
  const wordsInProcess = inProgress.flat().map((w: any) => w.word).join(" ").split(/\s/);
  // console.log("*** isSolved", { wordsInProcess, solution });

  // if (wordsInProcess.filter((w: any) => !w.placeholder).length == solution.flat().length) {
  if (!words.find((w: any) => !w.picked)) {
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
    const words =
      shuffleArray(
        haiku.poem
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
          })
      )
      ;

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
      inProgress: inProgress,
      solution,
      words: [],
      solved: false,
    });
  },

  pick: (offset: number) => {
    console.log(">> hooks.haikudle.pick", { offset });

    const { haiku, inProgress, solution, words } = get();
    const word = words.find((w: any) => w.offset == offset);
    console.log(">> hooks.haikudle.pick", { word });
    // const lw = w.toLowerCase();
    word.picked = true;

    const syllableCounts = countSyllables(inProgress);
    const syllableCount = syllable(word.word);

    // const updatedInProgress = [
    //   inProgress[0],
    //   syllableCounts[1] + syllableCount <= 7
    //     ? [...inProgress[1], w /* + (syllableCounts[1] + syllableCount >= 7 || left.length == 0 ? "," : "") */]
    //     : inProgress[1],
    //   syllableCounts[1] + syllableCount <= 7
    //     ? inProgress[2]
    //     : [...inProgress[2], w /* + (left.length == 0 ? "." : "") */]
    // ];

    // find a placeholder and replace

    console.log(">> hooks.haikudle.pick", { inProgress });

    const placeholders = inProgress
      .flat()
      .filter((w: any) => w.placeholder)
      .sort((a: any, b: any) => (a.line * 7 + a.offset) - (b.line * 7 + b.offset))


    console.log(">> hooks.haikudle.pick", { placeholders });

    const placeholder = placeholders[0];

    if (!placeholder) {
      throw 'no more placeholder?!'
    }

    console.log(">> hooks.haikudle.pick", { placeholder });

    const { line } = placeholder;
    const placeholderOffset = inProgress[line].indexOf(placeholder);
    console.log(">> hooks.haikudle.pick", { placeholderOffset });

    // here we either replace placeholders, or push non-placeholders
    const [sliced] = inProgress[line].splice(placeholderOffset, 0, word);
    console.log(">> hooks.haikudle.pick", { sliced });
    // eat up following placeholders
    for (let i = 0; inProgress[line][placeholderOffset + 1]?.placeholder && i < word.syllables; i++) {
      inProgress[line].splice(placeholderOffset + 1, 1);
    }

    set({
      inProgress, //checkCorrect(updatedInProgress, solution),
      words,
      solved: isSolved(words, inProgress, solution),
    });
  },

  remove: (lineNum: number, wordNum: number) => {
    const { haiku, inProgress, words, solution } = get();
    console.log(">> hooks.haikudle.remove", { lineNum, wordNum });

    // const [spliced] = inProgress[lineNum].splice(wordNum, 1);
    // console.log(">> hooks.haikudle.remove", { spliced });

    // if (spliced) {
    //   spliced.picked = false;
    //   spliced.correct = false;
    // }

    const word = inProgress[lineNum][wordNum];
    console.log(">> hooks.haikudle.remove", { word });

    if (word) {
      word.picked = false;
      word.correct = false;
    }

    const updatedWords = words.map((w: any) => w.offset == word.offset ? word : w);

    // here we want to fill the removed slot with placeholders, 
    // but not exceeding poem's structure (slot is a syllable)
    const maxSyllables = lineNum == 1 ? 7 : 5;
    // console.log("*** ", { inProgress });

    const totalSyllables = inProgress[lineNum].reduce((t: any, w: any) => {
      return t + (w.placeholder ? 1 : w.syllables || 0);
    }, 0) - (inProgress[lineNum][wordNum]?.syllables || 0); // we're about to remove that last one
    const syllables = word.syllables || 0;
    const numPlaceholders = Math.max(0, Math.min(syllables, maxSyllables - totalSyllables))
    console.log("*** ", { inProgress, maxSyllables, wordNum, totalSyllables, syllables, numPlaceholders });

    const placeholders = Array(numPlaceholders)
      .fill({
        word: "placeholder",
        // offset: slot,
        placeholder: true,
        line: lineNum,
        offset: wordNum,
      }).map((p: any, i: number) => {
        return {
          ...p,
          offset: wordNum + i,
        }
      });

    inProgress[lineNum] = [
      ...inProgress[lineNum].slice(0, wordNum),
      ...placeholders,
      ...inProgress[lineNum].slice(wordNum + 1),
    ];

    set({
      words: updatedWords,
      inProgress,
      solved: isSolved(words, inProgress, solution),
    })
  },

  solve: () => {
    const { haiku, inProgress, words, solution } = get();
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



  move: (word: any, fromLine: number, fromOffset: number, toLine: number, toOffset: number) => {
    console.log(">> hooks.haikudle.move", { word, fromLine, fromOffset, toLine, toOffset });
    const { haiku, inProgress, words, solution } = get();

    const [spliced] = inProgress[fromLine].splice(fromOffset, 1);
    inProgress[toLine].splice(toOffset, 0, spliced);

    checkCorrect(inProgress, solution); // side effects yuk!

    set({
      inProgress,
      solved: isSolved(words, inProgress, solution),
    });
  },


})));

export default useHaikudle;
