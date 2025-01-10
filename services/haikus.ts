import { findHoleInDatecodeSequence, hashCode, normalizeWord, shuffleArray, uuid } from '@desmat/utils';
import { byCreatedAtDesc } from '@desmat/utils/sort';
import chroma from 'chroma-js';
import * as locale from 'locale-codes'
import moment from 'moment';
import { put } from '@vercel/blob';
import { DailyHaiku, FlaggedHaiku, Haiku, LikedHaiku, UserHaiku, UserHaikuOptions } from "@/types/Haiku";
import { HaikuAlbum } from '@/types/Album';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { DailyHaikudle, Haikudle, UserHaikudle } from '@/types/Haikudle';
import { USAGE_LIMIT } from '@/types/Usage';
import { User } from '@/types/User';
import { deleteHaikudle, getHaikudle, getUserHaikudle } from './haikudles';
import * as openai from './openai';
import { incUserUsage, userUsage } from './usage';
import { triggerDailyHaikuSaved, triggerHaikuSaved, triggerHaikuShared } from './webhooks';
import { createStore } from './stores/redis';
import { notFoundHaiku } from './stores/samples';
import { getFlaggedUserIds } from './users';

const store = createStore({
  // debug: true,
});

export async function getHaikus(query?: any, hashPoem?: boolean): Promise<Haiku[]> {
  console.log("services.haikus.getHaikus", { query, hashPoem });
  let haikus = (await store.haikus.find({ ...query, count: 100 }))
    .filter((haiku: Haiku) => haiku && !haiku.deprecated && !haiku.deprecatedAt);
  // note that we started with .deprecated but moved to .deprecatedAt

  if (!haikus?.length && (!query || JSON.stringify(query) == "{}")) {
    return [];
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

  return haikus;
}

export async function getHaikuIds(query?: any): Promise<Set<any>> {
  console.log("services.haikus.getHaikuIds", { query });
  // note: some ids get converted to numbers for some reason
  return new Set(Array.from(await store.haikus.ids(query)).map((id: any) => `${id}`));
}

export async function getUserHaikus(user: User, {
  all,
  albumId,
  count,
  offset,
}: {
  all?: boolean,
  albumId?: string,
  count?: number,
  offset?: number
}): Promise<Haiku[]> {
  console.log(`services.haiku.getUserHaikus`, { user, all, albumId, count, offset });

  let haikus;

  if (all) {
    // for admins: get all haikus
    haikus = (await store.haikus.find({ count: count || 100, offset }))
      .filter((haiku: Haiku) => haiku && !haiku.deprecated && !haiku.deprecatedAt);
  } else {
    const haikuAlbum = albumId && await store.haikuAlbums.get(albumId);
    // find all haikus that user solved corresponding haikudle
    const [
      generatedHaikus,
      userHaikus,
      userHaikudles
    ] = haikuAlbum
        ? [
          await store.haikus.find({ id: haikuAlbum.haikuIds.splice(offset || 0, count || haikuAlbum.haikuIds.length) }),
          [],
          []
        ]
        : await Promise.all([
          store.haikus.find({
            user: user.id,
            count,
            offset,
          }),
          // @ts-ignore
          store.userHaikus.find({
            user: user.id,
            count,
            offset,
          }),
          store.userHaikudles.find({
            user: user.id,
            count,
            offset,
            // solved: true, // nope, need to filter on haikudle.solved and can't do that
          }),
        ]);

    console.log(`services.haiku.getUserHaikus`, { userHaikus, userHaikudles, generatedHaikus });

    const haikuIds = Array.from(new Set([
      ...generatedHaikus.map((haiku: Haiku) => haiku.id),
      ...userHaikus.map((userHaiku: UserHaiku) => userHaiku.haikuId),
      ...userHaikudles.map((userHaikudle: UserHaikudle) => userHaikudle.haikudle?.solved && userHaikudle.haikudle?.haikuId),
    ]));
    haikus = (await store.haikus.find({ id: haikuIds }))
      .filter((haiku: Haiku) => haiku && !haiku.deprecated && !haiku.deprecatedAt);
    console.log(`services.haiku.getUserHaikus`, { haikuIds, justThoseHaikus: haikus });

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

    console.log(`services.haiku.getUserHaikus`, { userHaikuLookup, userHaikudleLookup, generatedHaikuLookup });

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
        theme: haiku.title || haiku.theme,
        moves: haiku.moves,
      };
    })
    .filter(Boolean);

  return haikus;
}

