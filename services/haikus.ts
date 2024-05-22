import chroma from 'chroma-js';
import moment from 'moment';
import { put } from '@vercel/blob';
import { DailyHaiku, Haiku, UserHaiku, UserHaikuSaveOptions } from "@/types/Haiku";
import { Store } from "@/types/Store";
import { User } from '@/types/User';
import { hashCode, mapToList, normalizeWord, uuid } from '@/utils/misc';
import * as samples from '@/services/stores/samples';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { Haikudle, UserHaikudle } from '@/types/Haikudle';
import { deleteHaikudle, getHaikudle } from './haikudles';
import * as openai from './openai';
import { incUserUsage } from './usage';
import shuffleArray from '@/utils/shuffleArray';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s });
    store = new s.create();
  });

export async function getHaikus(query?: any, hashPoem?: boolean): Promise<Haiku[]> {
  console.log(">> services.haikus.getHaikus", { query, hashPoem })
  let haikus = (await store.haikus.find(query))
    .filter((haiku: Haiku) => haiku && !haiku.deprecated && !haiku.deprecatedAt);
  // note that we started with .deprecated but moved to .deprecatedAt

  if (!haikus?.length && (!query || JSON.stringify(query) == "{}")) {
    // empty db, populate with samples
    haikus = await Promise.all(
      mapToList(samples.haikus)
        .map((h: Haiku) => store.haikus.create("(system)", h)));
  }

  if (hashPoem) {
    haikus = haikus
      .map((haiku: Haiku) => haiku = {
        ...haiku,
        poem: haiku.poem
          .map((line: string) => line.split(/\s+/)
            .map((word: string) => hashCode(normalizeWord(word))))
      })
  }

  return new Promise((resolve, reject) => resolve(haikus));
}

export async function getUserHaikus(user: User, all?: boolean): Promise<Haiku[]> {
  console.log(`>> services.haiku.getUserHaikus`, { user });

  let haikus;

  if (all) {
    // for admins: get all haikus
    haikus = (await store.haikus.find())
      .filter((haiku: Haiku) => haiku && !haiku.deprecated && !haiku.deprecatedAt);
  } else {
    // find all haikus that user solved corresponding haikudle
    const [generatedHaikus, userHaikus, userHaikudles] = await Promise.all([
      store.haikus.find({
        createdBy: user.id
      }),
      store.userHaikus.find({
        createdBy: user.id,
      }),
      store.userHaikudles.find({
        createdBy: user.id,
        // solved: true, // nope, need to filter on haikudle.solved and can't do that
      }),
    ]);

    console.log(`>> services.haiku.getUserHaikus`, { userHaikus, userHaikudles, generatedHaikus });

    const haikuIds = Array.from(new Set([
      ...generatedHaikus.map((haiku: Haiku) => haiku.id),
      ...userHaikus.map((userHaiku: UserHaiku) => userHaiku.haikuId),
      ...userHaikudles.map((userHaikudle: UserHaikudle) => userHaikudle.haikudle?.solved && userHaikudle.haikudle?.haikuId),
    ]));
    haikus = await store.haikus.find({ id: haikuIds });
    console.log(`>> services.haiku.getUserHaikus`, { haikuIds, justThoseHaikus: haikus });

    const generatedHaikuLookup = new Map(generatedHaikus
      .map((h: Haiku) => [h.id, {
        generatedAt: h.updatedAt || h.createdAt,
      }]));

    const userHaikuLookup = new Map(userHaikus
      .map((uh: UserHaiku) => [uh.haikuId, {
        viewedAt: uh.createdAt,
        likedAt: uh.likedAt,
      }]));

    const userHaikudleLookup = new Map(userHaikudles
      .filter((uh: UserHaikudle) => uh?.haikudle?.solved)
      .map((uh: UserHaikudle) => [uh.haikudle.haikuId, {
        solvedAt: uh.updatedAt || uh.createdAt,
        moves: uh.haikudle?.moves,
      }]));

    console.log(`>> services.haiku.getUserHaikus`, { userHaikuLookup, userHaikudleLookup, generatedHaikuLookup });

    haikus = haikus
      .map((haiku: Haiku) => {
        return {
          ...haiku,
          ...userHaikuLookup.get(haiku.id),
          ...userHaikudleLookup.get(haiku.id),
          ...generatedHaikuLookup.get(haiku.id),
        }
      });
  }

  // strip down to just the basics
  haikus = haikus
    .map((haiku: Haiku) => {
      return {
        id: `${user.id}:${haiku.id}`,
        haikuId: haiku.id,
        userId: user.id,
        createdBy: haiku.createdBy,
        createdAt: haiku.createdAt,
        generatedAt: haiku.generatedAt,
        solvedAt: haiku.solvedAt,
        viewedAt: haiku.viewedAt,
        likedAt: haiku.likedAt,
        theme: haiku.theme,
        moves: haiku.moves,
      };
    })
    .filter(Boolean);

  return haikus;
}

