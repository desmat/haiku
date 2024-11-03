import { RedisStoreRecord } from "@desmat/redis-store";

export type Usage = any;

export type UserUsage = {
  userId: string,
  dateCode: string,
  usage: {
    haikusCreated?: number,
    haikusRegenerated?: number,
  },
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord;

export const USAGE_LIMIT = {
  DAILY_CREATE_HAIKU: 8,
  DAILY_REGENERATE_HAIKU: 16,
};
