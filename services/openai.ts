import OpenAI from 'openai';
import * as samples from "@/services/stores/samples";
import delay from '@/utils/delay';
import { mapToList } from '@/utils/misc';
import { LanguageType } from '@/types/Languages';
import { temperature } from 'chroma-js';

const openai = process.env.OPENAI_API_KEY != "DEBUG" && new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = "gpt-4o";
// const languageModel = "gpt-4";
// const languageModel = "gpt-3.5-turbo";
const imageModel = "dall-e-3";
// const imageModel = "dall-e-2";

function parseJson(input: string) {
  // response from openai api sometimes returns ```json\n ... ```
  const matches = input.replaceAll(`\n`, "").match(/\s*(?:```json)?\s*(\{\s*.*\s*\})\s*(?:```)?\s*/);
  if (matches && matches.length > 1) {
    return JSON.parse(matches[1])
  }

  return undefined;
}

export async function generateBackgroundImage(subject?: string, mood?: string, artStyle?: string): Promise<any> {
  console.log(`>> services.openai.generateBackgroundImage`, { subject, mood, artStyle });
  const imageTypes = [
    // "charcoal drawing", 
    // "pencil drawing",
    "Painting",
    "Watercolor painting",
    "Oil painting",
    "Oil painting with large paint strokes",
    "Oil painting with natural paint strokes",
    "Abstract painting",
    "Impressionist painting",
    "Post-Impressionism painting",
    "Expressionist painting",
    "Landscape painting",
    "Chinene Shan Shui painting",
    "Chinese-style ink wash painting",
    "Old-school Japanese-style painting",
    "Japanese woodblock print",
    "Japanese-style ink wash painting",
    "Japanese Ukiyo-e style woodblock print or painting",
    "Japanese Hanga style woodblock print",
    "Japanese Sosaku-Hanga woodblock print",
    "Japanese Shin-Hanga woodblock print",
    "Japanese Sumi-e style ink painting",
    "Japanese Yamato-e style painting",
    "Japanese Nihonga style painting",
    "Japanese Rimpa style painting",
    "japanese style ink painting with very few simple large brush strokes",
    "Japanese style watercolor with few large brush strokes and a minimal palete of colors",
    "Quick wobbly sketch, colored hastily with watercolors", // https://www.reddit.com/r/dalle2/comments/1ch4ddv/how_do_i_create_images_with_this_style/
  ];
  const selectedArtStyle = artStyle || imageTypes[Math.floor(Math.random() * imageTypes.length)];
  const prompt = `
    Respond with an extremely muted, almost monochromatic colors, 
    ${selectedArtStyle},
    on the theme of ${subject || "any"}${mood ? ` with a mood of ${mood}` : ""}.
    Make the art low-key with negative space in the middle, 
    so that a haiku poem can be overlayed.
    The image should not contain any characters of any kind.
  `;

  // for testing
  if (process.env.OPENAI_API_KEY == "DEBUG") {
    console.warn(`>> services.openai.generateBackgroundImage: DEBUG mode: returning dummy response`);
    const sampleHaikus = mapToList(samples.haikus)
    const res = {
      "created": 1705515146,
      "data": [
        {
          "revised_prompt": "Create an image that uses extremely muted, almost monochromatic colors. Make the style similar to traditional Japanese artwork, with the subject matter focused on various aspects of nature. Ensure the colors used are slightly varied but maintain a consistent, subdued aesthetic.",
          // "url": "https://haiku.desmat.ca/backgrounds/DALL%C2%B7E%202024-01-15%2017.55.09%20-%20An%20extremely%20muted,%20almost%20monochromatic%20painting%20in%20the%20Japanese%20style,%20featuring%20a%20winter%20snow%20scene.%20The%20artwork%20captures%20the%20quiet%20beauty%20of%20a%20sno.png"
          url: `http://localhost:3000${encodeURI(sampleHaikus[Math.floor(Math.random() * sampleHaikus.length)].bgImage)}`,
          // url: "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/haiku-f98a2e55-nature.png",
          // url: "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/45e37365-nmjxiOoeO9WKMUAkgv5tJvxdKGFNkt.png"
        }
      ]
    }

    return {
      artStyle: selectedArtStyle,
      prompt: res.data[0]["revised_prompt"],
      url: res.data[0].url,
      model: "debug",
    };
  }

  // @ts-ignore
  const response = await openai.images.generate({
    model: imageModel,
    prompt,
    n: 1,
    size: "1024x1024",
    // size: "256x256",
  });

  try {
    console.log(">> services.openai.generateBackgroundImage RESULTS FROM API", { response });
    return {
      artStyle: selectedArtStyle,
      prompt: (response.data[0]["revised_prompt"] || prompt),
      model: imageModel,
      url: response.data[0].url,
    };
  } catch (error) {
    console.error("Error reading results", { error, response });
  }
}

