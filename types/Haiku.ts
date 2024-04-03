export type Haiku = {
  id: string,
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
