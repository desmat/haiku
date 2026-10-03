import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { hashCode } from '@desmat/utils';

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

export async function mockGenerateBackgroundImage({ prompt, artStyle, subject }: {
  prompt: string,
  artStyle?: string,
  subject?: string,
}) {
  const file = await pickBackground(subject);
  const b64_json = (await readFile(path.join(backgroundsDir, file))).toString("base64");

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