export async function generateHaiku(language?: string, subject?: string, mood?: string): Promise<any> {
  const prompt = `Topic: ${subject || "any"}${mood ? ` Mood: ${mood}` : ""}`;

  console.log(`>> services.openai.generateHaiku`, { language, subject, mood, prompt });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.generateHaiku: DEBUG mode: returning dummy response`);
    await delay(2000);
    const sampleHaikus = mapToList(samples.haikus);
    return {
      response: {
        prompt,
        haiku: subject?.includes("DEBUG")
          ? [
            "line one,",
            "line two,",
            "line three.",
          ] : sampleHaikus[Math.floor(Math.random() * sampleHaikus.length)].poem,
        subject: subject || "test subject",
        mood: mood || "test mood",
        model: "debug",
      }
    };
  }

  // ... generate a haiku in ${language || "English"} and respond ...
  const systemPrompt = `Given a topic (or "any", meaning you pick) and optionally mood, please generate a haiku and respond in JSON where each response is an array of 3 strings.
    Be sure to respect the rules of 5, 7, 5 syllables for each line, respectively.
    If the topic specifies a language, or is in another language, please generate the haiku in that language.
    Also include in the response, in fewest number of words, what were the subject (in the language requested) and mood (in English) of the haiku.
    The subject should be in the same language of the haiku. 
    Also include in the response the language code in which the poem was generated, using the official ISO 639-1 standard language code.
    Please only include keys "haiku", "subject", "mood" and "lang".
    `;
  // @ts-ignore
  const completion = await openai.chat.completions.create({
    model: languageModel,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt,
      }
    ],
  });

  let response;
  try {
    console.log(">> services.openai.generateHaiku RESULTS FROM API", { completion, content: completion.choices[0]?.message?.content });
    response = parseJson(completion.choices[0].message.content);
    console.log(">> services.openai.generateHaiku RESULTS FROM API", { response });
    return {
      prompt: systemPrompt + "\n" + prompt,
      model: completion.model,
      response,
    };
  } catch (error) {
    console.error("Error reading results", { error, response, completion });
  }
}

export async function completeHaiku(poem: string[], language?: string, subject?: string, mood?: string, previousPoems?: any[]): Promise<any> {
  const prompt = `Haiku poem to complete: "${poem.join(" / ")}"
  ${subject ? `Topic: "${subject}"` : ""}
  ${mood ? ` Mood: "${mood}"` : ""}`;

  console.log(`>> services.openai.completeHaiku`, { language, subject, mood, prompt, previousPoems });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.completeHaiku: DEBUG mode: returning dummy response`);
    await delay(1000);
    return {
      response: {
        prompt,
        haiku: poem.map((line: string) => !line || line.includes("...") ? line.replaceAll("...", "___") : line),
        subject: subject || "test subject",
        mood: mood || "test mood",
        model: "debug",
      }
    };
  }

  const messages = [
    {
      role: 'system',
      content: `
      Given an incomplete haiku please complete the haiku. 
      Characters "..." or "…" will be used to indicate a placeholder, please keep the existing word(s) and fill the rest.
      If a line looks like this: "<some one or more words> ..." then keep the word(s) at the beginning and fill the rest.
      If a line looks like this: "... <one or more words>" then keep the word(s) at the end and fill the rest.
      If a line looks like this: "... <one or more words> ..." then keep the word(s) together and fill the rest.
      Additionally, if a line looks obviously incomplete even without "..." characters please complete it.
      Optionally a topic (or "any", meaning you pick) and/or mood may be included.
      Previous haiku poems may be provided, if so please ensure that the new haiku poem is different than previous ones.
      Please generate a haiku and respond in JSON where each response is an array of 3 strings.
      Be sure to respect the rules of 5, 7, 5 syllables for each line, respectively.
      If the topic specifies a language, or is in another language, or the incomplete haiku is in another language, please generate the haiku in that language.
      Also, please fix up any extraneous white spaces, punctuation, incorrect capitalized words, typos or incorrectly words.
      Also include in the response, in fewest number of words, what were the subject (in the language requested) and mood (in English) of the haiku. 
      Also include in the response the language code in which the poem was generated, using the official ISO 639-1 standard language code.
      Please only include keys "haiku", "subject", "mood" and "lang".`
    },
    ...((previousPoems || []).map((previousPoem: []) => {
      return {
        role: 'user',
        content: `Previous haiku poem: \n${previousPoem.join("\n")}`,
      }
    })),
    {
      role: 'user',
      content: prompt,
    }
  ];
  // console.log(`>> services.openai.completeHaiku`, { messages });

  // @ts-ignore
  const completion = await openai.chat.completions.create({
    model: languageModel,
    messages,
  });

  let response;
  try {
    console.log(">> services.openai.completeHaiku RESULTS FROM API", { completion, content: completion.choices[0]?.message?.content });
    response = parseJson(completion.choices[0].message.content);
    console.log(">> services.openai.completeHaiku RESULTS FROM API", { response });
    return { prompt, response, model: completion.model };
  } catch (error) {
    console.error("Error reading results", { error, response, completion });
  }
}











