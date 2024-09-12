import moment from 'moment';
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

export async function flagUser(admin: User, user: User, reason?: string) {
  console.log(">> services.users.flagUser", { admin, user, reason });
  let flaggedUser = await store.flaggedUsers.get(user.id);

  if (flaggedUser) {
    flaggedUser = await store.flaggedUsers.update(admin.id, {
      ...flaggedUser,
      id: user.id,
      userId: user.id,
      reason,
    });
  } else {
    flaggedUser = await store.flaggedUsers.create(admin.id, {
      id: user.id,
      userId: user.id,
      reason,
    });
  }

  return flaggedUser;
}

export async function getFlaggedUserIds(): Promise<Set<any>> {
  return store.flaggedUsers.ids();
}

export async function getUserStats(): Promise<any> {
  const [
    allUsers,
    flaggedUserIds
  ] = await Promise.all([
    store.user.find(),
    store.flaggedUsers.ids(),
  ]);

  const users = [];
  const admins = [];
  let monthlyActiveUserCount = 0; // active session in the last 30 days
  let monthlyActiveUserSessionCount = 0;
  let dailyActiveUserCount = 0; // active session in the last 24 hours
  let dailyActiveUserSessionCount = 0;
  let flaggedUserCount = 0

  for (const user of allUsers) {
    const isAdmin = user.isAdmin;
    // @ts-ignore
    const diff = moment().diff(user.updatedAt || user.createdAt, "days")

    if (isAdmin) {
      admins.push(user);
    } else {
      users.push(user);
    }

    if (!isAdmin && diff <= 30) {
      monthlyActiveUserCount++;
      monthlyActiveUserSessionCount += (user.sessionCount || 1);
    }

    if (!isAdmin && diff <= 1) {
      dailyActiveUserCount++;
      dailyActiveUserSessionCount += (user.sessionCount || 1);
    }

    if (flaggedUserIds.has(user.id)) flaggedUserCount++;

    // ...
  }

  return {
    users: users.length,
    admins: admins.length,
    monthlyActiveUsers: monthlyActiveUserCount,
    avgMonthlyActiveUserSessions: Math.round(monthlyActiveUserSessionCount / monthlyActiveUserCount),
    dailyActiveUser: dailyActiveUserCount,
    avgDailyActiveUserSessions: Math.round(dailyActiveUserSessionCount / dailyActiveUserCount),
    flaggedUsers: flaggedUserCount,
  }
}