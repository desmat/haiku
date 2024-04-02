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
  console.log('>> app.services.usage.userUsage', { user });

  const dateCode = moment().format("YYYYMMDD");
  const id = `${user.id}:${dateCode}`;
  const userUsage = await store.userUsage.get(id);

  return {
    [dateCode]: userUsage?.usage || {},
  };
}

export async function incUserUsage(user: User, resource: "haikusCreated" | "haikusRegenerated") {
  const expire = 60 * 60 * 24; // 24 hours
  const dateCode = moment().format("YYYYMMDD");
  const id = `${user.id}:${dateCode}`;
  const userUsage = await store.userUsage.get(id);
  const val = userUsage?.usage && userUsage?.usage[resource] || 0;

  const updatedUsage = {
    ...userUsage?.usage,
    [resource]: val + 1,
  }

  const updatedUserUsage = {
    id,
    userId: user.id,
    dateCode,
    ...userUsage,
    usage: updatedUsage,
  }

  // console.log('>> app.services.usage.incUserUsage', { updatedUserUsage });

  if (userUsage) {
    return store.userUsage.update(user.id, updatedUserUsage, { expire });
  } else {
    return store.userUsage.create(user.id, updatedUserUsage, { expire });
  }
}