export async function generateLimerick({ startingWith, language, previousPoems }: { startingWith?: string, language?: string, previousPoems?: any[] }): Promise<any> {
  const prompt = `Starting with: ${startingWith}`;

  console.log(`>> services.openai.generateLimerick`, { language, prompt });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.generateLimerick: DEBUG mode: returning dummy response`);
    // await delay(13000);
    const sampleHaikus = mapToList(samples.haikus);
    return {
      response: {
        prompt,
        limerick: true // startingWith?.includes("DEBUG")
          ? [
              "There was once a man from Kent,",
              "Whose rod was so long it bent.",
              "It scared all the fishes,",
              "Fulfilled mermaid wishes,",
              "And made quite the splash wherever he went!",
          ] : sampleHaikus[Math.floor(Math.random() * sampleHaikus.length)].poem,
        // startingWith: subject || "test subject",
        // mood: mood || "test mood",
        title: "test title",
      }
    };
  }

  const systemPrompt = `
    Given the starting words (if provided) please generate a limerick in ${language || "English"} and respond in JSON where each response is an array of strings.
    Make sure the limerick include innuendos.
    Other limerick poems may be provided, if so please ensure that this new limerick poem is different from the previous ones.
    Also include in the response, in fewest number of words, a title for this limeric. 
    Please only include keys "limerick" and "title".
    `;

    const messages = [
      {
        role: 'system',
        content: `
          Given the starting words (if provided) please generate a limerick in ${language || "English"} and respond in JSON where each response is an array of strings.
          Make sure the limerick include innuendos.
          Other limerick poems may be provided, if so please ensure that this new limerick poem is different from the previous ones.
          Also include in the response, in fewest number of words, a title for this limeric. 
          Please only include keys "limerick" and "title".
        `  
      },
      ...((previousPoems || []).map((previousPoem: []) => {
        return {
          role: 'user',
          content: `Other limerick poem: \n${previousPoem.join("\n")}`,
          temperature: 1,
        }
      })),
      {
        role: 'user',
        content: prompt,
      }
    ];
    console.log(`>> services.openai.generateLimerick`, { messages });
  

  // @ts-ignore
  const completion = await openai.chat.completions.create({
    model: languageModel,
    messages,
  });

  let response;
  try {
    // console.log(">> services.openai.generateLimerick RESULTS FROM API", completion);
    response = parseJson(completion.choices[0].message.content || "{}");
    console.log(">> services.openai.generateLimerick RESULTS FROM API", { completion, response });
    return {
      prompt: systemPrompt + "\n" + prompt,
      languageModel,
      response,
    };
  } catch (error) {
    console.error("Error reading results", { error, response, completion });
  }
}

export async function completeLimerick(poem: string[], language?: string, subject?: string, mood?: string, previousPoems?: any[]): Promise<any> {
  const prompt = `Limerick to complete: "${poem.join(" / ")}"
  ${subject ? `Topic: "${subject}"` : ""}
  ${mood ? ` Mood: "${mood}"` : ""}`;

  console.log(`>> services.openai.completeLimerick`, { poem, language, subject, mood, prompt, previousPoems });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.completeLimerick: DEBUG mode: returning dummy response`);
    // await delay(3000);
    return {
      response: {
        prompt,
        limerick: poem.map((line: string) => !line || line.includes("...") ? line.replaceAll("...", "___") : line),
        // subject: subject || "test subject",
        // mood: mood || "test mood",
        title: "test title",
      }
    };
  }

  const messages = [
    {
      role: 'system',
      content: `
        Given an incomplete limerick please complete the limerick. 
        Characters "..." or "…" will be used to indicate a placeholder, please keep the existing word(s) and fill the rest.
        If a line looks like this: "<some one or more words> ..." then keep the word(s) at the beginning and fill the rest.
        If a line looks like this: "... <one or more words>" then keep the word(s) at the end and fill the rest.
        If a line looks like this: "... <one or more words> ..." then keep the word(s) together and fill the rest.
        Additionally, if a line looks obviously incomplete even without "..." characters please complete it.
        Any empty or missing lines should be filled in or added so that we end up with 5 lines.
        Optionally a topic (or "any", meaning you pick) and/or mood may be included.
        Previous limerick poems may be provided, if so please ensure that the new limerick poem is different than previous ones.
        Make sure the limerick include innuendos.
        Also, please fix up any extraneous white spaces, punctuation, incorrect capitalized words, typos or incorrectly words.
        Respond in JSON where the response is an array of strings.
        Also include in the response, in fewest number of words, a title for this limerick. 
        Please only include keys "limerick" and "title".`
    },
    ...((previousPoems || []).map((previousPoem: []) => {
      return {
        role: 'user',
        content: `Previous limerick poem: \n${previousPoem.join("\n")}`,
      }
    })),
    {
      role: 'user',
      content: prompt,
      temperature: 1,
    }
  ];
  console.log(`>> services.openai.completeLimerick`, { messages });

  // @ts-ignore
  const completion = await openai.chat.completions.create({
    model: languageModel,
    messages,
    // temperature: 1,
  });

  let response;
  try {
    console.log(">> services.openai.completeHaiku RESULTS FROM API", { completion });
    response = parseJson(completion.choices[0].message.content || "{}");
    console.log(">> services.openai.completeHaiku RESULTS FROM API", { response });
    return { prompt, response };
  } catch (error) {
    console.error("Error reading results", { error, response, completion });
  }
}

