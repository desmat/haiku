import { RedisStoreRecord } from "@desmat/redis-store";
import { Usage } from "./Usage";

export type User = {
  isAnonymous?: boolean,
  isAdmin?: boolean,
  isInternal?: boolean,
  impersonating?: boolean,
  displayName?: string,
  email?: string,
  preferences?: any,
  usage?: Usage,
  host?: string | undefined | null,
  referer?: string | undefined | null,
  sessionCount?: number,
} & RedisStoreRecord;

export const UserSaveOptions = {
  lookups: {
    admin: "isAdmin",
    internal: "isInternal",
  },
};

export type FlaggedUser = {
  userId: string,
  createdBy: string,
  updatedBy?: string,
  reason?: string,
} & RedisStoreRecord;

export const FlaggedUserSaveOptions = {
  lookups: {
    user: "userId",
  },
};

export const HAIKUS_PAGE_SIZE = 20;
export const SESSION_TIMEOUT_SECONDS = 60 * 30 // 30 minutes