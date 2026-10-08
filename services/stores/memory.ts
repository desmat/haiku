import { MemoryStore } from "@desmat/redis-store";
import { HaikuAlbum } from "@/types/Album";
import { DailyHaiku, FlaggedHaiku, Haiku, LikedHaiku, UserHaiku } from "@/types/Haiku";
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { FlaggedUser, User } from "@/types/User";
import { storeConfigs } from "./config";
import { memorySeedAlbums, memorySeedDailyHaikudles, memorySeedHaikus, memorySeedLikedHaikus } from "./samples";

// Daily haiku and today's daily haikudle are created on first read from the seeded haikus.
function buildStore({ debug }: { debug?: boolean }) {
  debug && console.log(`services.stores.memory.create`);

  return {
    haikus: new MemoryStore<Haiku>({ ...storeConfigs.haikus, debug, seed: memorySeedHaikus() }),
    dailyHaikus: new MemoryStore<DailyHaiku>({ ...storeConfigs.dailyHaikus, debug }),
    haikuAlbums: new MemoryStore<HaikuAlbum>({ ...storeConfigs.haikuAlbums, debug, seed: memorySeedAlbums() }),
    haikudles: new MemoryStore<Haikudle>({ ...storeConfigs.haikudles, debug }),
    dailyHaikudles: new MemoryStore<DailyHaikudle>({ ...storeConfigs.dailyHaikudles, debug, seed: memorySeedDailyHaikudles() }),
    userHaikudles: new MemoryStore<UserHaikudle>({ ...storeConfigs.userHaikudles, debug }),
    userHaikus: new MemoryStore<UserHaiku>({ ...storeConfigs.userHaikus, debug }),
    likedHaikus: new MemoryStore<LikedHaiku>({ ...storeConfigs.likedHaikus, debug, seed: memorySeedLikedHaikus() }),
    flaggedHaikus: new MemoryStore<FlaggedHaiku>({ ...storeConfigs.flaggedHaikus, debug }),
    userUsage: new MemoryStore<UserUsage>({ ...storeConfigs.userUsage, debug }),
    user: new MemoryStore<User>({ ...storeConfigs.user, debug }),
    flaggedUsers: new MemoryStore<FlaggedUser>({ ...storeConfigs.flaggedUsers, debug }),
  }
}

// Every service calls createStore() at import time and Next dev duplicates modules per
// route. A module-level singleton would give each service its own disconnected store.
const globalForMemoryStore = globalThis as unknown as { __haikuMemoryStore?: ReturnType<typeof buildStore> };

export function createStore({
  debug
}: {
  debug?: boolean
}) {
  if (!globalForMemoryStore.__haikuMemoryStore) {
    globalForMemoryStore.__haikuMemoryStore = buildStore({ debug });
  }

  return globalForMemoryStore.__haikuMemoryStore;
}
