import { Haiku, UserHaiku } from "./Haiku";
import { Haikudle, UserHaikudle, DailyHaikudle } from "./Haikudle";
import { UserUsage } from "./Usage";

export interface GenericStore<T> {
  get: (id: string) => Promise<T | undefined>,
  find: (query?: any) => Promise<T[]>,
  create: (userId: string, value: T, options?: any) => Promise<T>,
  update: (userId: string, value: T, options?: any) => Promise<T>,
  delete: (userId: string, id: string) => Promise<T>,
}

export type Store = {
  haikus: GenericStore<Haiku>,
  haikudles: GenericStore<Haikudle>,
  dailyHaikudles: GenericStore<DailyHaikudle>,
  userHaikus: GenericStore<UserHaiku>,
  userHaikudles: GenericStore<UserHaikudle>,
  userUsage: GenericStore<UserUsage>,
}
