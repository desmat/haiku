import moment from 'moment';
import { User } from '@/types/User';
import { Haiku } from '@/types/Haiku';
import { getHaikus } from '@/services/haikus';
import { Store } from '@/types/Store';

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.haikus.init", { s });
    store = new s.create();
  });

export async function userUsage(user: User) {
  console.log('>> app.services.users.userUsage', { user });

  const dateCode = moment().format("YYYYMMDD");
  const {
    haikusCreated,
    haikusRegenerated
   } = (await store.users.get(user.id))?.usage[dateCode] || {};

  return {
    haikusCreated: haikusCreated || 0,
    haikusRegenerated: haikusRegenerated || 0,
  };
}

export async function incUserUsage(user: User, resource: string) {
  store.users.get(user.id).then((u: User | undefined) => {
    const datecode = moment().format("YYYYMMDD");
    const updatedUser = {
      ...(u || user),
      usage: {
        [datecode]: {
          ...u?.usage[datecode],
          [resource]: (u?.usage[datecode][resource] || 0) + 1,
        }
      }
    }

    if (!u) {
      return store.users.create(user.id, updatedUser);
    }

    return store.users.update(user.id, updatedUser);
  });  
}