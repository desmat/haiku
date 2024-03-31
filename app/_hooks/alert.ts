import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AlertType } from '@/types/Alert';
import moment from 'moment';

const useAlert: any = create(devtools((set: any, get: any) => ({
  message: undefined as string | undefined,
  type: undefined as AlertType | undefined,
  onDissmiss: () => undefined,
  closeLabel: undefined as string | undefined,
  closeTimeout: undefined as any,
  closedTimestamp: undefined as number | undefined,

  reset: async () => {
    // console.log(">> hooks.alert.reset", {});
    set({
      message: undefined,
      type: undefined,
      onDismiss: undefined,
      closeLabel: undefined,
      closeTimeout: undefined,
      closedTimestamp: undefined,
    });
  },

  error: async (message: string, {
    onDissmiss, closeLabel, closeDelay
  }: {
    onDissmiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number
  } = {}) => {
    // console.log(">> hooks.alert.error", { message });
    set({ message, type: message && "error", onDissmiss, closeLabel });
  },

  warning: async (message: string, {
    onDissmiss, closeLabel, closeDelay
  }: {
    onDissmiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number
  } = {}) => {
    // console.log(">> hooks.alert.warning", { message, closeDelay });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "warning", onDissmiss, closeLabel });
  },

  info: async (message: string, {
    onDissmiss, closeLabel, closeDelay
  }: {
    onDissmiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number
  } = {}) => {
    // console.log(">> hooks.alert.info", { message });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "info", onDissmiss, closeLabel });
  },

  success: async (message: string, {
    onDissmiss, closeLabel, closeDelay
  }: {
    onDissmiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number
  } = {}) => {
    // console.log(">> hooks.alert.success", { message });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "success", onDissmiss, closeLabel });
  },

  plain: async (message: string, {
    onDissmiss, closeLabel, closeDelay
  }: {
    onDissmiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number
  } = {}) => {
    // console.log(">> hooks.alert.plain", { message, onDissmiss, closeLabel, closeDelay });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "plain", onDissmiss, closeLabel });
  },

  setCloseTimeout: async (closeDelayMs: number) => {
    const { closeTimeout: previousCloseTimeout, reset } = get();

    if (previousCloseTimeout) {
      clearTimeout(previousCloseTimeout);
    }

    // calling reset() directly works but leveraging AnimatedAlert is smoother 
    const closeTimeout = setTimeout(
      () => set({ closedTimestamp: moment().valueOf() }),
      closeDelayMs
    );

    set({ closeTimeout });
  },

})));

export default useAlert;
