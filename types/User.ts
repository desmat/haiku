import { Usage } from "./Usage";

export type User = {
  id: string,
  isAnonymous?: boolean,
  isAdmin?: boolean,
  displayName?: string,
  email?: string,
  preferences?: any,
  usage?: Usage,
  host?: string | undefined | null,
  referer?: string | undefined | null,
  sessionCount?: number,
}

export const UserSaveOptions = {
  lookups: {
    admin: "isAdmin",
  },
};

export type FlaggedUser = {
  id: string,
  userId: string,
  createdBy?: string,
  createdAt?: number,
  updatedBy?: string,
  updatedAt?: number,
  reason?: string,
};

export const FlaggedUserSaveOptions = {
  lookups: {
    user: "userId",
  },
};

export const HAIKUS_PAGE_SIZE = 20;
export const SESSION_TIMEOUT_SECONDS = 60 * 30 // 30 minutes