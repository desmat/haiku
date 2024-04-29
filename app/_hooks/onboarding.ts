import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import useAlert from './alert';
import { OnboardingStep } from '@/types/Onboarding';

const initialState = {
  steps: undefined as OnboardingStep[] | undefined,
  step: undefined as number | undefined,
  focus: undefined as string | undefined,
  message: undefined as string | undefined,
  interval: undefined as any,
  onDismiss: undefined as (() => void) | undefined,
  onComplete: undefined as (() => void) | undefined,
}

const useOnboarding: any = create(devtools((set: any, get: any) => ({
  ...initialState,

  reset: () => {
    set(initialState);
  },

  nextStep: async () => {
    const { steps, step, nextStep, finish, onDismiss, onComplete } = get();
    const nextStepOffset = typeof (step) != "number"
      ? 0
      : step >= steps.length - 1
        // ? 0 cycle
        ? undefined
        : step + 1;
    const done = typeof (nextStepOffset) != "number";    
    const lastStep = !done && nextStepOffset >= steps.length - 1;

    // console.log(">> hooks.useOnboarding.nextStep", { step, nextStepOffset, done, lastStep, steps, onDismiss, onComplete });

    if (done) {
      return //finish();
    }

    set({
      step: nextStepOffset,
      focus: typeof (nextStepOffset) == "number" && steps[nextStepOffset]?.focus,
      message: typeof (nextStepOffset) == "number" && steps[nextStepOffset]?.message,
    });

    useAlert.getState().plain(steps[nextStepOffset]?.message, {
      onDismiss: () => {
        // console.log("hooks.useOnboarding.nextStep onDismiss", { lastStep, onComplete, onDismiss })
        onComplete && lastStep 
          ? onComplete()
          : onDismiss && onDismiss();
        finish();
      },
      style: steps[nextStepOffset]?.style,
      customActions: [
        {
          label: "Close",
          action: "close"
        },
        !lastStep && {
          label: `Next (${nextStepOffset + 1}/${steps.length})`,
          action: nextStep,
        },
      ]
    });

    return typeof (nextStepOffset) == "number" && steps[nextStepOffset];
  },

  start: async (steps: OnboardingStep[], onDismiss?: () => void | undefined, onComplete?: () => void | undefined) => {
    const { nextStep } = get();

    // const interval = setInterval(async () => {
    //   console.log(">> hooks.useOnboarding.start", { steps });
    //   nextStep();
    // }, 2000);

    // avoid race condition
    setTimeout(async () => {
      // console.log(">> hooks.useOnboarding.start", { onDismiss, onComplete });
      nextStep();
    }, 100);

    set({
      steps,
      onDismiss,
      onComplete,
      // interval,
    });
  },

  finish: async () => {
    const { reset, interval } = get();
    // console.log(">> hooks.useOnboarding.finish", { reset, interval });

    if (interval) {
      clearInterval(interval);
    }

    useAlert.getState().reset();
    return reset();
  }

})));

export default useOnboarding;
