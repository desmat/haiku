'use client'

import { useEffect, useLayoutEffect, useRef, useState, type DragEvent } from "react";
import { upperCaseFirstLetter } from "@desmat/utils/format";
import useHaikudle from '@/app/_hooks/haikudle';
import { Haiku } from "@/types/Haiku";
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
  // console.log('app._components.HaikuPage.HaikuPoem.render()', { haiku });
  const [
    inProgress,
    swap,
    haikudleId,
    moves,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.swap,
    state.haikudleId,
    state.moves,
  ]);

  const poem = inProgress
  const [draggingWord, setDraggingWord] = useState<any>();
  const [dragOverWordId, setDragOverWordId] = useState<string>();
  const [idleDragHint, setIdleDragHint] = useState<any>();
  const [layoutAnimation, setLayoutAnimation] = useState<any>();
  const ignoreNextClick = useRef(false);
  const dragActivityOccurred = useRef(false);
  const poemRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const preSwapPoemRect = useRef<DOMRect>();
  const preSwapRects = useRef<{ [key: string]: DOMRect }>({});
  const preSwapTargetWordId = useRef<string>();

  // console.log('app._components.HaikuPage.HaikuPoem.render()', { poem, solved });

  const handleClickWord = (word: any, lineNumber: number, wordNumber: number) => {
    // console.log('app._components.HaikuPage.handleClickWord()', { word, lineNumber, wordNumber });
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }

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

  const handleDragStart = (event: DragEvent, word: any, lineNumber: number, wordNumber: number) => {
    if (word?.correct) return;

    const dragWord = { word, lineNumber, wordNumber };
    dragActivityOccurred.current = true;
    ignoreNextClick.current = true;
    setIdleDragHint(undefined);
    setDraggingWord(dragWord);
    setSelectedWord(dragWord);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", word?.id || "");
  }

  const handleDragOver = (event: DragEvent, word: any) => {
    if (!draggingWord || word?.correct || draggingWord.word?.id == word?.id) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverWordId(word?.id);
  }

  const handleDragLeave = (word: any) => {
    if (dragOverWordId == word?.id) {
      setDragOverWordId(undefined);
    }
  }

  const handleDrop = (event: DragEvent, word: any, lineNumber: number, wordNumber: number) => {
    event.preventDefault();

    if (draggingWord && !word?.correct && draggingWord.word?.id != word?.id) {
      preSwapTargetWordId.current = word?.id;
      preSwapPoemRect.current = poemRef.current?.getBoundingClientRect();
      preSwapRects.current = Object.fromEntries(
        Object.entries(wordRefs.current)
          .filter((entry): entry is [string, HTMLSpanElement] => Boolean(entry[1]))
          .map(([wordId, el]) => [wordId, el.getBoundingClientRect()])
      );

      swap(
        haikudleId,
        draggingWord.word,
        draggingWord.lineNumber,
        draggingWord.wordNumber,
        lineNumber,
        wordNumber,
      );
    }

    setSelectedWord(undefined);
    setDraggingWord(undefined);
    setDragOverWordId(undefined);
  }

  useEffect(() => {
    dragActivityOccurred.current = false;
    setIdleDragHint(undefined);
  }, [haikudleId]);

  useEffect(() => {
    if (dragActivityOccurred.current || draggingWord || idleDragHint || layoutAnimation) return;

    const timeout = window.setTimeout(() => {
      if (dragActivityOccurred.current) return;

      const unsolvedWords = poem
        .flatMap((line: any[], lineNumber: number) => line
          .map((word: any, wordNumber: number) => ({ word, lineNumber, wordNumber })))
        .filter(({ word }: any) => word?.id && !word?.correct);

      if (unsolvedWords.length < 2) return;

      const target = unsolvedWords[0];
      const sourceCandidates = unsolvedWords.slice(1);
      const source = sourceCandidates[Math.floor(Math.random() * sourceCandidates.length)];
      const sourceRect = wordRefs.current[source.word.id]?.getBoundingClientRect();
      const targetRect = wordRefs.current[target.word.id]?.getBoundingClientRect();

      if (!sourceRect || !targetRect) return;

      setIdleDragHint({
        wordId: source.word.id,
        dx: ((targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2)) * 1 / 2,
        dy: ((targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2)) * 1 / 2,
        returning: false,
      });
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [draggingWord, haikudleId, idleDragHint, layoutAnimation, poem]);

  useEffect(() => {
    if (!idleDragHint) return;

    if (idleDragHint.returning) {
      const clearTimeoutId = window.setTimeout(() => {
        setIdleDragHint(undefined);
      }, 500);

      return () => window.clearTimeout(clearTimeoutId);
    }

    const returnTimeout = window.setTimeout(() => {
      setIdleDragHint({
        ...idleDragHint,
        returning: true,
      });
    }, 650);

    return () => window.clearTimeout(returnTimeout);
  }, [idleDragHint]);

  useLayoutEffect(() => {
    const rects = preSwapRects.current;
    const previousPoemRect = preSwapPoemRect.current;
    if (!Object.keys(rects).length && !previousPoemRect) return;

    const newPoemRect = poemRef.current?.getBoundingClientRect();
    const poemOffset = previousPoemRect && newPoemRect
      ? {
        dx: previousPoemRect.left - newPoemRect.left,
        dy: previousPoemRect.top - newPoemRect.top,
      }
      : undefined;

    const offsets = Object.fromEntries(
      Object.entries(rects)
        .map(([wordId, rect]) => {
          const newRect = wordRefs.current[wordId]?.getBoundingClientRect();
          if (!newRect) return undefined;

          const dx = rect.left - newRect.left - (poemOffset?.dx || 0);
          const dy = rect.top - newRect.top - (poemOffset?.dy || 0);
          if (!dx && !dy) return undefined;

          return [wordId, { dx, dy }];
        })
        .filter(Boolean) as [string, { dx: number, dy: number }][]
    );

    preSwapRects.current = {};
    preSwapPoemRect.current = undefined;
    const targetWordId = preSwapTargetWordId.current;
    preSwapTargetWordId.current = undefined;
    if (!Object.keys(offsets).length && !poemOffset?.dx && !poemOffset?.dy) return;

    setLayoutAnimation({
      offsets,
      poemOffset,
      targetWordId,
      settling: true,
    });
  }, [moves]);

  useEffect(() => {
    if (!layoutAnimation) return;

    if (layoutAnimation.settling) {
      const frame = window.requestAnimationFrame(() => {
        setLayoutAnimation({
          ...layoutAnimation,
          settling: false,
        });
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const timeout = window.setTimeout(() => {
      setLayoutAnimation(undefined);
    }, 240);

    return () => window.clearTimeout(timeout);
  }, [layoutAnimation]);

  const handleDragEnd = () => {
    setSelectedWord(undefined);
    setDraggingWord(undefined);
    setDragOverWordId(undefined);
    window.setTimeout(() => {
      ignoreNextClick.current = false;
    }, 0);
  }

  return (
    <div
      ref={poemRef}
      className={layoutAnimation?.settling ? "transition-none" : "transition-transform duration-[200ms] ease-out"}
      style={{
        transform: layoutAnimation?.poemOffset && layoutAnimation.settling
          ? `translate(${layoutAnimation.poemOffset.dx}px, ${layoutAnimation.poemOffset.dy}px)`
          : undefined,
      }}
    >
      {poem.map((s: string, i: number) => {
        return (
          <div
            key={`${i}`}
            className={`_bg-purple-200 flex flex-row items-center justify-start my-0 px-5 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-full select-none`}
          >
            {poem[i].map((w: any, j: number) => {
              const isDragging = draggingWord?.word?.id == w?.id;
              const isDragTarget = dragOverWordId == w?.id;
              const isIdleDragHint = idleDragHint?.wordId == w?.id;
              const layoutOffset = layoutAnimation?.offsets?.[w?.id];
              const isDisplacedTarget = layoutAnimation?.targetWordId == w?.id;
              return (
                <span
                  key={w?.id || `${i}-${j}`}
                  ref={(el) => {
                    if (w?.id) wordRefs.current[w.id] = el;
                  }}
                  draggable={!w?.correct}
                  onClick={() => !w?.correct && handleClickWord(w, i, j)}
                  onDragStart={(event) => handleDragStart(event, w, i, j)}
                  onDragOver={(event) => handleDragOver(event, w)}
                  onDragLeave={() => handleDragLeave(w)}
                  onDrop={(event) => handleDrop(event, w, i, j)}
                  onDragEnd={handleDragEnd}
                >
                  {/* <StyledLayers key={i} styles={w?.correct ? styles : [styles[0]]}> */}
                  <div
                    style={styles[0]}
                  >
                    <div
                      className={`px-1 ${w?.correct ? "" : "m-1"} ${layoutAnimation?.settling ? "transition-none" : isIdleDragHint ? "transition-transform duration-[650ms] ease-in-out" : isDisplacedTarget ? "transition-all duration-[240ms] ease-out" : "transition-all duration-[200ms] ease-out"} ${!w?.correct && "cursor-grab active:cursor-grabbing draggable-notsure-why-cant-inline"}`}
                      style={{
                        transitionTimingFunction: isIdleDragHint && idleDragHint.returning
                          ? "cubic-bezier(.34, 1.56, .64, 0.95)"
                          : undefined,
                        transitionDuration: isIdleDragHint && idleDragHint.returning
                          ? "300ms"
                          : undefined,
                        backgroundColor: w?.correct
                          ? undefined
                          : haiku?.bgColor || "lightgrey",
                        transform: layoutOffset && layoutAnimation.settling
                          ? `translate(${layoutOffset.dx}px, ${layoutOffset.dy}px)`
                          : isIdleDragHint && !idleDragHint.returning
                            ? `translate(${idleDragHint.dx}px, ${idleDragHint.dy}px)`
                          : isDragTarget
                            ? "translateY(-2px) scale(1.04)"
                            : undefined,
                        opacity: isDragTarget ? 0.35 : undefined,
                        outline: isDragTarget ? "1px solid rgb(0 0 0 / 0.35)" : undefined,
                        filter: w?.correct
                          ? undefined
                          : isDragging || selectedWord?.word?.id == w?.id || isDragTarget
                            ? `drop-shadow(0px 3px 5px rgb(0 0 0 / 1))`
                            : selectedWord || draggingWord
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
            })}
          </div>
        )
      })}
    </div>
  )
}