export async function getHaiku(user: User, id: string, hashPoem?: boolean, version?: number): Promise<Haiku | undefined> {
  console.log(`services.haiku.getHaiku`, { id, hashPoem });

  if (!id) return undefined;
  
  const idAndVersionedId = [
    id,
    typeof (version) == "number" && `${id}:${version}`,
  ];

  let [
    haikus,
    userLiked,
    haikuLikes,
    flaggedHaiku,
    haikuflags,
    dailyHaikuIds,
    dailyHaikudleIds,
  ] = await Promise.all([
    store.haikus.find({ id: idAndVersionedId }),
    user?.id && store.likedHaikus.get(`${user?.id}:${id}`),
    user.isAdmin && store.likedHaikus.ids({ haiku: id }),
    user.isAdmin && user?.id && store.flaggedHaikus.get(`${user?.id}:${id}`),
    user.isAdmin && store.flaggedHaikus.ids({ haiku: id }),
    /* user.isAdmin && */ store.dailyHaikus.ids({ haiku: id }),
    user.isAdmin && store.dailyHaikudles.ids({ haikudle: id }),
  ]);
  console.log(`services.haiku.getHaiku`, { dailyHaikuIds });
  // get either current or versioned
  // note the edge case when current version is requested explicitly by its version
  // since only previous version have the key <id>:<version>
  let haiku = typeof (version) == "number" && haikus[0]?.version != version
    ? { ...haikus[1], id }
    : haikus[0];

  if (!haiku) return;

  if (user.isAdmin) {
    const flaggedUser = await store.flaggedUsers.get(haiku.createdBy);
    if (flaggedUser) {
      haiku.userFlaggedAt = flaggedUser.updatedAt || flaggedUser.createdAt;
    }

    haiku.likedAt = userLiked?.createdAt;
    haiku.flaggedAt = flaggedHaiku?.createdAt;
    haiku.numLikes = haikuLikes && haikuLikes.size;
    haiku.numFlags = haikuflags && haikuflags.size;
    haiku.dailyHaikuId = dailyHaikuIds && Array.from(dailyHaikuIds).sort().reverse()[0];
    haiku.dailyHaikudleId = dailyHaikudleIds && Array.from(dailyHaikudleIds).sort().reverse()[0];
  }

  const dailyHaikuId = process.env.DAILY_HAIKU_PREVIEW == "true" 
  ? moment().add(1, "day").format("YYYYMMDD")
  : moment().format("YYYYMMDD");

  // @ts-ignore: dailyHaikuIds sometimes has integers instead of strings
  if (dailyHaikuIds && (dailyHaikuIds.has(dailyHaikuId) || dailyHaikuIds.has(parseInt(dailyHaikuId)))) {
    haiku.isCurrentDailyHaiku = true;
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

  console.log(`services.haiku.getHaiku`, { id, haiku });
  return haiku;
}

export async function getHaikuNumLikes(id: number) {
  return (await store.likedHaikus.ids({ haiku: id })).size;
}

export async function createHaiku(user: User, {
  title,
  theme,
  subject,
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
  albumId,
}: {
  title?: string,
  theme?: string,
  subject?: string,
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
  albumId?: string,
}): Promise<Haiku> {
  console.log("services.haiku.createHaiku", { user, theme, poem, imageUrl });

  if (!imageBuffer && !imageUrl) {
    throw 'neither imageBuffer or imageUrl provided';
  }

  const debug = process.env.OPENAI_API_KEY == "DEBUG";
  debug && console.warn(`>> services.haiku.createHaiku: DEBUG mode: not uploading to blob store`);

  if (!imageBuffer && imageUrl) {
    const imageRet = await fetch(imageUrl);
    // console.log("services.haiku.createHaiku", { imageRet });
    imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  }

  const getColors = require('get-image-colors');
  const colors = await getColors(imageBuffer, imageType || 'image/png');
  // console.log("services.haiku.createHaiku", { colors });
  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const sizeOf = require('buffer-image-size');
  const dimensions = sizeOf(imageBuffer);
  // console.log("services.haiku.createHaiku", { imageWidth: dimensions.width, imageHeight: dimensions.height });

  const haikuId = uuid();

  if (!debug && imageBuffer) {
    const filename = `haiku-${haikuId}-${theme?.replaceAll(/\W/g, "_").toLowerCase()}.png`;
    const blob = !debug && await put(filename, imageBuffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    // console.log("services.haiku.createHaiku", { subject, filename, blob });
    imageUrl = blob.url;
  }

  let create = {
    id: haikuId,
    createdBy: user.id,
    subject,
    title,
    theme,
    poem,
    bgImage: imageUrl,
    bgImageDimensions: dimensions,
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
    sharedVersioned: true, // be sure to keep in sync with triggerHaikuShared below
  } as Haiku;

  if (!user.isAdmin) {
    incUserUsage(user, "haikusCreated");
  }

  if (albumId) {
    create = await addToAlbum(user, create, albumId);
  }

  const created = await store.haikus.create(create);

  const webhookRet = await Promise.all([
    triggerHaikuSaved(created),
    triggerHaikuShared(created), // be sure to keep in sync with `sharedVersioned: true` above
  ]);
  // console.log("services.haiku.createHaiku", { webhookRet });

  return created;
}

export async function regenerateHaikuPoem(user: any, haiku: Haiku, albumId?: string): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const subject = haiku.subject || haiku.theme || haiku.title;
  const mood = undefined;
  console.log("services.haiku.regenerateHaikuPoem", { lang, subject, mood, user });
  const language = locale.getByTag(lang)?.name

  const album = albumId && await store.haikuAlbums.get(albumId);
  const customPoemPrompt = album && album.poemPrompt;

  const {
    prompt: poemPrompt,
    model: languageModel,
    response: {
      haiku: poem,
      title: generatedTitle,
      subject: generatedSubject,
      mood: generatedMood,
      lang: generatedLang,
    }
  } = await openai.generateHaiku(user.id, language, subject, mood, customPoemPrompt);
  // console.log("services.haiku.regenerateHaikuPoem", { ret });
  console.log("services.haiku.regenerateHaikuPoem", { poem, generatedSubject, generatedMood, poemPrompt });

  // delete corresponding haikudle 
  getHaikudle(user, haiku.id).then(async (haikudle: Haikudle) => {
    console.log("services.haiku.regenerateHaikuPoem", { haikudle });
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
    title: generatedTitle,
    theme: generatedSubject,
    mood: generatedMood,
    lang: generatedLang || lang || "en",
    poemPrompt,
    languageModel,
  });
}

export async function completeHaikuPoem(user: any, haiku: Haiku, albumId?: string): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const subject = haiku.subject || haiku.theme || haiku.title;
  const mood = haiku.mood;
  const language = supportedLanguages[lang]?.name;
  console.log("services.haiku.completeHaikuPoem", { subject, mood, user });

  // a bit akward to do this here and in this way but we're just covering a narrow case
  const usage = await userUsage(user);
  const { haikusRegenerated } = usage[moment().format("YYYYMMDD")];
  // console.log('services.haiku.completeHaikuPoem', { haikusRegenerated, usage });

  if (haikusRegenerated && haikusRegenerated >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
    throw 'exceeded daily limit';
  }

  const album = albumId && await store.haikuAlbums.get(albumId);
  const customPoemPrompt = album && album.poemPrompt;

  const {
    response: {
      haiku: completedPoem,
      title: generatedTitle,
      subject: generatedSubject,
      mood: generatedMood,
      lang: generatedLang,
    },
    model: languageModel,
    prompt: poemPrompt,
  } = await openai.completeHaiku(user.id, haiku.poem, language, subject, mood, customPoemPrompt);
  console.log("services.haiku.completeHaikuPoem", { completedPoem, generatedSubject, generatedMood });

  // delete corresponding haikudle 
  if (await store.haikudles.exists(haiku.id)) {
    await deleteHaikudle(user, haiku.id);
  }

  if (!user.isAdmin) {
    incUserUsage(user, "haikusRegenerated");
  }

  return saveHaiku(user, {
    ...haiku,
    poem: completedPoem,
    title: generatedTitle,
    theme: generatedSubject,
    mood: generatedMood,
    lang: generatedLang,
    languageModel,
    poemPrompt,
  });
}

