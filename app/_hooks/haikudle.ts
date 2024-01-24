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
  const r = lines.map((line: string[]) => {
    // console.log('>> app._components.HaikuPage.countSyllables()', { line });
    return line.reduce((total: number, v: string) => {
      const v2 = v.toLowerCase().replace(/[,.]/, "");
      // console.log('>> app._components.HaikuPage.countSyllables()', { v, v2, c: syllable(v2) });
      return total + (syllable(v2) || 0);
    }, 0);
  });

  // console.log('>> app._components.HaikuPage.countSyllables()', { r });
  return r;
}

const useHaikudle: any = create(devtools((set: any, get: any) => ({

  // access via get(id) or find(query?)
  haiku: undefined,
  inProgress: [[], [], []],
  words: [],


  init: (haiku: Haiku) => {
    console.log(">> hooks.haikudle.init", { haiku });
    const words =
      // shuffleArray(
        [haiku.poem[1], haiku.poem[2]]
          .join(" ")
          .split(/\s/)
          .map((w: string) => w.toLowerCase().replace(/[]/, ""))
      // )

    set({
      haiku,

      inProgress: [
        haiku.poem[0].split(/\s/),
        [],
        [],
      ],

      words: words.map((w: string, i: number) => {
        return {
          offset: i,
          word: w,
          picked: false,
          correct: undefined,
        }
      }),

    });
  },

  pick: (offset: number) => {
    console.log(">> hooks.haikudle.pick", { offset });

    const { haiku, inProgress, words } = get();
    const w = words[offset].word;
    const lw = w.toLowerCase();
    words[offset].picked = true;
    words[offset].correct = true;

    const syllableCounts = countSyllables(inProgress);
    const syllableCount = syllable(lw);

    set({
      inProgress: [
        inProgress[0],
        syllableCounts[1] + syllableCount <= 7
          ? [...inProgress[1], lw /* + (syllableCounts[1] + syllableCount >= 7 || left.length == 0 ? "," : "") */]
          : inProgress[1],
        syllableCounts[1] + syllableCount <= 7
          ? inProgress[2]
          : [...inProgress[2], lw /* + (left.length == 0 ? "." : "") */]
      ],

      words,
    });
  },

  remove: (lineNum: number, wordNum: number) => {
    const { haiku, inProgress, words } = get();
    console.log(">> hooks.haikudle.remove", { lineNum, wordNum });

    const [spliced] = inProgress[lineNum].splice(wordNum, 1);
    console.log(">> hooks.haikudle.remove", { spliced });

    const w = words.find((w: any) => w.picked && w.word == spliced)
    console.log(">> hooks.haikudle.remove", { w, words });

    if (w) {
      w.picked = false;
    }

    set({
      words,
      inProgress,
    })
  },

})));

export default useHaikudle;
