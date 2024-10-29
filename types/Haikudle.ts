import { RedisStoreRecord } from "@desmat/redis-store";

export type Haikudle = {
  haikuId: string,
  status?: string,
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord | any;

// not really needed - for consistency
export const HaikudleSaveOptions = {
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

export const UserHaikudleSaveOptions = {
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

export const DailyHaikudleSaveOptions = {
  lookups: {
    haikudle: "haikudleId",
  },
};
