import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AlertType } from '@/types/Alert';
import moment from 'moment';

export type CustomAction = {
  label: string,
  action?: () => void | "close" | undefined,
  disabled?: boolean,
};

const initialState = {
  message: undefined as string | undefined,
  type: undefined as AlertType | undefined,
  onDismiss: () => undefined,
  closeLabel: undefined as string | undefined,
  closeTimeout: undefined as any,
  closedTimestamp: undefined as number | undefined,
  positionClassName: undefined as string | undefined,
  customActions: undefined as CustomAction[] | undefined,
}

const useAlert: any = create(devtools((set: any, get: any) => ({
  ...initialState,

  reset: () => {
    set(initialState);
  },

  _alert: async (type: AlertType, message: string, {
    onDismiss,
    closeLabel,
    closeDelay,
    positionClassName,
    customActions,
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
    customActions?: any,
  } = {}) => {
    // console.log(">> hooks.alert.error", { message });
    if (closeDelay) {
      const { setCloseTimeout } = get();
      setCloseTimeout(closeDelay);
    }

    set({
      message,
      type: message && type,
      onDismiss,
      closeLabel,
      positionClassName,
      customActions
    });
  },

  error: async (message: string, {
    onDismiss,
    closeLabel,
    closeDelay,
    positionClassName,
    customActions,
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
    customActions?: any,
  } = {}) => {
    // console.log(">> hooks.alert.error", { message, closeDelay });
    get()._alert("error", message, { onDismiss, closeLabel, closeDelay, positionClassName, customActions });
  },

  warning: async (message: string, {
    onDismiss,
    closeLabel,
    closeDelay,
    positionClassName,
    customActions,
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
    customActions?: any,
  } = {}) => {
    // console.log(">> hooks.alert.warning", { message, closeDelay });
    get()._alert("warning", message, { onDismiss, closeLabel, closeDelay, positionClassName, customActions });
  },

  info: async (message: string, {
    onDismiss,
    closeLabel,
    closeDelay,
    positionClassName,
    customActions,
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
    customActions?: any,
  } = {}) => {
    // console.log(">> hooks.alert.info", { message });
    get()._alert("info", message, { onDismiss, closeLabel, closeDelay, positionClassName, customActions });
  },

  success: async (message: string, {
    onDismiss,
    closeLabel,
    closeDelay,
    positionClassName,
    customActions,
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
    customActions?: any,
  } = {}) => {
    // console.log(">> hooks.alert.success", { message });
    get()._alert("success", message, { onDismiss, closeLabel, closeDelay, positionClassName, customActions });
  },

  plain: async (message: string, {
    onDismiss,
    closeLabel,
    closeDelay,
    positionClassName,
    customActions,
  }: {
    onDismiss?: () => undefined,
    closeLabel?: string,
    closeDelay?: number,
    positionClassName?: string,
    customActions?: any
  } = {}) => {
    // console.log(">> hooks.alert.plain", { message, onDismiss, closeLabel, closeDelay });
    get()._alert("plain", message, { onDismiss, closeLabel, closeDelay, positionClassName, customActions });
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