export async function regenerateHaikuImage(user: any, haiku: Haiku, artStyle?: string, albumId?: string): Promise<Haiku> {
  console.log("services.haiku.regenerateHaikuImage", { user, haiku });
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";
  debugOpenai && console.warn(`>> services.haiku.regenerateHaikuImage: DEBUG mode: not uploading to blob store`);

  const album = albumId && await store.haikuAlbums.get(albumId);
  const customImagePrompt = album && album.imagePrompt;
  const customArtStyles = album && album.artStyles || undefined;

  const {
    url: openaiUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    model: imageModel,
  } = await openai.generateBackgroundImage(user.id, haiku.subject || haiku.theme || haiku.title, haiku.mood, artStyle, customImagePrompt, customArtStyles);

  const imageRet = await fetch(openaiUrl);
  // console.log("services.haiku.regenerateHaikuImage", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  // console.log("services.haiku.generateHaiku", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  // console.log("services.haiku.generateHaiku", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();
  const filename = `haiku-${haikuId}-${haiku.theme?.replaceAll(/\W/g, "_").toLowerCase()}-${(haiku.version || 0) + 1}.png`;
  const blob = !debugOpenai && await put(filename, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log("services.haiku.generateHaiku", { subject, filename, blob });

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
    sharedVersioned: true, // be sure to keep in sync with triggerHaikuShared below
  } as Haiku;

  if (!user.isAdmin) {
    // TODO let's separate image and text
    incUserUsage(user, "haikusRegenerated");
  }

  const savedHaiku = await saveHaiku(user, updatedHaiku);

  const webhookRet = await Promise.all([
    triggerHaikuSaved(savedHaiku),
    triggerHaikuShared(savedHaiku), // be sure to keep in sync with `sharedVersioned: true` above
  ]);
  // console.log("services.haiku.regenerateHaikuImage", { webhookRet });

  return savedHaiku;
}

