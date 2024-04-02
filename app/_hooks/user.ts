import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { User } from '@/types/User';
import { decodeJWT, encodeJWT } from '@/utils/jwt';
import { uuid } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from './alert';

const useUser: any = create(devtools((set: any, get: any) => ({
  user: undefined as User | undefined,
  // session: undefined,
  token: undefined,
  loaded: false,
  // loading: false, // guard against signin in many times anonymously

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
    // console.log(">> hooks.user.load()", { token });

    const { user: localUser, token } = await loadLocal();
    const { user: remoteUser } = await loadRemote(token);

    user = {
      ...localUser,
      isAdmin: remoteUser?.isAdmin,
      isAnonymous: remoteUser?.isAnonymous,
      usage: remoteUser?.usage,
    }

    set({ user, token, loaded: true });
    return { user, token };
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
    } else {
      // console.log('>> hooks.user.load() creating session', {});
      user = { id: uuid(), isAnonymous: true, isAdmin: false, preferences: {} };
      token = await encodeJWT({ user });
      window?.localStorage && window.localStorage.setItem("session", token || "");
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

    const data = await res.json();
    const user = data.user;

    return { user };
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
    const token = await encodeJWT({ user });
    window?.localStorage && window.localStorage.setItem("session", token || "");
    set({ user });
  },
})));

export default useUser;
