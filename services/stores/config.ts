import { DailyHaikuOptions, FlaggedHaikuOptions, HaikuOptions, LikedHaikuOptions, UserHaikuOptions } from "@/types/Haiku";
import { DailyHaikudleOptions, HaikudleOptions, UserHaikudleOptions } from "@/types/Haikudle";
import { FlaggedUserOptions, UserOptions } from "@/types/User";

// Shared by the Redis and memory stores so key/lookup config can't drift.
export const storeConfigs = {
  haikus: { key: "haiku", options: HaikuOptions },
  dailyHaikus: { key: "dailyhaiku", options: DailyHaikuOptions },
  haikuAlbums: { key: "haikualbum" },
  haikudles: { key: "haikudle", options: HaikudleOptions },
  dailyHaikudles: { key: "dailyhaikudle", options: DailyHaikudleOptions },
  userHaikudles: { key: "userhaikudle", options: UserHaikudleOptions },
  userHaikus: { key: "userhaiku", options: UserHaikuOptions },
  likedHaikus: { key: "likedhaiku", options: LikedHaikuOptions },
  flaggedHaikus: { key: "flaggedhaiku", options: FlaggedHaikuOptions },
  userUsage: { key: "haikuuserusage" },
  user: { key: "haikuuser", options: UserOptions },
  flaggedUsers: { key: "flaggedhaikuuser", options: FlaggedUserOptions },
};
