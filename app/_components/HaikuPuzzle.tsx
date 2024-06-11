'use client'

import { Draggable, Droppable } from "@hello-pangea/dnd";
import useHaikudle from '@/app/_hooks/haikudle';
import { Haiku } from "@/types/Haiku";
import { upperCaseFirstLetter } from "@/utils/format";
import { StyledLayers } from "./StyledLayers";

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
  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { haiku });
  const [
    inProgress,
    swap,
    haikudleId,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.swap,
    state.haikudleId,
  ]);

  const poem = inProgress

  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { poem, solved });

  const handleClickWord = (word: any, lineNumber: number, wordNumber: number) => {
    // console.log('>> app._components.HaikuPage.handleClickWord()', { word, lineNumber, wordNumber });

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
                              >
                                <div
                                  className={`px-1 ${w?.correct ? "" : "m-1"} transition-all ${!w?.correct && "draggable-notsure-why-cant-inline"}`}
                                  style={{
                                    backgroundColor: w?.correct
                                      ? undefined
                                      : haiku?.bgColor || "lightgrey",
                                    filter: w?.correct
                                      ? undefined
                                      : snapshot.isDragging
                                        ? `drop-shadow(0px 1px 5px rgb(0 0 0 / 0.9))`
                                        : selectedWord?.word?.id == w?.id
                                          ? `drop-shadow(0px 1px 3px rgb(0 0 0 / 0.9))`
                                          : selectedWord
                                            ? `drop-shadow(0px 1px 1px rgb(0 0 0 / 0.5))`
                                            : `drop-shadow(0px 1px 1px rgb(0 0 0 / 0.2))`,
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