export async function getHaiku(user: User, id: string, hashPoem?: boolean, version?: string): Promise<Haiku | undefined> {
  console.log(`>> services.haiku.getHaiku`, { id, hashPoem });

  const versionedId = version ? `${id}:${version}` : id;
  let haiku = await store.haikus.get(versionedId);

  if (!haiku) return;

  if (version) {
    haiku = { ...haiku, id };
  }

  if (hashPoem) {
    haiku = {
      ...haiku,
      poemHashed: true,
      poem: haiku.poem
        .map((line: string) => line.split(/\s+/)
          .map((word: string) => hashCode(normalizeWord(word)))),
    }
  }

  // if (user.isAdmin) {
    haiku.numLikes = (await store.userHaikus.find({ haikuId: id }))
      .filter((uh: UserHaiku) => uh.likedAt)
      .length;
  // }

  console.log(`>> services.haiku.getHaiku`, { id, haiku });
  return haiku;
}

export async function createHaiku(user: User, haiku: Haiku): Promise<Haiku> {
  console.log(">> services.haiku.createHaiku", { user });

  let create = {
    ...haiku,
    id: haiku.id || uuid(),
    createdBy: user.id,
    createdAt: moment().valueOf(),
    status: "created",
  } as Haiku;

  return store.haikus.create(user.id, create);
}

export async function regenerateHaikuPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const subject = haiku.theme;
  const mood = undefined;
  console.log(">> services.haiku.regenerateHaikuPoem", { lang, subject, mood, user });
  const language = supportedLanguages[lang].name;

  const {
    prompt: poemPrompt,
    model: languageModel,
    response: {
      haiku: poem,
      subject: generatedSubject,
      mood: generatedMood,
    }
  } = await openai.generateHaiku(language, subject, mood);
  // console.log(">> services.haiku.regenerateHaikuPoem", { ret });
  console.log(">> services.haiku.regenerateHaikuPoem", { poem, generatedSubject, generatedMood, poemPrompt });

  // delete corresponding haikudle 
  getHaikudle(user, haiku.id).then(async (haikudle: Haikudle) => {
    console.log(">> services.haiku.regenerateHaikuPoem", { haikudle });
    if (haikudle) {
      deleteHaikudle(user, haikudle.id);
    }
  });

  if (!user.isAdmin) {
    incUserUsage(user, "haikusRegenerated");
  }

  return saveHaiku(user, {
    ...haiku,
    poem,
    theme: generatedSubject,
    mood: generatedMood,
    poemPrompt,
    languageModel,
  });
}

export async function completeHaikuPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const subject = haiku.theme;
  const mood = haiku.mood;
  const language = supportedLanguages[lang].name;
  console.log(">> services.haiku.completeHaikuPoem", { language, subject, mood, user });

  const {
    response: {
      haiku: completedPoem,
      subject: generatedSubject,
      mood: generatedMood,
    },
    model: languageModel,
    prompt: poemPrompt,
  } = await openai.completeHaiku(haiku.poem, language, subject, mood);
  console.log(">> services.haiku.completeHaikuPoem", { completedPoem, generatedSubject, generatedMood });

  // delete corresponding haikudle 
  getHaikudle(user, haiku.id).then(async (haikudle: Haikudle) => {
    console.log(">> services.haiku.regenerateHaikuPoem", { haikudle });
    if (haikudle) {
      deleteHaikudle(user, haikudle.id);
    }
  });

  if (!user.isAdmin) {
    incUserUsage(user, "haikusRegenerated");
  }

  return saveHaiku(user, {
    ...haiku,
    poem: completedPoem,
    theme: generatedSubject,
    mood: generatedMood,
    languageModel,
    poemPrompt,
  });
}

