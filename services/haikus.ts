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
import { USAGE_LIMIT } from '@/types/Usage';
import { byCreatedAtDesc, byIdDesc } from '@/utils/sort';
import shuffleArray from '@/utils/shuffleArray';
import { deleteHaikudle, getHaikudle } from './haikudles';
import * as openai from './openai';
import { incUserUsage, userUsage } from './usage';
import { triggerDailyHaikuSaved } from './webhooks';
import { completeLimerickPoem } from './limericks';

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
    haikus = (await store.haikus.find({ id: haikuIds }))
      .filter((haiku: Haiku) => haiku && !haiku.deprecated && !haiku.deprecatedAt);
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

export async function getHaiku(user: User, id: string, hashPoem?: boolean, version?: number): Promise<Haiku | undefined> {
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
  haiku.numLikes = await getHaikuNumLikes(haiku.id);
  // }

  console.log(`>> services.haiku.getHaiku`, { id, haiku });
  return haiku;
}

export async function getHaikuNumLikes(id: number) {
  return (await store.userHaikus.find({ haikuId: id }))
    .filter((uh: UserHaiku) => uh.likedAt)
    .length;
}

export async function createHaiku(user: User, {
  theme,
  poem,
  imageBuffer,
  imageType,
  imageUrl,
  mood,
  artStyle,
  poemPrompt,
  languageModel,
  imagePrompt,
  imageModel,
  lang,
}: {
  theme: string,
  poem: string[],
  // note: either imageBuffer or imageUrl should be provided
  imageBuffer?: Buffer,
  imageType?: string
  imageUrl?: string,
  mood?: string,
  artStyle?: string,
  poemPrompt?: string,
  languageModel?: string,
  imagePrompt?: string,
  imageModel?: string,
  lang?: LanguageType,
}): Promise<Haiku> {
  console.log(">> services.haiku.createHaiku", { user, theme, poem, imageUrl });

  if (!imageBuffer && !imageUrl) {
    throw 'neither imageBuffer or imageUrl provided';
  }

  const debug = process.env.OPENAI_API_KEY == "DEBUG";
  debug && console.warn(`>> services.haiku.createHaiku: DEBUG mode: not uploading to blob store`);

  if (!imageBuffer && imageUrl) {
    const imageRet = await fetch(imageUrl);
    // console.log(">> services.haiku.createHaiku", { imageRet });
    imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  }

  const getColors = require('get-image-colors')
  const colors = await getColors(imageBuffer, imageType || 'image/png');
  // console.log(">> services.haiku.createHaiku", { colors });
  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();

  if (!debug && imageBuffer) {
    const filename = `haiku-${haikuId}-${theme?.replaceAll(/\W/g, "_").toLowerCase()}.png`;
    const blob = !debug && await put(filename, imageBuffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    // console.log(">> services.haiku.createHaiku", { subject, filename, blob });
    imageUrl = blob.url;
  }

  let create = {
    id: haikuId,
    theme,
    poem,
    bgImage: imageUrl,
    status: "created",
    mood,
    artStyle,
    poemPrompt,
    languageModel,
    imagePrompt,
    imageModel,
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(0.5).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
    lang,
  } as Haiku;

  if (!user.isAdmin) {
    incUserUsage(user, "haikusCreated");
  }

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
      lang: generatedLang,
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
    lang: generatedLang || lang || "en",
    poemPrompt,
    languageModel,
  });
}

export async function completeHaikuPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const subject = haiku.theme;
  const mood = haiku.mood;
  const language = supportedLanguages[lang]?.name;
  console.log(">> services.haiku.completeHaikuPoem", { subject, mood, user, haiku });

  // a bit akward to do this here and in this way but we're just covering a narrow case
  const usage = await userUsage(user);
  const { haikusRegenerated } = usage[moment().format("YYYYMMDD")];
  // console.log('>> services.haiku.completeHaikuPoem', { haikusRegenerated, usage });

  if (haikusRegenerated && haikusRegenerated >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
    throw 'exceeded daily limit';
  }

  const previousHaikus: any[] = await Promise.all(
    Array.from(Array(Math.min(haiku?.version || 0, 8)))
      .map((_, i: number) => getHaiku(user, haiku.id, undefined, haiku.version - i))
  );
  const previousPoems = [
    (await getHaiku(user, haiku.id)).poem,
    ...previousHaikus?.map((haiku: Haiku) => haiku.poem)
  ];

  const {
    response: {
      haiku: completedPoem,
      subject: generatedSubject,
      mood: generatedMood,
      lang: generatedLang,
    },
    model: languageModel,
    prompt: poemPrompt,
  } = await openai.completeHaiku(haiku.poem, language, subject, mood, previousPoems);
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

  // cripple for testing
  // return {
  //   ...haiku,
  //   poem: completedPoem,
  //   theme: generatedSubject,
  //   mood: generatedMood,
  //   lang: generatedLang,
  //   languageModel,
  //   poemPrompt,
  // }  
  return saveHaiku(user, {
    ...haiku,
    poem: completedPoem,
    theme: generatedSubject,
    mood: generatedMood,
    lang: generatedLang,
    languageModel,
    poemPrompt,
  });
}

export async function regenerateHaikuImage(user: any, haiku: Haiku, artStyle?: string): Promise<Haiku> {
  console.log(">> services.haiku.regenerateHaikuImage", { user, haiku });
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";
  console.warn(`>> services.haiku.regenerateHaikuImage: DEBUG mode: not uploading to blob store`);

  const {
    url: openaiUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    model: imageModel,
  } = await openai.generateBackgroundImage(haiku.theme, haiku.mood, artStyle);

  const imageRet = await fetch(openaiUrl);
  // console.log(">> services.haiku.regenerateHaikuImage", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  // console.log(">> services.haiku.generateHaiku", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  // console.log(">> services.haiku.generateHaiku", { colors });

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
    // TODO let's separate image and text
    incUserUsage(user, "haikusRegenerated");
  }

  return saveHaiku(user, updatedHaiku);
}

