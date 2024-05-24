import moment from 'moment';
// import fetch from 'node-fetch';
import { User } from '@/types/User';
import { Store } from '@/types/Store';
import { put } from '@vercel/blob';
import { formatBytes } from '@/utils/format';
import { UserHaikuSaveOptions } from '@/types/Haiku';

export const maxDuration = 300;

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services[key].init", { s });
    store = new s.create();
  });

export async function backup(user: User) {
  console.log('>> app.services.admin.backup', { user });

  const keys = Object.keys(store)
    // .filter((key: string) => key == "haikus"); //testing
  const values = await Promise.all(
    Object.values(store)
      .map((v: any) => v.find())
  );

  // @ts-ignore
  const keyValues = Object.fromEntries(
    await Promise.all(
      keys
        .map(async (k: string, i: number) => {
          const versionedValues = await Promise.all(
            values[i]
              // .filter((v: any) => v.id == "fab762bf") // just the one for testing
              // .filter((v: any) => v.id == "c43aa3c6") // just the one for testing            
              .map(async (currentValue: any) => {

                const previousVersionIds = Array.from(Array(currentValue.version || 0).keys())
                  .map((version: number) => `${currentValue.id}:${version}`);
                // console.log('>> app.services.admin.backup', { previousVersionIds });

                const previousValues = previousVersionIds?.length > 0
                  // @ts-ignore
                  ? await store[k].find({ id: previousVersionIds })
                  : [];
                // console.log('>> app.services.admin.backup', { previousValues });

                return [currentValue, ...previousValues];
              })
          );

          // console.log('>> app.services.admin.backup', { k, v: versionedValues[i] });
          return [k, versionedValues.flat()]
        })
    )
  );

  console.log('>> app.services.admin.backup', { keyValues });
// return keyValues;

  const p = require('/package.json');
  const filename = `backups/${p.name}_${p.version}_${moment().format("YYYYMMDD_kkmmss")}.json`;
  const buffer = Buffer.from(JSON.stringify(keyValues), 'utf8');
  const blob = await put(filename, buffer, {
    access: 'public',
    addRandomSuffix: false,
  });

  return { filename: blob.pathname, size: formatBytes(Buffer.byteLength(buffer)), url: blob.url };
}


export async function restore(user: User, url: string) {
  console.log('>> app.services.admin.restore', { user, url });

  const res = await fetch(url);
  // console.log('>> app.services.admin.restore', { res });

  if (res.status != 200) {
    console.error(`Error fetching '${url}': ${res.statusText} (${res.status})`)
  }

  const data = await res.json();
  console.log('>> app.services.admin.restore', { data });

  const result = {} as any;
  await Promise.all(
    Object.entries(data).map(async ([key, values]: any) => {
      // console.log('>> app.services.admin.restore', { key, values });
      if (!Array.isArray(values)) {
        console.warn('>> app.services.admin.restore UNEXPECTED VALUES TYPE', { key, values });
        return;
      }

      const options = key == "userHaikus" ? UserHaikuSaveOptions : {};
      return await Promise.all(
        values.map(async (value: any) => {
          // @ts-ignore
          const record = await store[key].get(value.id);
          if (record) {
            // for now don't restore if already exists
            result[`${key}_skipped`] = (result[`${key}_skipped`] || 0) + 1;

            // @ts-ignore
            // await store[key].update("(system)", value, options);
            // result[`${key}_updated`] = (result[`${key}_updated`] || 0) + 1;
          } else {
            // @ts-ignore
            await store[key].create("", value, options);
            result[`${key}_created`] = (result[`${key}_created`] || 0) + 1;
          }
        })
      );
    })
  );

  console.log('>> app.services.admin.restore >>>RESULTS<<<', { result });

  return result;
}