export async function generateLimerickImage(limerick?: string, subject?: string, mood?: string, artStyle?: string): Promise<any> {
  console.log(`>> services.openai.generateLimerickImage`, { limerick, subject, mood, artStyle });
  const imageTypes = [
    // "charcoal drawing", 
    // "pencil drawing",
    // "Painting",
    "funny and whimsical painting with large brush strokes, in a style often seen in irish or english pubs",
    "funny and whimsical quick wobbly sketch, colored hastily with watercolors",
  ];
  const selectedArtStyle = artStyle || imageTypes[Math.floor(Math.random() * imageTypes.length)];
  const prompt = `
    Please read this limerick: ${limerick}
    Respond with an image that would complement, hint at, and/or capture the essence that limerick.
    Make the art low-key with negative space in the middle, so that the limerick can be overlayed.
    The image SHOULD NOT contain any writing, letters, numbers or characters of any kind.
    ${selectedArtStyle ? "Additional instructions for the image: " + selectedArtStyle + "." : ""}
  `;

  // for testing
  if (process.env.OPENAI_API_KEY == "DEBUG") {
    console.warn(`>> services.openai.generateLimerickImage: DEBUG mode: returning dummy response`);
    const res = {
      "created": 1705515146,
      "data": [
        {
          "revised_prompt": "REVISED PROMPT",
          url: "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/limericks/DALL%C2%B7E%202024-04-27%2011.26.51%20-%20An%20impressionistic%20painting%20of%20a%20whimsical%20scene%20featuring%20a%20man%20from%20Kent%20at%20a%20riverbank,%20holding%20a%20long,%20curiously%20bent%20fishing%20rod.%20The%20setting%20is%20%20(2).png"
        }
      ]
    }

    return {
      artStyle: selectedArtStyle,
      prompt: res.data[0]["revised_prompt"],
      url: res.data[0].url,
      imageModel,
    };
  }

  // @ts-ignore
  const response = await openai.images.generate({
    model: imageModel,
    prompt,
    n: 1,
    size: "1024x1024",
    // size: "256x256",
  });

  try {
    console.log(">> services.openai.generateBackgroundImage RESULTS FROM API", { response });
    return {
      artStyle: selectedArtStyle,
      prompt: (response.data[0]["revised_prompt"] || prompt),
      imageModel,
      url: response.data[0].url,
    };
  } catch (error) {
    console.error("Error reading results", { error, response });
  }
}
