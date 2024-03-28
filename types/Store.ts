import { Haiku } from "./Haiku";
import { Haikudle, UserHaikudle, DailyHaikudle } from "./Haikudle";
import { Usage } from "./Usage";
import { User } from "./User";

export interface GenericStore<T> {
  get: (id: string) => Promise<T | undefined>,
  find: (query?: any) => Promise<T[]>,
  create: (userId: string, value: T) => Promise<T>,
  update: (userId: string, value: T) => Promise<T>,
  delete: (userId: string, id: string) => Promise<T>,
}

export type Store = {
  haikus: GenericStore<Haiku>,
  haikudles: GenericStore<Haikudle>,
  userHaikudles: GenericStore<UserHaikudle>,
  dailyHaikudles: GenericStore<DailyHaikudle>,
  users: GenericStore<User>,
}
