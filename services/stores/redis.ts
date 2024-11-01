import RedisStore from "@desmat/redis-store";
import { HaikuAlbum } from "@/types/Album";
import { DailyHaiku, DailyHaikuOptions, FlaggedHaiku, FlaggedHaikuOptions, Haiku, HaikuOptions, LikedHaiku, LikedHaikuOptions, UserHaiku, UserHaikuOptions } from "@/types/Haiku";
import { DailyHaikudle, DailyHaikudleOptions, Haikudle, HaikudleOptions, UserHaikudle, UserHaikudleOptions } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { FlaggedUser, FlaggedUserOptions, User, UserOptions } from "@/types/User";

export function createStore({
  debug
}: {
  debug?: boolean
}) {
  debug && console.log(`services.stores.redis.create`);

  return {
    haikus: new RedisStore<Haiku>({ key: "haiku", options: HaikuOptions, debug }),
    dailyHaikus: new RedisStore<DailyHaiku>({ key: "dailyhaiku", options: DailyHaikuOptions, debug }),
    haikuAlbums: new RedisStore<HaikuAlbum>({ key: "haikualbum", debug }),
    haikudles: new RedisStore<Haikudle>({ key: "haikudle", options: HaikudleOptions, debug }),
    dailyHaikudles: new RedisStore<DailyHaikudle>({ key: "dailyhaikudle", options: DailyHaikudleOptions, debug }),
    userHaikudles: new RedisStore<UserHaikudle>({ key: "userhaikudle", options: UserHaikudleOptions, debug }),
    userHaikus: new RedisStore<UserHaiku>({ key: "userhaiku", options: UserHaikuOptions, debug }),
    likedHaikus: new RedisStore<LikedHaiku>({ key: "likedhaiku", options: LikedHaikuOptions, debug }),
    flaggedHaikus: new RedisStore<FlaggedHaiku>({ key: "flaggedhaiku", options: FlaggedHaikuOptions, debug }),
    userUsage: new RedisStore<UserUsage>({ key: "haikuuserusage", debug }),
    user: new RedisStore<User>({ key: "haikuuser", options: UserOptions, debug }),
    flaggedUsers: new RedisStore<FlaggedUser>({ key: "flaggedhaikuuser", options: FlaggedUserOptions, debug }),
  }
}
