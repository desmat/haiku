import { delay, mapToList } from '@desmat/utils';
import OpenAI from 'openai';
import * as samples from "@/services/stores/samples";
import trackEvent from '@/utils/trackEventServer';

const openai = process.env.OPENAI_API_KEY != "DEBUG" && new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = "gpt-4o";
const smallLanguageModel = "gpt-4o-mini"
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

export async function generateBackgroundImage(userId: string, subject?: string, mood?: string, artStyle?: string, customPrompt?: string, customArtStyles?: string[]): Promise<any> {
  console.log(`services.openai.generateBackgroundImage`, { subject, mood, artStyle, customPrompt, customArtStyles });
  const imageTypes = customArtStyles || [
    // "charcoal drawing", 
    // "pencil drawing",
    // "Painting",
    "Watercolor painting",
    "Oil painting",
    "Oil painting with large paint strokes",
    "Oil painting with natural paint strokes",
    "Abstract painting",
    "Impressionist painting",
    "Post-Impressionism painting",
    "Expressionist painting",
    "Landscape painting",

    "Chinese-style ink wash painting",
    "Chinese Shan Shui painting",

    "Old-school Japanese-style painting",

    // "Japanese woodblock print",
    // "Japanese Ukiyo-e style woodblock print or painting",
    "Japanese Hanga style woodblock print",
    // "Japanese Sosaku-Hanga woodblock print",
    // "Japanese Shin-Hanga woodblock print",

    "Japanese-style ink wash painting",
    "Japanese Sumi-e style ink painting",
    // "Japanese Yamato-e style painting",
    // "Japanese Nihonga style painting",
    // "Japanese Rimpa style painting",

    "Japanese-style ink painting with very few simple large brush strokes",
    "Japanese-style watercolor with few large brush strokes and a minimal palete of colors",

    // https://www.reddit.com/r/dalle2/comments/1ch4ddv/how_do_i_create_images_with_this_style/
    "Quick wobbly sketch, colored hastily with watercolors",

    // developped for kingfisher
    `A painting that uses the traditional East Asian art techniques of sumi-e or Chinese ink painting, with characteristics such as minimal brush strokes, a focus on natural subjects, and the use of negative space. 
    Employ a selective use of color to add a layer of emphasis and contrast, enhancing the overall aesthetic without detracting from the simplicity and elegance that define this art style.
    The painting should use very imperfect almost hasty strokes. No detailed brush strokes. 
    There should be at most 8 brush strokes using only dark ink with a few colourful accents with an ink of bright color like orange, pink, red, etc.
    The background should be pure white and the composition extremely simple and abstract with extreme use of negative space.`,
  ];

  if (customPrompt) {
    if (customPrompt.indexOf("${theme}") > -1 || customPrompt.indexOf("${mood}") > -1) {
      customPrompt = customPrompt
        .replace("${theme}", subject || "")
        .replace("${mood}", mood ? ` with a mood of ${mood || mood}` : "")
    } else if (subject || mood) {
      customPrompt = `${customPrompt}.
      ${subject ? `It should be on the subject of ${subject}` : ""}${subject && mood ? ", and it should have" : "It should have"}${mood ? ` a mood of ${mood}` : ""}`
    }
  }

  const selectedArtStyle = artStyle || imageTypes && Array.isArray(imageTypes) && imageTypes.length > 0 && imageTypes[Math.floor(Math.random() * imageTypes.length)] || undefined;
  const prompt = customPrompt || `
    Respond with an extremely muted, almost monochromatic colors, 
    ${selectedArtStyle},
    on the theme of ${subject || "any"}${mood ? `, with a mood of ${mood}` : ""}.
    Make the art extremely minimal and low-key, with very few brush strokes, 
    The image should not contain any writing or characters of any kind.
    There should be some negative space where a small poem will be overlayed.
    If the composition has a central point of interest it should be either up or down from the center.
  `;
  console.log(`services.openai.generateBackgroundImage`, { prompt });

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

  try {
    // @ts-ignore
    const response = await openai.images.generate({
      model: imageModel,
      prompt,
      n: 1,
      size: "1024x1024",
      // size: "256x256",
    });

    try {
      console.log("services.openai.generateBackgroundImage RESULTS FROM API", { response });
      return {
        artStyle: selectedArtStyle,
        prompt: (response.data[0]["revised_prompt"] || prompt),
        model: imageModel,
        url: response.data[0].url,
      };
    } catch (error) {
      console.error("Error reading results", { error, response });
    }
  } catch (error: any) {
    await trackEvent("error", {
      scope: "generate-haiku-image",
      type: error?.type,
      code: error?.code,
      message: error.message,
      userId,
      request: subject,
    });

    console.error("Error generating haiku image", { type: error.type, code: error.code, message: error.message, error, prompt });
    throw error;
  }
}

