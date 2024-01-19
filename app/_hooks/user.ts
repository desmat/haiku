import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// import { User } from '@/types/User';

const useUser: any = create(devtools((set: any, get: any) => ({
  user: undefined,
  loaded: false,
  loading: false, // guard against signin in many times anonymously
  fetching: false, // guard against fetching many times

  load: async () => {
    // console.log(">> hooks.user.load", {});

  },
})));

export default useUser;
