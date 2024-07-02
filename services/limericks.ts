import chroma from 'chroma-js';
import moment from 'moment';
import { put } from '@vercel/blob';
import { Store } from "@/types/Store";
import { uuid } from '@/utils/misc';
import { Haiku } from '@/types/Haiku';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import * as openai from './openai';
import { incUserUsage } from './usage';
import { getHaiku, saveHaiku } from './haikus';
import { triggerLimerickShared } from './webhooks';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.limericks.init", { s });
    store = new s.create();
  });

export async function _regenerateLimerickPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const startingWith = haiku.startingWith;
  console.log(">> services.limerick.regenerateLimerickPoem", { lang, startingWith, user });
  const language = supportedLanguages[lang].name;

  const {
    prompt: poemPrompt,
    languageModel,
    response: {
      limerick: poem,
      title,
    }
  } = await openai.generateLimerick({ language, startingWith });
  console.log(">> services.limerick.regenerateLimerick", { poem, title, poemPrompt });

  // delete corresponding haikudle 
  // getHaikudle(user, haiku.id).then(async (haikudle: Haikudle) => {
  //   console.log(">> services.limerick.regenerateHaikuPoem", { haikudle });
  //   if (haikudle) {
  //     deleteHaikudle(user, haikudle.id);
  //   }
  // });

  // if (!user.isAdmin) {
  //   incUserUsage(user, "haikusRegenerated");
  // }

  return saveHaiku(user, {
    ...haiku,
    poem,
    theme: title,
    poemPrompt,
    languageModel,
  });
}

export async function completeLimerickPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const subject = haiku.theme;
  const mood = haiku.mood;
  const language = supportedLanguages[lang].name;
  console.log(">> services.limerick.completeLimerickPoem", { language, subject, mood, user });

  const previousLimericks: any[] = await Promise.all(
    Array.from(Array(Math.min(haiku?.version || 0, 16)))
      .map((_, i: number) => getHaiku(user, haiku.id, undefined, haiku.version - i))
  );
  console.log(">> services.limerick.completeLimerickPoem", { previousLimericks });
  const previousPoems = Array.from(
    new Set([
      (await getHaiku(user, haiku.id))?.poem,
      ...previousLimericks
        .map((haiku: Haiku) => haiku && haiku?.poem)
        .filter(Boolean)
    ]))    
  console.log(">> services.limerick.completeLimerickPoem", { previousPoems });

  const {
    response: {
      limerick: completedPoem,
      title,
      // subject: generatedSubject,
      // mood: generatedMood,
    }
  } = await openai.completeLimerick(haiku.poem, language, subject, mood, previousPoems.slice(0, 4));
  console.log(">> services.limerick.completeLimerickPoem", { completedPoem, title });

  // // delete corresponding haikudle 
  // getHaikudle(user, haiku.id).then(async (haikudle: Haikudle) => {
  //   console.log(">> services.limerick.completeLimerickPoem", { haikudle });
  //   if (haikudle) {
  //     deleteHaikudle(user, haikudle.id);
  //   }
  // });

  if (!user.isAdmin) {
    incUserUsage(user, "haikusRegenerated");
  }

  return saveHaiku(user, {
    ...haiku,
    poem: completedPoem,
    title,
    // theme: generatedSubject,
    // mood: generatedMood,
  });
}

