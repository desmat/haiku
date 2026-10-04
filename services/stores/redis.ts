import RedisStore from "@desmat/redis-store";
import { HaikuAlbum } from "@/types/Album";
import { DailyHaiku, FlaggedHaiku, Haiku, LikedHaiku, UserHaiku } from "@/types/Haiku";
import { DailyHaikudle, Haikudle, UserHaikudle } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { FlaggedUser, User } from "@/types/User";
import { storeConfigs } from "./config";

export function createStore({
  debug
}: {
  debug?: boolean
}) {
  debug && console.log(`services.stores.redis.create`);

  return {
    haikus: new RedisStore<Haiku>({ ...storeConfigs.haikus, debug }),
    dailyHaikus: new RedisStore<DailyHaiku>({ ...storeConfigs.dailyHaikus, debug }),
    haikuAlbums: new RedisStore<HaikuAlbum>({ ...storeConfigs.haikuAlbums, debug }),
    haikudles: new RedisStore<Haikudle>({ ...storeConfigs.haikudles, debug }),
    dailyHaikudles: new RedisStore<DailyHaikudle>({ ...storeConfigs.dailyHaikudles, debug }),
    userHaikudles: new RedisStore<UserHaikudle>({ ...storeConfigs.userHaikudles, debug }),
    userHaikus: new RedisStore<UserHaiku>({ ...storeConfigs.userHaikus, debug }),
    likedHaikus: new RedisStore<LikedHaiku>({ ...storeConfigs.likedHaikus, debug }),
    flaggedHaikus: new RedisStore<FlaggedHaiku>({ ...storeConfigs.flaggedHaikus, debug }),
    userUsage: new RedisStore<UserUsage>({ ...storeConfigs.userUsage, debug }),
    user: new RedisStore<User>({ ...storeConfigs.user, debug }),
    flaggedUsers: new RedisStore<FlaggedUser>({ ...storeConfigs.flaggedUsers, debug }),
  }
}
