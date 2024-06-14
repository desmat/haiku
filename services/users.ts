import { Store } from '@/types/Store';
import { User } from '@/types/User';
import { decodeJWT, encodeJWT } from "@/utils/jwt";

let store: Store;
import(`@/services/stores/${process.env.STORE_TYPE}`)
  .then((s: any) => {
    console.log(">> services.users.init", { s });
    store = new s.create();
  });

export function getUserName(user: User): string {
  return user?.isAnonymous
    ? "Anonymous"
    : user?.displayName
    || (user?.email && user.email.split("@")?.length > 0 && user.email.split("@")[0])
    || "Noname";
}

export function getProviderType(user: User): string | undefined {
  return "localStorage";
}

  export function getProviderName(user: User): string {
  return user?.isAnonymous
    ? "(anonymous)"
    : "(unknown)";
}

export async function userSession(request: any) {
  // console.log(">> services.users.userSession", { request });
  const authorization = request.headers.get("Authorization");
  // console.log(">> services.users.userSession", { authorization, host: request.headers.get("host") });

  let token;
  if (authorization?.startsWith("Bearer ")) {
    token = authorization.split("Bearer ")[1];
  }

  if (!token) {
    console.warn(">> services.users.userSession token not found");
    return {};
  }

  const decodedToken = token && await decodeJWT(token);
  const user = decodedToken.user && await loadUser(decodedToken.user.id);
  // console.log(">> services.users.userSession", { decodedToken, user, adminUserIds: process.env.ADMIN_USER_IDS });
  
  return {
    ...decodedToken,
    user: {
      ...decodedToken.user,
      ...user,
      isAdmin: user?.isAdmin || ((process.env.ADMIN_USER_IDS || "").split(",").includes(decodedToken.user.id)),
      host: user?.host || request.headers.get("host"),
      referer: user?.referer || request.headers.get("referer"),
    }
  };
}

export async function loadUser(userId: string) {
  console.log(">> services.users.loadUser", { userId });
  let loadedUser = await store.user.get(userId);
  
  return loadedUser;
}

export async function saveUser(user: User) {
  console.log(">> services.users.saveUser", { user });
  let savedUser = await store.user.get(user.id);
  
  // TODO: maybe we'll need to distinguish between user acting and user to save?

  if (savedUser) {
    savedUser = await store.user.update(user.id, user);
  } else {
    savedUser = await store.user.create(user.id, user);
  }

  return savedUser;
}

export async function createToken(user: User) {
  return encodeJWT({ user });
}
