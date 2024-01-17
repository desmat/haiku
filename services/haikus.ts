import { User } from 'firebase/auth';
import moment from 'moment';
import { Haiku } from "@/types/Haiku";
import { Store } from "@/types/Store";
import { uuid } from '@/utils/misc';
import * as openai from './openai';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s })
    store = new s.create();
  });

export async function getHaikus(query?: any): Promise<Haiku[]> {
  const haikus = await store.haikus.find(query);
  return new Promise((resolve, reject) => resolve(haikus.filter(Boolean)));
}

export async function getHaiku(id: string): Promise<Haiku | undefined> {
  console.log(`>> services.haiku.getHaiku`, { id });

  const haiku = await store.haikus.get(id);
  console.log(`>> services.haiku.getHaiku`, { id, haiku });
  return new Promise((resolve, reject) => resolve(haiku));
}

export async function createHaiku(user: User, name: string): Promise<Haiku> {
  console.log(">> services.haiku.createHaiku", { name, user });

  let haiku = {
    id: uuid(),
    createdBy: user.uid,
    createdAt: moment().valueOf(),
    status: "created",
    name,
  } as Haiku;

  return store.haikus.create(user.uid, haiku);
}

export async function generateHaiku(user: User, subject?: string): Promise<Haiku> {
  console.log(">> services.haiku.generateHaiku", { subject, user });

  
  const { response: { haiku: poem, subject: generatedSubject } } = await openai.generateHaiku(subject);
  // console.log(">> services.haiku.generateHaiku", { ret });
  console.log(">> services.haiku.generateHaiku", { poem, generatedSubject });

  const { url } = await openai.generateBackgroundImage(generatedSubject);

  // TODO upload image to storage

  let haiku = {
    id: uuid(),
    createdBy: user.uid,
    createdAt: moment().valueOf(),
    status: "created",
    theme: generatedSubject,
    bgImage: url, // bgImage: "/backgrounds/DALL·E 2024-01-17 11.32.41 - An extremely muted, almost monochromatic painting in the Japanese style, depicting the concept of emptiness. The artwork captures a minimalist landsca.png",
    // color: "rgb(43, 44, 41))",
    // bgColor: "rgb(174, 177, 164)",
    poem,      
  } as Haiku;

  return store.haikus.create(user.uid, haiku);

//   haiku = {
//     status: "generating",
//     createdAt: haiku.createdAt,
//     createdBy: haiku.createdBy,
//     updatedAt: moment().valueOf(),
//     updatedBy: user.uid,
//   };
//   store.haikus.update(user.uid, haiku);

//   const res = await openai.generateHaiku(haiku.name);
//   const generatedHaiku = parseGeneratedHaiku(res);
//   console.log(">> services.haiku.createHaiku (fixed instructions)", { generatedHaiku });

//   haiku = {
//     ...haiku,
//     ...generatedHaiku,
//     name: haiku.name,
//     status: "created",
//     updatedAt: moment().valueOf(),
//     updatedBy: user.uid,
//   };

//   return store.haikus.update(user.uid, haiku);
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

  if (!(haiku.createdBy == user.uid || user.customClaims?.admin)) {
    throw `Unauthorized`;
  }

  return store.haikus.delete(user.uid, id);
}

export async function saveHaiku(user: any, haiku: Haiku): Promise<Haiku> {
  console.log(">> services.haiku.deleteHaiku", { haiku, user });

  if (!(haiku.createdBy == user.uid || user.customClaims?.admin)) {
    throw `Unauthorized`;
  }

  return store.haikus.update(user.uid, haiku);
}
