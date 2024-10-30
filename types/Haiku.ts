import { RedisStoreRecord } from "@desmat/redis-store";

export type Haiku = {
  theme: string,
  poem: string[],
  bgImage: string,
  status?: string,
  lang?: string,
  version?: number,
  albumId?: string, // TODO change to many-to-many
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord | any;

export const HaikuOptions = {
  lookups: {
    lang: "lang",
    user: "createdBy",
    album: "albumId",
  },
};

export type UserHaiku = {
  userId: string,
  haikuId: string,
  theme?: string,
  solvedAt?: number,
  moves?: number, // move to UserHaikudle
  createdBy: string,
  updatedBy: string,
  generatedAt?: number,
  viewedAt?: number,
  likedAt?: number, // kill?
  sharedAt?: number,
} & RedisStoreRecord;

export const UserHaikuOptions = {
  lookups: {
    user: "userId",
    haiku: "haikuId",
  },
};

export type LikedHaiku = {
  haikuId: string,
  userId: string,
  createdBy: string,
  updatedBy?: string,
  }& RedisStoreRecord | any;

export const LikedHaikuOptions = {
  lookups: {
    user: "userId",
    haiku: "haikuId",
  },
};

export type FlaggedHaiku = {
  haikuId: string,
  userId: string,
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord | any;

export const FlaggedHaikuOptions = {
  lookups: {
    user: "userId",
    haiku: "haikuId",
  },
};

export type DailyHaiku = {
  haikuId: string,
  theme?: string, // ???
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord;

export const DailyHaikuOptions = {
  lookups: {
    haiku: "haikuId",
  },
};

export type HaikuAction = string;

export function haikuStyles(haiku: Haiku) {
  const fontColor = haiku?.color || "#555555";
  const bgColor = haiku?.bgColor || "#aaaaaa";

  return {
    textStyles: [
      {
        color: fontColor,
        bgColor,
        filter: `drop-shadow(0px 0px 8px ${bgColor})`,
        WebkitTextStroke: `1px ${fontColor}`,
        fontWeight: 300,
      },
      {
        filter: `drop-shadow(0px 0px 2px ${bgColor})`,
      },
      {
        filter: `drop-shadow(0px 0px 4px ${bgColor}99)`,
      },
      {
        filter: `drop-shadow(0px 0px 8px ${bgColor}66)`,
      },
      {
        filter: `drop-shadow(0px 0px 12px ${bgColor}33)`,
      },
      {
        filter: `drop-shadow(0px 0px 18px ${bgColor}22)`,
      },
    ],
    altTextStyles: [
      {
        color: bgColor,
        filter: `drop-shadow(0px 0px 3px ${fontColor})`,
        WebkitTextStroke: `0.5px ${bgColor}`,
        fontWeight: 300,
      },
      {
        filter: `drop-shadow(0px 0px 1px ${fontColor})`,
      },
      {
        filter: `drop-shadow(0px 0px 8px ${bgColor}55)`,
      },
      {
        filter: `drop-shadow(0px 0px 12px ${bgColor}33)`,
      },
      {
        filter: `drop-shadow(0px 0px 18px ${bgColor}11)`,
      },
    ],
  }
}
