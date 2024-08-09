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
import { DailyHaiku, DailyHaikuSaveOptions, FlaggedHaiku, FlaggedHaikuSaveOptions, Haiku, HaikuSaveOptions, LikedHaiku, LikedHaikuSaveOptions, UserHaiku, UserHaikuSaveOptions } from "@/types/Haiku";
import { HaikuAlbum } from "@/types/Album";
import { DailyHaikudle, DailyHaikudleSaveOptions, Haikudle, HaikudleSaveOptions, UserHaikudle, UserHaikudleSaveOptions } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { User } from "@/types/User";

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
  setKey: string;
  valueKey: (id: string) => string;
  saveOptions: any;

  constructor(key: string, setKey?: string, saveOptions?: any) {
    this.key = key;
    this.setKey = setKey || key + "s";
    this.valueKey = (id: string) => `${key}:${id}`;
    this.saveOptions = saveOptions;
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

    const queryEntries = query && Object.entries(query);

    if (queryEntries?.length > 1) {
      throw `redis.find(query) only supports a single query entry pair`;
    }

    let keys: string[] | undefined;
    const queryEntry = queryEntries && queryEntries[0];
    const [queryKey, queryVal] = queryEntry || [];

    if (queryKey == "id" && Array.isArray(queryVal)) {
      // console.log(`>> services.stores.redis.RedisStore<${this.key}>.find special case: query is for IDs`, { ids: queryVal });
      keys = queryVal
        .map((id: string) => id && this.valueKey(id))
        .filter(Boolean);
    } else {
      if (queryKey) {
        /* NOT SUPPORTED FOR NOW
        if (queryVal == "*") {
          // lookup keys via the foos:bars lookup set
          keys = (await kv.zrange(`${this.setKey}:${queryKey}s`, 0, -1))
            // @ts-ignore
            .map((key: string) => `${this.key}:${key}`);
        } else */ if (queryVal) {
          // lookup keys via the foos:bar:123 lookup set
          keys = (await kv.zrange(`${this.setKey}:${queryKey}:${queryVal}`, 0, -1))
            // @ts-ignore
            .map((key: string) => `${this.key}:${key}`);
        } else {
          throw `redis.find(query) query must have key and value`;
        }

        console.log(`>> services.stores.redis.RedisStore<${this.key}>.find queried lookup key`, { query, keys });
      } else {
        // get all keys via the index set
        keys = (await kv.zrange(`${this.setKey}`, 0, -1))
          // @ts-ignore
          .map((key: string) => `${this.key}:${key}`)
      }
    }

    console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { keys });

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
        .filter((value: any) => value && !value.deletedAt)
      : [];

    console.log(`>> services.stores.redis.RedisStore<${this.key}>.find`, { values });

    return values as T[];
  }

  async create(userId: string, value: T, options?: any): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { userId, value, options, saveOptions: this.saveOptions });

    const now = moment().valueOf();
    options = { ...this.saveOptions, ...options };
    
    const createdValue = {
      id: value.id || uuid(),
      createdAt: value.createdAt || now,
      createdBy: value.createdBy || userId,
      ...value,
    }

    /* 
      create index and lookup sets based on options.lookups

      given a likedhaiku record: 
      {
        id: 123:456,
        userId: 123,
        haikuId 456,
      }

      and lookups: 
      { 
        user: { userId: "haikuId"},
        haiku: { haikuId: "userId" }
      }
  
      we want indexes:

      likedhaiku:123:456 -> value (JSON, the rest are sorted sets)
      likedhaikus -> all likedhaiku id's (ie 123:456, etc)
      // NOT SUPPORTED FOR NOW // likedhaikus:users -> all user ids (ie 123, etc) NOTE: this should be a sorted set of user ids with its score as number of haikus liked
      likedhaikus:user:123 -> all likedhaiku id's for the given user (ie 123:456, etc)
      // NOT SUPPORTED FOR NOW // likedhaikus:haikus ->  NOTE: this should be a sorted set of haiku ids with its score as number of users who liked it
      likedhaikus:haiku:456 -> all likedhaiku id's for the given haiku (ie 123:456, etc)

    */


    const lookupKeys = Object
      .entries(options?.lookups || {})
      .map((entry) => {
        const id = createdValue.id;
        const lookupName = entry[0];
        const lookupKey = entry[1];
        // TODO validate and log errors
        // @ts-ignore
        const lookupId = createdValue[lookupKey];

        return [
          // foos -> 123:456
          [`${this.setKey}`, id],
          // foos:bar:123 -> 123:456
          [`${this.setKey}:${lookupName}:${lookupId}`, id],
        ]
      })
      .flat();

    console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { lookupKeys });

    const responses = await Promise.all([
      kv.json.set(this.valueKey(createdValue.id), "$", createdValue),
      (options.expire ? kv.expire(this.valueKey(createdValue.id), options.expire) : undefined),
      kv.zadd(this.setKey, { score: createdValue.createdAt, member: createdValue.id }),
      ...lookupKeys.map((lookupKey: any) => kv.zadd(lookupKey[0], { score: now, member: lookupKey[1] }))
    ]);

    console.log(`>> services.stores.redis.RedisStore<${this.key}>.create`, { responses });

    return new Promise((resolve) => resolve(createdValue));
  }

  async update(userId: string, value: T, options?: any): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { value, options });

    if (!value.id) {
      throw `Cannot update ${this.key}: null id`;
    }

    if (!this.get(value.id)) {
      throw `Cannot update ${this.key}: does not exist: ${value.id}`;
    }

    const now = moment().valueOf();
    options = { ...this.saveOptions, ...options }

    const updatedValue = {
      ...value,
      updatedAt: now,
      updatedBy: userId
    };

    const response = await Promise.all([
      kv.json.set(this.valueKey(value.id), "$", updatedValue),
      (options.expire ? kv.expire(this.valueKey(value.id), options.expire) : undefined),
    ]);

    console.log(`>> services.stores.redis.RedisStore<${this.key}>.update`, { response });

    return new Promise((resolve) => resolve(updatedValue));
  }

  async delete(userId: string, id: string, options: any = {}): Promise<T> {
    console.log(`>> services.stores.redis.RedisStore<${this.key}>.delete`, { id, options });

    if (!id) {
      throw `Cannot delete ${this.key}: null id`;
    }

    options = { ...this.saveOptions, ...options };
    const value = await this.get(id)
    if (!value) {
      throw `Cannot update ${this.key}: does not exist: ${id}`;
    }

    value.deletedAt = moment().valueOf();
    const response = await Promise.all([
      // TODO remove lookup keys if hardDelete?
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
    haikus: new RedisStore<Haiku>("haiku", undefined, HaikuSaveOptions),
    dailyHaikus: new RedisStore<DailyHaiku>("dailyhaiku", undefined, DailyHaikuSaveOptions),
    haikuAlbums: new RedisStore<HaikuAlbum>("haikualbum"),
    haikudles: new RedisStore<Haikudle>("haikudle", undefined, HaikudleSaveOptions),
    dailyHaikudles: new RedisStore<DailyHaikudle>("dailyhaikudle", undefined, DailyHaikudleSaveOptions),
    userHaikudles: new RedisStore<UserHaikudle>("userhaikudle", undefined, UserHaikudleSaveOptions),
    userHaikus: new RedisStore<UserHaiku>("userhaiku", undefined, UserHaikuSaveOptions),
    likedHaikus: new RedisStore<LikedHaiku>("likedhaiku", undefined, LikedHaikuSaveOptions),
    flaggedHaikus: new RedisStore<FlaggedHaiku>("flaggedhaiku", undefined, FlaggedHaikuSaveOptions),
    userUsage: new RedisStore<UserUsage>("haikuuserusage"),
    user: new RedisStore<User>("haikuuser"),
  }
}
