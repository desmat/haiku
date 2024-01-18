import { User } from 'firebase/auth';
import moment from 'moment';
import { put } from '@vercel/blob';
import { Haiku } from "@/types/Haiku";
import { Store } from "@/types/Store";
import { listToMap, mapToList, uuid } from '@/utils/misc';
import * as samples from '@/services/stores/samples';
import * as openai from './openai';
import { create } from 'domain';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s })
    store = new s.create();
  });

export async function getHaikus(query?: any): Promise<Haiku[]> {
  let haikus = await store.haikus.find(query);
  if (!haikus?.length && (!query || JSON.stringify(query) == "{}")) {
    // empty db, populate with samples
    haikus = await Promise.all(
      mapToList(samples.haikus)
        .map((h: Haiku) => store.haikus.create("(system)", h)));
  }

  return new Promise((resolve, reject) => resolve(haikus.filter(Boolean)));
}

export async function getHaiku(id: string): Promise<Haiku | undefined> {
  console.log(`>> services.haiku.getHaiku`, { id });

  const haiku = await store.haikus.get(id);
  console.log(`>> services.haiku.getHaiku`, { id, haiku });
  return new Promise((resolve, reject) => resolve(haiku));
}

export async function createHaiku(user: User): Promise<Haiku> {
  console.log(">> services.haiku.createHaiku", { user });

  let haiku = {
    id: uuid(),
    createdBy: user.uid,
    createdAt: moment().valueOf(),
    status: "created",
  } as Haiku;

  return store.haikus.create(user.uid, haiku);
}

export async function generateHaiku(user: any, subject?: string): Promise<Haiku> {
  console.log(">> services.haiku.generateHaiku", { subject, user });


  const { response: { haiku: poem, subject: generatedSubject } } = await openai.generateHaiku(subject);
  // console.log(">> services.haiku.generateHaiku", { ret });
  console.log(">> services.haiku.generateHaiku", { poem, generatedSubject });

  const { url: openaiUrl } = await openai.generateBackgroundImage(generatedSubject);

  const imageRet = await fetch(openaiUrl);
  // console.log(">> services.haiku.generateHaiku", { imageRet });

  const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
  console.log(">> services.haiku.generateHaiku", { imageBuffer });

  const getColors = require('get-image-colors')

  const colors = await getColors(imageBuffer, 'image/png');
  console.log(">> services.haiku.generateHaiku", { colors });

  // const blob = await put(`${uuid()}.png`, imageBuffer, {
  //   access: 'public',
  // });
  // console.log(">> services.haiku.generateHaiku", { blob });

  let haiku = {
    id: uuid(),
    createdBy: user.uid,
    createdAt: moment().valueOf(),
    status: "created",
    theme: generatedSubject,
    bgImage: openaiUrl, //blob.url,  // TODO revert
    // color: `rgb(${colors[0].rgb().join(",")})`,
    // bgColor: `rgb(${colors[1].rgb().join(",")})`,
    colorPalette: colors.map((c: any) => c.hex()),
    poem,
  } as Haiku;

  return store.haikus.create(user.uid, haiku);
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
