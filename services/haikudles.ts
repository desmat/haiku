import moment from 'moment';
import { syllable } from 'syllable';
import { DailyHaiku, Haiku } from '@/types/Haiku';
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { Store } from "@/types/Store";
import { User } from '@/types/User';
import { uuid } from '@/utils/misc';
import shuffleArray from '@/utils/shuffleArray';
import { getDailyHaikus, getHaiku, getHaikus } from './haikus';
import { triggerDailyHaikudleSaved } from './webhooks';

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

async function createInProgress(user: User, haikudle: Haikudle): Promise<Haikudle> {
  const haiku = await getHaiku(user, haikudle.haikuId);
  console.log(`>> services.haikudle.createInProgress`, { haiku });

  let words = haiku.poem
    .join(" ")
    .split(/\s/)
    .map((w: string, i: number) => {
      const word = w.toLowerCase().replace(/[]/, "")
      return {
        id: uuid(),
        word: word,
        syllables: syllable(word),
      }
    });

  // always set first 2 and last words correct
  let correctWords = [
    words.splice(0, 2),
    words.splice(words.length - 1, 1),
  ];

  words = [
    ...correctWords[0],
    ...shuffleArray(words),
    ...correctWords[1],
  ];

  const numWords = words.length;
  const numLines = haiku.poem.length;
  const inProgress = haikudle?.inProgress || Array.from(new Array(numLines))
    .map((e: any, i: number) => words.slice((i * numWords / numLines), ((i + 1) * numWords / numLines)));

  haikudle = {
    ...haikudle,
    inProgress,
  }

  return haikudle;
}

export async function getHaikudle(user: User, id: string): Promise<Haikudle | undefined> {
  console.log(`>> services.haikudle.getHaikudle`, { id });

  let haikudle = await store.haikudles.get(id);
  console.log(`>> services.haikudle.getHaikudle`, { id, haikudle });

  if (!haikudle) {
    haikudle = await createHaikudle(user, {
      id,
      haikuId: id,
    });
  }

  if (!haikudle.inProgress) {
    haikudle = await createInProgress(user, haikudle);
  }

  console.log(`>> services.haikudle.getHaikudle`, { haikudle });

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

  if (!haikudle.inProgress) {
    newHaikudle = await createInProgress(user, newHaikudle);
  }

  return store.haikudles.create(user.id, newHaikudle);
}

