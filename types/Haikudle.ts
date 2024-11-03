import { RedisStoreRecord } from "@desmat/redis-store";

export type Haikudle = {
  haikuId: string,
  status?: string,
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord | any;

// not really needed - for consistency
export const HaikudleOptions = {
  lookups: {
    haiku: "haikuId",
    user: "createdBy",
  },
};

export type UserHaikudle = {
  userId: string,
  haikudleId: string,
  haikudle: Haikudle, // kill?
  moves?: number,
  solvedAt?: number,
} & RedisStoreRecord| any; // kill?

export const UserHaikudleOptions = {
  lookups: {
    user: "userId",
    haikudle: "haikudleId",
  },
};

export type DailyHaikudle = {
  haikuId: string,
  haikudleId: string,
  theme?: string,  // ???
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord;

export const DailyHaikudleOptions = {
  lookups: {
    haikudle: "haikudleId",
  },
};
