import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AlertType } from '@/types/Alert';
import moment from 'moment';
import useAlert from './alert';
import { clear } from 'console';

const steps = [
  {
    focus: "",
    message: "TODO initial message<br/>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore <br/><br/>et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.<br/><br/> Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.<br/> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    positionClassName: "top-[50vh] -translate-y-1/2 left-3",
  },
  {
    focus: "poem",
    message: "TODO message for poem",
    positionClassName: "top-[10vh] left-3",
  },
  {
    focus: "poem-actions",
    message: "TODO message for poem-actions",
    positionClassName: "top-[20vh] left-3",
  },
  {
    focus: "logo",
    message: "TODO message logo",
    positionClassName: "top-[20vh] left-3",
  },
  {
    focus: "generate-icon",
    message: "TODO message generate-icon",
    positionClassName: "top-[20vh] left-3",
  },
  {
    focus: "side-panel",
    message: "TODO message side-panel",
    positionClassName: "bottom-[20vh] left-3",
  },
  {
    focus: "bottom-links",
    message: "TODO message for bottom-links",
    positionClassName: "bottom-[20vh] left-3",
  },
]

const initialState = {
  step: undefined as number | undefined,
  focus: undefined as string | undefined,
  message: undefined as string | undefined,
  interval: undefined as any,
}

const useOnboarding: any = create(devtools((set: any, get: any) => ({
  ...initialState,

  reset: () => {
    // console.log(">> hooks.useOnboarding.reset", {});
    return new Promise(async (resolve) => {
      set(initialState);
      resolve(true);
    })
  },

  nextStep: async () => {
    const { step, finish } = get();
    const nextStep = typeof (step) != "number"
      ? 0
      : step >= steps.length - 1
        // ? 0 cycle
        ? undefined
        : step + 1;

    console.log(">> hooks.useOnboarding.nextStep", { step, nextStep, steps });

    if (typeof (nextStep) != "number") {
      return finish();
    }

    set({
      step: nextStep,
      focus: typeof (nextStep) == "number" && steps[nextStep]?.focus,
      message: typeof (nextStep) == "number" && steps[nextStep]?.message,
    });

    useAlert.getState().plain(steps[nextStep]?.message, {
      onDismiss: finish,
      positionClassName: steps[nextStep]?.positionClassName,
    });

    return typeof (nextStep) == "number" && steps[nextStep];
  },

  start: async () => {
    const { nextStep } = get();

    const interval = setInterval(async () => {
      console.log(">> hooks.useOnboarding.start", {});
      nextStep();
    }, 2000);

    set({
      interval,
    })
  },

  finish: async () => {
    const { reset, interval } = get();
    console.log(">> hooks.useOnboarding.finish", { reset, interval });

    if (interval) {
      clearInterval(interval);
    }

    useAlert.getState().reset();
    return reset();
  }

})));

export default useOnboarding;
