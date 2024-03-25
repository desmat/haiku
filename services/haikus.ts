import moment from 'moment';
import { put } from '@vercel/blob';
import { Haiku } from "@/types/Haiku";
import { Store } from "@/types/Store";
import { User } from '@/types/User';
import { hashCode, mapToList, normalizeWord, uuid } from '@/utils/misc';
import * as samples from '@/services/stores/samples';
import * as openai from './openai';
import chroma from 'chroma-js';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { Haikudle, UserHaikudle } from '@/types/Haikudle';
import { deleteHaikudle, getHaikudle } from './haikudles';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s })
    store = new s.create();
  });

export async function getHaikus(query?: any, hashPoem?: boolean): Promise<Haiku[]> {
  let haikus = await store.haikus.find(query);

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

  return new Promise((resolve, reject) => resolve(haikus.filter(Boolean)));
}

export async function getUserHaikus(user: User): Promise<Haiku[]> {
  console.log(`>> services.haiku.getUserHaikus`, { user });

  let haikus = await store.haikus.find();
  if (!user.isAdmin) {
    // find all haikus that user solved corresponding haikudle
    let userHaikudles = await store.userHaikudles.find({
      createdBy: user.id,
      // solved: true, // nope, need to filter on haikudle.solved and can't do that
    });
    
    const userHaikudleLookup = new Map(userHaikudles
      .filter((uh: UserHaikudle) => uh?.haikudle?.solved)
      .map((uh: UserHaikudle) => [uh.haikudle.haikuId, uh.updatedAt || uh.createdAt]));

    haikus = haikus
      .filter((haiku: Haiku) => userHaikudleLookup.get(haiku.id))
      .map((haiku: Haiku) => {
        return {
          ...haiku,
          solvedAt: userHaikudleLookup.get(haiku.id),
        }
      });
  }

  // strip down to just the basics
  haikus = haikus.map((haiku: Haiku) => {
    return {
      id: haiku.id,
      createdBy: haiku.createdBy,
      createdAt: haiku.createdAt,
      solvedAt: haiku.solvedAt,
      theme: haiku.theme,
    };
  });

  return new Promise((resolve, reject) => resolve(haikus.filter(Boolean)));
}

export async function getHaiku(id: string, hashPoem?: boolean): Promise<Haiku | undefined> {
  console.log(`>> services.haiku.getHaiku`, { id });

  let haiku = await store.haikus.get(id);

  if (haiku && hashPoem) {
    haiku = {
      ...haiku,
      poem: haiku.poem
        .map((line: string) => line.split(/\s+/)
          .map((word: string) => hashCode(normalizeWord(word)))),
    }
  }

  console.log(`>> services.haiku.getHaiku`, { id, haiku });
  return new Promise((resolve, reject) => resolve(haiku));
}

export async function createHaiku(user: User): Promise<Haiku> {
  console.log(">> services.haiku.createHaiku", { user });

  let haiku = {
    id: uuid(),
    createdBy: user.id,
    createdAt: moment().valueOf(),
    status: "created",
  } as Haiku;

  return store.haikus.create(user.id, haiku);
}

export async function regenerateHaikuPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "eng") as LanguageType;
  const subject = haiku.theme;
  const mood = undefined; // TODO
  console.log(">> services.haiku.regenerateHaikuPoem", { lang, subject, mood, user });
  const language = supportedLanguages[lang].name;

  const {
    response: {
      haiku: poem,
      subject: generatedSubject,
      mood: generatedMood,
    }
  } = await openai.generateHaiku(language, subject, mood);
  // console.log(">> services.haiku.regenerateHaikuPoem", { ret });
  console.log(">> services.haiku.regenerateHaikuPoem", { poem, generatedSubject, generatedMood });

  // TODO: delete corresponding haikudle 
  getHaikudle(haiku.id).then(async (haikudle: Haikudle) => {
    console.log(">> services.haiku.regenerateHaikuPoem", { haikudle });
    deleteHaikudle(user, haikudle.id);
  })
  
  return saveHaiku(user, {
    ...haiku,
    poem,
    theme: generatedSubject,
    mood: generatedMood,
  });
}

export async function generateHaiku(user: any, lang?: LanguageType, subject?: string, mood?: string, img?: string): Promise<Haiku> {
  console.log(">> services.haiku.generateHaiku", { lang, subject, mood, user });
  const language = supportedLanguages[lang || "en"].name;
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";

  const {
    response: {
      haiku: poem,
      subject: generatedSubject,
      mood: generatedMood,
    }
  } = await openai.generateHaiku(language, subject, mood);
  // console.log(">> services.haiku.generateHaiku", { ret });
  console.log(">> services.haiku.generateHaiku", { poem, generatedSubject });

  // const {
  //   url: openaiUrl,
  //   prompt: imagePrompt,
  //   revisedPrompt: imageRevisedPrompt
  // } = await openai.generateBackgroundImage(subject || generatedSubject, mood || generatedMood);
  const openaiUrl = img || "";
  const imagePrompt = undefined;
  const imageRevisedPrompt = undefined;

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
    imagePrompt,
    imageRevisedPrompt,
    // @ts-ignore
    bgImage: debugOpenai ? openaiUrl : blob.url,
    color: sortedColors[0].darken(0.5).hex(),
    bgColor: sortedColors[sortedColors.length - 1].brighten(1).hex(),
    colorPalette: sortedColors.map((c: any) => c.hex()),
    poem,
  } as Haiku;

  return store.haikus.create(user.id, haiku);
}

export async function deleteHaiku(user: any, id: string): Promise<Haiku> {
  console.log(">> services.haiku.deleteHaiku", { id, user });

  if (!id) {
    throw `Cannot delete haiku with null id`;
  }

  const haiku = await getHaiku(id);
  if (!haiku) {
    throw `Haiku not found: ${id}`;
  }

  if (!(haiku.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  return store.haikus.delete(user.id, id);
}

export async function saveHaiku(user: any, haiku: Haiku): Promise<Haiku> {
  console.log(">> services.haiku.saveHaiku", { haiku, user });

  if (!(haiku.createdBy == user.id || user.isAdmin)) {
    throw `Unauthorized`;
  }

  return store.haikus.update(user.id, haiku);
}