export async function updateHaikuImage(user: any, haiku: Haiku, buffer: Buffer, type: string = "image/png"): Promise<Haiku> {
  console.log("services.haiku.updateHaikuImage", { user, haiku, buffer, type });

  const getColors = require('get-image-colors');
  const colors = await getColors(buffer, type);
  // console.log("services.haiku.updateHaikuImage", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const sizeOf = require('buffer-image-size');
  const dimensions = sizeOf(buffer);
  // console.log("services.haiku.updateHaikuImage", { imageWidth: dimensions.width, imageHeight: dimensions.height });

  const haikuId = uuid();
  const filename = `haiku-${haikuId}-custom-${moment().format("YYYYMMDD_HHmmss")}-${(haiku.version || 0) + 1}.png`;
  const blob = await put(filename, buffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log("services.haiku.updateHaikuImage", { filename, blob });

  let updatedHaiku = {
    ...haiku,
    artStyle: undefined,
    imagePrompt: undefined,
    imageModel: undefined,
    // @ts-ignore
    bgImage: blob.url,
    bgImageDimensions: dimensions,
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(0.5).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
    sharedVersioned: true, // be sure to keep in sync with triggerHaikuShared below
  } as Haiku;

  // TODO: trigger haiku shared

  const savedHaiku = await saveHaiku(user, updatedHaiku);

  const webhookRet = await Promise.all([
    triggerDailyHaikuSaved(savedHaiku),
    triggerHaikuShared(savedHaiku), // be sure to keep in sync with `sharedVersioned: true` above
  ]);
  // console.log("services.haikudle.updateHaikuImage", { webhookRet });

  return savedHaiku;
}

export async function generateHaiku(user: User, {
  lang,
  subject,
  mood,
  artStyle,
  // title,
  poem,
  // image,
  albumId,
}: {
  lang?: LanguageType,
  subject?: string,
  mood?: string,
  artStyle?: string,
  // title?: string
  poem?: string[],
  // image?: Buffer,
  albumId?: string,
}): Promise<Haiku> {
  console.log("services.haiku.generateHaiku", { lang, subject, mood, poem, user });
  const language = supportedLanguages[lang || "en"].name;
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";
  debugOpenai && console.warn(`>> services.haiku.generateHaiku: DEBUG mode: not uploading to blob store`);

  const album = albumId && await store.haikuAlbums.get(albumId);
  const customPoemPrompt = album && album.poemPrompt;
  const customImagePrompt = album && album.imagePrompt;
  const customArtStyles = album && album.artStyles || undefined;

  const {
    prompt: poemPrompt,
    model: languageModel,
    response: {
      haiku: generatedPoem,
      subject: generatedSubject,
      title: generatedTitle,
      mood: generatedMood,
      lang: generatedLang,
    }
  } = poem
      ? await openai.analyzeHaiku(user.id, poem)
      : await openai.generateHaiku(user.id, language, subject, mood, customPoemPrompt);
  // console.log("services.haiku.generateHaiku", { ret });
  console.log("services.haiku.generateHaiku", { generatedSubject, generatedMood, poemPrompt });

  const {
    url: imageUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    model: imageModel,
  } = await openai.generateBackgroundImage(user.id, subject || generatedSubject, mood || generatedMood, artStyle, customImagePrompt, customArtStyles);

  return createHaiku(user, {
    lang: generatedLang || lang || "en",
    subject,
    theme: generatedSubject,
    title: generatedTitle,
    mood: generatedMood,
    artStyle: selectedArtStyle,
    poemPrompt,
    languageModel,
    imagePrompt,
    imageModel,
    imageUrl,
    poem: poem || generatedPoem || [],
    albumId,
  });
}

export async function deleteHaiku(user: any, id: string): Promise<Haiku> {
  console.log("services.haiku.deleteHaiku", { id, user });

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
    dailyHaikuIds,
    userHaikuIds
  ] = await Promise.all([
    store.dailyHaikus.ids({ haiku: id }),
    store.userHaikus.ids({ haiku: id }),
  ]);
  console.log("services.haiku.deleteHaiku", { dailyHaikuIds, userHaikuIds });

  const dailyHaikuId = dailyHaikuIds?.size && dailyHaikuIds.values().next().value;
  dailyHaikuId && store.dailyHaikus.delete(dailyHaikuId);
  Array.from(userHaikuIds).map((id: string) => store.userHaikus.delete(id));

  return store.haikus.delete(id);
}

