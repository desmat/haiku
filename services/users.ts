import moment from 'moment';
import { Store } from '@/types/Store';
import { User } from '@/types/User';
import { searchParamsToMap } from '@/utils/misc';
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

  let savedUser = await store.user.get(user.id);
  user.isInternal = !!(user.isInternal || user.referer && user.referer.includes("vercel.com"));

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
  console.log(">> services.users.getUserStats", {});
  const [
    allUsers,
    flaggedUserIds
  ] = await Promise.all([
    store.user.find(),
    store.flaggedUsers.ids(),
  ]);

  const userIds = new Set();
  const adminIds = new Set();
  const internalUserIds = new Set();
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
  let flaggedUserCount = 0

  for (const user of allUsers) {
    const isAdmin = user.isAdmin;
    const isInternal = user.isInternal;
    // @ts-ignore
    const diff = moment().diff(user.updatedAt || user.createdAt, "days");
    // @ts-ignore
    const diffCreated = moment().diff(user.createdAt, "days");

    if (isAdmin || isInternal) {
      if (isAdmin) adminIds.add(user.id);
      if (isInternal) internalUserIds.add(user.id);
    } else {
      userIds.add(user.id);

      if (diff <= 30) {
        // @ts-ignore
        if (user.sessionCount > 1) {
          monthlyReturningUserCount++;
          monthlyReturningUserSessionCount += (user.sessionCount || 1);
        }
      }

      if (diffCreated <= 30) {
        monthlyNewUserCount++;
      }

      if (diff <= 1) {
        // @ts-ignore
        if (user.sessionCount > 1) {
          dailyReturningUserCount++;
          dailyReturningUserSessionCount += (user.sessionCount || 1);
        }
      }

      if (diffCreated <= 1) {
        dailyNewUserCount++;
      }

      if (flaggedUserIds.has(user.id)) {
        flaggedUserCount++;
      }
    }
  }

  const pageSize = 99; // just below the "pulling more than 100" warning
  let brokethebank = false;

  for (let i = 0; i < 10; i++) {
    if (i == 9) {
      console.warn(">> services.users.getUserStats WARNING: pulling too many haikus");
      brokethebank = true;
      break;
    }

    const haikus = await store.haikus.find({ count: pageSize, offset: pageSize * i });
    let done = false;

    for (const haiku of haikus) {
      const diffCreated = moment().diff(haiku.createdAt, "days");

      if (diffCreated > 30) {
        done = true;
        break;
      }

      if (!adminIds.has(haiku.createdBy) && !internalUserIds.has(haiku.createdBy)) {
        if (diffCreated <= 30) {
          monthlyActiveUserIds.add(haiku.createdBy);
          // TODO monthlyActiveUserSessionCount
        }

        if (diffCreated <= 1) {
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
      const diffCreated = moment().diff(userHaikudle.updatedAt || userHaikudle.createdAt, "days");

      if (diffCreated > 30) {
        done = true;
        break;
      }

      if (!adminIds.has(userHaikudle.createdBy) && !internalUserIds.has(userHaikudle.createdBy) && userHaikudle?.haikudle?.moves > 0) {
        // console.warn(">> services.users.getUserStats", { userHaikudle });

        if (diffCreated <= 30) {
          monthlyActiveUserIds.add(userHaikudle.createdBy);
          // TODO monthlyActiveUserSessionCount
        }

        if (diffCreated <= 1) {
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
      const diffCreated = moment().diff(userHaiku.updatedAt || userHaiku.createdAt, "days");

      if (diffCreated > 30) {
        done = true;
        break;
      }

      if (!adminIds.has(userHaiku.createdBy) && !internalUserIds.has(userHaiku.createdBy) && userHaiku.sharedAt) {
        // console.warn(">> services.users.getUserStats", { userHaikudle });

        if (diffCreated <= 30) {
          monthlyActiveUserIds.add(userHaiku.createdBy);
          // TODO monthlyActiveUserSessionCount
        }

        if (diffCreated <= 1) {
          dailyActiveUserIds.add(userHaiku.createdBy);
          // TODO dailyActiveUserSessionCount
        }
      }
    }

    if (done) break;
  }

  return {
    users: userIds.size,
    admins: adminIds.size,
    internalUsers: internalUserIds.size,
    monthlyNewUsers: monthlyNewUserCount,
    monthlyReturningUsers: monthlyReturningUserCount,
    avgMonthlyReturningUserSessions: Math.round(monthlyReturningUserSessionCount / monthlyReturningUserCount),
    monthlyActiveUsers: brokethebank ? -1 : monthlyActiveUserIds.size,
    // avgMonthlyActiveUserSessions: Math.round(monthlyActiveUserSessionCount / monthlyActiveUserCount),
    dailyNewUsers: dailyNewUserCount,
    dailyReturningUser: dailyReturningUserCount,
    avgDailyReturningUserSessions: Math.round(dailyReturningUserSessionCount / dailyReturningUserCount),
    dailyActiveUsers: brokethebank ? -1 : dailyActiveUserIds.size,
    // avgDailyActiveUserSessions: Math.round(dailyActiveUserSessionCount / dailyActiveUserCount),
    flaggedUsers: flaggedUserCount,
  }
}