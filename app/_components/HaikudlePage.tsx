'use client'

import useHaikudle from '@/app/_hooks/haikudle';
import useUser from "@/app/_hooks/user";
import * as font from "@/app/font";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import { bgImageRevealMs } from "./HaikuPage";
import HaikuPuzzle from "./HaikuPuzzle";
import Loading from "./Loading";

// The background clears as words fall into place. HaikuPage renders it, so it carries over from the loading page.
export function usePuzzleFilter(haiku?: Haiku) {
  const [user] = useUser((state: any) => [state.user]);

  const [
    solved,
    inProgress,
    previousDailyHaikudleId,
  ] = useHaikudle((state: any) => [
    state.solved,
    state.inProgress,
    state.previousDailyHaikudleId,
  ]);

  const blurCurve = [0, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20];
  const saturateCurve = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];

  const numWords = inProgress.flat().length;
  let numCorrectWords = previousDailyHaikudleId
    ? inProgress.flat().length
    : inProgress.flat().filter((word: any) => word?.correct).length;
  // if (numCorrectWords > 0) numCorrectWords = numCorrectWords + 1; // make the last transition more impactful
  let blurValue =
    solved || (!user?.isAdmin && haiku?.createdBy == user?.id)
      ? blurCurve[0]
      : blurCurve[numWords - numCorrectWords];
  let saturateValue = solved || (!user?.isAdmin && haiku?.createdBy == user?.id)
    ? saturateCurve[0]
    : saturateCurve[numWords - numCorrectWords];

  if (typeof (blurValue) != "number") {
    blurValue = blurCurve[blurCurve.length - 1];
  }
  if (typeof (saturateValue) != "number") {
    saturateValue = saturateCurve[saturateCurve.length - 1];
  }
  // console.log('app._components.HaikudlePage.usePuzzleFilter()', { numWords, numCorrectWords, blurValue });

  return { blur: blurValue, saturate: saturateValue };
}

export default function HaikudlePage({
  mode,
  haiku,
  styles,
  regenerating,
  onboardingElement,
}: {
  mode: ExperienceMode,
  haiku?: Haiku,
  styles: any[],
  regenerating?: boolean,
  onboardingElement?: string | undefined,
}) {
  // console.log('app._components.HaikudlePage.render()', { mode, id: haiku.id, poem: haiku.poem, haiku, onboardingElement});

  return (
    <div
      className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[18pt] absolute top-0 left-0 right-0 bottom-[5vh] portrait:bottom-[12vh] m-auto w-fit h-fit ${onboardingElement && ["puzzle"].includes(onboardingElement) ? "z-50" : "z-10"} transition-all `}
      // Mounts as the loading page ends: fades in as the background clears.
      // Here, not on a wrapper: a fading wrapper would stack it under the nav overlay.
      style={{ animation: `haiku-fade-in ${bgImageRevealMs}ms ease-out` }}
    >
      {regenerating &&
        <Loading styles={styles} />
      }
      {!regenerating &&
        <div className="_bg-pink-200 onboarding-container" data-testid="haikudle-puzzle">
          {onboardingElement == "puzzle" &&
            <div className="onboarding-focus double" />
          }
          <HaikuPuzzle
            mode={mode}
            haiku={haiku}
            styles={styles}
          />
        </div>
      }
    </div>
  )
}
