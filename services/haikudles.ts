import moment from 'moment';
import { syllable } from 'syllable';
import { put } from '@vercel/blob';
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { Store } from "@/types/Store";
import { User } from '@/types/User';
import { mapToList, uuid } from '@/utils/misc';
import * as samples from '@/services/stores/samples';
import * as openai from './openai';
import chroma from 'chroma-js';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import shuffleArray from '@/utils/shuffleArray';
import { getHaiku } from './haikus';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikudles.init", { s })
    store = new s.create();
  });

export async function getHaikudles(query?: any): Promise<Haikudle[]> {
  let haikudles = await store.haikudles.find(query);
  if (!haikudles?.length && (!query || JSON.stringify(query) == "{}")) {
    // empty db, populate with samples
    // haikudles = await Promise.all(
    //   mapToList(samples.haikudles)
    //     .map((h: Haikudle) => store.haikudles.create("(system)", h)));
  }

  return new Promise((resolve, reject) => resolve(haikudles.filter(Boolean)));
}

export async function getHaikudle(id: string): Promise<Haikudle | undefined> {
  console.log(`>> services.haikudle.getHaikudle`, { id });

  let haikudle = await store.haikudles.get(id);
  console.log(`>> services.haikudle.getHaikudle`, { id, haikudle });

  if (!haikudle.inProgress) {
    const haiku = await getHaiku(haikudle.haikuId);
    console.log(`>> services.haikudle.getHaikudle`, { haiku });

    const words = shuffleArray(haiku.poem
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
      }));

    const numWords = words.length;
    const inProgress = haikudle?.inProgress || [
      words.slice(0, (numWords / 3)),
      words.slice((numWords / 3), (2 * numWords / 3)),
      words.slice((2 * numWords / 3)),
    ];

    haikudle = {
      ...haikudle,
      inProgress,
    }
  }

  return new Promise((resolve, reject) => resolve(haikudle));
}

export async function createHaikudle(user: User, haikudle: Haikudle): Promise<Haikudle> {
  console.log(">> services.haikudle.createHaikudle", { user, haikudle });

  let newHaikudle = {
    id: haikudle.id,
    createdBy: user.id,
    createdAt: moment().valueOf(),
    status: "created",
    haikuId: haikudle.haikuId,
    inProgress: haikudle.inProgress,
  } as Haikudle;

  // TODO

  return store.haikudles.create(user.id, newHaikudle);
}

export async function deleteHaikudle(user: any, id: string): Promise<Haikudle> {
  console.log(">> services.haikudle.deleteHaikudle", { id, user });

  if (!id) {
    throw `Cannot delete haikudle with null id`;
  }

  const haikudle = await getHaikudle(id);
  if (!haikudle) {
    throw `Haikudle not found: ${id}`;
  }

  if (!(haikudle.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  // return store.haikudles.delete(user.id, id);
}

export async function saveHaikudle(user: any, haikudle: Haikudle): Promise<Haikudle> {
  console.log(">> services.haikudle.saveHaikudle", { haikudle, user });

  if (!(haikudle.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  return store.haikudles.update(user.id, haikudle);
}

export async function getUserHaikudle(userHaikudleId: string): Promise<UserHaikudle | undefined> {
  console.log(`>> services.haikudle.getUserHaikudle`, { userHaikudleId });

  const userHaikudle = await store.userHaikudles.get(userHaikudleId);
  console.log(`>> services.haikudle.getUserHaikudle`, { userHaikudleId, userHaikudle });
  return new Promise((resolve, reject) => resolve(userHaikudle));
}

export async function saveUserHaikudle(user: any, haikudle: Haikudle): Promise<Haikudle> {
  console.log(">> services.haikudle.saveUserHaikudle", { haikudle, user });

  if (!user) {
    throw `Unauthorized`;
  }

  const userHaikudleId = `${haikudle.haikuId}-${user.id}`;
  let userHaikudle = await store.userHaikudles.get(userHaikudleId);

  if (userHaikudle) {
    return store.userHaikudles.update(userHaikudleId, { ...userHaikudle, haikudle });
  }

  userHaikudle = {
    id: userHaikudleId,
    userId: user.id,
    haikudle,
  }

  return store.userHaikudles.create(userHaikudleId, userHaikudle);
}

export async function getDailyHaikudle(id: string): Promise<DailyHaikudle | undefined> {
  console.log(`>> services.haikudle.getDailyHaikudle`, { id });

  const dailyHaikudle = await store.dailyHaikudles.get(id);
  console.log(`>> services.haikudle.getDailyHaikudle`, { id, dailyHaikudle });
  return new Promise((resolve, reject) => resolve(dailyHaikudle));
}

export async function saveDailyHaikudle(user: any, dateCode: string, haikuId: string, haikudleId: string): Promise<DailyHaikudle> {
  console.log(">> services.haikudle.saveDailyHaikudle", { user, dateCode, haikuId, haikudleId });

  if (!user) {
    throw `Unauthorized`;
  }

  let dailyhaikudle = await store.dailyHaikudles.get(dateCode);

  if (dailyhaikudle) {
    return store.dailyHaikudles.update(dateCode, { id: dateCode, haikuId, haikudleId });
  }

  return store.dailyHaikudles.create(dateCode, {
    id: dateCode,
    haikuId,
    haikudleId,
  });
}
