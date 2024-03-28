'use client'

import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import useHaikudle from '@/app/_hooks/haikudle';
import useUser from "@/app/_hooks/user";
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
import { StyledLayers } from "./StyledLayers";
import HaikuPoem from "./HaikuPoem";
import HaikuPuzzle from "./HaikuPuzzle";

export default function HaikuPage({
  mode,
  haiku,
  styles,
  altStyles,
  regenerateHaiku,
  regenerating,
  refresh,
}: {
  mode: string,
  haiku?: Haiku,
  styles: any[],
  altStyles?: any[],
  regenerateHaiku?: any,
  regenerating?: boolean,
  refresh?: any,
}) {
  // console.log('>> app._components.HaikuPage.render()', { mode, haiku, id: haiku.id });

  const [user] = useUser((state: any) => [state.user]);
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

  const isHaikudleMode = mode == "haikudle";
  const isLyricleMode = mode == "lyricle";
  const notPuzzleMode = !(isHaikudleMode || isLyricleMode)
    || ((isHaikudleMode || isLyricleMode) && solved)
    || ((isHaikudleMode || isLyricleMode) && previousDailyHaikudleId && !user.isAdmin)
    || ((isHaikudleMode || isLyricleMode) && haiku.createdBy == user?.id && !user?.isAdmin)

  const _haiku = (isHaikudleMode || isLyricleMode) && solved
    ? {
      ...haiku,
      poem: inProgress
        .map((line: any) => line
          .map((word: any) => word.word)
          .join(" "))
    }
    : haiku;


  // TODO move to hook store
  const [selectedWord, setSelectedWord] = useState<any>();
  // console.log('>> app._components.HaikuPage.render()', { solved, isPuzzleMode, haiku, inProgress, _haiku });

  const handleDragStart = (result: any) => {
    // console.log('>> app._components.HaikuPage.handleDragStart()', { result });

    setSelectedWord({
      word: inProgress.flat().find((w: any) => w?.id == result.draggableId),
      lineNumber: Number(result.source.droppableId),
      wordNumber: result.source.index,
    });
  }

  const handleDragEnd = (result: any) => {
    // console.log('>> app._components.HaikuPage.handleDragEnd()', { result });

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

  const blurCurve = ["lyricle", "social-img-lyricle"].includes(mode)
    ? [0, 1, 2.5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    : [0, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];
  const saturateCurve = ["lyricle", "social-img-lyricle"].includes(mode)
    ? [0.8, 1, 1.2, 1.3, 1.35, 1.45, 1.5, 1.55, 1.6]
    : [1];
  const numWords = inProgress.flat().length;
  let numCorrectWords = previousDailyHaikudleId
    ? inProgress.flat().length
    : inProgress.flat().filter((word: any) => word.correct).length;
  // if (numCorrectWords > 0) numCorrectWords = numCorrectWords + 1; // make the last transition more impactful
  let blurValue = mode == "social-img-lyricle"
    ? blurCurve[blurCurve.length - 1]
    : solved || (!user?.isAdmin && haiku.createdBy == user?.id)
      ? blurCurve[0]
      : blurCurve[numWords - numCorrectWords];
  let saturateValue = mode == "social-img-lyricle"
    ? saturateCurve[saturateCurve.length - 1]
    : solved || (!user?.isAdmin && haiku.createdBy == user?.id)
      ? saturateCurve[0]
      : saturateCurve[numWords - numCorrectWords];

  if (typeof (blurValue) != "number") {
    blurValue = blurCurve[blurCurve.length - 1];
  }
  if (typeof (saturateValue) != "number") {
    saturateValue = saturateCurve[saturateCurve.length - 1];
  }
  // console.log('>> app._components.HaikuPage.render()', { numWords, numCorrectWords, blurValue });

  return (
    <div>
      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="bar fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
          style={{
            backgroundImage: `url("${_haiku?.bgImage}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
            transition: "filter 0.5s ease-out",
          }}
        />


        <div className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[16pt] fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-10 transition-all `}>
          {regenerating &&
            <div className="relative opacity-30">
              <StyledLayers styles={styles}>
                <div className="animate-pulse">
                  Generating...
                </div>
              </StyledLayers>
            </div>
          }
          {!regenerating && !["social-img", "social-img-lyricle"].includes(mode) &&
            <div className="_bg-pink-200 relative">
              {notPuzzleMode &&
                <HaikuPoem
                  user={user}
                  mode={mode}
                  haiku={_haiku}
                  solved={solved}
                  styles={styles}
                  altStyles={altStyles}
                  regenerate={regenerateHaiku}
                  refresh={refresh}
                />
              }
              {!notPuzzleMode &&
                <HaikuPuzzle
                  haiku={_haiku}
                  styles={styles}
                  selectedWord={selectedWord}
                  setSelectedWord={setSelectedWord}
                />
              }
            </div>
          }
        </div>
      </DragDropContext>
    </div >
  )
}
