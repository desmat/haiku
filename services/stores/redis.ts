/*
    Some useful commands

    keys *
    scan 0 match thing:*
    del thing1 thing2 etc
    json.get things $
    json.get things '$[?((@.deletedAt > 0) == false)]'
    json.get things '$[?((@.deletedAt > 0) == true)]'
    json.get things '$[?(@.createdBy == "UID")]'
    json.get things '$[?(@.content ~= "(?i)lorem")]'
    json.get things '$[?(@.id ~= "(ID1)|(ID2)")]
    json.set thing:UUID '$.foos[5].bar' '{"car": 42}'
    json.set thing:UUID '$.foos[1].bar.car' '42'
*/

import moment from "moment";
import { kv } from "@vercel/kv";
import { uuid } from "@/utils/misc";
import { GenericStore, Store } from "@/types/Store";
import { Haiku, UserHaiku } from "@/types/Haiku";
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";

const jsonNotDeletedExpression = "(@.deletedAt > 0) == false";
const jsonEqualsExpression = (key: string, val: string) => {
  return `@.${key} == ${typeof (val) == "number" ? val : `"${val}"`}`;
}
const jsonMatchExpression = (key: string, vals: string | string[]) => {
  const regex = Array.isArray(vals)
    ? vals.map((val: string) => `(${val})`).join("|")
    : `(${vals})`;
  return `@.${key} ~= "${regex}"`;
}

const jsonGetNotDeleted = `$[?(${jsonNotDeletedExpression})]`;
const jsonGetBy = (key: string, val: string, deleted?: boolean) => {
  const deletedExpression = deleted === false
    ? ` && (${jsonNotDeletedExpression})`
    : deleted === true ?
      ` && ((${jsonNotDeletedExpression}) == false)`
      : ""
  return `$[?(true && (${jsonEqualsExpression(key, val)})${deletedExpression})]`;
}
const jsonFindBy = (key: string, vals: string | string[], deleted?: boolean) => {
  const deletedExpression = deleted === false
    ? ` && (${jsonNotDeletedExpression})`
    : deleted === true ?
      ` && ((${jsonNotDeletedExpression}) == false)`
      : ""
  return `$[?(true && (${jsonMatchExpression(key, vals)})${deletedExpression})]`;
}

async function checkKey(key: string) {
  const response = await kv.json.get(key, "$");

  if (!response || !response.length) {
    console.log('>> services.stores.redis.checkKey(): empty redis key, creating empty list', { key });
    return kv.json.set(key, "$", "[]");
  }
}

type RedisStoreEntry = {
  id?: string,
  name?: string,
  createdBy?: string,
  createdAt?: number,
  updatedAt?: number,
  updatedBy?: string,
  deletedAt?: number,
  deletedBy?: string,
  lang?: string,
}

class RedisStore<T extends RedisStoreEntry> implements GenericStore<T> {
  key: string;
  valueKey: (id: string) => string;
  listKey: () => string;

  constructor(key: string, listKey?: string) {
    this.key = key;
    this.valueKey = (id: string) => `${key}:${id}`;
    this.listKey = () => `${listKey || key + "s"}`;
  }

  async get(id: string): Promise<T | undefined> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.get`, { id });

    const response = await kv.json.get(this.valueKey(id), "$");

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.get`, { response });

    let value: T | undefined;
    if (response && response[0] && !response[0].deletedAt) {
      value = response[0] as T;
    }

    return value;
  }

  async find(query?: any): Promise<T[]> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { query });

    let list;
    const entry = query && Object.entries(query)[0];
    if (entry?.length > 0) {
      list = await kv.json.get(this.listKey(), jsonFindBy(entry[0], `${entry[1]}`, false));
    } else {
      list = await kv.json.get(this.listKey(), jsonGetNotDeleted);
    }
    
    const keys = list && list
      .filter((entry: any) => !entry.deletedAt)
      .map((value: T) => value.id && this.valueKey(value.id))
      .filter(Boolean);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { keys });

    const values = keys && keys.length > 0 && (await kv.json.mget(keys, "$")).filter(Boolean).flat() || [];

    return values as T[];
  }

  async create(userId: string, value: T, options: any = {}): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { userId, value });

    if (!value.id) {
      throw `Cannot save with null id`;
    }

    const createdListValue = {
      id: value.id || uuid(),
      createdAt: moment().valueOf(),
      createdBy: userId,
      name: value.name,
      lang: value.lang,
    };

    const createdValue = {
      ...value,
      ...createdListValue,
    };

    await checkKey(this.listKey());
    const responses = await Promise.all([
      kv.json.arrappend(this.listKey(), "$", createdListValue),
      kv.json.set(this.valueKey(value.id), "$", createdValue),
      (options.expire ? kv.expire(this.valueKey(value.id), options.expire) : undefined),
    ]);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { responses });

    return new Promise((resolve) => resolve(value));
  }

  async update(userId: string, value: T, options: any = {}): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { value });

    if (!value.id) {
      throw `Cannot update ${this.key}: null id`;
    }

    if (!this.get(value.id)) {
      throw `Cannot update ${this.key}: does not exist: ${value.id}`;
    }

    const updatedValue = { ...value, updatedAt: moment().valueOf(), updatedBy: userId }
    const response = await Promise.all([
      kv.json.set(this.listKey(), `${jsonGetBy("id", value.id)}.updatedAt`, updatedValue.updatedAt),
      kv.json.set(this.listKey(), `${jsonGetBy("id", value.id)}.updatedBy`, `"${updatedValue.updatedBy}"`),
      kv.json.set(this.valueKey(value.id), "$", updatedValue),
      (options.expire ? kv.expire(this.valueKey(value.id), options.expire) : undefined),
    ]);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { response });

    return new Promise((resolve) => resolve(updatedValue));
  }

  async delete(userId: string, id: string): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.delete`, { id });

    if (!id) {
      throw `Cannot delete ${this.key}: null id`;
    }

    const value = await this.get(id)
    if (!value) {
      throw `Cannot update ${this.key}: does not exist: ${id}`;
    }

    value.deletedAt = moment().valueOf();
    const response = await Promise.all([
      kv.json.set(this.listKey(), `${jsonGetBy("id", id)}.deletedAt`, value.deletedAt),
      kv.json.set(this.listKey(), `${jsonGetBy("id", id)}.deletedBy`, `"${userId}"`),
      // kv.json.del(this.valueKey(id), "$")
      kv.json.set(this.valueKey(id), "$", { ...value, deletedAt: moment().valueOf()}),
    ]);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.delete`, { response });

    return new Promise((resolve) => resolve(value));
  }
}

export function create(): Store {
  return {
    haikus: new RedisStore<Haiku>("haiku"),
    haikudles: new RedisStore<Haikudle>("haikudle"),
    dailyHaikudles: new RedisStore<DailyHaikudle>("dailyhaikudle"),
    userHaikudles: new RedisStore<UserHaikudle>("userhaikudle"),
    userHaikus: new RedisStore<UserHaiku>("userhaiku"),
    userUsage: new RedisStore<UserUsage>("userusage"),
  }
}
