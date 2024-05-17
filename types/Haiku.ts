export type Haiku = {
  id: string,
  status?: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
} | any;

export type UserHaiku = {
  id: string,
  userId: string,
  haikuId: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
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

export function haikuStyles(haiku: Haiku) {
  const fontColor = haiku?.color || "#555555";
  const bgColor = haiku?.bgColor || "lightgrey";

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
