'use client'

import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import useHaikudle from '@/app/_hooks/haikudle';
import useUser from "@/app/_hooks/user";
import * as font from "@/app/font";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import HaikuPuzzle from "./HaikuPuzzle";
import Loading from "./Loading";

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
  // console.log('>> app._components.HaikudlePage.render()', { mode, id: haiku.id, poem: haiku.poem, haiku, onboardingElement});

  const [user] = useUser((state: any) => [state.user]);
  // TODO move to hook store
  const [selectedWord, setSelectedWord] = useState<any>();

  const [
    solved,
    inProgress,
    move,
    haikudleId,
    previousDailyHaikudleId,
  ] = useHaikudle((state: any) => [
    state.solved,
    state.inProgress,
    state.move,
    state.haikudleId,
    state.previousDailyHaikudleId,
  ]);

  // console.log('>> app._components.HaikudlePage.render()', { solved, haiku, inProgress });

  const blurCurve = [0, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20];
  const saturateCurve = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];

  const numWords = inProgress.flat().length;
  let numCorrectWords = previousDailyHaikudleId
    ? inProgress.flat().length
    : inProgress.flat().filter((word: any) => word?.correct).length;
  // if (numCorrectWords > 0) numCorrectWords = numCorrectWords + 1; // make the last transition more impactful
  let blurValue =
    solved || (!user?.isAdmin && haiku.createdBy == user?.id)
      ? blurCurve[0]
      : blurCurve[numWords - numCorrectWords];
  let saturateValue = solved || (!user?.isAdmin && haiku.createdBy == user?.id)
    ? saturateCurve[0]
    : saturateCurve[numWords - numCorrectWords];

  if (typeof (blurValue) != "number") {
    blurValue = blurCurve[blurCurve.length - 1];
  }
  if (typeof (saturateValue) != "number") {
    saturateValue = saturateCurve[saturateCurve.length - 1];
  }
  // console.log('>> app._components.HaikudlePage.render()', { numWords, numCorrectWords, blurValue });

  const handleDragStart = (result: any) => {
    // console.log('>> app._components.HaikudlePage.handleDragStart()', { result });

    setSelectedWord({
      word: inProgress.flat().find((w: any) => w?.id == result.draggableId),
      lineNumber: Number(result.source.droppableId),
      wordNumber: result.source.index,
    });
  }

  const handleDragEnd = (result: any) => {
    // console.log('>> app._components.HaikudlePage.handleDragEnd()', { result });

    setSelectedWord(undefined);

    if (result.destination && !(result.source.droppableId == result.destination.droppableId && result.source.index == result.destination.index)) {
      move(
        haikudleId,
        Number(result.source.droppableId),
        result.source.index,
        Number(result.destination.droppableId),
        result.destination.index
      );
    }
  }

  return (
    <div>
      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="_bg-pink-200 absolute top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
          style={{
            backgroundImage: `url("${haiku?.bgImage}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
            transition: "filter 0.5s ease-out",
          }}
        />
        <div className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[18pt] absolute top-0 left-0 right-0 bottom-[5vh] portrait:bottom-[12vh] m-auto w-fit h-fit ${onboardingElement && ["puzzle"].includes(onboardingElement) ? "z-50" : "z-10"} transition-all `}>
          {regenerating &&
            <Loading styles={styles} />
          }
          {!regenerating &&
            <div className="_bg-pink-200 onboarding-container">
              {onboardingElement == "puzzle" &&
                <div className="onboarding-focus double" />
              }
              <HaikuPuzzle
                haiku={haiku}
                styles={styles}
                selectedWord={selectedWord}
                setSelectedWord={setSelectedWord}
              />
            </div>
          }
        </div>
      </DragDropContext>
    </div >
  )
}
