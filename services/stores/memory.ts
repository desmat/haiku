
import { mapToList } from "@/utils/misc";
import { DailyHaiku, Haiku, UserHaiku } from "@/types/Haiku";
import { GenericStore, Store } from "@/types/Store";
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { User } from "@/types/User";

type MenoryStoreEntry = {
  id?: string,
  name?: string,
  createdBy?: string,
  createdAt?: number,
  updatedAt?: number,
  updatedBy?: string,
  deletedAt?: number,
  deletedBy?: string,
}

class MemoryStore<T extends MenoryStoreEntry> implements GenericStore<T> {
  key: string;
  valueKey: (id: string) => string;
  listKey: () => string;

  store = {};

  constructor(key: string, listKey?: string) {
    this.key = key;
    this.valueKey = (id: string) => `${key}:${id}`;
    this.listKey = () => `${listKey || key + "s"}`;
  }

  async get(id: string): Promise<T | undefined> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.get`, { id });

    // @ts-ignore
    return this.store[id];

    // const response = await kv.json.get(this.valueKey(id), "$");

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.get`, { response });

    // let value: T | undefined;
    // if (response) {
    //   value = response[0] as T;
    // }

    // return value;
  }

  async find(query?: any): Promise<T[]> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.find`, { query });

    return mapToList(this.store)
      .filter((h) => Object.entries(query)
        .reduce((a, [k, v]) => a && h[k] == v, true));
  }

  async create(userId: string, value: T): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.create`, { userId, value });

    // @ts-ignore
    this.store[value.id] = value;

    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.create`, { value, store: this.store });

    return value;

    // if (!value.id) {
    //   throw `Cannot save add with null id`;
    // }

    // const createdListValue = {
    //   id: value.id || uuid(),
    //   createdAt: moment().valueOf(),
    //   createdBy: userId,
    //   name: value.name,
    // };

    // const createdValue = {
    //   ...value,
    //   ...createdListValue,
    // };

    // await checkKey(this.listKey());
    // const responses = await Promise.all([
    //   kv.json.arrappend(this.listKey(), "$", createdListValue),
    //   kv.json.set(this.valueKey(value.id), "$", createdValue),
    // ]);

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.create`, { responses });

    // return new Promise((resolve) => resolve(value));
  }

  async update(userId: string, value: T): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.update`, { value });

    throw "Not implemented";

    // if (!value.id) {
    //   throw `Cannot update ${this.key}: null id`;
    // }

    // if (!this.get(value.id)) {
    //   throw `Cannot update ${this.key}: does not exist: ${value.id}`;
    // }

    // const updatedValue = { ...value, updatedAt: moment().valueOf(), updatedBy: userId }
    // const response = await Promise.all([
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", value.id)}.updatedAt`, updatedValue.updatedAt),
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", value.id)}.updatedBy`, `"${updatedValue.updatedBy}"`),
    //   kv.json.set(this.valueKey(value.id), "$", updatedValue),
    // ]);

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.update`, { response });

    // return new Promise((resolve) => resolve(updatedValue));
  }

  async delete(userId: string, id: string, options: any = {}): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.delete`, { id, options });

    throw "Not implemented";

    // if (!id) {
    //   throw `Cannot delete ${this.key}: null id`;
    // }

    // const value = await this.get(id)
    // if (!value) {
    //   throw `Cannot update ${this.key}: does not exist: ${id}`;
    // }

    // value.deletedAt = moment().valueOf();
    // const response = await Promise.all([
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", id)}.deletedAt`, value.deletedAt),
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", id)}.deletedBy`, `"${userId}"`),
    //   kv.json.del(this.valueKey(id), "$")
    // ]);

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.delete`, { response });

    // return new Promise((resolve) => resolve(value));
  }
}

export function create(): Store {
  return {
    haikus: new MemoryStore<Haiku>("haiku"),
    dailyHaikus: new MemoryStore<DailyHaiku>("dailyhaiku"),
    haikudles: new MemoryStore<Haikudle>("haikudle"),
    dailyHaikudles: new MemoryStore<DailyHaikudle>("dailyhaikudle"),
    userHaikudles: new MemoryStore<UserHaikudle>("userhaikudle"),
    userHaikus: new MemoryStore<UserHaiku>("userhaiku"),
    userUsage: new MemoryStore<UserUsage>("userusage"),
    user: new MemoryStore<User>("user"),
  }
}