export async function generateHaiku(userId: string, language?: string, subject?: string, mood?: string, customPrompt?: string): Promise<any> {
  const prompt = `Topic: ${subject || "any"}${mood ? ` Mood: ${mood}` : ""}`;

  console.log(`services.openai.generateHaiku`, { language, subject, mood, prompt });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.generateHaiku: DEBUG mode: returning dummy response`);
    // await delay(3000);
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
  const systemPrompt = customPrompt || `
    Given a topic (or "any", meaning you pick) and optionally mood, please generate a haiku and respond in JSON where each response is an array of 3 strings.
    Follow any instructions indicated about what the poem should start with, end with, contain specific words, or other guidance, if provided.
    Be sure to respect the rules of 5, 7, 5 syllables for each line, respectively.
    If the topic specifies a language, or is in another language, please generate the haiku in that language.
    Also include in the response, in maximum 3 words, what were the subject (in the language requested) and mood (in English) of the haiku.
    Additionally, please include a very short title of 1, 2 or 3 words that reflects the poem, subject and mood, in the language of the haiku.
    The subject should be in the same language of the haiku.
    Also include in the response the language code in which the poem was generated, using the official ISO 639-1 standard language code.
    Also, if haiku is about a season (summer/fall/winter/spring) please indicate which one, otherwise don't.
    Please only include keys "haiku", "subject", "mood", "title", "lang", and optionally "season".

    Example input:
    \`\`\`
    Topic: cherry blossoms
    \`\`\`
    Example output:
    \`\`\`json
    {
        "haiku": [
            "Pink blossoms gather,",
            "Soft whispers in the breeze,",
            "Fleeting beauty falls."
        ],
        "subject": "cherry blossoms",
        "mood": "tranquil",
        "title": "Fleeting Beauty",
        "lang": "en",
        "season": "spring",
    }
    \`\`\`

    Example input:
    \`\`\`
    Topic: night
    \`\`\`
    Example output:
    \`\`\`json
    {
        "haiku": [
          "Moon casts her soft glow,",
          "Whispers of night serenade,",
          "Dreams in shadows flow."
        ],
        "subject": "night",
        "mood": "calm",
        "title": "Flowing Dreams",
        "lang": "en",
    }
    \`\`\`

    Example input:
    \`\`\`
    Topic: butterfly
    \`\`\`
    Example output:
    \`\`\`json
    {
        "haiku": [
          "Gentle wings alight,",
          "Dancing on a summer breeze,",
          "Nature's fleeting grace.",
        ],
        "subject": "butterfly",
        "mood": "tranquil",
        "title": "A Butterfly",
        "lang": "en",
        "season": "summer"
    }
    \`\`\`
    `;





  try {
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
      console.log("services.openai.generateHaiku RESULTS FROM API", { completion, content: completion.choices[0]?.message?.content });
      response = parseJson(completion.choices[0].message.content);
      console.log("services.openai.generateHaiku RESULTS FROM API", { response });
      return {
        prompt: systemPrompt + "\n" + prompt,
        model: completion.model,
        response,
      };
    } catch (error) {
      console.error("Error reading results", { error, response, completion });
    }
  } catch (error: any) {
    await trackEvent("error", {
      scope: "generate-haiku-poem",
      type: error?.type,
      code: error?.code,
      message: error.message,
      userId,
      request: subject,
    });

    console.error("Error generating haiku poem", { type: error.type, code: error.code, message: error.message, error, prompt });
    throw error;
  }
}

