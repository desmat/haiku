'use client'

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import useHaikudle from '@/app/_hooks/haikudle';
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
import { GenerateIcon } from "./Nav";
import { StyledLayers } from "./StyledLayers";

function HaikuPoem({ haiku, styles, selectedWord, setSelectedWord }: { haiku: Haiku, styles: any[], selectedWord: any, setSelectedWord: any }) {
  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { haiku });

  const [
    inProgress,
    solved,
    swap,
    haikudleId,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.solved,
    state.swap,
    state.haikudleId,
  ]);

  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
  const poem = isHaikudleMode ? inProgress : haiku.poem.map((line: string) => line.split(/\s+/).map((w: string) => { return { word: w } }));

  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { poem });

  const upperCaseFirstLetter = (s: string) => {
    if (!s || s.length == 0) return "";
    return s.substring(0, 1).toUpperCase() + s.substring(1);
  }

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
                  className={`_bg-purple-200 flex flex-row items-center justify-start my-0 px-2 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-fit ${i == 1 ? "sm:min-w-[24rem] md:min-w-[28rem] min-w-[18rem]" : "sm:min-w-[22rem] md:min-w-[24rem] min-w-[16rem]"}`}
                >
                  {poem[i].map((w: any, j: number) => {
                    return (
                      <Draggable
                        key={`word-${i}-${j}`}
                        // key={w.id}
                        draggableId={`word-${i}-${j}`}
                        // draggableId={w.id}
                        index={j}
                        isDragDisabled={!isHaikudleMode || w.correct}
                        shouldRespectForcePress={true}
                      // timeForLongPress={0}
                      >
                        {(provided, snapshot) => {
                          return (
                            <span
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onMouseDown={() => isHaikudleMode && !w.correct && handleClickWord(w, i, j)}
                            >
                              <StyledLayers key={i} styles={!isHaikudleMode || solved || w.correct ? styles : [styles[0]]}>
                                <div
                                  className={`px-1 ${!isHaikudleMode || solved || w.correct ? "" : "m-1"} transition-all ${!solved && !w.correct && "draggable-notsure-why-cant-inline"}`}
                                  style={{
                                    backgroundColor: (!isHaikudleMode || solved || w.correct)
                                      ? undefined
                                      : haiku?.bgColor || "lightgrey",
                                    filter: (!isHaikudleMode || solved || w.correct)
                                      ? undefined
                                      : snapshot.isDragging
                                        ? `drop-shadow(0px 1px 3px rgb(0 0 0 / 0.9))`
                                        : selectedWord?.word?.id == w.id
                                          ? `drop-shadow(0px 1px 2px rgb(0 0 0 / 0.9))`
                                          : selectedWord
                                            ? `drop-shadow(0px 1px 1px rgb(0 0 0 / 0.5))`
                                            : `drop-shadow(0px 1px 1px rgb(0 0 0 / 0.2))`,
                                  }}
                                >
                                  {j == 0 && w.correct &&
                                    upperCaseFirstLetter(w.word)
                                  }
                                  {!(j == 0 && w.correct) &&
                                    w.word
                                  }
                                </div>
                              </StyledLayers>
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

export default function HaikuPage({ haiku, styles }: { haiku?: Haiku, styles: any[] }) {
  // console.log('>> app._components.HaikuPage.render()', { haiku, id: haiku.id });

  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  const [
    loaded,
    load,
    inProgress,
    init,
    move,
    _haiku,
    haikudleId,
  ] = useHaikudle((state: any) => [
    state.loaded,
    state.load,
    state.inProgress,
    state.init,
    state.move,
    isHaikudleMode ? state.haiku : haiku,
    state.haikudleId,
  ]);

  // const [
  //   deleteHaiku,
  // ] = useHaikus((state: any) => [
  //   state.delete,
  // ])

  // TODO move to hook store
  const [selectedWord, setSelectedWord] = useState<any>();

  // console.log('>> app._components.HaikuPage.render()', { inProgress });

  const handleDragStart = (result: any) => {
    // console.log('>> app._components.HaikuPage.handleDragStart()', { result });

    setSelectedWord({
      word: inProgress.flat().find((w: any) => w.id == result.draggableId),
      lineNumber: Number(result.source.droppableId),
      wordNumber: result.source.index,
    });
  }

  const handleDragEnd = (result: any) => {
    // console.log('>> app._components.HaikuPage.handleDragEnd()', { result });

    move(
      haikudleId,
      inProgress.flat().find((w: any) => w.id == result.draggableId),
      Number(result.source.droppableId),
      result.source.index,
      Number(result.destination.droppableId),
      result.destination.index
    );
    setSelectedWord(undefined);
  }

  return (
    <div>
      {/* {user.isAdmin &&
        <div className="fixed top-12 right-2.5 z-20">
          <StyledLayers styles={styles}>
            <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); deleteHaiku(haiku.id); }}>
              <MdDelete className="_bg-orange-600 _hover: _text-purple-100 h-6 w-6 md:h-8 md:w-8" />
            </div>
          </StyledLayers>
        </div>
      } */}

      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
          style={{
            backgroundImage: `url("${_haiku?.bgImage}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "brightness(1.2)",
          }}
        />

        <div
          className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-10`}
        >
          <HaikuPoem haiku={_haiku} styles={styles} selectedWord={selectedWord} setSelectedWord={setSelectedWord} />
        </div>
      </DragDropContext>
    </div >
  )
}