export async function regenerateLimerickPoem(user: any, haiku: Haiku): Promise<Haiku> {
  const lang = (haiku.lang || "en") as LanguageType;
  const startingWith = haiku.startingWith;
  console.log(">> services.limericks.regenerateLimerickPoem", { lang, startingWith, user });
  const language = supportedLanguages[lang].name;

  const previousLimericks: any[] = await Promise.all(
    Array.from(Array(Math.min(haiku?.version || 0, 16)))
      .map((_, i: number) => getHaiku(user, haiku.id, undefined, haiku.version - i))
  );
  console.log(">> services.limerick.regenerateLimerickPoem", { previousLimericks });
  const previousPoems = Array.from(
    new Set([
      (await getHaiku(user, haiku.id))?.poem,
      ...previousLimericks
        .map((haiku: Haiku) => haiku && haiku?.poem)
        .filter(Boolean)
    ]))    
  console.log(">> services.limerick.regenerateLimerickPoem", { previousPoems });

  const {
    prompt: poemPrompt,
    languageModel,
    response: {
      limerick: poem,
      title,
    }
  } = await openai.generateLimerick({ language, startingWith, previousPoems: previousPoems.slice(0, 4) });
  console.log(">> services.limerick.regenerateLimerick", { poem, title, poemPrompt });

  // delete corresponding haikudle 
  // getHaikudle(user, haiku.id).then(async (haikudle: Haikudle) => {
  //   console.log(">> services.limerick.regenerateHaikuPoem", { haikudle });
  //   if (haikudle) {
  //     deleteHaikudle(user, haikudle.id);
  //   }
  // });

  // if (!user.isAdmin) {
  //   incUserUsage(user, "haikusRegenerated");
  // }

  return saveHaiku(user, {
    ...haiku,
    poem,
    theme: title,
    poemPrompt,
    languageModel,
  });
}

export async function regenerateLimerickImage(user: any, haiku: Haiku, artStyle?: string): Promise<Haiku> {
  console.log(">> services.limerick.regenerateLimerickImage", { user, haiku });
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";

  const {
    url: openaiUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    imageModel,
  } = await openai.generateLimerickImage(haiku.poem.join(" / "), undefined, undefined, artStyle);

  const imageRet = await fetch(openaiUrl);
  // console.log(">> services.limerick.regenerateLimerickImage", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  console.log(">> services.limerick.regenerateLimerickImage", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  console.log(">> services.limerick.regenerateLimerickImage", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();
  const filename = `limerick-${haikuId}-${haiku.theme?.replaceAll(/\W/g, "_").toLowerCase()}-${(haiku.version || 0) + 1}.png`;
  const blob = !debugOpenai && await put(filename, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log(">> services.limerick.generateHaiku", { subject, filename, blob });

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

  const savedHaiku = await saveHaiku(user, updatedHaiku);

  if (await triggerLimerickShared(savedHaiku)) {
    haiku = await saveHaiku(user, { 
      ...savedHaiku, 
      shared: true,
    }, { noVersion: true });
  }

  return savedHaiku;
}


export async function generateLimerick(user: any, lang?: LanguageType, startingWith?: string): Promise<Haiku> {
  console.log(">> services.limerick.generateLimerick", { lang, startingWith, user });
  const language = supportedLanguages[lang || "en"].name;
  const debugOpenai = process.env.OPENAI_API_KEY == "DEBUG";

  const {
    prompt: poemPrompt,
    languageModel,
    response: {
      limerick: poem,
      title,
    }
  } = await openai.generateLimerick({ language, startingWith });
  console.log(">> services.limerick.generateLimerick", { poem, title, poemPrompt });

  const {
    url: openaiUrl,
    prompt: imagePrompt,
    artStyle: selectedArtStyle,
    imageModel,
  } = await openai.generateLimerickImage(poem.join(" / ")); // TODO provide poem here

  const imageRet = await fetch(openaiUrl);
  // console.log(">> services.limerick.generateLimerick", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  console.log(">> services.limerick.generateLimerick", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  console.log(">> services.limerick.generateLimerick", { colors });

  // sort by darkness and pick darkest for foreground, lightest for background
  const sortedColors = colors.sort((a: any, b: any) => chroma.deltaE(a.hex(), "#000000") - chroma.deltaE(b.hex(), "#000000"));

  const haikuId = uuid();
  const filename = `limerick-${haikuId}-${title?.replaceAll(/\W/g, "_").toLowerCase()}.png`;
  const blob = !debugOpenai && await put(filename, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });
  // console.log(">> services.limerick.generateLimerick", { subject, filename, blob });

  let haiku = {
    id: haikuId,
    lang: lang || "en",
    createdBy: user.id,
    createdAt: moment().valueOf(),
    status: "created",
    startingWith,
    theme: title,
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

  const createdHaiku = await store.haikus.create(user.id, haiku); 

  if (await triggerLimerickShared(createdHaiku)) {
    haiku = await saveHaiku(user, { 
      ...createdHaiku, 
      shared: true,
    }, { noVersion: true });
  }

  return createdHaiku;
}
