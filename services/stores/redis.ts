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
    json.get userhaikus '$[?(@.haikuId == "ID" && (@.likedAt > 0) == true)]'
*/

import moment from "moment";
import { kv } from "@vercel/kv";
import { kvArrayToObject, uuid } from "@/utils/misc";
import { GenericStore, Store } from "@/types/Store";
import { DailyHaiku, Haiku, UserHaiku } from "@/types/Haiku";
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { User } from "@/types/User";

const jsonNotDeletedExpression = "(@.deletedAt > 0) == false && (@.deprecatedAt > 0) == false";
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
};

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

    let keys: string[] | undefined;
    const queryEntry = query && Object.entries(query)[0];

    if (query && queryEntry[0] == "id" && Array.isArray(queryEntry[1])) {
      // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find special case: query is for IDs`, { ids: queryEntry[1] });
      keys = queryEntry[1]
        .map((id: string) => id && this.valueKey(id))
        .filter(Boolean);
    } else {
      let list;
      if (queryEntry?.length > 0) {
        const jsonFindByQuery = jsonFindBy(queryEntry[0], `${queryEntry[1]}`, false);
        // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { jsonFindByQuery });
        list = await kv.json.get(this.listKey(), jsonFindByQuery);
      } else {
        list = await kv.json.get(this.listKey(), jsonGetNotDeleted);
      }
      // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { list });

      keys = list && list
        .map((value: T) => value.id && this.valueKey(value.id))
        .filter(Boolean);
    }

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { keys });

    // don't mget too many at once otherwise 💥
    const blockSize = 512;
    const blocks = keys && keys.length && Array
      .apply(null, Array(Math.ceil(keys.length / blockSize)))
      .map((v: any, block: number) => (keys || [])
        .slice(blockSize * block, blockSize * (block + 1)));
    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { blocks });

    const values = blocks && blocks.length > 0
      ? (await Promise.all(
        blocks
          .map(async (keys: string[]) => (await kv.json.mget(keys, "$"))
            .filter(Boolean)
            .flat())))
        .flat()
      : [];

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { values });

    return values as T[];
  }

  async create(userId: string, value: T, options: any = {}): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { userId, value, options });

    if (!value.id) {
      throw `Cannot save with null id`;
    }

    const additionalListValues = kvArrayToObject(
      Object.entries(options?.indices || {})
        // @ts-ignore
        .map(([key, val]: [key: string, val: any]) => [key, value[key]])
    );
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { additionalListValues });

    const createdListValue = {
      id: value.id || uuid(),
      createdAt: value.createdAt || moment().valueOf(),
      createdBy: value.createdBy || userId,
      name: value.name,
      lang: value.lang,
      ...additionalListValues,
    };
    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { createdListValue });

    const createdValue = {
      ...value,
      ...createdListValue,
    };

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { createdValue });

    await checkKey(this.listKey());
    const responses = await Promise.all([
      kv.json.arrappend(this.listKey(), "$", createdListValue),
      kv.json.set(this.valueKey(value.id), "$", createdValue),
      (options.expire ? kv.expire(this.valueKey(value.id), options.expire) : undefined),
    ]);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { responses });

    return new Promise((resolve) => resolve(createdValue));
  }

  async update(userId: string, value: T, options: any = {}): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { value });

    if (!value.id) {
      throw `Cannot update ${this.key}: null id`;
    }

    if (!this.get(value.id)) {
      throw `Cannot update ${this.key}: does not exist: ${value.id}`;
    }

    const listValue = await kv.json.get(this.listKey(), `${jsonGetBy("id", value.id || "")}`);
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { listEntry: listValue });

    if (!listValue?.length) {
      // corner case where somehow the list value was not found
      console.warn(`>> services.stores.redis.RedisStore<${this.key}>.update LIST VALUE NOT FOUND: creating record`);
      await this.create(userId, value, options);
    }

    const updatedValue = {
      ...value,
      updatedAt: moment().valueOf(),
      updatedBy: userId
    };

    // TODO prefer kv.json.mset but not available here; figure out an alternative
    const listKeys = Object
      .entries({
        ...(options?.indices || {}),
        updatedAt: "number",
        updatedBy: "string",
      })
      .map(([key, val]: [key: string, val: any]) => {
        switch (val) {
          case "string":
            // @ts-ignore
            return kv.json.set(this.listKey(), `${jsonGetBy("id", value.id || "")}.${key}`, `"${updatedValue[`${key}`]}"`)
          case "number":
            // @ts-ignore
            return kv.json.set(this.listKey(), `${jsonGetBy("id", value.id || "")}.${key}`, updatedValue[`${key}`] || 0);
          default:
            throw `Unrecongnized index data type: ${val}`
        }
      });

    const response = await Promise.all([
      ...listKeys,
      kv.json.set(this.valueKey(value.id), "$", updatedValue),
      (options.expire ? kv.expire(this.valueKey(value.id), options.expire) : undefined),
    ]);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { response });

    return new Promise((resolve) => resolve(updatedValue));
  }

  async delete(userId: string, id: string, options: any = {}): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.delete`, { id, options });

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
      options.hardDelete 
        ? kv.json.del(this.valueKey(id), "$")
        : kv.json.set(this.valueKey(id), "$", { ...value, deletedAt: moment().valueOf() }),
    ]);

    // console.log(`>> services.stores.redis.RedisStore<${this.key}>.delete`, { response });

    return new Promise((resolve) => resolve(value));
  }
}

export function create(): Store {
  return {
    haikus: new RedisStore<Haiku>("haiku"),
    dailyHaikus: new RedisStore<DailyHaiku>("dailyhaiku"),
    haikudles: new RedisStore<Haikudle>("haikudle"),
    dailyHaikudles: new RedisStore<DailyHaikudle>("dailyhaikudle"),
    userHaikudles: new RedisStore<UserHaikudle>("userhaikudle"),
    userHaikus: new RedisStore<UserHaiku>("userhaiku"),
    userUsage: new RedisStore<UserUsage>("userusage"),
    user: new RedisStore<User>("user"),
  }
}
