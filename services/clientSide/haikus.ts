import { hashCode, mapToList, normalizeWord, uuid } from '@desmat/utils';
import { DailyHaiku, Haiku, UserHaiku } from "@/types/Haiku";
import { createStore } from '../stores/redis';

const store = createStore({
  // debug: true,
});

export async function getHaiku(id: string, hashPoem?: boolean): Promise<Haiku | undefined> {
  console.log(`>> services.haiku.getHaiku`, { id, hashPoem });

  let haiku = await store.haikus.get(id);

  if (haiku && hashPoem) {
    haiku = {
      ...haiku,
      poem: haiku.poem
        .map((line: string) => line.split(/\s+/)
          .map((word: string) => hashCode(normalizeWord(word)))),
    }
  }

  haiku = {
    ...haiku, 
    usage: {},
  };

  console.log(`>> services.haiku.getHaiku`, { id, haiku });
  return haiku;
}

export async function getDailyHaiku(id: string): Promise<DailyHaiku | undefined> {
  console.log(`>> services.haiku.getDailyHaiku`, { id });

  const dailyHaiku = await store.dailyHaikus.get(id);
  console.log(`>> services.haiku.getDailyHaiku`, { id, dailyHaiku });
  return dailyHaiku;
}