export async function deleteHaikudle(user: any, id: string): Promise<Haikudle> {
  console.log(">> services.haikudle.deleteHaikudle", { id, user });

  if (!id) {
    throw `Cannot delete haikudle with null id`;
  }

  const haikudle = await getHaikudle(user, id);
  if (!haikudle) {
    throw `Haikudle not found: ${id}`;
  }

  if (!(haikudle.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  // remove daily haikudle and this user's userhaikudle (leave the others alone)
  const userHaikudleId = `${id}-${user.id}`;
  const [
    dailyHaikudles,
    userHaikudle
  ] = await Promise.all([
    store.dailyHaikudles.find(),
    store.userHaikudles.get(userHaikudleId),
  ]);
  const dailyHaikudle = dailyHaikudles
    .filter((dailyHaikudle: DailyHaikudle) => dailyHaikudle.haikudleId == id)[0];

  dailyHaikudle && store.dailyHaikudles.delete(user.id, dailyHaikudle.id);
  userHaikudle && store.userHaikudles.delete(user.id, userHaikudle.id);

  return store.haikudles.delete(user.id, id);
}

export async function saveHaikudle(user: any, haikudle: Haikudle): Promise<Haikudle> {
  console.log(">> services.haikudle.saveHaikudle", { haikudle, user });

  if (!(haikudle.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  return store.haikudles.update(user.id, haikudle);
}

export async function getUserHaikudle(userId: string, haikudleId: string): Promise<UserHaikudle | undefined> {
  console.log(`>> services.haikudle.getUserHaikudle`, { userId, haikudleId });

  const userHaikudleId = `${haikudleId}-${userId}`; // this really should be userId:haikudleId but too late ¯\_(ツ)_/¯
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

  return store.userHaikudles.create(user.id, userHaikudle);
}

export async function getDailyHaikudle(id?: string): Promise<DailyHaikudle | undefined> {
  console.log(`>> services.haikudle.getDailyHaikudle`, { id });

  if (!id) id = moment().format("YYYYMMDD");

  let dailyHaikudle = await store.dailyHaikudles.get(id);
  console.log(`>> services.haikudle.getDailyHaikudle`, { id, dailyHaikudle });

  if (!dailyHaikudle) {
    const systemUser = { id: "(system)" } as User;
    // create a new haikudle and dailyhaikudle combo: 
    // first pull from daily haikus, else from the rest
    const [
      previousDailyHaikudles,
      haikudles,
      dailyHaikus,
    ] = await Promise.all([
      getDailyHaikudles(),
      getHaikudles(),
      getDailyHaikus(),
    ]);

    const previousDailyHaikuIds = previousDailyHaikudles.map((dailyHaikudle: DailyHaikudle) => dailyHaikudle.haikuId);
    let nonDailyhaikus = dailyHaikus.filter((dailyHaiku: DailyHaiku) => !previousDailyHaikuIds.includes(dailyHaiku.haikuId));

    let randomHaikuId;
    if (nonDailyhaikus.length) {
      randomHaikuId = shuffleArray(nonDailyhaikus)[0].haikuId;
    } else {
      // didn't find any daily haikus that hasn't been a daily haikudle already
      const haikus = await getHaikus();
      nonDailyhaikus = haikus.filter((haiku: Haiku) => !previousDailyHaikuIds.includes(haiku.id));
      randomHaikuId = shuffleArray(nonDailyhaikus)[0].id;
    }

    const randomHaikudle = await createHaikudle(systemUser, { id: randomHaikuId, haikuId: randomHaikuId });

    console.log('>> app.api.haikudles.GET', { randomHaikuId, randomHaikudle, previousDailyHaikudles, haikudles });

    dailyHaikudle = await saveDailyHaikudle(systemUser, id, randomHaikudle.haikuId, randomHaikudle.id);
  }

  return dailyHaikudle;
}

export async function getDailyHaikudles(query?: any): Promise<DailyHaikudle[]> {
  const dailyHaikudles = (await store.dailyHaikudles.find(query))
    .filter(Boolean);
  const dailyHaikudleIds = dailyHaikudles
    .map((dailyHaikudle: DailyHaikudle) => dailyHaikudle.haikuId);

  // lookup theme; 
  // at some point we won't need to do this since we're now 
  // saving them with the daily haikudle record  
  const haikus = await store.haikus.find({ id: dailyHaikudleIds });
  const themeLookup = new Map(haikus
    .map((haiku: Haiku) => [haiku.id, haiku.theme]));

  // @ts-ignore
  return dailyHaikudles
    .map((dh: DailyHaikudle) => {
      const theme = themeLookup.get(dh?.haikuId)
      if (theme) {
        return {
          ...dh,
          theme,
        }
      }
    })
    .sort((a: any, b: any) => a.id - b.id);
}

export async function getNextDailyHaikudleId(dailyHaikudles?: DailyHaikudle[]): Promise<string> {
  const ids = (dailyHaikudles || await getDailyHaikudles())
    .map((dh: DailyHaikudle) => dh?.id)
    .sort()
    .reverse();
  const todays = moment().format("YYYYMMDD");

  if (!ids.includes(todays)) {
    return todays;
  }

  const next = moment(ids[0]).add(1, "days").format("YYYYMMDD");

  return next;
}


export async function saveDailyHaikudle(user: any, dateCode: string, haikuId: string, haikudleId: string): Promise<DailyHaikudle> {
  console.log(">> services.haikudle.saveDailyHaikudle", { user, dateCode, haikuId, haikudleId });

  if (!user) {
    throw `Unauthorized`;
  }

  const [dailyhaikudle, haiku, haikudle] = await Promise.all([
    store.dailyHaikudles.get(dateCode),
    store.haikus.get(haikuId),
    store.haikudles.get(haikudleId),
  ]);

  if (!haiku) throw `Haiku not found: ${haikuId}`;

  if (!haikudle) throw `Haikudle not found: ${haikudleId}`;

  let ret;
  if (dailyhaikudle) {
    ret = await store.dailyHaikudles.update(user.id, {
      id: dateCode,
      haikuId,
      haikudleId,
      theme: haiku.theme
    });
  } else {
    ret = await store.dailyHaikudles.create(user.id, {
      id: dateCode,
      haikuId,
      haikudleId,
      theme: haiku.theme,
    });
  }

  triggerDailyHaikudleSaved(ret);

  return ret;
}
