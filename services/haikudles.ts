import moment from 'moment';
import { syllable } from 'syllable';
import { DailyHaiku, Haiku } from '@/types/Haiku';
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { Store } from "@/types/Store";
import { User } from '@/types/User';
import { findHoleInDatecodeSequence, uuid } from '@/utils/misc';
import shuffleArray from '@/utils/shuffleArray';
import { getDailyHaikus, getFlaggedHaikuIds, getHaiku, getHaikus } from './haikus';
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

  return haikudles.filter(Boolean);
}

async function createInProgress(user: User, haikudle: Haikudle): Promise<Haikudle> {
  console.log(`>> services.haikudle.createInProgress`, { user, haikudle });

  const haiku = await getHaiku(user, haikudle.haikuId);
  if (!haiku) throw `Haiku not found: ${haikudle.haikuId}`;

  const shuffle = !user || user.isAdmin || !user.isAdmin && user.id != haiku.createdBy;
  console.log(`>> services.haikudle.createInProgress`, { haiku, user, shuffle });

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

  if (shuffle) {
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
  }

  const numWords = words.length;
  const numLines = haiku.poem.length;
  const inProgress = haikudle?.inProgress || Array.from(new Array(numLines))
    .map((e: any, i: number) => words.slice((i * numWords / numLines), ((i + 1) * numWords / numLines)));

  haikudle = {
    ...haikudle,
    inProgress,
    solved: !shuffle,
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

  return haikudle;
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
  const userHaikudleId = `${user.id}:${id}`;
  const [
    dailyHaikudles,
    userHaikudle
  ] = await Promise.all([
    store.dailyHaikudles.find({ haiku: id }),
    store.userHaikudles.get(userHaikudleId),
  ]);

  dailyHaikudles[0] && store.dailyHaikudles.delete(user.id, dailyHaikudles[0].id);
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

  const userHaikudleId = `${userId}:${haikudleId}`;
  const userHaikudle = await store.userHaikudles.get(userHaikudleId);
  console.log(`>> services.haikudle.getUserHaikudle`, { userHaikudleId, userHaikudle });
  return userHaikudle;
}

export async function saveUserHaikudle(user: any, haikudle: Haikudle): Promise<Haikudle> {
  console.log(">> services.haikudle.saveUserHaikudle", { haikudle, user });

  if (!user) {
    throw `Unauthorized`;
  }

  const userHaikudleId = `${user.id}:${haikudle.haikuId}`;
  let userHaikudle = await store.userHaikudles.get(userHaikudleId);

  if (userHaikudle) {
    return store.userHaikudles.update(userHaikudleId, { ...userHaikudle, haikudle });
  }

  userHaikudle = {
    id: userHaikudleId,
    userId: user.id,
    haikudleId: haikudle.id,
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
      flaggedHaikuIds,
    ] = await Promise.all([
      getDailyHaikudles(), // TODO: get ids
      getHaikudles(), // TODO: get ids
      getDailyHaikus(), // TODO: get ids
      getFlaggedHaikuIds(),
    ]);

    const previousDailyHaikuIds = previousDailyHaikudles.map((dailyHaikudle: DailyHaikudle) => dailyHaikudle.haikuId);
    let nonDailyhaikus = dailyHaikus.filter((dailyHaiku: DailyHaiku) => !previousDailyHaikuIds.includes(dailyHaiku.haikuId));

    let randomHaikuId;
    if (nonDailyhaikus.length) {
      randomHaikuId = shuffleArray(nonDailyhaikus)[0].haikuId;
    } else {
      // didn't find any daily haikus that hasn't been a daily haikudle already
      const haikus = await getHaikus(); // TODO get ids
      nonDailyhaikus = haikus
        .filter((haiku: Haiku) => !flaggedHaikuIds.has(haiku.id) && !previousDailyHaikuIds.includes(haiku.id));

      randomHaikuId = shuffleArray(nonDailyhaikus)[0]?.id;
      console.warn(`>> services.haiku.getDailyHaikudle WARNING: ran out of liked or non-daily haikus, picking from the lot`, { randomHaikuId });
    }

    const randomHaikudle = await createHaikudle(systemUser, { id: randomHaikuId, haikuId: randomHaikuId });

    console.log('>> app.api.haikudles.GET', { randomHaikuId, randomHaikudle, previousDailyHaikudles, haikudles });

    dailyHaikudle = await saveDailyHaikudle(systemUser, id, randomHaikudle.haikuId, randomHaikudle.id);
  }

  return dailyHaikudle;
}

