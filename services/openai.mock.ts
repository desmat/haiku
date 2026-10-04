import { readdir, readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { delay, hashCode } from '@desmat/utils';
import type { PartialImage } from './openai';

// Mocks return exactly the shapes the callers in services/haikus.ts read.
// Prompt-building stays in openai.ts and only the API call is replaced, so
// the mock stays close to the real response.

const backgroundsDir = path.join(process.cwd(), "public", "backgrounds");

// Same subject always gets the same image.
async function pickBackground(subject?: string) {
  const files = (await readdir(backgroundsDir)).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  return files[Math.abs(hashCode(subject || "")) % files.length];
}

const mockPoem = (subject?: string) => [
  "Mock haiku about",
  subject || "nothing at all,",
  "written by no one.",
];

// Real chat calls take ~2s for a poem and ~4s for the layout's image analysis.
const textDelay = () => delay(Number(process.env.AI_MOCK_TEXT_MS || 0));

// Timed like the real API: partials at ~30%, 55% and 80% of the total. Real partials have the
// final composition, softer and washed out.
const mockPartials = [
  { at: 0.3, blur: 2.5, saturation: 0.6, brightness: 1.1 },
  { at: 0.55, blur: 1.2, saturation: 0.8, brightness: 1.05 },
  { at: 0.8, blur: 0.5, saturation: 0.95, brightness: 1 },
];

async function mockPartialImage(image: Buffer, { blur, saturation, brightness }: { blur: number, saturation: number, brightness: number }) {
  return sharp(image).resize(512, 512).blur(blur).modulate({ saturation, brightness }).png().toBuffer();
}

export async function mockGenerateBackgroundImage({ prompt, artStyle, subject, onPartialImage, partialImages }: {
  prompt: string,
  artStyle?: string,
  subject?: string,
  onPartialImage?: (partial: PartialImage) => Promise<void>,
  partialImages: number,
}) {
  const file = await pickBackground(subject);
  const image = await readFile(path.join(backgroundsDir, file));
  const durationMs = Number(process.env.AI_MOCK_IMAGE_MS || 0);
  const start = Date.now();
  const waitUntil = (fraction: number) => delay(Math.max(0, start + durationMs * fraction - Date.now()));

  if (onPartialImage) {
    for (let index = 0; index < Math.min(partialImages, mockPartials.length); index++) {
      await waitUntil(mockPartials[index].at);
      await onPartialImage({ index, b64_json: (await mockPartialImage(image, mockPartials[index])).toString("base64") });
    }
  }
  await waitUntil(1);
  const b64_json = image.toString("base64");

  return {
    artStyle,
    prompt,
    model: "mock",
    data: { b64_json, revised_prompt: prompt },
  };
}

export async function mockGenerateHaiku({ prompt, subject, mood }: { prompt: string, subject?: string, mood?: string }) {
  await textDelay();
  return {
    prompt,
    model: "mock",
    response: {
      haiku: mockPoem(subject),
      subject: subject || "mock subject",
      mood: mood || "mock mood",
      title: "Mock Haiku",
      lang: "en",
    },
  };
}

export async function mockCompleteHaiku({ prompt, poem, subject, mood }: { prompt: string, poem: string[], subject?: string, mood?: string }) {
  await textDelay();
  return {
    prompt,
    model: "mock",
    response: {
      haiku: poem.map((line: string) => !line || line.includes("...") ? line.replaceAll("...", "_") : line),
      subject: subject || "mock subject",
      mood: mood || "mock mood",
      title: "Mock Haiku",
      lang: "en",
    },
  };
}

export async function mockAnalyzeHaiku({ prompt, poem }: { prompt: string, poem: string[] }) {
  await textDelay();
  return {
    prompt,
    model: "mock",
    response: {
      haiku: poem,
      subject: "mock subject",
      mood: "mock mood",
      title: "Mock Haiku",
      lang: "en",
    },
  };
}

export async function mockAnalyzeImage({ prompt }: { prompt: string }) {
  await textDelay();
  return {
    prompt,
    model: "mock",
    response: {
      pointOfInterest: null,
      personOrAnimalOfInterest: null,
      negativeSpace: null,
      alignment: "center",
    },
  };
}