export async function completeHaiku(userId: string, poem: string[], language?: string, subject?: string, mood?: string, customPrompt?: string): Promise<any> {
  const prompt = `Haiku to complete: "${poem.join(" / ")}"
  ${subject ? `Topic: "${subject}"` : ""}
  ${mood ? ` Mood: "${mood}"` : ""}`;

  console.log(`services.openai.completeHaiku`, { language, subject, mood, prompt });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.completeHaiku: DEBUG mode: returning dummy response`);
    // await delay(3000);
    return {
      response: {
        prompt,
        haiku: poem.map((line: string) => !line || line.includes("...") ? line.replaceAll("...", "_") : line),
        subject: subject || "test subject",
        mood: mood || "test mood",
        model: "debug",
      }
    };
  }

  try {
    // @ts-ignore
    const completion = await openai.chat.completions.create({
      model: languageModel,
      messages: [
        {
          role: 'system',
          content: customPrompt || `
          Given an incomplete haiku please complete the haiku. 
          Characters "..." or "…" will be used to indicate a placeholder, please keep the existing word(s) and fill the rest.
          If a line looks like this: "<some one or more words> ..." then keep the word(s) at the beginning and fill the rest.          If a line looks like this: "... <one or more words>" then keep the word(s) at the end and fill the rest.
          If a line looks like this: "... <one or more words> ..." then keep the word(s) together and fill the rest.
          Additionally, if a line looks obviously incomplete even without "..." characters please complete it.
          Optionally a topic (or "any", meaning you pick) and/or mood may be included.
          Please generate a haiku and respond in JSON where each response is an array of 3 strings.
          Be sure to respect the rules of 5, 7, 5 syllables for each line, respectively.
          If the topic specifies a language, or is in another language, or the incomplete haiku is in another language, please generate the haiku in that language.
          Also, please fix up any extraneous white spaces, punctuation, incorrect capitalized words, typos or incorrectly words.
          Also include in the response, in fewest number of words, what were the subject (in the language requested) and mood (in English) of the haiku. 
          Also include in the response the language code in which the poem was generated, using the official ISO 639-1 standard language code.
          Also, if haiku is about a season (summer/fall/winter/spring) please indicate which one, otherwise don't.
          Please only include keys "haiku", "subject", "mood", "title", "lang", and optionally "season".`
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
    });

    let response;
    try {
      console.log("services.openai.completeHaiku RESULTS FROM API", { completion, content: completion.choices[0]?.message?.content });
      response = parseJson(completion.choices[0].message.content);
      console.log("services.openai.completeHaiku RESULTS FROM API", { response });
      return { prompt, response, model: completion.model };
    } catch (error) {
      console.error("Error reading results", { error, response, completion });
    }
  } catch (error: any) {
    await trackEvent("error", {
      scope: "complete-haiku-poem",
      type: error?.type,
      code: error?.code,
      message: error.message,
      userId,
      request: poem.join(" / "),
    });

    console.error("Error copmleting haiku poem", { type: error.type, code: error.code, message: error.message, error, prompt });
    throw error;
  }
}

export async function analyzeHaiku(userId: string, poem: string[]): Promise<any> {

  const language = undefined
  const subject = undefined;
  const mood = undefined;
  console.log(`services.openai.analyzeHaiku`, { language, subject, mood });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.analyzeHaiku: DEBUG mode: returning dummy response`);
    // await delay(3000);
    const sampleHaikus = mapToList(samples.haikus);
    return {
      response: {
        prompt: "<system prompt>" + "\n" + poem.join("\n"),
        haiku: true //subject?.includes("DEBUG")
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
  const systemPrompt = `
    Given a poem of any language, 
    please respond, in fewest number of words, what were the subject (in the language of the poem) and mood (in English) of the poem.
    The subject should be in the same language of the poem. 
    Also include in the response the language code in which the poem was generated, using the official ISO 639-1 standard language code.
    Also, if the poem is a haiku about a season (summer/fall/winter/spring) please indicate which one, otherwise don't.
    Please only include keys "subject", "mood", "lang", and optionally "season".
    `;

  try {
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
          content: poem.join("\n"),
        }
      ],
    });

    let response;
    try {
      console.log("services.openai.analyzeHaiku RESULTS FROM API", { completion, content: completion.choices[0]?.message?.content });
      response = parseJson(completion.choices[0].message.content);
      console.log("services.openai.analyzeHaiku RESULTS FROM API", { response });
      return {
        prompt: systemPrompt + "\n" + poem,
        model: completion.model,
        response,
      };
    } catch (error) {
      console.error("Error reading results", { error, response, completion });
    }
  } catch (error: any) {
    await trackEvent("error", {
      scope: "analyze-haiku-poem",
      type: error?.type,
      code: error?.code,
      message: error.message,
      userId,
      request: poem.join(" / "),
    });

    console.error("Error analyzing haiku poem", { type: error.type, code: error.code, message: error.message, error, prompt });
    throw error;
  }
}

