export type Usage = any;

export type UserUsage = {
  id: string,
  userId: string,
  dateCode: string,
  usage: {
    haikusCreated?: number,
    haikusRegenerated?: number,
  },
}

export const USAGE_LIMIT = {
  DAILY_CREATE_HAIKU: 13,
  DAILY_REGENERATE_HAIKU: 39,
};
