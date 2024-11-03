import moment from 'moment';
import { User } from '@/types/User';
import { Haiku } from '@/types/Haiku';
import { getHaikus } from '@/services/haikus';
import { createStore } from './stores/redis';

const store = createStore({
  // debug: true,
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
    return store.userUsage.update(updatedUserUsage, { expire });
  } else {
    return store.userUsage.create(updatedUserUsage, { expire });
  }
}