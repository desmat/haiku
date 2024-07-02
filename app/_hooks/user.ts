import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DailyHaiku, Haiku, UserHaiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { User } from '@/types/User';
import { listToMap } from '@/utils/misc';
import trackEvent from '@/utils/trackEvent';
import useAlert from './alert';

const useUser: any = create(devtools((set: any, get: any) => ({
  user: undefined as User | undefined,
  // session: undefined,
  token: undefined,
  loaded: false,
  loading: false,
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
    // console.log(">> hooks.user.getToken()", {});
    const { loaded, token, load } = get();
    if (!loaded) {
      return (await load()).token;
    }

    return token;
  },

  load: async () => {
    set({ loading: true });
    const { loadLocal, loadRemote } = get();
    let user;
    // console.log(">> hooks.user.load()", {});

    let createdUser: User | undefined;
    let token = window?.localStorage && window.localStorage.getItem("session");
    
    if (!token) {
      const ret = await get().createRemote(user);
      createdUser = ret.user;
      token = ret.token;

      if (!createdUser || !token) {
        useAlert.getState().error(`Unable to create session user and/or token: (unknown)`);
        set({ loading: false });
        return;
      }
    } 
    
    const {
      user: remoteUser,
      haikus,
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId,
    } = await loadRemote(token);

    // console.log(">> hooks.user.load()", { createdUser, remoteUser });

    if (createdUser) {
      trackEvent("user-session-created", {
        userId: createdUser.id,
        isAdmin: createdUser.isAdmin,
        isAnonymous: createdUser.isAnonymous,
        host: createdUser.host,
      });
    } else {
      trackEvent("user-session-loaded", {
        userId: remoteUser.id,
        isAdmin: remoteUser.isAdmin,
        isAnonymous: remoteUser.isAnonymous,
        host: remoteUser.host,
        // token, 
      });
    }

    user = {
      ...createdUser,
      ...remoteUser,
    }

    set({
      user,
      token,
      loaded: true,
      loading: false,
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

    // save remote
    const { user: savedUser, token: savedToken } = await get().saveRemote(user);
    // console.log(">> hooks.user.save()", { savedUser, savedToken });

    // save local
    window?.localStorage && window.localStorage.setItem("session", savedToken || "");
    set({ user: savedUser, token: savedToken });

    return { user: savedUser, token: savedToken };
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

  createRemote: async (user: any) => {
    // console.log(">> hooks.user.createRemote()", { user });

    const res = await fetch(`/api/user`, {
      // ...await fetchOpts(),
      method: "POST",
      body: JSON.stringify({ user })
    });

    if (res.status != 200) {
      trackEvent("error", {
        type: "post-user",
        code: res.status,
      });
      useAlert.getState().error(`Error posting user session: ${res.status} (${res.statusText})`);
      return {};
    }

    const { user: updatedUser, token: updatedToken } = await res.json();
    // console.log(">> hooks.user.createRemote()", { updatedToken, updatedUser });

    return { user: updatedUser, token: updatedToken };
  },  

  saveRemote: async (user: any) => {
    // console.log(">> hooks.user.saveRemote()", { user });

    const token = await get().getToken();
    const opts = token && { headers: { Authorization: `Bearer ${token}` } } || {};
  
    const res = await fetch(`/api/user/${user.id}`, {
      ...opts,
      method: "PUT",
      body: JSON.stringify({ user })
    });

    if (res.status != 200) {
      trackEvent("error", {
        type: "put-user",
        code: res.status,
      });
      useAlert.getState().error(`Error saving user session: ${res.status} (${res.statusText})`);
      return {};
    }

    const { user: updatedUser, token: updatedToken } = await res.json();
    // console.log(">> hooks.user.saveRemote()", { updatedToken, updatedUser });

    return { user: updatedUser, token: updatedToken };
  },  

  addUserHaiku: async (haiku: Haiku, action?: "viewed" | "generated") => {
    const { user, haikus, allHaikus } = get();
    // console.log(">> hooks.user.addUserHaiku", { haiku, action, user });

    const token = await get().getToken();
    const opts = token && { headers: { Authorization: `Bearer ${token}` } } || {};

    const res = await fetch(`/api/user/${user.id}/haikus`, {
      ...opts,
      method: "POST",
      body: JSON.stringify({ haiku, action })
    });

    if (res.status != 200) {
      trackEvent("error", {
        type: "put-user",
        code: res.status,
      });
      useAlert.getState().error(`Error saving user session: ${res.status} (${res.statusText})`);
      return {};
    }

    const { userHaiku } = await res.json();
    // console.log(">> hooks.user.addUserHaiku", { userHaiku });

    useUser.setState({
      haikus: {
        ...haikus,
        [haiku.id]: userHaiku,
      },
      allHaikus: user.isAdmin && {
        ...allHaikus,
        [haiku.id]: userHaiku
      },
    });
  },  
})));

export default useUser;
