'use client'

// import { useEffect, useState } from 'react';
import { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { FaMagic } from "react-icons/fa";
import { syllable } from 'syllable'
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
import { StyledLayers } from "./StyledLayers";
import shuffleArray from "@/utils/shuffleArray";
import useHaikudle from '../_hooks/haikudle';
import { GenerateIcon } from './Nav';
// import { useState } from "react";


export default function HaikuPage({ haiku, styles }: { haiku?: Haiku, styles: any[] }) {
  console.log('>> app._components.HaikuPage.render()', { poem: haiku.poem, id: haiku.id });

  const [
    inProgress,
    words,
    solved,
    init,
    pick,
    remove,
    solve,
    move,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.words,
    state.solved,
    state.init,
    state.pick,
    state.remove,
    state.solve,
    state.move,
  ]);

  const someCorrect = inProgress.flat().reduce((a: boolean, m: any, i: number) => a || m.correct, false);

  console.log('>> app._components.HaikuPage.render()', { inProgress: JSON.stringify(inProgress), words: JSON.stringify(words) });

  const upperCaseFirstLetter = (s: string) => {
    if (!s || s.length == 0) return "";
    return s.substring(0, 1).toUpperCase() + s.substring(1);
  }

  const countSyllables = (s: string) => {
    // @ts-ignore
    const r = s.split(/\s+/).reduce((total: number, v: string) => {
      // @ts-ignore
      const v2 = v.toLowerCase().replace(/[,.]/, "");
      // @ts-ignore
      // console.log('>> app._components.HaikuPage.countSyllables()', { v, v2, c: syllable(v2) });
      // @ts-ignore
      return total + (syllable(v2) || 0);
    }, 0);

    // console.log('>> app._components.HaikuPage.countSyllables()', { r });
    return r;
  }

  const onDragEnd = (result: any) => {
    move(
      inProgress.flat().find((w: any) => w.id == result.draggableId), 
      Number(result.source.droppableId), 
      result.source.index, 
      Number(result.destination.droppableId),
      result.destination.index)
  }

  // const handleClickInProgress = (line: number, slot: number) => {
  //   const prev = inProgress[line][slot];
  //   const word = {
  //     "word": "onetwo",
  //     "offset": 2,
  //     syllables: 2,
  //     "correct": true
  //   };
  //   const placeholder = {
  //     "word": "placeholder",
  //     offset: slot,
  //     placeholder: true,
  //   };

  //   //@ts-ignore
  //   if (prev?.placeholder) {
  //     // here we either replace placeholders, or push non-placeholders
  //     inProgress[line].splice(slot, 0, word);
  //     // eat up following placeholders
  //     //@ts-ignore
  //     for (let i = 0; inProgress[line][slot + 1]?.placeholder && i < word.syllables; i++) {
  //       inProgress[line].splice(slot + 1, 1);
  //     }
  //   } else {
  //     // here we want to fill the removed slot with placeholders, 
  //     // but not exceeding poem's structure (slot is a syllable)
  //     const maxSyllables = line == 1 ? 7 : 5;
  //     console.log("*** ", { inProgress });

  //     const totalSyllables = inProgress[line].reduce((t: any, w: any) => {
  //       return t + (w.placeholder ? 1 : w.syllables || 0);
  //     }, 0) - (inProgress[line][slot]?.syllables || 0); // we're about to remove that last one
  //     const syllables = word.syllables || 0;
  //     const numPlaceholders = Math.max(0, Math.min(syllables, maxSyllables - totalSyllables))
  //     // console.log("*** ", { inProgress, maxSyllables, slot, totalSyllables, syllables, numPlaceholders });

  //     inProgress[line] = [
  //       ...inProgress[line].slice(0, slot),
  //       ...Array(numPlaceholders).fill(placeholder),
  //       ...inProgress[line].slice(slot + 1),
  //     ];
  //   }

  //   setInProgress(inProgress);
  // }

  useEffect(() => {
    init(haiku);
  }, [haiku.id]);

  // console.log('>> app._components.HaikuPage.render()', { words });

  // const [colorOffsets, setColorOffsets] = useState({ front: -1, back: -1 });

  // const fontColor = haiku?.colorPalette && colorOffsets.front >= 0 && haiku.colorPalette[colorOffsets.front] || haiku?.color || "#555555";
  const fontColor = haiku?.color || "#555555";

  // const bgColor = haiku?.colorPalette && colorOffsets.back >= 0 && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";
  const bgColor = haiku?.bgColor || "lightgrey";

  return (
    <div>
      <DragDropContext
        onDragEnd={onDragEnd}
      >
        <div
          className="fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
          style={{
            backgroundImage: `url("${haiku.bgImage}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "brightness(1.2)",
          }}
        />

        <div
          // className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-10`}
          // className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          className="fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-10"
        >
          {haiku.poem.map((s: string, i: number) => {
            return (
              <Droppable
                key={`${i}`}
                droppableId={`${i}`}
                direction="horizontal"
              >
                {(provided, snapshot) => {
                  return (
                    <div
                      // key={`line-${i}`}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`_bg-purple-200 capitalize-first-letter _relative flex flex-row items-center justify-start my-0 px-2 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-fit ${i == 1 ? "sm:min-w-[24rem] md:min-w-[28rem] min-w-[18rem]" : "sm:min-w-[22rem] md:min-w-[24rem] min-w-[16rem]"}`}
                      // style={{
                      //   backgroundColor: solved || someCorrect
                      //     ? undefined
                      //     : haiku?.bgColor || "lightgrey",
                      // }}
                    >
                      {inProgress[i].map((w: any, j: number) => {
                        return (
                          <Draggable
                            // key={`word-${i}-${j}`}
                            key={w.id}
                            // draggableId={`word-${i}-${j}`}
                            draggableId={w.id}
                            index={j}
                            isDragDisabled={w.correct}
                          >
                            {(provided, snapshot) => {
                              return (
                                <span
                                  // key={j}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={!solved && !w.correct && i > 0 ? "cursor-pointer" : ""}
                                // onClick={() => !solved && !w.correct && i > 0 ? remove(i, j) : undefined}
                                // onClick={() => handleClickInProgress(i, j)}
                                >
                                  <StyledLayers key={i} styles={solved || w.correct ? styles : [styles[0]]}>
                                    <div
                                      className={`px-1 ${w.correct ? "" : "m-1"}`}
                                      style={{
                                        backgroundColor: solved || w.correct
                                          ? undefined
                                          : haiku?.bgColor || "lightgrey"
                                      }}
                                    >
                                      {j == 0 &&
                                        upperCaseFirstLetter(w.word)
                                      }
                                      {j != 0 &&
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
        </div>
      </DragDropContext>
    </div>
  )
}
