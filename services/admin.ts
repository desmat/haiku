import moment from 'moment';
import { User } from '@/types/User';
import { Store } from '@/types/Store';
import { put } from '@vercel/blob';
import { formatBytes } from '@/utils/format';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s });
    store = new s.create();
  });

export async function backup(user: User) {
  console.log('>> app.services.admin.backup', { user });

  const keys = Object.keys(store);
  const values = await Promise.all(
    Object.values(store)
      .map((v: any) => v.find())
  );

  const str = JSON.stringify(
    Object.fromEntries(
      keys.map((k: string, i: number) => [k, values[i]])
    )
  );

  // console.log('>> app.services.admin.backup', { str });

  const p = require('/package.json');
  const filename = `backups/${p.name}_${p.version}_${moment().format("YYYYMMDD_kkmmss")}.json`;
  const buffer = Buffer.from(str, 'utf8');
  const blob = await put(filename, buffer, {
    access: 'public',
    addRandomSuffix: false,
  });

  return { filename, size: formatBytes(Buffer.byteLength(buffer)) };
}
