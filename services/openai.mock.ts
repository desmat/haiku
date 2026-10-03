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

// Timed like the real API: partials at ~30%, 55% and 80% of the total.
const mockPartials = [
  { at: 0.3, blur: 24 },
  { at: 0.55, blur: 12 },
  { at: 0.8, blur: 4, blankBottom: 0.14 },
];

async function mockPartialImage(image: Buffer, { blur, blankBottom }: { blur: number, blankBottom?: number }) {
  const size = 512;
  const partial = sharp(image).resize(size, size).blur(blur);
  // Like a real partial sent before its bottom rows were rendered.
  const band = blankBottom && Math.round(size * blankBottom);

  return (band
    ? partial.composite([{
      input: { create: { width: size, height: band, channels: 3, background: "#fdfdfd" } },
      top: size - band,
      left: 0,
    }])
    : partial
  ).png().toBuffer();
}

export async function mockGenerateBackgroundImage({ prompt, artStyle, subject, onPartialImage }: {
  prompt: string,
  artStyle?: string,
  subject?: string,
  onPartialImage?: (partial: PartialImage) => Promise<void>,
}) {
  const file = await pickBackground(subject);
  const image = await readFile(path.join(backgroundsDir, file));
  const durationMs = Number(process.env.AI_MOCK_IMAGE_MS || 0);
  const start = Date.now();
  const waitUntil = (fraction: number) => delay(Math.max(0, start + durationMs * fraction - Date.now()));

  if (onPartialImage) {
    for (let index = 0; index < mockPartials.length; index++) {
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
