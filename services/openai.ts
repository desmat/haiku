import OpenAI from 'openai';
import * as samples from "@/services/stores/samples";
import delay from '@/utils/delay';
import { mapToList } from '@/utils/misc';

const openai = process.env.OPENAI_API_KEY != "DEBUG" && new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageModel = "gpt-4";
// const languageModel = "gpt-3.5-turbo";
const imageModel = "dall-e-3";
// const imageModel = "dall-e-2";

export async function generateBackgroundImage(subject?: string, mood?: string): Promise<any> {
  console.log(`>> services.openai.generateBackgroundImage`, { subject, mood });
  const imageTypes = [
    // "charcoal drawing", 
    // "pencil drawing",
    "painting",
    "watercolor painting",
    "oil painting",
    "oil painting with large paint strokes",
    "oil painting with natural paint strokes",
    "abstract painting",
    "impressionist painting",
    "expressionist painting",
    "landscape painting"
  ];
  const prompt = `Please respond with an extremely muted, almost monochromatic colors, old-school japanese-style ${imageTypes[Math.floor(Math.random() * imageTypes.length)]}
    on the theme of ${subject || "any"}${mood ? ` with a mood of ${mood}` : ""}.`

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
      prompt: prompt,
      revisedPrompt: res.data[0]["revised_prompt"],
      url: res.data[0].url
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
      prompt: (response.data[0]["revised_prompt"] || prompt),
      url: response.data[0].url
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
    // await delay(3000);
    const sampleHaikus = mapToList(samples.haikus);
    return {
      response: {
        prompt,
        // haiku: [
        //   "line one,",
        //   "line two,",
        //   "line three.",
        // ],
        haiku: sampleHaikus[Math.floor(Math.random() * sampleHaikus.length)].poem,
        subject: subject || "test subject",
        mood: mood || "test mood",
      }
    };
  }

  // @ts-ignore
  const completion = await openai.chat.completions.create({
    model: languageModel,
    messages: [
      {
        role: 'system',
        content: `Given a topic (or "any", meaning you pick) and optionally mood, please generate a haiku in ${language || "English"} and respond in JSON where each response is an array of 3 strings.
          Be sure to respect the rules of 5, 7, 5 syllables for each line, respectively.
          Also include in the response, in fewest number of words, what were the subject and mood of the haiku. Please only include keys "haiku", "subject" and "mood"`
      },
      {
        role: 'user',
        content: prompt,
      }
    ],
  });

  let response;
  try {
    // console.log(">> services.openai.generateHaiku RESULTS FROM API", completion);
    response = JSON.parse(completion.choices[0].message.content || "{}");
    console.log(">> services.openai.generateHaiku RESULTS FROM API", { response });
    return { prompt, response };
  } catch (error) {
    console.error("Error reading results", { error, response, completion });
  }
}
