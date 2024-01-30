export type User = {
  id: string,
  isAnonymous?: boolean,
  isAdmin?: boolean,
  displayName?: string,
  email?: string,
  preferences: any,
}
