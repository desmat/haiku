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
}
