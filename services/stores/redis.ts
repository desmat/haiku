import { RedisStore } from "@desmat/redis-store";
import { HaikuAlbum } from "@/types/Album";
import { DailyHaiku, DailyHaikuSaveOptions, FlaggedHaiku, FlaggedHaikuSaveOptions, Haiku, HaikuSaveOptions, LikedHaiku, LikedHaikuSaveOptions, UserHaiku, UserHaikuSaveOptions } from "@/types/Haiku";
import { DailyHaikudle, DailyHaikudleSaveOptions, Haikudle, HaikudleSaveOptions, UserHaikudle, UserHaikudleSaveOptions } from "@/types/Haikudle";
import { UserUsage } from "@/types/Usage";
import { FlaggedUser, FlaggedUserSaveOptions, User, UserSaveOptions } from "@/types/User";

export function createStore({
  url,
  token,
  debug
}: {
  url: string,
  token: string,
  debug?: boolean
}) {
  debug && console.log(`services.stores.redis.create`);

  return {
    haikus: new RedisStore<Haiku>({
      url,
      token,
      key: "haiku",
      recordOptions: HaikuSaveOptions,
      debug,
    }),
    dailyHaikus: new RedisStore<DailyHaiku>({
      url,
      token,
      key: "dailyhaiku",
      recordOptions: DailyHaikuSaveOptions,
      debug,
    }),
    haikuAlbums: new RedisStore<HaikuAlbum>({
      url,
      token,
      key: "haikualbum",
      debug,
    }),
    haikudles: new RedisStore<Haikudle>({
      url,
      token,
      key: "haikudle",
      recordOptions: HaikudleSaveOptions,
      debug,
    }),
    dailyHaikudles: new RedisStore<DailyHaikudle>({
      url,
      token,
      key: "dailyhaikudle",
      recordOptions: DailyHaikudleSaveOptions,
      debug,
    }),
    userHaikudles: new RedisStore<UserHaikudle>({
      url,
      token,
      key: "userhaikudle",
      recordOptions: UserHaikudleSaveOptions,
      debug,
    }),
    userHaikus: new RedisStore<UserHaiku>({
      url,
      token,
      key: "userhaiku",
      recordOptions: UserHaikuSaveOptions,
      debug,
    }),
    likedHaikus: new RedisStore<LikedHaiku>({
      url,
      token,
      key: "likedhaiku",
      recordOptions: LikedHaikuSaveOptions,
      debug,
    }),
    flaggedHaikus: new RedisStore<FlaggedHaiku>({
      url,
      token,
      key: "flaggedhaiku",
      recordOptions: FlaggedHaikuSaveOptions,
      debug,
    }),
    userUsage: new RedisStore<UserUsage>({
      url,
      token,
      key: "haikuuserusage",
      debug,
    }),
    user: new RedisStore<User>({
      url,
      token,
      key: "haikuuser",
      recordOptions: UserSaveOptions,
      debug,
    }),
    flaggedUsers: new RedisStore<FlaggedUser>({
      url,
      token,
      key: "flaggedhaikuuser",
      recordOptions: FlaggedUserSaveOptions,
      debug,
    }),
  }
}
