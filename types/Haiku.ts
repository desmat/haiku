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
