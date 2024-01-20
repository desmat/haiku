import { decodeJWT, encodeJWT } from '@/utils/jwt';
import { uuid } from '@/utils/misc';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

async function getSession() {
  const session = window?.localStorage && window.localStorage.getItem("session");
  const decoded = session && await decodeJWT(session);

  // @ts-ignore
  return { token: session, session: decoded, user: decoded?.user };
}

const useUser: any = create(devtools((set: any, get: any) => ({
  user: undefined, //(await getSession()).user,
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
    let user;
    let token = window?.localStorage && window.localStorage.getItem("session");
    // console.log(">> hooks.user.load()", { token });

    if (token) {
      user = (await decodeJWT(token)).user;
    } else {
      // console.log('>> hooks.user.load() creating session', {});
      user = { id: uuid(), isAnonymous: true, preferences: {} };
      token = await encodeJWT({ user });
      window?.localStorage && window.localStorage.setItem("session", token || "");
    }

    set({ user, token, loaded: true });
    return { user, token };
  },
})));

export default useUser;
