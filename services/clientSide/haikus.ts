import { DailyHaiku, Haiku, UserHaiku } from "@/types/Haiku";
import { Store } from "@/types/Store";
import { hashCode, mapToList, normalizeWord, uuid } from '@/utils/misc';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s });
    store = new s.create();
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
  return new Promise((resolve, reject) => resolve(haiku));
}

export async function getDailyHaiku(id: string): Promise<DailyHaiku | undefined> {
  console.log(`>> services.haiku.getDailyHaiku`, { id });

  const dailyHaiku = await store.dailyHaikus.get(id);
  console.log(`>> services.haiku.getDailyHaiku`, { id, dailyHaiku });
  return new Promise((resolve, reject) => resolve(dailyHaiku));
}
