import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AlertType } from '@/types/Alert';
import trackEvent from '@/utils/trackEvent';

const useAlert: any = create(devtools((set: any, get: any) => ({
  message: undefined as string | undefined,
  type: undefined as AlertType | undefined,
  onDissmiss: () => undefined,
  closeLabel: undefined as string | undefined,

  reset: async() => {
    set({
      message: undefined,
      type: undefined,
      onDismiss: undefined,
      closeLabel: undefined,
    });
  },

  error: async (message?: string, onDissmiss?: () => undefined, closeLabel?: string) => {
    console.log(">> hooks.alert.error", { message });
    set({ message, type: message && "error", onDissmiss, closeLabel });
  },

  warning: async (message?: string, onDissmiss?: () => undefined, closeLabel?: string) => {
    // console.log(">> hooks.alert.warning", { message });
    set({ message, type: message && "warning", onDissmiss, closeLabel });
  },

  info: async (message?: string, onDissmiss?: () => undefined, closeLabel?: string) => {
    // console.log(">> hooks.alert.info", { message });
    set({ message, type: message && "info", onDissmiss, closeLabel });
  },

  success: async (message?: string, onDissmiss?: () => undefined, closeLabel?: string) => {
    // console.log(">> hooks.alert.success", { message });
    set({ message, type: message && "success", onDissmiss, closeLabel });
  },

  plain: async (message?: string, onDissmiss?: () => undefined, closeLabel?: string) => {
    // console.log(">> hooks.alert.success", { message });
    set({ message, type: message && "plain", onDissmiss, closeLabel });
  },  
})));

export default useAlert;
