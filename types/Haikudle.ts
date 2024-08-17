export type Haikudle = {
  id: string,
  haikuId: string,
  status?: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
} | any;

// not really needed - for consistency
export const HaikudleSaveOptions = {
  lookups: {
    haiku: "haikuId",
    user: "createdBy",
  },
};

export type UserHaikudle = {
  id: string,
  userId: string,
  haikudleId: string,
  haikudle: Haikudle, // kill?
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
  solvedAt?: number,
  moves?: number,
}
  | any; // kill?

export const UserHaikudleSaveOptions = {
  lookups: {
    user: "userId",
    haikudle: "haikudleId",
  },
};

export type DailyHaikudle = {
  id: string,
  haikuId: string,
  haikudleId: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
  theme?: string,  // ???
};

export const DailyHaikudleSaveOptions = {
  lookups: {
    haikudle: "haikudleId",
  },
};
