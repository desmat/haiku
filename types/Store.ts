import { DailyHaiku, Haiku, LikedHaiku, UserHaiku } from "./Haiku";
import { Haikudle, UserHaikudle, DailyHaikudle } from "./Haikudle";
import { HaikuAlbum } from "./Album";
import { UserUsage } from "./Usage";
import { User } from "./User";

export interface GenericStore<T> {
  get: (id: string) => Promise<T | undefined>,
  find: (query?: any) => Promise<T[]>,
  create: (userId: string, value: T, options?: any) => Promise<T>,
  update: (userId: string, value: T, options?: any) => Promise<T>,
  delete: (userId: string, id: string, options?: any) => Promise<T>,
}

export type Store = {
  haikus: GenericStore<Haiku>,
  dailyHaikus: GenericStore<DailyHaiku>,
  haikuAlbums: GenericStore<HaikuAlbum>,
  haikudles: GenericStore<Haikudle>,
  dailyHaikudles: GenericStore<DailyHaikudle>,
  userHaikus: GenericStore<UserHaiku>,
  likedHaikus: GenericStore<LikedHaiku>,
  userHaikudles: GenericStore<UserHaikudle>,
  userUsage: GenericStore<UserUsage>,
  user: GenericStore<User>,
}