export async function getDailyHaikudleIds(query?: any): Promise<string[]> {
  console.log(`>> services.haiku.getDailyHaikudleIds`, { query });
  let dailyHaikudleIds = Array.from(await store.dailyHaikudles.ids(query))
    .map((id: any) => `${id}`)
    .filter((id: string) => id && id.match(/20\d{6}/))
    .sort()
    .reverse();

  if (query?.count) {
    dailyHaikudleIds = dailyHaikudleIds.splice(query?.offset || 0, query.count)
  }

  return dailyHaikudleIds;
}

export async function getDailyHaikudles(query?: any): Promise<DailyHaikudle[]> {
  console.log(`>> services.haiku.getDailyHaikudles`, { query });
  const dailyHaikudleDateCodes = await getDailyHaikudleIds(query);
  const dailyHaikudles = await store.dailyHaikudles.find({ id: dailyHaikudleDateCodes })
  const dailyHaikudleIds = dailyHaikudles
    .map((dailyHaikudle: DailyHaikudle) => dailyHaikudle.haikuId);

  // lookup theme; 
  // at some point we won't need to do this since we're now 
  // saving them with the daily haikudle record  
  const haikus = await store.haikus.find({ id: dailyHaikudleIds });
  const themeLookup = new Map(haikus
    .map((haiku: Haiku) => [haiku.id, haiku.title || haiku.theme]));

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
    .filter(Boolean)
    .sort((a: any, b: any) => a.id - b.id);
}

export async function getNextDailyHaikudleId(): Promise<string> {
  const todayDatecode = moment().format("YYYYMMDD");
  const todaysDatecodeInt = parseInt(todayDatecode);

  const ids = Array.from(await store.dailyHaikudles.ids())
    .filter((id: any) => {
      const idInt = parseInt(id);
      return idInt >= todaysDatecodeInt && idInt < 20990000; // some bad datecodes gpt om there somehow
    })
    .map((id: any) => `${id}`) // but y?
    .sort();

  if (!ids.includes(todayDatecode)) {
    return todayDatecode;
  }

  const latestId = findHoleInDatecodeSequence(ids);

  return moment(latestId).add(1, "days").format("YYYYMMDD");
}


export async function saveDailyHaikudle(user: any, dateCode: string, haikuId: string, haikudleId: string): Promise<DailyHaikudle> {
  console.log(">> services.haikudle.saveDailyHaikudle", { user, dateCode, haikuId, haikudleId });

  if (!user) {
    throw `Unauthorized`;
  }

  let [dailyHaikudle, haiku, haikudle] = await Promise.all([
    store.dailyHaikudles.get(dateCode),
    store.haikus.get(haikuId),
    store.haikudles.get(haikudleId),
  ]);

  if (!haiku) throw `Haiku not found: ${haikuId}`;

  if (!haikudle) throw `Haikudle not found: ${haikudleId}`;

  const newDailyHaikudle = {
    id: dateCode,
    haikuId,
    haikudleId,
    theme: haiku.theme
  };

  let ret;
  if (dailyHaikudle) {
    ret = await store.dailyHaikudles.update(user.id, { ...dailyHaikudle, ...newDailyHaikudle });
  } else {
    ret = await store.dailyHaikudles.create(user.id, newDailyHaikudle);
  }

  const webhookRet = await triggerDailyHaikudleSaved(ret);
  // console.log(">> services.haikudle.saveDailyHaikudle", { webhookRet });

  return ret;
}
