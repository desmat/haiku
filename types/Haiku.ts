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
  theme?: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
  solvedAt?: number,
  moves?: number,
  generatedAt?: number,
  generatedBy?: string,
  viewedAt?: number,
  likedAt?: number,
};

export const UserHaikuSaveOptions = {
  indices: {
    haikuId: "string",
    likedAt: "number",
  }
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

export type HaikuAction = "like";
