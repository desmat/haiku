export type Haikudle = {
  id: string,
  haikuId: string,
  status?: string,
  createdAt?: number,
  createdBy?: string,
  updatedAt?: number,
  updatedBy?: string,
} | any;

export type UserHaikudle = {
  id: string,
  userId: string,
  haikudle: Haikudle,
} | any;

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
