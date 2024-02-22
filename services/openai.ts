import OpenAI from 'openai';
import delay from '@/utils/delay';
import * as samples from "@/services/stores/samples";
import { mapToList } from '@/utils/misc';

let store: any;
import(`@/services/stores/${process.env.STORE_TYPE}`).then((importedStore) => {
  store = importedStore;
});

const openai = process.env.OPENAI_API_KEY != "DEBUG" && new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const model = "gpt-3.5-turbo"; // seems good and fast enough for now
const model = "gpt-4";

export async function generateBackgroundImage(subject?: string): Promise<any> {
  console.log(`>> services.openai.generateBackgroundImage`, { subject });
  const prompt = `Please respond with an extremely muted, almost monochromatic colors paintings in a japanese style, 
    on the subject of ${subject || "landscape"}.`

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
          // "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/org-2MGbI0LLfEavnqcGsIgw6J4L/user-KM4FaAIbSJ6GtgT2mO363LEE/img-xbunXGE7qzyF0Bf2RW2BFiZk.png?st=2024-01-17T21%3A27%3A35Z&se=2024-01-17T23%3A27%3A35Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-01-17T19%3A18%3A49Z&ske=2024-01-18T19%3A18%3A49Z&sks=b&skv=2021-08-06&sig=Iv7zzVZ2zl8CjGxBuVNCa5xBRBQD%2B0cSBG5yf9JjtiQ%3D"
          // url: `http://localhost:3000${encodeURI(sampleHaikus[Math.floor(Math.random() * sampleHaikus.length)].bgImage)}`,
          url: "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/haiku-f98a2e55-nature.png",
          // url: "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/45e37365-nmjxiOoeO9WKMUAkgv5tJvxdKGFNkt.png"
        }
      ]
    }

    return {
      prompt: (res.data[0]["revised_prompt"] || prompt),
      url: res.data[0].url
    };
  }

  // @ts-ignore
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  // image_url = response.data.data[0].url;  

  try {
    console.log(">> services.openai.generateExercise RESULTS FROM API", { response });
    console.log(">> services.openai.generateExercise RESULTS FROM API (as json)", JSON.stringify(response));
    return {
      prompt: (response.data[0]["revised_prompt"] || prompt),
      url: response.data[0].url
    };
  } catch (error) {
    console.error("Error reading results", { error, response });
  }
}

export async function generateHaiku(subject?: string, language?: string): Promise<any> {
  console.log(`>> services.openai.generateHaiku`, { subject, language });
  // const prompt = "age: 46; gender: male; difficulty: beginner; total length: about 45 minutes; maybe involving the following equiments or just the floor: rowing machine. " // parameters.map(([name, value]: any) => `${name}: ${value}`).join("; ");
  const prompt = `Subject: ${subject || "any"}`;

  console.log(`>> services.openai.generateHaiku`, { prompt });

  // for testing

  // await delay(3000);

  if (process.env.OPENAI_API_KEY == "DEBUG") {
    console.warn(`>> services.openai.generateHaiku: DEBUG mode: returning dummy response`);
    return {
      response: {
        prompt,
        // haiku: [
        //   "line one,",
        //   "line two,",
        //   "line three.",
        // ],
        haiku: [
          'Moonlight on the lake',
          'Soft whispers in the night air',
          "Nature's lullaby"
        ],
        // subject: "Test subject",
        subject: "Nature",
      }
    };
  }

  // @ts-ignore
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `Given a topic (or "any") generate a haiku in ${language || "English"} and respond in JSON where each response is an array of 3 strings.
          Also include in the response, in fewest number of words, what was the subject of the haiku. Please only include keys "haiku" and "subject"`
      },
      {
        role: 'user',
        content: prompt,
      }
    ],
  });

  let response;
  try {
    // console.log(">> services.openai.generateExercise RESULTS FROM API", completion);
    response = JSON.parse(completion.choices[0].message.content || "{}");
    console.log(">> services.openai.generateExercise RESULTS FROM API", { response });
    console.log(">> services.openai.generateExercise RESULTS FROM API (as json)", JSON.stringify(response));
    return { prompt, response };
  } catch (error) {
    console.error("Error reading results", { error, response, completion });
  }
}
