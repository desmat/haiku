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

const countSyllables = (inProgress: any) => {
  // @ts-ignore
  const r = inProgress.map((line: string) => {
    console.log('>> app._components.HaikuPage.countSyllables()', { line });
    // @ts-ignore
    return line.split(/\s+/).reduce((total: number, v: string) => {
      // @ts-ignore
      const v2 = v.toLowerCase().replace(/[,.]/, "");
      // @ts-ignore
      console.log('>> app._components.HaikuPage.countSyllables()', { v, v2, c: syllable(v2) });
      // @ts-ignore
      return total + (syllable(v2) || 0);
    }, 0);
  });

  console.log('>> app._components.HaikuPage.countSyllables()', { r });
  return r;
}

const useHaikudle: any = create(devtools((set: any, get: any) => ({

  // access via get(id) or find(query?)
  haiku: undefined,
  inProgress: ["", "", ""],
  left: [],

  init: (haiku: Haiku) => {
    console.log(">> hooks.haikudle.init", { haiku });

    set({
      haiku,
      inProgress: [
        haiku.poem[0],
        "",
        ""
      ],
      left: 
        shuffleArray(
          [haiku.poem[1], haiku.poem[2]]
            .join(" ")
            .split(/\s/)
            .map((w: string) => w.toLowerCase().replace(/[.,]/, ""))
        )
    });
  },

  pick: (offset: number) => {
    console.log(">> hooks.haikudle.pick", { offset });

    const { haiku, inProgress, left } = get();
    const w = left[offset];
    const lw = w.toLowerCase();

    const r = left.splice(offset, 1);
    const syllableCounts = countSyllables(inProgress);
    const syllableCount = syllable(lw);

    set({
      inProgress: [
        inProgress[0],
        syllableCounts[1] + syllableCount <= 7
          ? inProgress[1] + (inProgress[1] ? " " : "") + lw + (syllableCounts[1] + syllableCount >= 7 || left.length == 0 ? "," : "")
          : inProgress[1],
        syllableCounts[1] + syllableCount <= 7
          ? inProgress[2]
          : inProgress[2] + (inProgress[2] ? " " : "") + lw + (left.length == 0 ? "." : "")
      ],

      left: left,
    });
  },

  remove: (offset: number) => {
    console.log(">> hooks.haikudle.remove", { offset });

    // TODO
  },

})));

export default useHaikudle;
