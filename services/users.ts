import { searchParamsToMap } from '@desmat/utils';
import moment from 'moment';
import { User } from '@/types/User';
import { decodeJWT, encodeJWT } from "@/utils/jwt";
import { createStore } from './stores/redis';

const store = createStore({
  url: process.env.KV_REST_API_URL || "NOT_DEFINED",
  token: process.env.KV_REST_API_TOKEN || "NOT_DEFINED",
  debug: true,
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
  const query = searchParamsToMap(request.nextUrl.searchParams.toString()) as any;
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

  if (query.user) {
    if (!user.isAdmin) {
      console.error("ERROR: only admininstrators can impersonate users", { user, impersonatingUserId: query.user });
      return;
    }

    console.warn(">> services.users.userSession loading impersonated user");
    const impersonatedUser = await loadUser(query.user);
    return {
      token: "FAKE_TOKEN",
      user: {
        id: query.user,
        ...impersonatedUser,
        impersonating: true,
      },
    }
  }

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

  if (user.impersonating) {
    console.warn(">> services.users.saveUser WARNING: not saving impersonated user", { user });
    return user;
  }

  user.isInternal = !!(user.isInternal
    || user.referer && user.referer.includes("vercel.com")
    || user.host && user.host.includes("localhost"));

  // TODO: maybe we'll need to distinguish between user acting and user to save?

  if (await store.user.exists(user.id)) {
    return store.user.update(user);
  }

  return store.user.create(user);
}

export async function createToken(user: User) {
  return encodeJWT({ user });
}

export async function flagUser(admin: User, userId: string, reason?: string) {
  console.log(">> services.users.flagUser", { admin, userId, reason });

  if (await store.flaggedUsers.exists(userId)) {
    return store.flaggedUsers.update({
      id: userId,
      updatedBy: admin.id,
      userId,
      reason,
    });
  }

  return store.flaggedUsers.create({
    id: userId,
    createdBy: admin.id,
    userId,
    reason,
  });
}

export async function getFlaggedUserIds(): Promise<Set<any>> {
  return store.flaggedUsers.ids();
}

export async function getUserStats(reportAt?: any): Promise<any> {
  console.log(">> services.users.getUserStats", {});
  const [
    // allUsers,
    userIds,
    adminIds,
    internalUserIds,
    flaggedUserIds,
  ] = await Promise.all([
    store.user.ids(),
    store.user.ids({ admin: true }),
    store.user.ids({ internal: true }),
    store.flaggedUsers.ids(),
  ]);

  reportAt = reportAt || moment();
  let monthlyNewUserCount = 0;
  let monthlyReturningUserCount = 0; // returning session in the last 30 days
  let monthlyReturningUserSessionCount = 0;
  let monthlyActiveUserIds = new Set(); // has created or shared a haiku, started or solved a puzzle in the last 30 days
  // let monthlyActiveUserSessionCount = 0;
  let dailyNewUserCount = 0;
  let dailyReturningUserCount = 0; // returning session in the last 24 hours
  let dailyReturningUserSessionCount = 0;
  let dailyActiveUserIds = new Set; // has created or shared a haiku, started or solved a puzzle in the last 24 hours
  // let dailyActiveUserSessionCount = 0;

  // for (const user of allUsers) {
  const pageSize = 99; // just below the "pulling more than 100" warning
  let brokethebank = false;

  for (let i = 0; i < 100; i++) {
    if (i == 99) {
      console.warn(">> services.users.getUserStats WARNING: pulling too many users");
      brokethebank = true;
      break;
    }

    const users = await store.user.find({ count: pageSize, offset: pageSize * i });
    let done = false;

    for (const user of users) {
      const isAdmin = user.isAdmin;
      const isInternal = user.isInternal;
      // @ts-ignore
      const diff = reportAt.diff(user.updatedAt || user.createdAt, "hours");
      // @ts-ignore
      const diffCreated = reportAt.diff(user.createdAt, "hours");

      if (diffCreated >= 24 * 30) {
        done = true;
        break;
      }

      if (diffCreated >= 0 && !isAdmin && !isInternal) {
        if (diff < 24 * 30) {
          if (diff < 24) {
            // @ts-ignore
            if (user.sessionCount > 1) {
              dailyReturningUserCount++;
              dailyReturningUserSessionCount += (user.sessionCount || 1);
            }
          }

          // @ts-ignore
          if (user.sessionCount > 1) {
            monthlyReturningUserCount++;
            monthlyReturningUserSessionCount += (user.sessionCount || 1);
          }
        }

        if (diffCreated < 24 * 30) {
          if (diffCreated < 24) {
            dailyNewUserCount++;
          }

          monthlyNewUserCount++;
        }
      }
    }

    if (done) break;
  }

  for (let i = 0; i < 10; i++) {
    if (i == 9) {
      console.warn(">> services.users.getUserStats WARNING: pulling too many haikus");
      brokethebank = true;
      break;
    }

    const haikus = await store.haikus.find({ count: pageSize, offset: pageSize * i });
    let done = false;

    for (const haiku of haikus) {
      const diffCreated = reportAt.diff(haiku.createdAt, "hours");

      if (diffCreated >= 24 * 30) {
        done = true;
        break;
      }

      if (diffCreated >= 0 && !adminIds.has(haiku.createdBy) && !internalUserIds.has(haiku.createdBy)) {
        if (diffCreated < 24 * 30) {
          monthlyActiveUserIds.add(haiku.createdBy);
          // TODO monthlyActiveUserSessionCount
        }

        if (diffCreated < 24) {
          dailyActiveUserIds.add(haiku.createdBy);
          // TODO dailyActiveUserSessionCount
        }
      }
    }

    if (done) break;
  }

  for (let i = 0; i < 10; i++) {
    if (i == 9) {
      console.warn(">> services.users.getUserStats WARNING: pulling too many userHaikudles");
      brokethebank = true;
      break;
    }

    const userHaikudles = await store.userHaikudles.find({ count: pageSize, offset: pageSize * i });
    let done = false;

    for (const userHaikudle of userHaikudles) {
      const diffCreated = reportAt.diff(userHaikudle.updatedAt || userHaikudle.createdAt, "hours");

      if (diffCreated >= 24 * 30) {
        done = true;
        break;
      }

      if (diffCreated >= 0 && !adminIds.has(userHaikudle.createdBy) && !internalUserIds.has(userHaikudle.createdBy) && userHaikudle?.haikudle?.moves > 0) {
        // console.warn(">> services.users.getUserStats", { userHaikudle });

        if (diffCreated < 24 * 30) {
          monthlyActiveUserIds.add(userHaikudle.createdBy);
          // TODO monthlyActiveUserSessionCount
        }

        if (diffCreated < 24) {
          dailyActiveUserIds.add(userHaikudle.createdBy);
          // TODO dailyActiveUserSessionCount
        }
      }
    }

    if (done) break;
  }

  for (let i = 0; i < 100; i++) {
    if (i == 99) {
      console.warn(">> services.users.getUserStats WARNING: pulling too many userHaikus");
      brokethebank = true;
      break;
    }

    const userHaikus = await store.userHaikus.find({ count: pageSize, offset: pageSize * i });
    let done = false;

    for (const userHaiku of userHaikus) {
      const diffCreated = reportAt.diff(userHaiku.updatedAt || userHaiku.createdAt, "hours");

      if (diffCreated >= 24 * 30) {
        done = true;
        break;
      }

      if (diffCreated >= 0 && !adminIds.has(userHaiku.userId) && !internalUserIds.has(userHaiku.userId) && userHaiku.sharedAt) {
        // console.warn(">> services.users.getUserStats", { userHaikudle });

        if (diffCreated < 24 * 30) {
          monthlyActiveUserIds.add(userHaiku.userId);
          // TODO monthlyActiveUserSessionCount
        }

        if (diffCreated < 24) {
          dailyActiveUserIds.add(userHaiku.userId);
          // TODO dailyActiveUserSessionCount
        }
      }
    }

    if (done) break;
  }

  return {
    users: userIds.size - adminIds.size - internalUserIds.size,
    admins: adminIds.size,
    internalUsers: internalUserIds.size,
    monthlyNewUsers: brokethebank ? -1 : monthlyNewUserCount,
    monthlyReturningUsers: brokethebank ? -1 : monthlyReturningUserCount,
    avgMonthlyReturningUserSessions: brokethebank ? -1 : Math.round(monthlyReturningUserSessionCount / monthlyReturningUserCount),
    monthlyActiveUsers: brokethebank ? -1 : monthlyActiveUserIds.size,
    // avgMonthlyActiveUserSessions: Math.round(monthlyActiveUserSessionCount / monthlyActiveUserCount),
    dailyNewUsers: brokethebank ? -1 : dailyNewUserCount,
    dailyReturningUser: brokethebank ? -1 : dailyReturningUserCount,
    avgDailyReturningUserSessions: Math.round(dailyReturningUserSessionCount / dailyReturningUserCount),
    dailyActiveUsers: brokethebank ? -1 : dailyActiveUserIds.size,
    // avgDailyActiveUserSessions: Math.round(dailyActiveUserSessionCount / dailyActiveUserCount),
    flaggedUsers: flaggedUserIds.size,
  }
}