export async function regenerateHaikuImage(user: any, haiku: Haiku, artStyle?: string): Promise<Haiku> {
  console.log(">> services.haiku.regenerateHaikuImage", { user, haiku });
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";

  const {
    url: openaiUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    model: imageModel,
  } = await openai.generateBackgroundImage(haiku.theme, haiku.mood, artStyle);

  const imageRet = await fetch(openaiUrl);
  // console.log(">> services.haiku.regenerateHaikuImage", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  console.log(">> services.haiku.generateHaiku", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  console.log(">> services.haiku.generateHaiku", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();
  const filename = `haiku-${haikuId}-${haiku.theme?.replaceAll(/\W/g, "_").toLowerCase()}-${(haiku.version || 0) + 1}.png`;
  const blob = !debugOpenai && await put(filename, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log(">> services.haiku.generateHaiku", { subject, filename, blob });

  let updatedHaiku = {
    ...haiku,
    artStyle: selectedArtStyle,
    imagePrompt,
    imageModel,
    // @ts-ignore
    bgImage: debugOpenai ? openaiUrl : blob.url,
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(0.5).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
  } as Haiku;

  if (!user.isAdmin) {
    incUserUsage(user, "haikusCreated");
  }

  return saveHaiku(user, updatedHaiku);
}

export async function generateHaiku(user: any, lang?: LanguageType, subject?: string, mood?: string, artStyle?: string): Promise<Haiku> {
  console.log(">> services.haiku.generateHaiku", { lang, subject, mood, user });
  const language = supportedLanguages[lang || "en"].name;
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";

  const {
    prompt: poemPrompt,
    model: languageModel,
    response: {
      haiku: poem,
      subject: generatedSubject,
      mood: generatedMood,
    }
  } = await openai.generateHaiku(language, subject, mood);
  // console.log(">> services.haiku.generateHaiku", { ret });
  console.log(">> services.haiku.generateHaiku", { poem, generatedSubject, generatedMood, poemPrompt });

  const {
    url: openaiUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    model: imageModel,
  } = await openai.generateBackgroundImage(subject || generatedSubject, mood || generatedMood, artStyle);

  const imageRet = await fetch(openaiUrl);
  // console.log(">> services.haiku.generateHaiku", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  console.log(">> services.haiku.generateHaiku", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  console.log(">> services.haiku.generateHaiku", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();
  const filename = `haiku-${haikuId}-${generatedSubject?.replaceAll(/\W/g, "_").toLowerCase()}.png`;
  const blob = !debugOpenai && await put(filename, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log(">> services.haiku.generateHaiku", { subject, filename, blob });

  let haiku = {
    id: haikuId,
    lang: lang || "en",
    createdBy: user.id,
    createdAt: moment().valueOf(),
    status: "created",
    theme: generatedSubject,
    mood: generatedMood,
    artStyle: selectedArtStyle,
    poemPrompt,
    languageModel,
    imagePrompt,
    imageModel,
    // @ts-ignore
    bgImage: debugOpenai ? openaiUrl : blob.url,
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(0.5).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
    poem,
  } as Haiku;

  if (!user.isAdmin) {
    incUserUsage(user, "haikusCreated");
  }

  return store.haikus.create(user.id, haiku);
}

export async function deleteHaiku(user: any, id: string): Promise<Haiku> {
  console.log(">> services.haiku.deleteHaiku", { id, user });

  if (!id) {
    throw `Cannot delete haiku with null id`;
  }

  const haiku = await getHaiku(user, id);
  if (!haiku) {
    throw `Haiku not found: ${id}`;
  }

  if (!(haiku.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  // remove daily haiku and all user haikus in addition to the actual haiku
  const [
    dailyHaikus,
    userHaikus
  ] = await Promise.all([
    store.dailyHaikus.find(),
    store.userHaikus.find(),
  ]);
  const dailyHaiku = dailyHaikus
    .filter((dailyHaiku: DailyHaiku) => dailyHaiku.haikuId == id)[0];

  dailyHaiku && store.dailyHaikus.delete(user.id, dailyHaiku.id);
  userHaikus
    .filter((userHaiku: UserHaiku) => userHaiku.haikuId == id)
    .map((userHaiku: UserHaiku) => store.userHaikus.delete(user.id, userHaiku.id));

  return store.haikus.delete(user.id, id);
}

export async function saveHaiku(user: any, haiku: Haiku): Promise<Haiku> {
  console.log(">> services.haiku.saveHaiku", { haiku, user });

  if (!(haiku.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  const original = await store.haikus.get(haiku.id);

  if (!original) {
    throw `Not found`;
  }

  const version = (original.version || 0);
  store.haikus.create(user.id, {
    ...original,
    id: `${original.id}:${version}`,
    version,
    deprecated: true,
  });

  // edge case where we're editing a previous version
  delete haiku.deprecated;
  delete haiku.deprecatedAt;

  const poem = haiku.poem.join("/");
  if (poem.includes("...") || poem.includes("…")) {
    return completeHaikuPoem(user, haiku);
  }

  return store.haikus.update(user.id, { ...haiku, version: version + 1 });
}

export async function getUserHaiku(userId: string, haikuId: string): Promise<UserHaiku | undefined> {
  console.log(`>> services.haiku.getUserHaiku`, { userId, haikuId });

  const id = `${userId}:${haikuId}`
  const userHaiku = await store.userHaikus.get(id);

  console.log(`>> services.haiku.getUserHaiku`, { userHaiku });
  return new Promise((resolve, reject) => resolve(userHaiku));
}

export async function createUserHaiku(user: User, haiku: Haiku, action?: "viewed" | "generated"): Promise<UserHaiku> {
  console.log(`>> services.haiku.createUserHaiku`, { user, haiku });

  const id = `${user.id}:${haiku.id}`;
  const now = moment().valueOf();
  const actionKV = action ? { [`${action}At`]: now } : {};
  const userHaiku = {
    id,
    userId: user.id,
    createdBy: user.id,
    createdAt: now,
    haikuId: haiku.id,
    theme: haiku.theme,
    ...actionKV,
  };

  const createdUserHaiku = await store.userHaikus.create(id, userHaiku, UserHaikuSaveOptions);

  console.log(`>> services.haiku.createUserHaiku`, { userHaiku: createdUserHaiku });
  return new Promise((resolve, reject) => resolve(createdUserHaiku));
}

export async function saveUserHaiku(user: User, userHaiku: UserHaiku): Promise<UserHaiku> {
  console.log(`>> services.haiku.saveUserHaiku`, { userHaiku });

  const savedUserHaiku = await store.userHaikus.update(user.id, userHaiku, UserHaikuSaveOptions);

  console.log(`>> services.haiku.saveUserHaiku`, { savedUserHaiku });
  return new Promise((resolve, reject) => resolve(savedUserHaiku));
}

export async function getDailyHaiku(id?: string): Promise<DailyHaiku | undefined> {
  console.log(`>> services.haiku.getDailyHaiku`, { id });

  if (!id) id = moment().format("YYYYMMDD");

  let dailyHaiku = await store.dailyHaikus.get(id);
  console.log(`>> services.haiku.getDailyHaiku`, { id, dailyHaiku });

  if (!dailyHaiku) {
    // create daily haiku if none for today
    const previousDailyHaikus = await getDailyHaikus();
    const previousDailyHaikuIds = previousDailyHaikus.map((dailyHaiku: DailyHaiku) => dailyHaiku.haikuId);
    const haikus = await getHaikus();
    const nonDailyhaikus = haikus.filter((haiku: Haiku) => !previousDailyHaikuIds.includes(haiku.id));
    const randomHaikuId = shuffleArray(nonDailyhaikus)[0].id;
    const randomHaiku = haikus[randomHaikuId];
    console.log('>> app.api.haikus.GET creating daily haiku', { randomHaikuId, randomHaiku, previousDailyHaikus, haikus });

    dailyHaiku = await saveDailyHaiku({ id: "(system)" } as User, id, randomHaikuId);
  }

  return new Promise((resolve, reject) => resolve(dailyHaiku));
}

export async function getDailyHaikus(query?: any): Promise<DailyHaiku[]> {
  const dailyHaikus = (await store.dailyHaikus.find(query))
    .filter(Boolean);
  const dailyHaikuIds = dailyHaikus
    .map((dailyHaiku: DailyHaiku) => dailyHaiku.haikuId);

  // lookup theme; 
  // at some point we won't need to do this since we're now 
  // saving them with the daily haiku record  
  const haikus = await store.haikus.find({ id: dailyHaikuIds });
  const themeLookup = new Map(haikus
    .map((haiku: Haiku) => [haiku.id, haiku.theme]));

  // @ts-ignore
  return dailyHaikus
    .map((dh: DailyHaiku) => {
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

export async function getNextDailyHaikuId(dailyHaikus?: DailyHaiku[]): Promise<string> {
  const ids = (dailyHaikus || await getDailyHaikus())
    .map((dh: DailyHaiku) => dh.id)
    .sort()
    .reverse();
  const todays = moment().format("YYYYMMDD");

  if (!ids.includes(todays)) {
    return todays;
  }

  const next = moment(ids[0]).add(1, "days").format("YYYYMMDD");

  return next;
}

export async function saveDailyHaiku(user: any, dateCode: string, haikuId: string): Promise<DailyHaiku> {
  console.log(">> services.haiku.saveDailyHaiku", { user, dateCode, haikuId });

  if (!user) {
    throw `Unauthorized`;
  }

  const [dailyHaiku, haiku] = await Promise.all([
    store.dailyHaikus.get(dateCode),
    store.haikus.get(haikuId),
  ]);

  if (!haiku) throw `Haiku not found: ${haikuId}`;

  if (dailyHaiku) {
    return store.dailyHaikus.update(user.id, {
      id: dateCode,
      haikuId,
      theme: haiku.theme
    });
  }

  return store.dailyHaikus.create(user.id, {
    id: dateCode,
    haikuId,
    theme: haiku.theme,
  });
}
