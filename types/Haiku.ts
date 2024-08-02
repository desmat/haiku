export type Haiku = {
  id: string,
  createdAt: number,
  createdBy: string,
  theme: string,
  poem: string[],
  bgImage: string,
  updatedAt?: number,
  updatedBy?: string,
  status?: string,
  lang?: string,
} | any;

export const HaikuSaveOptions = {
  lookups: {
    lang: "lang",
    user: "createdBy",
  },
};

export type UserHaiku = {
  id: string,
  userId: string,
  haikuId: string,
  theme?: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
  solvedAt?: number,
  moves?: number, // move to UserHaikudle
  generatedAt?: number,
  generatedBy?: string,
  viewedAt?: number,
  likedAt?: number, // kill?
};

export const UserHaikuSaveOptions = {
  lookups: {
    user: "userId",
    haiku: "haikuId",
  },
};

export type LikedHaiku = {
  id: string,
  haikuId: string,
  userId: string,
  createdBy: string, 
  createdAt: string,
} | any;

export const LikedHaikuSaveOptions = {
  lookups: {
    user: "userId",
    haiku: "haikuId",
  },
};

export type DailyHaiku = {
  id: string,
  haikuId: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
  theme?: string, // ???
};

export const DailyHaikuSaveOptions = {
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
