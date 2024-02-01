import { Haiku } from "./Haiku";
import { Haikudle } from "./Haikudle";

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
}
