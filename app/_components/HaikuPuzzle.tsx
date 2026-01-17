'use client'

import { upperCaseFirstLetter } from "@desmat/utils/format";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useEffect, useRef } from "react";
import useHaikudle from '@/app/_hooks/haikudle';
import { Haiku } from "@/types/Haiku";

export default function HaikuPuzzle({
  haiku,
  styles,
  selectedWord,
  setSelectedWord,
}: {
  haiku: Haiku,
  styles: any[],
  selectedWord: any,
  setSelectedWord: any,
}) {
  // console.log('app._components.HaikuPage.HaikuPoem.render()', { haiku });
  const [
    inProgress,
    swap,
    cleanupMove,
    haikudleId,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.swap,
    state.cleanupMove,
    state.haikudleId,
  ]);

  const poem = inProgress

  const moveFromRef = useRef<any>();
  const moveToRef = useRef<any>();

  // console.log('app._components.HaikuPage.HaikuPoem.render()', { poem, solved });

  const handleClickWord = (word: any, lineNumber: number, wordNumber: number) => {
    // console.log('app._components.HaikuPage.handleClickWord()', { word, lineNumber, wordNumber });

    if (word.id == selectedWord?.word?.id) {
      setSelectedWord(undefined);
    } else if (selectedWord) {
      swap(
        haikudleId,
        selectedWord.word,
        selectedWord.lineNumber,
        selectedWord.wordNumber,
        lineNumber,
        wordNumber,
      );
      setSelectedWord(undefined);
    } else {
      setSelectedWord({
        word,
        lineNumber,
        wordNumber,
      });
    }
  }

  useEffect(() => {
    if (moveFromRef.current && moveToRef.current) {
      const { x: fromX, y: fromY, height: fromHeight } = moveFromRef.current?.getBoundingClientRect()
      const { x: toX, y: toY } = moveToRef.current?.getBoundingClientRect()

      moveFromRef.current.style.position = "absolute";
      moveFromRef.current.style.top = `calc(-${fromHeight}px / 2 - 4px)`;
      moveFromRef.current.style.left = `0px`;
      moveFromRef.current.style["transition-property"] = "transform";
      moveFromRef.current.style["transition-duration"] = "250ms";
      moveFromRef.current.style.transform = `translate(${toX - fromX}px, ${toY - fromY}px)`;

      setTimeout(cleanupMove, 350);
    }
  }, [JSON.stringify(poem)])

  return (
    <>
      {poem.map((s: string, i: number) => {
        return (
          <Droppable
            key={`${i}`}
            droppableId={`${i}`}
            direction="horizontal"
          >
            {(provided, snapshot) => {
              return (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`_bg-purple-200 flex flex-row items-center justify-start my-0 px-5 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-full select-none`}
                >
                  {poem[i].map((w: any, j: number) => {
                    return (
                      <Draggable
                        key={`word-${i}-${j}`}
                        draggableId={`word-${i}-${j}`}
                        index={j}
                        isDragDisabled={w?.correct}
                        shouldRespectForcePress={true}
                      // timeForLongPress={0}
                      >
                        {(provided, snapshot) => {
                          return (
                            <span
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onMouseDown={() => !w?.correct && handleClickWord(w, i, j)}
                            >
                              {/* <StyledLayers key={i} styles={w?.correct ? styles : [styles[0]]}> */}
                              <div
                                style={styles[0]}
                                className="relative"
                              >
                                <div
                                  className={`px-1 ${w?.correct ? "" : "m-1"} _transition-all ${!w?.correct && "draggable-notsure-why-cant-inline"}`}
                                  ref={w.moveFrom ? moveFromRef : w.moveTo ? moveToRef : undefined}
                                  style={{
                                    backgroundColor: w?.correct
                                      ? undefined
                                      : haiku?.bgColor || "lightgrey",
                                    // outline: w.moveFrom ? "yellow 2px solid" : w.moveTo ? "red 2px solid" : undefined,
                                    opacity: w.moveTo ? "0" : undefined,
                                    filter: w?.correct
                                      ? undefined
                                      : snapshot.isDragging
                                        ? `drop-shadow(0px 3px 5px rgb(0 0 0 / 1))`
                                        : selectedWord?.word?.id == w?.id
                                          ? `drop-shadow(0px 3px 5px rgb(0 0 0 / 1))`
                                          : selectedWord
                                            ? `drop-shadow(0px 2px 3px rgb(0 0 0 / 0.5))`
                                            : `drop-shadow(0px 2px 3px rgb(0 0 0 / 0.5))`,
                                  }}
                                >
                                  {j == 0 && w?.correct &&
                                    upperCaseFirstLetter(w?.word)
                                  }
                                  {!(j == 0 && w?.correct) &&
                                    w?.word
                                  }
                                </div>
                                {/* </StyledLayers> */}
                              </div>
                            </span>
                          )
                        }}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )
            }}
          </Droppable>
        )
      })}
    </>
  )
}

