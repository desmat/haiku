import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AlertType } from '@/types/Alert';
import moment from 'moment';

const useAlert: any = create(devtools((set: any, get: any) => ({
  message: undefined as string | undefined,
  type: undefined as AlertType | undefined,
  onDismiss: () => undefined,
  closeLabel: undefined as string | undefined,
  closeTimeout: undefined as any,
  closedTimestamp: undefined as number | undefined,
  positionClassName: undefined as string | undefined,

  reset: async () => {
    // console.log(">> hooks.alert.reset", {});
    set({
      message: undefined,
      type: undefined,
      onDismiss: undefined,
      closeLabel: undefined,
      closeTimeout: undefined,
      closedTimestamp: undefined,
      positionClassName: undefined,
    });
  },

  error: async (message: string, {
    onDismiss, closeLabel, closeDelay, positionClassName
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
  } = {}) => {
    // console.log(">> hooks.alert.error", { message });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "error", onDismiss, closeLabel, positionClassName });
  },

  warning: async (message: string, {
    onDismiss, closeLabel, closeDelay, positionClassName
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
  } = {}) => {
    // console.log(">> hooks.alert.warning", { message, closeDelay });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "warning", onDismiss, closeLabel, positionClassName });
  },

  info: async (message: string, {
    onDismiss, closeLabel, closeDelay, positionClassName
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
  } = {}) => {
    // console.log(">> hooks.alert.info", { message });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "info", onDismiss, closeLabel, positionClassName });
  },

  success: async (message: string, {
    onDismiss, closeLabel, closeDelay, positionClassName
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
  } = {}) => {
    // console.log(">> hooks.alert.success", { message });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "success", onDismiss, closeLabel, positionClassName });
  },

  plain: async (message: string, {
    onDismiss, closeLabel, closeDelay, positionClassName
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
  } = {}) => {
    // console.log(">> hooks.alert.plain", { message, onDismiss, closeLabel, closeDelay });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({ message, type: message && "plain", onDismiss, closeLabel, positionClassName });
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
