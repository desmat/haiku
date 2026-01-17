'use client'

import React, { FC, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import Sortable, { Swap } from 'sortablejs';
import { upperCaseFirstLetter } from "@desmat/utils/format";
import useHaikudle from '@/app/_hooks/haikudle';
import { Haiku } from "@/types/Haiku";
import { StyledLayers } from "./StyledLayers";

// Sortable.mount(new Swap());
// Mount the Swap plugin once globally
Sortable.mount(new Swap());

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
    haikudleId,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.swap,
    state.haikudleId,
  ]);

  const poem = inProgress

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

  interface ItemType {
    id: number;
    name: string;
    correct?: boolean;
  }

  const [state, setState] = useState<ItemType[]>(
    poem.map((s: string, i: number) => (
      poem[i].map((w: any, j: number) => (
        { id: `word-${i}-${j}`, name: `${i}-${j} ${w.word}`, word: w }
      ))
    )).flat()
  );

  const states = [
    useState<ItemType[]>(poem[0].map((w: any, j: number) => (
      { id: `word-${0}-${j}`, name: `${0}-${j} ${w.word}`, word: w }
    ))),
    useState<ItemType[]>(poem[1].map((w: any, j: number) => (
      { id: `word-${1}-${j}`, name: `${1}-${j} ${w.word}`, word: w }
    ))),
    useState<ItemType[]>(poem[2].map((w: any, j: number) => (
      { id: `word-${2}-${j}`, name: `${2}-${j} ${w.word}`, word: w }
    ))),
  ]



  /*
  
        <style
          dangerouslySetInnerHTML={{
            __html: `
                  .sortable-swap-highlight {
                    background-color: ${haiku?.bgColor || "#aaaaaa"};
                  }
                `
          }}
        />
        <ReactSortable
          group="the-group-name"
          list={state}
          setList={setState}
          swap
          _animation={150} // Optional: Adds a smooth animation
          _swapThreshold={0.65} // Optional: Percentage of target that triggers a swap
          _onEnd={console.log}
          onEnd={(e) => swap(
            haikudleId,
            poem[0][e.oldIndex], // selectedWord.word,
            0, // selectedWord.lineNumber,
            e.oldIndex, // selectedWord.wordNumber,
            0, // lineNumber,
            e.newIndex, // wordNumber,
          )}
        >
  
  */



  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
                  .sortable-swap-highlight {
                    background-color: red;
                  }
                `
        }}
      />

      {states.map((state, i: number) => (
        <div
          key={`${i}`}
        >
          <div
            className={`_bg-purple-200 flex flex-row items-center justify-start my-0 px-5 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-full select-none`}
            data-line={i}
            group={`all-lines`}
            list={state[0]}
            // setList={state[1]}
            setList={(l) => { console.log('setList', { i, l }); state[1](l); }}
            // swap
            _animation={150} // Optional: Adds a smooth animation
            _swapThreshold={0.65} // Optional: Percentage of target that triggers a swap
            onEnd={console.log}
            // onEnd={(e) => swap(
            //   haikudleId,
            //   poem[parseInt(e.from?.firstChild?.dataset?.line)][e.oldIndex], // selectedWord.word,
            //   parseInt(e.from?.firstChild?.dataset?.line), // selectedWord.lineNumber,
            //   e.oldIndex, // selectedWord.wordNumber,
            //   parseInt(e.to?.firstChild?.dataset?.line), // lineNumber,
            //   e.newIndex, // wordNumber,
            // )}
            // onEnd={(e) => console.log('asdf', { e, itemLine: e.item.firstChild.dataset.line, toLine: e.to.firstChild.dataset.line, fromLine: e.from.firstChild.dataset.line})}
          >
            {state[0].map((w: any, j: number) => (
              <div
                draggable
                key={w.id}
                data-line={i}
                data-word={j}
              >
                <span
                  _onMouseDown={() => !w?.correct && handleClickWord(w, i, j)}
                >
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
                          : false && 'snapshot.isDragging'
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
                        w?.name
                      }
                    </div>
                    {/* </StyledLayers> */}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

