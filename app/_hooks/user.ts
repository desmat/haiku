import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { User } from '@/types/User';
import { decodeJWT, encodeJWT } from '@/utils/jwt';
import { listToMap, uuid } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from './alert';
import { DailyHaiku, UserHaiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';

const useUser: any = create(devtools((set: any, get: any) => ({
  user: undefined as User | undefined,
  // session: undefined,
  token: undefined,
  loaded: false,
  // loading: false, // guard against signin in many times anonymously

  // populate the side panel
  haikus: {} as { number: UserHaiku },
  allHaikus: {} as { number: UserHaiku },
  dailyHaikus: {} as { string: DailyHaiku },
  dailyHaikudles: {} as { string: DailyHaikudle },
  nextDailyHaikuId: undefined as string | undefined,
  nextDailyHaikudleId: undefined as string | undefined,

  getUser: async () => {
    const { loaded, user, load } = get();
    if (!loaded) {
      return (await load()).user;
    }

    return user;
  },

  getToken: async () => {
    const { loaded, token, load } = get();
    if (!loaded) {
      return (await load()).token;
    }

    return token;
  },

  load: async () => {
    const { loadLocal, loadRemote } = get();
    let user;
    // console.log(">> hooks.user.load()", {});

    const {
      user: localUser,
      token
    } = await loadLocal();
    const remoteRes = await loadRemote(token);
    const {
      user: remoteUser,
      haikus,
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId,
    } = remoteRes;
    // console.log(">> hooks.user.load()", { remoteRes });

    user = {
      ...localUser,
      isAdmin: remoteUser?.isAdmin,
      isAnonymous: remoteUser?.isAnonymous,
      usage: remoteUser?.usage,
    }

    set({
      user,
      token,
      loaded: true,
      haikus: haikus ? listToMap(haikus, { keyFn: (e: any) => e.haikuId }) : {},
      allHaikus: allHaikus ? listToMap(allHaikus, { keyFn: (e: any) => e.haikuId }) : {},
      dailyHaikus: dailyHaikus ? listToMap(dailyHaikus, { keyFn: (e: any) => e.haikuId }) : {},
      dailyHaikudles: dailyHaikudles ? listToMap(dailyHaikudles, { keyFn: (e: any) => e.haikuId }) : {},
      nextDailyHaikuId,
      nextDailyHaikudleId,
    });

    return {
      user,
      token,
      haikus,
      dailyHaikus,
      dailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId
    };
  },

  loadLocal: async () => {
    let user;
    let token = window?.localStorage && window.localStorage.getItem("session");
    // console.log(">> hooks.user.loadLocal()", { token });

    if (token) {
      user = (await decodeJWT(token)).user as User;
      // @ts-ignore
      if ((process.env.ADMIN_USER_IDS || "").split(",").includes(user.id)) {
        user.isAdmin = true;
      }

      trackEvent("user-session-loaded", {
        userId: user.id,
        isAdmin: user.isAdmin,
        isAnonymous: user.isAnonymous,
        // token, 
      });
    } else {
      // console.log('>> hooks.user.load() creating session', { onboardingUserId: process.env.ONBOARDING_USER_ID });
      if (process.env.ONBOARDING_USER_ID) {
        console.warn('>> hooks.user.load() CREATING SESSION WITH ONBOARDING USER ID', { onboardingUserId: process.env.ONBOARDING_USER_ID });
      }

      user = {
        id: process.env.ONBOARDING_USER_ID || uuid(),
        isAnonymous: true,
        isAdmin: false,
        preferences: {}
      };

      token = await encodeJWT({ user });

      window?.localStorage && window.localStorage.setItem("session", token || "");

      trackEvent("user-session-created", {
        userId: user.id,
        isAdmin: user.isAdmin,
        isAnonymous: user.isAnonymous,
        // token, 
      });
    }

    return { user, token };
  },

  loadRemote: async (token: string) => {
    // console.log(">> hooks.user.loadRemote()", { token });

    const res = await fetch(`/api/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status != 200) {
      trackEvent("error", {
        type: "fetch-user",
        code: res.status,
        token,
      });
      useAlert.getState().error(`Error fetching haikus: ${res.status} (${res.statusText})`);
      return {};
    }

    return res.json();
  },

  update: async (user: any) => {
    set({ user });
  },

  incUserUsage: async (user: any, resource: string) => {
    const dateCode = moment().format("YYYYMMDD");
    const usage = user?.usage[dateCode] && user?.usage[dateCode] || {};
    const val = usage[resource] || 0;

    set({
      user: {
        ...user,
        usage: {
          ...usage,
          [dateCode]: {
            ...usage[resource],
            [resource]: val + 1,
          },
        },
      },
    });
  },

  save: async (user: any) => {
    // console.log(">> hooks.user.save()", { user });
    const token = await encodeJWT({ user });
    window?.localStorage && window.localStorage.setItem("session", token || "");
    set({ user });
  },
})));

export default useUser;
