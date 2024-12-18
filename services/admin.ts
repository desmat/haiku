import { formatBytes } from '@desmat/utils/format';
import moment from 'moment';
// import fetch from 'node-fetch';
import { User } from '@/types/User';
import { put } from '@vercel/blob';
import { createStore } from './stores/redis';

export const maxDuration = 300;

const store = createStore({
  // debug: true,
});

export async function backup(user: User, entities?: string[], haikuIds?: string[] | null) {
  console.log('app.services.admin.backup', { user, entities, haikuIds });

  const keys = Object.keys(store)
    .filter((key: string) => {
      return entities?.length
        ? entities.includes(key)
        : haikuIds?.length
          ? key == "haikus"
          : true
    });

  if (!keys) throw 'No entities to backup';

  // TODO maybe do in chucks
  const values = await Promise.all(
    // @ts-ignore
    keys.map((key: string) => store[key].find(haikuIds?.length ? { id: haikuIds } : undefined))
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
                // console.log('app.services.admin.backup', { previousVersionIds });

                const previousValues = previousVersionIds?.length > 0
                  // @ts-ignore
                  ? await store[k].find({ id: previousVersionIds })
                  : [];
                // console.log('app.services.admin.backup', { previousValues });

                return [currentValue, ...previousValues];
              })
          );

          // console.log('app.services.admin.backup', { k, v: versionedValues[i] });
          return [k, versionedValues.flat()]
        })
    )
  );

  console.log('app.services.admin.backup', { keyValues });
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
  console.log('app.services.admin.restore', { user, url });

  const res = await fetch(url);
  // console.log('app.services.admin.restore', { res });

  if (res.status != 200) {
    console.error(`Error fetching '${url}': ${res.statusText} (${res.status})`)
  }

  const data = await res.json();
  console.log('app.services.admin.restore', { data });

  const result = {} as any;
  await Promise.all(
    Object.entries(data).map(async ([key, values]: any) => {
      // console.log('app.services.admin.restore', { key, values });
      if (!Array.isArray(values)) {
        console.warn('>> app.services.admin.restore UNEXPECTED VALUES TYPE', { key, values });
        return;
      }

      // const options = key == "userHaikus" ? UserHaikuSaveOptions : {};
      return await Promise.all(
        values.map(async (value: any) => {
          // @ts-ignore
          const record = await store[key].get(value.id);
          const options = value.deprecated || value.deprecatedAt
            ? {
              noIndex: true,
              noLookup: true,
            }
            : {};

          if (record) {
            // for now don't restore if already exists
            result[`${key}_skipped`] = (result[`${key}_skipped`] || 0) + 1;

            // @ts-ignore
            // await store[key].update(value, options);
            // result[`${key}_updated`] = (result[`${key}_updated`] || 0) + 1;
          } else {
            // @ts-ignore
            await store[key].create(value, options);
            result[`${key}_created`] = (result[`${key}_created`] || 0) + 1;
          }
        })
      );
    })
  );

  console.log('app.services.admin.restore >>>RESULTS<<<', { result });

  return result;
}
