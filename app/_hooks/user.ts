import moment from 'moment';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DailyHaiku, Haiku, UserHaiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { HAIKUS_PAGE_SIZE, User } from '@/types/User';
import { listToMap, mapToSearchParams } from '@/utils/misc';
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

  load: async (options: any = {}) => {
    set({ loading: true });
    const { loadRemote, haikus, allHaikus, dailyHaikus, dailyHaikudles } = get();
    let user = { album: options.album, referer: document?.referrer };
    // console.log(">> hooks.user.load()", { options, user });

    let createdUser: User | undefined;
    let token = window?.localStorage && window.localStorage.getItem("session");

    if (!token) {
      if (options.user) {
        // we need to have a local session so that we can validate impersonator is an admin
        throw 'access denied';
      }

      const ret = await get().createRemote(user);
      createdUser = ret.user;
      token = ret.token;

      if (!createdUser || !token) {
        useAlert.getState().error(`Unable to create session user and/or token: (unknown)`);
        set({ loading: false });
        return;
      }

      window?.localStorage && window.localStorage.setItem("session", token || "");
    }

    const {
      user: remoteUser,
      haikus: loadedHaikus,
      allHaikus: loadedAllHaikus,
      dailyHaikus: loadedDailyHaikus,
      dailyHaikudles: loadedDailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId,
    } = await loadRemote(token, options);

    // console.log(">> hooks.user.load()", { createdUser, remoteUser });

    if (createdUser && !createdUser.impersonating) {
      trackEvent("user-session-created", {
        userId: createdUser.id,
        isAdmin: createdUser.isAdmin,
        isAnonymous: createdUser.isAnonymous,
        isInternal: createdUser.isInternal,
        host: createdUser.host,
        referer: createdUser.referer,
      });
    } else if (remoteUser && !remoteUser.impersonating) {
      trackEvent("user-session-loaded", {
        userId: remoteUser.id,
        isAdmin: remoteUser.isAdmin,
        isAnonymous: remoteUser.isAnonymous,
        isInternal: remoteUser.isInternal,
        host: remoteUser.host,
        sessionCount: remoteUser.sessionCount,
        referer: remoteUser.referer,
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
      haikus: {
        ...haikus,
        ...loadedHaikus ? listToMap(loadedHaikus, { keyFn: (e: any) => e.haikuId }) : {},
      },
      allHaikus: {
        ...allHaikus,
        ...loadedAllHaikus ? listToMap(loadedAllHaikus, { keyFn: (e: any) => e.haikuId }) : {},
      },
      dailyHaikus: {
        ...dailyHaikus,
        ...loadedDailyHaikus ? listToMap(loadedDailyHaikus, { keyFn: (e: any) => e.haikuId }) : {},
      },
      dailyHaikudles: {
        ...dailyHaikudles,
        ...loadedDailyHaikudles ? listToMap(loadedDailyHaikudles, { keyFn: (e: any) => e.haikuId }) : {},
      },
      nextDailyHaikuId,
      nextDailyHaikudleId,
    });

    return {
      user,
      token,
      haikus,
      allHaikus: { ...allHaikus, ...loadedAllHaikus },
      dailyHaikus: { ...dailyHaikus, ...loadedDailyHaikus },
      dailyHaikudles: { ...dailyHaikudles, ...loadedDailyHaikudles },
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

    if (user.impersonating) {
      console.warn(">> hooks.user.save() impersonating user", { user });
      return { user, token: "IMPERSONATE_TOKEN" }; 
    }

    // save remote
    const { user: savedUser, token: savedToken } = await get().saveRemote(user);
    // console.log(">> hooks.user.save()", { savedUser, savedToken });

    // save local
    window?.localStorage && window.localStorage.setItem("session", savedToken || "");
    set({ user: savedUser, token: savedToken });

    return { user: savedUser, token: savedToken };
  },

  loadRemote: async (token: string, options: any = {}) => {
    // console.log(">> hooks.user.loadRemote()", { token, options });

    const params = mapToSearchParams({
      ...options.album && { album: options.album } || {},
      ...options.userId && { user: options.userId } || {},
      ...options.count && { count: options.count } || { count: HAIKUS_PAGE_SIZE + 1 },
      ...options.offset && { offset: options.offset } || {},
    });

    const res = await fetch(`/api/user${params ? `?${params}` : ""}`, {
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
