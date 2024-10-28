
import { mapToList } from "@desmat/utils";
import { DailyHaiku, FlaggedHaiku, Haiku, LikedHaiku, UserHaiku } from "@/types/Haiku";
import { HaikuAlbum } from "@/types/Album";
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { GenericStore, Store } from "@/types/Store";
import { UserUsage } from "@/types/Usage";
import { FlaggedUser, User } from "@/types/User";

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
  }

  async ids(query?: any): Promise<Set<any>> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.ids`, { query });

    return new Set(Object.keys(this.store));
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
  }

  async update(userId: string, value: T): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.update`, { value });
    
    throw "Not implemented";
  }

  async delete(userId: string, id: string, options: any = {}): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.delete`, { id, options });
    
    throw "Not implemented";
  }
}

export function create(): Store {
  return {
    haikus: new MemoryStore<Haiku>("haiku"),
    dailyHaikus: new MemoryStore<DailyHaiku>("dailyhaiku"),
    haikuAlbums: new MemoryStore<HaikuAlbum>("haikualbum"),
    haikudles: new MemoryStore<Haikudle>("haikudle"),
    dailyHaikudles: new MemoryStore<DailyHaikudle>("dailyhaikudle"),
    userHaikudles: new MemoryStore<UserHaikudle>("userhaikudle"),
    userHaikus: new MemoryStore<UserHaiku>("userhaiku"),
    likedHaikus: new MemoryStore<LikedHaiku>("likedhaiku"),
    flaggedHaikus: new MemoryStore<FlaggedHaiku>("flaggedhaiku"),
    userUsage: new MemoryStore<UserUsage>("userusage"),
    user: new MemoryStore<User>("user"),
    flaggedUsers: new MemoryStore<FlaggedUser>("flaggeduser"),
  }
}