export async function updateHaikuImage(user: any, haiku: Haiku, buffer: Buffer, type: string = "image/png"): Promise<Haiku> {
  console.log(">> services.haiku.updateHaikuImage", { user, haiku, buffer, type });

  const getColors = require('get-image-colors');
  const colors = await getColors(buffer, type);
  // console.log(">> services.haiku.updateHaikuImage", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();
  const filename = `haiku-${haikuId}-custom-${moment().format("YYYYMMDD_HHmmss")}-${(haiku.version || 0) + 1}.png`;
  const blob = await put(filename, buffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log(">> services.haiku.updateHaikuImage", { filename, blob });

  let updatedHaiku = {
    ...haiku,
    artStyle: undefined,
    imagePrompt: undefined,
    imageModel: undefined,
    // @ts-ignore
    bgImage: blob.url,
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(0.5).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
  } as Haiku;

  return saveHaiku(user, updatedHaiku);
}

export async function generateHaiku(user: User, {
  lang,
  subject,
  mood,
  artStyle,
  // title,
  // poem,
  // image,
}: {
  lang?: LanguageType,
  subject?: string,
  mood?: string,
  artStyle?: string,
  // title?: string
  // poem?: string[],
  // image?: Buffer,
}): Promise<Haiku> {
  console.log(">> services.haiku.generateHaiku", { lang, subject, mood, user });
  const language = supportedLanguages[lang || "en"].name;
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";
  debugOpenai && console.warn(`>> services.haiku.generateHaiku: DEBUG mode: not uploading to blob store`);

  const {
    prompt: poemPrompt,
    model: languageModel,
    response: {
      haiku: generatedPoem,
      subject: generatedSubject,
      mood: generatedMood,
      lang: generatedLang,
    }
  } = await openai.generateHaiku(language, subject, mood);
  // console.log(">> services.haiku.generateHaiku", { ret });
  console.log(">> services.haiku.generateHaiku", { generatedPoem, generatedSubject, generatedMood, poemPrompt });

  const {
    url: imageUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    model: imageModel,
  } = await openai.generateBackgroundImage(subject || generatedSubject, mood || generatedMood, artStyle);

  return createHaiku(user, {
    lang: generatedLang || lang || "en",
    theme: generatedSubject,
    mood: generatedMood,
    artStyle: selectedArtStyle,
    poemPrompt,
    languageModel,
    imagePrompt,
    imageModel,
    imageUrl,
    poem: generatedPoem,
  });
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

export async function saveHaiku(user: any, haiku: Haiku, options: any = {}): Promise<Haiku> {
  console.log(">> services.haiku.saveHaiku", { haiku, user });

  if (!(haiku.createdBy == user.id || user.isAdmin || haiku.isDemo)) {
    throw `Unauthorized`;
  }

  const original = await store.haikus.get(haiku.id);

  if (!original) {
    throw `Not found`;
  }

  const version = (original.version || 0);
  if (!options.noVersion) {
    store.haikus.create(user.id, {
      ...original,
      id: `${original.id}:${version}`,
      version,
      deprecated: true,
    });

    // edge case where we're editing a previous version
    delete haiku.deprecated;
    delete haiku.deprecatedAt;
  }

  const poem = haiku.poem.join("/");
  if (poem.includes("...") || poem.includes("…")) {
    // return completeHaikuPoem(user, haiku);
    return completeLimerickPoem(user, haiku);
  }

  return store.haikus.update(user.id, {
    ...haiku,
    version: options.noVersion
      ? version
      : version + 1,
    shared: options.noVersion
      ? haiku.shared
      : false,
  });
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
    // find previous daily haiku
    const previousDailyHaikus = (await getDailyHaikus())
    .filter((dh: DailyHaiku) => id && dh.id < id)
    .sort(byIdDesc);
    // console.log(`>> services.haiku.getDailyHaiku`, { previousDailyHaikus });
    
    dailyHaiku = previousDailyHaikus[0];
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
    .map((dh: DailyHaiku) => dh?.id)
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

  let ret;
  if (dailyHaiku) {
    ret = await store.dailyHaikus.update(user.id, {
      id: dateCode,
      haikuId,
      theme: haiku.theme
    });
  } else {
    ret = await store.dailyHaikus.create(user.id, {
      id: dateCode,
      haikuId,
      theme: haiku.theme,
    });
  }

  triggerDailyHaikuSaved(ret);

  return ret;
}

export async function getLikedHaikus(): Promise<DailyHaiku[]> {
  const likedUserHaikuIds = (await store.userHaikus.find())
    .filter((userHaiku: UserHaiku) => userHaiku.likedAt)
    .map((userHaiku: UserHaiku) => userHaiku.haikuId);

  return (await store.haikus.find({ id: likedUserHaikuIds })).filter((haiku: Haiku) => !haiku.deletedAt);
}

export async function getLatestHaikus(fromDate?: number, toDate?: number): Promise<Haiku[]> {
  const now = moment();
  const yesterday = moment().add(-1, "days").valueOf()
  console.log(">> services.haiku.getLatestHaikus", { fromDate, toDate, now: now.valueOf() });

  const haikus = await store.haikus.find();
  const latest = haikus
    .filter((haiku: Haiku) => haiku.createdAt >= (fromDate || yesterday) && haiku.createdAt <= (toDate || now))
    .sort(byCreatedAtDesc);
  console.log(">> services.haiku.getLatestHaikus", { haikus, latest });

  return latest;
}