export async function analyzeImage(userId: string, imageBase64: string): Promise<any> {
  console.log(`services.openai.analyzeImage`, { userId });

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    // for testing
    console.warn(`>> services.openai.analyzeImage: DEBUG mode: returning dummy response`);
    // await delay(3000);
    return {
      response: {
        prompt: "<system prompt>",
        // TODO somethingsomethingsomething
        model: "debug",
      }
    };
  }

  // ... generate a haiku in ${language || "English"} and respond ...
  const systemPrompt = `
    Given the image please analyse and provide:

    1. The point of interest in the image, if any.
    This can be a tree, architecture, an animal, a person, the sun or moon, etc.
    If the point of intest takes the majority of the image then return undefined.
    If there are eyes from a person or animal, that will be the point of interest.
    Please specify the area containing this point of interest, if any:
    - top third: \`top\`
    - center: \`center\`
    - bottom third: \`bottom\`
    - did not find a point of interest: \`null\`

    2. If a person, persons, animal or animals' are featured 
    please specify the top of their face or eyes, if any: 
    - top third area (0 -> 1/3 height): \`top\`
    - center third area (1/3 -> 2/3 height): \`center\`
    - bottom third area (2/3 -> 3/3 height): \`bottom\`
    - did not find a point of interest: \`null\`

    3. The area with the most empty or negative space. 
    Note that there often is not, in cases where the point of intest takes the whole area, or the image is well balanced. In such cases return undefined.
    Please specify the area containing this space, if any:
    - top third: \`top\`
    - center: \`center\`
    - bottom third: \`bottom\`
    - did not find an area of negative space: \`null\`

    4. the position for a 3-line haiku poem to be overlayed.
    The poem will take most of the width and 1/3 of the height of the square image.
    Choose the position in the area of negative space, if any, and away from the point of interest, if any.
    If the moon or sun are features it's often nice to position the poem to touch it.
    If a person, persons, animal or animals are prominently featured make sure the position will ABOSOLUTELY NOT be covering it their face and so prefer to position below their face, even if this is in the negative space.
    IMPORTANT: IF PERSON, PEOPLE, ANIMAL OR ANIMALS ARE IN THE CENTER CHOOSE \`bottom\`.
    IMPORTANT: IF PERSON, PEOPLE, ANIMAL OR ANIMALS ARE IN THE BOTTOM CHOOSE THE POSITION OF THE NEGATIVE SPACE, EITHER \`top\` or \`center\`.
    If there is no obvious place in the image please choose center.
    Please specify on which position will work best to overlay the poem:
    - top third: \`top\`
    - center (default if did not find a good location): \`center\`
    - bottom third: \`bottom\`

    Please only respond in JSON format with the keys \`pointOfInterest\`, \`personOrAnimalOfInterest\`, \`negativeSpace\` and \`alignment\`, all of which can only be one of \`top\`, \`center\`, \`bottom\`, \`null\`.
    `;

  try {
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
          content: [
            {
              "type": "image_url",
              "image_url": { "url": `data:image/jpeg;base64,${imageBase64}` },
            }
          ]
        },
      ],
    });

    let response;

    try {
      console.log("services.openai.analyzeImage RESULTS FROM API", { completion, content: completion.choices[0]?.message?.content });
      response = parseJson(completion.choices[0].message.content);
      console.log("services.openai.analyzeImage RESULTS FROM API", { response });
      return {
        prompt: systemPrompt,
        model: completion.model,
        response,
      };
    } catch (error) {
      console.error("Error reading results", { error, response, completion });
    }
  } catch (error: any) {
    // TODO
    // await trackEvent("error", {
    //   scope: "analyze-haiku-poem",
    //   type: error?.type,
    //   code: error?.code,
    //   message: error.message,
    //   userId,
    //   request: poem.join(" / "),
    // });

    console.error("Error analyzing image", { type: error.type, code: error.code, message: error.message, error, prompt });
    throw error;
  }
}
