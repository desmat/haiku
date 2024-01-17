import OpenAI from 'openai';
import delay from '@/utils/delay';
import * as samples from "@/services/stores/samples";

let store: any;
import(`@/services/stores/${process.env.STORE_TYPE}`).then((importedStore) => {
  store = importedStore;
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const model = "gpt-3.5-turbo"; // seems good and fast enough for now
const model = "gpt-4";

export async function generateBackgroundImage(subject?: string): Promise<any> {
  console.log(`>> services.openai.generateBackgroundImage`, { subject });
  const prompt = `An extremely muted, almost monochromatic colors paintings in a japanese style, 
    on the subject of ${subject || "landscape"}.
    Please respond with a painting of the style above, and in addition please provide the predominant color in RGB, as well as another RGB representing 75% darker than the predominant color, both in JSON format.
    The response should only contain JSON.
    `

  // const res = {
  //   "created":1705515146,
  //   "data":[
  //     {
  //       "revised_prompt":"Create an image that uses extremely muted, almost monochromatic colors. Make the style similar to traditional Japanese artwork, with the subject matter focused on various aspects of nature. Ensure the colors used are slightly varied but maintain a consistent, subdued aesthetic.",
  //       "url":"https://oaidalleapiprodscus.blob.core.windows.net/private/org-2MGbI0LLfEavnqcGsIgw6J4L/user-KM4FaAIbSJ6GtgT2mO363LEE/img-tUNo4j0M1jMhWGXPU3NPEjOr.png?st=2024-01-17T17%3A12%3A26Z&se=2024-01-17T19%3A12%3A26Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-01-17T15%3A32%3A39Z&ske=2024-01-18T15%3A32%3A39Z&sks=b&skv=2021-08-06&sig=1RguiOApu5ikmdcFkgM0tbH7N5PkJCCfei6AtyZH2U0%3D"
  //     }
  //   ]
  // }

  // return {
  //   prompt: (res.data[0]["revised_prompt"] || prompt),
  //   url: res.data[0].url
  // };  

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

export async function generateHaiku(subject?: string): Promise<any> {
  console.log(`>> services.openai.generateHaiku`, { subject });
  // const prompt = "age: 46; gender: male; difficulty: beginner; total length: about 45 minutes; maybe involving the following equiments or just the floor: rowing machine. " // parameters.map(([name, value]: any) => `${name}: ${value}`).join("; ");
  const prompt = `Subject: ${subject || "any"}`;

  console.log(`>> services.openai.generateHaiku`, { prompt });

  // // for testing

  // await delay(3000);

  // return {
  //   response: {
  //     prompt,
  //     haiku: [
  //       "line one,",
  //       "line two,",
  //       "line three.",
  //     ],
  //     subject: "Nature",
  //   }
  // };

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `Given a topic (or "any") generate a haiku and respond in JSON where each response is an array of 3 strings.
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