export async function saveHaiku(user: any, haiku: Haiku, options: any = {}): Promise<Haiku> {
  console.log("services.haiku.saveHaiku", { haiku, user });

  if (!(haiku.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  const original = await store.haikus.get(haiku.id);

  if (!original) {
    throw `Not found`;
  }

  const version = (original.version || 0);
  if (!options.noVersion) {
    store.haikus.create({
      ...original,
      id: `${original.id}:${version}`,
      createdBy: user.id,
      version,
      deprecated: true,
    }, {
      noIndex: true,
      noLookup: true,
    });

    // edge case where we're editing a previous version
    delete haiku.deprecated;
    delete haiku.deprecatedAt;
  }

  const poem = haiku.poem.join("/");
  if (poem.includes("...") || poem.includes("…")) {
    return completeHaikuPoem(user, haiku);
  }

  const updated = await store.haikus.update({
    ...haiku,
    updatedBy: user.id,
    version: options.noVersion
      ? version
      : version + 1,
  });

  if (!options.noVersion) {
    const webhookRet = await triggerHaikuSaved(updated);
    // console.log("services.haiku.saveHaiku", { webhookRet });
  }

  return updated;
}

export async function getUserHaiku(userId: string, haikuId: string): Promise<UserHaiku | undefined> {
  console.log(`services.haiku.getUserHaiku`, { userId, haikuId });

  const id = `${userId}:${haikuId}`
  const userHaiku = await store.userHaikus.get(id);

  console.log(`services.haiku.getUserHaiku`, { userHaiku });
  return userHaiku;
}

export async function createUserHaiku(user: User, haiku: Haiku, action?: "viewed" | "generated"): Promise<UserHaiku | undefined> {
  console.log(`services.haiku.createUserHaiku`, { user, haiku });

  if (user.impersonating) {
    console.warn(">> services.users.saveUser WARNING: not saving impersonated user", { user });
    return;
  }

  const id = `${user.id}:${haiku.id}`;
  const now = moment().valueOf();
  const actionKV = action ? { [`${action}At`]: now } : {};
  const userHaiku = {
    id,
    createdBy: user.id,
    userId: user.id,
    haikuId: haiku.id,
    theme: haiku.theme,
    ...actionKV,
  };

  const createdUserHaiku = await store.userHaikus.create(userHaiku);

  console.log(`services.haiku.createUserHaiku`, { userHaiku: createdUserHaiku });
  return createdUserHaiku;
}

export async function saveUserHaiku(user: User, userHaiku: UserHaiku): Promise<UserHaiku | undefined> {
  console.log(`services.haiku.saveUserHaiku`, { userHaiku });

  if (user.impersonating) {
    console.warn(">> services.users.saveUser WARNING: not saving impersonated user", { user });
    return;
  }

  if (await store.userHaikus.exists(userHaiku.id)) {
    return store.userHaikus.update({ ...userHaiku, updatedBy: user.id });
  }

  return store.userHaikus.create({ ...userHaiku, createdBy: user.id });
}

export async function getRandomHaiku(user: User, mode: string, query?: any, options?: any): Promise<Haiku | undefined> {
  console.log(`services.haiku.getRandomHaiku`, { query, options });

  const lastHaikuId = query.lastId;
  delete query.lastId;

  let [
    haikuIds,
    flaggedHaikuIds,
    likedHaikuIds,
    seenHaikuIds,
  ] = await Promise.all([
    getHaikuIds(query),
    typeof (options.flagged) == "boolean" ? getFlaggedHaikuIds() : new Set(),
    typeof (options.liked) == "boolean" ? getLikedHaikuIds() : new Set(),
    typeof (options.seen) == "boolean" ? getSeenHaikuIds(user.id) : new Set(),
  ]);

  console.log('services.haiku.getRandomHaiku', { flaggedHaikuIds, likedHaikuIds, seenHaikuIds });

  // include or exclude flagged/liked/seen haikus
  let filteredHaikuIds = Array.from(haikuIds).filter((id: string) => {
    return (
      typeof (options.flagged) == "boolean"
        ? options.flagged ? flaggedHaikuIds.has(id) : (!flaggedHaikuIds.has(id))
        : true
    ) && (
        typeof (options.liked) == "boolean"
          ? options.liked ? likedHaikuIds.has(id) : (!likedHaikuIds.has(id))
          : true
      ) && (
        typeof (options.seen) == "boolean"
          ? options.seen ? seenHaikuIds.has(id) : (!seenHaikuIds.has(id))
          : true
      );
  });

  if (!filteredHaikuIds.length) {
    // not found
    return notFoundHaiku;
  } else if (filteredHaikuIds.length > 1) {
    // exclude special case for only one
    filteredHaikuIds = filteredHaikuIds.filter((id: string) => id != lastHaikuId);
  }

  const randomHaikuId = filteredHaikuIds[Math.floor(Math.random() * filteredHaikuIds.length)];
  const randomHaiku = await getHaiku(user, randomHaikuId, mode == "haikudle");

  if (!randomHaiku) {
    console.warn('>> services.haiku.getRandomHaiku WARNING: random haiku not found', { randomHaikuId })
    return undefined;
  }

  console.log('services.haiku.getRandomHaiku', { filteredHaikuIds, randomHaikuId, randomHaiku });

  const [numLikes, userHaiku, userHaikudle] = await Promise.all([
    getHaikuNumLikes(randomHaiku.id),
    getUserHaiku(user.id, randomHaiku.id),
    getUserHaikudle(user?.id, randomHaiku.id),
  ]);

  if (!user.isAdmin && randomHaiku?.createdBy != user.id && !userHaiku && !userHaikudle) {
    createUserHaiku(user, randomHaiku);
  }

  randomHaiku.numLikes = numLikes;
  randomHaiku.likedAt = userHaiku?.likedAt;

  return randomHaiku;
}

export async function getDailyHaiku(id?: string, dontCreate?: boolean): Promise<DailyHaiku | undefined> {
  console.log(`services.haiku.getDailyHaiku`, { id, dontCreate });

  if (!id) id = process.env.DAILY_HAIKU_PREVIEW == "true" 
    ? moment().add(1, "day").format("YYYYMMDD")
    : moment().format("YYYYMMDD");

  let dailyHaiku = await store.dailyHaikus.get(id);
  console.log(`services.haiku.getDailyHaiku`, { id, dailyHaiku });

  if (!dailyHaiku && dontCreate) {
    return;
  } else if (!dailyHaiku) {
    // create daily haiku if none for today
    const [
      haikuIds,
      previousDailyHaikus,
      likedHaikuIds,
      flaggedHaikuIds,
    ] = await Promise.all([
      getHaikuIds(),
      store.dailyHaikus.find(),
      store.likedHaikus.ids(),
      getFlaggedHaikuIds(),
    ]);

    const filteredHaikuIds = Array.from(haikuIds)
      .filter((id: string) => !flaggedHaikuIds.has(id));
    const previousDailyHaikuIds = new Set(
      previousDailyHaikus
        .map((dailyHaiku: DailyHaiku) => dailyHaiku?.haikuId)
    );
    const nonDailyLikedHaikuIds = Array.from(likedHaikuIds)
      .map((id: string) => id && id.split(":")[1])
      .filter((haikuId: string) => haikuId && !flaggedHaikuIds.has(haikuId) && !previousDailyHaikuIds.has(haikuId));
    const nonDailyhaikuIds = filteredHaikuIds
      .filter((haikuId: string) => haikuId && !flaggedHaikuIds.has(haikuId) && !previousDailyHaikuIds.has(haikuId));

    console.log('services.haiku.getDailyHaiku creating daily haiku', { haikuIds, filteredHaikuIds, previousDailyHaikuIds, likedHaikuIds, nonDailyLikedHaikuIds, nonDailyhaikuIds });

    // pick from liked haikus, else all haikus
    const randomHaikuId = nonDailyLikedHaikuIds.length
      ? shuffleArray(nonDailyLikedHaikuIds)[0]
      : shuffleArray(nonDailyhaikuIds)[0]

    console.log('services.haiku.getDailyHaiku creating daily haiku', { randomHaikuId });

    let randomHaiku = await store.haikus.get(randomHaikuId);

    if (!randomHaiku) {
      console.warn(`>> services.haiku.getDailyHaiku WARNING: ran out of liked or non-daily haikus, picking from the lot`, { randomHaiku });
      randomHaiku = await store.haikus.get(shuffleArray(filteredHaikuIds)[0]);

      if (!randomHaiku) {
        console.warn(`>> services.haiku.getDailyHaiku WARNING: no haikus found!`, { randomHaiku });
        // TODO generate haiku here
        return undefined;
      }
    }

    console.log('services.haiku.getDailyHaiku creating daily haiku', { randomHaikuId, randomHaiku });

    dailyHaiku = await saveDailyHaiku({ id: "(system)" } as User, id, randomHaiku.id);
  }

  return dailyHaiku;
}

export async function getDailyHaikus(query?: any): Promise<DailyHaiku[]> {
  console.log(`services.haiku.getDailyHaikus`, { query });
  let allDailyHaikuIds = Array.from(await store.dailyHaikus.ids())
    .map((id: any) => `${id}`)
    .filter((id: string) => id && id.match(/20\d{6}/))
    .sort()
    .reverse();

  if (query?.count) {
    allDailyHaikuIds = allDailyHaikuIds.splice(query?.offset || 0, query.count)
  }

  const dailyHaikus = await store.dailyHaikus.find({ id: allDailyHaikuIds });
  const dailyHaikuIds = dailyHaikus
    .map((dailyHaiku: DailyHaiku) => dailyHaiku.haikuId);

  // lookup theme; 
  // at some point we won't need to do this since we're now 
  // saving them with the daily haiku record  
  const haikus = await store.haikus.find({ id: dailyHaikuIds });
  const themeLookup = new Map(haikus
    .map((haiku: Haiku) => [haiku.id, haiku.title || haiku.theme]));

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
    .filter(Boolean)
    .sort((a: any, b: any) => a.id - b.id);
}

export async function getNextDailyHaikuId(): Promise<string> {
  if (process.env.DAILY_HAIKU_PREVIEW) {
    return moment().add(1, "day").format("YYYYMMDD");
  }
  
  const todayDatecode = moment().format("YYYYMMDD");
  const todaysDatecodeInt = parseInt(todayDatecode);

  const ids = Array.from(await store.dailyHaikus.ids())
    .filter((id: any) => parseInt(id) >= todaysDatecodeInt)
    .map((id: any) => `${id}`) // but y?
    .sort();

  if (!ids.includes(todayDatecode)) {
    return todayDatecode;
  }

  const latestId = findHoleInDatecodeSequence(ids);

  return moment(latestId).add(1, "days").format("YYYYMMDD");
}

export async function saveDailyHaiku(user: any, dateCode: string, haikuId: string): Promise<DailyHaiku> {
  console.log("services.haiku.saveDailyHaiku", { user, dateCode, haikuId });

  if (!user) {
    throw `Unauthorized`;
  }

  let [dailyHaikuExists, haiku] = await Promise.all([
    store.dailyHaikus.exists(dateCode),
    store.haikus.get(haikuId),
  ]);

  if (!haiku) throw `Haiku not found: ${haikuId}`;

  const newDailyHaiku = {
    id: dateCode,
    haikuId,
    theme: haiku.theme
  };

  let ret;
  if (dailyHaikuExists) {
    ret = await store.dailyHaikus.update({
      ...newDailyHaiku,
      updatedBy: user.id
    });
  } else {
    ret = await store.dailyHaikus.create({
      ...newDailyHaiku,
      createdBy: user.id
    });
  }

  const webhookRet = await triggerDailyHaikuSaved(ret);
  // console.log("services.haikudle.saveDailyHaiku", { webhookRet });

  return ret;
}

export async function likeHaiku(user: User, haiku: Haiku, like?: boolean): Promise<LikedHaiku | undefined> {
  console.log("services.haiku.likeHaiku", { user, haiku, like });
  if (like) {
    return store.likedHaikus.create({
      id: `${user.id}:${haiku.id}`,
      userId: user.id,
      haikuId: haiku.id,
    });
  } else {
    return store.likedHaikus.delete(`${user.id}:${haiku.id}`);
  }
}

export async function getLikedHaikus(): Promise<Haiku[]> {
  console.log("services.haiku.getLikedHaikus", {});

  const likedHaikus = await store.likedHaikus.find(); // TODO .keys then split and Set
  const haikuIds = Array.from(new Set(likedHaikus.map((likedHaiku: LikedHaiku) => likedHaiku.haikuId)))
  const haikus = await store.haikus.find({ id: haikuIds });
  // console.log("services.haiku.getLikedHaikus", { likedHaikus, haikuIds, haikus });

  return haikus;
}

export async function flagHaiku(user: User, haiku: Haiku, flag?: boolean): Promise<LikedHaiku | undefined> {
  console.log("services.haiku.flagHaiku", { user, haiku, flag });
  if (flag) {
    return store.flaggedHaikus.create({
      id: `${user.id}:${haiku.id}`,
      userId: user.id,
      haikuId: haiku.id,
    });
  } else {
    return store.flaggedHaikus.delete(`${user.id}:${haiku.id}`);
  }
}

export async function getFlaggedHaikus(): Promise<Haiku[]> {
  console.log("services.haiku.getFlaggedHaikus", {});

  const haikuIds = Array.from(await getFlaggedHaikuIds());
  const haikus = await store.haikus.find({ id: haikuIds });
  // console.log("services.haiku.getFlaggedHaikus", { flaggedHaikus, haikuIds, haikus });

  return haikus;
}

export async function getFlaggedHaikuIds(): Promise<Set<any>> {
  console.log("services.haiku.getFlaggedHaikuIds", {});

  const flaggedHaikuIds = Array.from(await store.flaggedHaikus.ids())
    .map((id: string) => id && id.split(":")[1])
    .filter(Boolean);

  const flaggedUserIds = await getFlaggedUserIds();
  let haikuIdsByFlaggedUser = (await Promise.all(
    Array.from(flaggedUserIds)
      .map((userId: string) => store.haikus.ids({ user: userId }))));
  // @ts-ignore
  haikuIdsByFlaggedUser = haikuIdsByFlaggedUser
    .reduce((accumulator: any, currentValue: any) => {
      return [...accumulator, ...Array.from(currentValue)]
    }, [])

  return new Set([...haikuIdsByFlaggedUser, ...flaggedHaikuIds]);
}

export async function getLikedHaikuIds(): Promise<Set<any>> {
  console.log("services.haiku.getLikedHaikuIds", {});

  const ids = Array.from(await store.likedHaikus.ids())
    .map((id: string) => id && id.split(":")[1])
    .filter(Boolean);

  return new Set(ids);
}

export async function getSeenHaikuIds(userId: string): Promise<Set<any>> {
  console.log("services.haiku.getSeenHaikuIds", {});

  const seedIds = Array.from(await store.userHaikus.ids({ user: userId }))
    .map((id: string) => id && id.split(":")[1])
    .filter(Boolean);

  // also those haikus created by user
  const createdIds = Array.from(await store.haikus.ids({ user: userId }))
    .filter(Boolean);

  // also include daily haikus and haikudles
  // const dailyHaikuIds = (await store.dailyHaikus.find())
  //   .map((dailyHaiku: DailyHaiku) => dailyHaiku?.haikuId)
  //   .filter(Boolean);

  // const dailyHaikudleIds = (await store.dailyHaikudles.find())
  //   .map((dailyHaikudle: DailyHaikudle) => dailyHaikudle?.haikuId)
  //   .filter(Boolean);

  return new Set([...seedIds, ...createdIds, /* ...dailyHaikuIds, ...dailyHaikudleIds */]);
}

export async function getLatestHaikus(fromDate?: number, toDate?: number): Promise<Haiku[]> {
  const now = moment();
  const yesterday = moment().add(-1, "days").valueOf()
  console.log("services.haiku.getLatestHaikus", { fromDate, toDate, now: now.valueOf() });

  // typical usecase for this is to pick up latest haikus between yesterday and now,
  // so for efficiency let's try with increasing batch sizes instead of pulling
  // down the whole thing

  let latest: Haiku[] = [];
  let offset = 0;
  let batchSize = 8;

  do {
    const haikus = (await store.haikus.find({ count: batchSize, offset }))
      .filter((haiku: Haiku) => haiku.createdAt >= (fromDate || yesterday) && haiku.createdAt <= (toDate || now))
      .sort(byCreatedAtDesc);

    if (!haikus.length) break;

    latest = [
      ...latest,
      ...haikus,
    ];
    offset += batchSize;
    batchSize *= 2;

    console.log("services.haiku.getLatestHaikus", { batchSize, offset, haikus, latest });

  } while (true);

  return latest;
}

export async function addToAlbum(user: User, haiku: Haiku, albumId: string): Promise<Haiku> {
  console.log("services.haiku.addToAlbum", { user, haiku, albumId });

  // find album, if not found create
  let haikuAlbum = await store.haikuAlbums.get(albumId);
  if (!haikuAlbum) {
    haikuAlbum = await store.haikuAlbums.create({
      id: albumId,
      createdBy: user.id,
      haikuIds: [haiku.id],
    })
  } else {
    await store.haikuAlbums.update({
      ...haikuAlbum,
      updatedBy: user.id,
      haikuIds: [
        ...haikuAlbum.haikuIds,
        haiku.id,
      ],
    })
  }

  return { ...haiku, albumId };
}

export async function getHaikuAlbum(user: User, albumId: string): Promise<HaikuAlbum | undefined> {
  console.log("services.haiku.getHaikuAlbum", { user, albumId });
  return store.haikuAlbums.get(albumId);
}

export async function getAlbumHaikus(user: User, albumId: string): Promise<Haiku[]> {
  console.log("services.haiku.getAlbumHaikus", { user, albumId });
  const haikuAlbum = albumId && await store.haikuAlbums.get(albumId);

  if (haikuAlbum && haikuAlbum.haikuIds) {
    return store.haikus.find({ id: haikuAlbum.haikuIds || [] });
  }

  return [];
}

export async function getHaikuStats(reportAt?: any): Promise<any> {
  const [
    adminUserIds,
    internalUserIds,
    haikuIds,
    likedHaikuIds,
    flaggedHaikuIds,
    flaggedAndByFlaggedUserHaikuIds,
  ] = await Promise.all([
    new Set(), // store.user.ids({ admin: true }),
    new Set(), // store.user.ids({ internal: true }),
    store.haikus.ids(),
    getLikedHaikuIds(),
    store.flaggedHaikus.ids(),
    getFlaggedHaikuIds(),
  ]);

  reportAt = reportAt || moment();
  let newHaikus1dayCount = 0; // haikus created not by admin in last 24 hours
  let newHaikus30daysCount = 0; // haikus created not by admin in last 30 days
  const pageSize = 99; // just below the "pulling more than 100" warning
  let brokethebank = false;

  for (let i = 0; i < 10; i++) {
    if (i == 9) {
      console.warn(">> services.users.getHaikuStats WARNING: pulling too many haikus");
      brokethebank = true;
      break;
    }

    const haikus = await store.haikus.find({ count: pageSize, offset: pageSize * i });
    let done = false;

    for (const haiku of haikus) {
      const diffCreated = reportAt.diff(haiku.createdAt, "hours");


      if (diffCreated >= 24 * 30) {
        done = true;
        break;
      }

      if (diffCreated >= 0 && !adminUserIds.has(haiku.createdBy) && !internalUserIds.has(haiku.createdBy)) {
        if (diffCreated < 24 * 30) {
          newHaikus30daysCount++;
        }

        if (diffCreated < 24) {
          newHaikus1dayCount++;
          console.log("services.users.getHaikuStats newHaikus1dayCount", { newHaikus1dayCount, createdAt: moment(haiku.createdAt).format(), diffCreated });
        }
      }
    }

    if (done) break;
  }

  return {
    haikus: haikuIds.size,
    newHaikus1day: brokethebank ? -1 : newHaikus1dayCount,
    newHaikus30days: brokethebank ? -1 : newHaikus30daysCount,
    likedHaikus: likedHaikuIds.size,
    flaggedHaikus: flaggedHaikuIds.size,
    allFlaggedHaikus: flaggedAndByFlaggedUserHaikuIds.size,
  }
}