'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { upperCaseFirstLetter } from "@desmat/utils/format";
import useHaikudle from '@/app/_hooks/haikudle';
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import HaikuTitle from "./HaikuTitle";
import { StyledLayers } from "./StyledLayers";

export default function HaikuPuzzle({
  mode,
  haiku,
  styles,
}: {
  mode: ExperienceMode,
  haiku: Haiku,
  styles: any[],
}) {
  // console.log('app._components.HaikuPage.HaikuPoem.render()', { haiku });
  const [
    inProgress,
    swap,
    haikudleId,
    moves,
    solved,
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.swap,
    state.haikudleId,
    state.moves,
    state.solved,
  ]);

  const poem = inProgress
  const [pointerPress, setPointerPress] = useState<any>();
  const [pointerPreview, setPointerPreview] = useState<any>();
  const [draggingWord, setDraggingWord] = useState<any>();
  const [pointerDrag, setPointerDrag] = useState<any>();
  const [dragOverTarget, setDragOverTarget] = useState<any>();
  const [idleDragHint, setIdleDragHint] = useState<any>();
  const [idleDragOverWordId, setIdleDragOverWordId] = useState<string>();
  const [layoutAnimation, setLayoutAnimation] = useState<any>();
  // the solved "flash" (full glow layers + title) waits for the final drop
  // animation to finish; solvedFlash starts true when loading an
  // already-solved haikudle
  const [solvedFlash, setSolvedFlash] = useState(!!solved);
  const pendingSolvedFlash = useRef(false);
  const dragActivityOccurred = useRef(false);
  const poemRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const wordTileRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hiddenSourceRef = useRef<HTMLSpanElement | null>(null);
  const preSwapPoemRect = useRef<DOMRect>();
  const preSwapRects = useRef<{ [key: string]: DOMRect }>({});
  const preSwapTargetWordId = useRef<string>();
  const preSwapDroppedWordId = useRef<string>();
  const preSwapIncorrectWordIds = useRef<Set<string>>();
  const idleHintShown = useRef(false);

  // console.log('app._components.HaikuPage.HaikuPoem.render()', { poem, solved });

  const swapDraggedWord = useCallback((dragWord: any, word: any, lineNumber: number, wordNumber: number) => {
    if (dragWord && !word?.correct && dragWord.word?.id != word?.id) {
      preSwapTargetWordId.current = word?.id;
      preSwapDroppedWordId.current = dragWord.word?.id;
      preSwapIncorrectWordIds.current = new Set(
        poem
          .flat()
          .filter((w: any) => w?.id && !w?.correct)
          .map((w: any) => w.id)
      );
      preSwapPoemRect.current = poemRef.current?.getBoundingClientRect();
      preSwapRects.current = Object.fromEntries(
        Object.entries(wordRefs.current)
          .filter((entry): entry is [string, HTMLSpanElement] => Boolean(entry[1]))
          .map(([wordId, el]) => [wordId, el.getBoundingClientRect()])
      );

      // both words already previewed the swap during the drag: the dropped
      // word settles from where it was released, and the displaced word from
      // the vacated slot its ghost was shown in
      const vacatedRect = preSwapRects.current[dragWord.word?.id];
      if (dragWord.word?.id) {
        preSwapRects.current[dragWord.word.id] = {
          left: dragWord.x - dragWord.offsetX,
          top: dragWord.y - dragWord.offsetY,
        } as DOMRect;
      }
      if (word?.id && vacatedRect) {
        preSwapRects.current[word.id] = {
          left: vacatedRect.left,
          top: vacatedRect.top,
        } as DOMRect;
      }

      swap(
        haikudleId,
        dragWord.word,
        dragWord.lineNumber,
        dragWord.wordNumber,
        lineNumber,
        wordNumber,
      );
    }
  }, [haikudleId, poem, swap]);

  const getPointerTarget = useCallback((clientX: number, clientY: number) => {
    const targetEl = document
      .elementFromPoint(clientX, clientY)
      ?.closest("[data-word-id]") as HTMLElement | null;
    const lineNumber = Number(targetEl?.dataset?.lineNumber);
    const wordNumber = Number(targetEl?.dataset?.wordNumber);
    const word = poem[lineNumber]?.[wordNumber];

    if (!targetEl || !word || word?.id != targetEl.dataset.wordId) return undefined;

    return {
      word,
      lineNumber,
      wordNumber,
    };
  }, [poem]);

  const handlePointerDown = (event: ReactPointerEvent, word: any, lineNumber: number, wordNumber: number) => {
    if (word?.correct) return;

    const sourceRect = wordRefs.current[word?.id]?.getBoundingClientRect();
    if (!sourceRect) return;

    event.preventDefault();
    const press = {
      word,
      lineNumber,
      wordNumber,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - sourceRect.left,
      offsetY: event.clientY - sourceRect.top,
      width: sourceRect.width,
      x: event.clientX,
      y: event.clientY,
    };
    setPointerPress(press);
  }

  useLayoutEffect(() => {
    if (pointerPreview || !hiddenSourceRef.current) return;

    hiddenSourceRef.current.style.visibility = "";
    hiddenSourceRef.current = null;
  }, [pointerPreview]);

  useEffect(() => {
    dragActivityOccurred.current = false;
    idleHintShown.current = false;
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
        targetWordId: target.word.id,
        dx: ((targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2)) * 4 / 5,
        dy: ((targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2)) * 4 / 5,
        targetDx: sourceRect.left - targetRect.left,
        targetDy: sourceRect.top - targetRect.top,
        targetRect: { left: targetRect.left, top: targetRect.top, right: targetRect.right, bottom: targetRect.bottom },
        returning: false,
      });
      idleHintShown.current = true;
    }, idleHintShown.current ? 2000 : 5000);

    return () => window.clearTimeout(timeout);
  }, [draggingWord, haikudleId, idleDragHint, layoutAnimation, poem]);

  useEffect(() => {
    if (!idleDragHint) return;

    if (idleDragHint.returning) {
      const clearTimeoutId = window.setTimeout(() => {
        setIdleDragHint(undefined);
      }, 300);

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

  useEffect(() => {
    if (!idleDragHint || idleDragHint.returning) {
      setIdleDragOverWordId(undefined);
      return;
    }

    let frame = 0;
    let lastOverTarget = false;

    const checkOverlap = () => {
      const sourceRect = wordTileRefs.current[idleDragHint.wordId]?.getBoundingClientRect();
      const targetRect = idleDragHint.targetRect;
      const isOverTarget = Boolean(
        sourceRect &&
        targetRect &&
        sourceRect.left < targetRect.right &&
        sourceRect.right > targetRect.left &&
        sourceRect.top < targetRect.bottom &&
        sourceRect.bottom > targetRect.top
      );

      if (isOverTarget != lastOverTarget) {
        lastOverTarget = isOverTarget;
        setIdleDragOverWordId(isOverTarget ? idleDragHint.targetWordId : undefined);
      }

      frame = window.requestAnimationFrame(checkOverlap);
    }

    frame = window.requestAnimationFrame(checkOverlap);

    return () => {
      window.cancelAnimationFrame(frame);
      setIdleDragOverWordId(undefined);
    };
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
    const droppedWordId = preSwapDroppedWordId.current;
    preSwapDroppedWordId.current = undefined;
    const justCorrectWordIds = Object.fromEntries(
      poem
        .flat()
        .filter((w: any) => w?.id && w?.correct && preSwapIncorrectWordIds.current?.has(w.id))
        .map((w: any) => [w.id, true])
    );
    preSwapIncorrectWordIds.current = undefined;
    if (!Object.keys(offsets).length && !poemOffset?.dx && !poemOffset?.dy && !Object.keys(justCorrectWordIds).length) return;

    if (solved) pendingSolvedFlash.current = true;

    setLayoutAnimation({
      offsets,
      poemOffset,
      targetWordId,
      droppedWordId,
      justCorrectWordIds: Object.keys(justCorrectWordIds).length ? justCorrectWordIds : undefined,
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
      if (pendingSolvedFlash.current) {
        pendingSolvedFlash.current = false;
        setSolvedFlash(true);
      }
    }, 110);

    return () => window.clearTimeout(timeout);
  }, [layoutAnimation]);

  useEffect(() => {
    if (!solved) {
      pendingSolvedFlash.current = false;
      setSolvedFlash(false);
    } else if (!pendingSolvedFlash.current) {
      // solved without a drop animation (ex: loaded already solved)
      setSolvedFlash(true);
    }
  }, [solved]);

  useEffect(() => {
    if (!pointerPress) return;

    const finishDrag = (event: PointerEvent) => {
      if (pointerDrag) {
        const target = getPointerTarget(event.clientX, event.clientY);
        const canSwap = target && !target.word?.correct && target.word?.id != pointerDrag.word?.id;

        if (canSwap) {
          swapDraggedWord(pointerDrag, target.word, target.lineNumber, target.wordNumber);
        } else {
          setPointerPreview({
            ...pointerDrag,
            returning: true,
          });
          setPointerPress(undefined);
          setPointerDrag(undefined);
          setDragOverTarget(undefined);
          return;
        }
      }

      setPointerPress(undefined);
      setPointerPreview(undefined);
      setDraggingWord(undefined);
      setPointerDrag(undefined);
      setDragOverTarget(undefined);
    }

    const moveDrag = (event: PointerEvent) => {
      const dx = event.clientX - pointerPress.startX;
      const dy = event.clientY - pointerPress.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      let activeDrag = pointerDrag;

      if (!activeDrag && distance > 4) {
        const sourceEl = wordRefs.current[pointerPress.word?.id];
        const sourceRect = sourceEl?.getBoundingClientRect();
        activeDrag = {
          word: pointerPress.word,
          lineNumber: pointerPress.lineNumber,
          wordNumber: pointerPress.wordNumber,
          offsetX: pointerPress.offsetX,
          offsetY: pointerPress.offsetY,
          width: pointerPress.width,
          startX: pointerPress.startX,
          startY: pointerPress.startY,
          x: event.clientX,
          y: event.clientY,
          sourceRect: sourceRect ? { left: sourceRect.left, top: sourceRect.top } : undefined,
        };
        if (sourceEl) {
          if (hiddenSourceRef.current && hiddenSourceRef.current != sourceEl) {
            hiddenSourceRef.current.style.visibility = "";
          }
          hiddenSourceRef.current = sourceEl;
          sourceEl.style.visibility = "hidden";
        }
        dragActivityOccurred.current = true;
        setIdleDragHint(undefined);
        setDraggingWord(activeDrag);
      }

      if (!activeDrag) return;

      event.preventDefault();
      activeDrag = {
        ...activeDrag,
        x: event.clientX,
        y: event.clientY,
      };
      setPointerPreview(activeDrag);
      setPointerDrag(activeDrag);

      const target = getPointerTarget(event.clientX, event.clientY);
      const validTarget = target && !target.word?.correct && target.word?.id != activeDrag.word?.id;
      const targetRect = validTarget ? wordRefs.current[target.word.id]?.getBoundingClientRect() : undefined;

      setDragOverTarget(
        validTarget && targetRect && activeDrag.sourceRect
          ? {
            wordId: target.word.id,
            dx: activeDrag.sourceRect.left - targetRect.left,
            dy: activeDrag.sourceRect.top - targetRect.top,
          }
          : undefined
      );
    }

    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", finishDrag, { once: true });
    window.addEventListener("pointercancel", finishDrag, { once: true });

    return () => {
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [getPointerTarget, pointerDrag, pointerPress, swapDraggedWord]);

  useEffect(() => {
    if (!pointerPreview?.returning) return;

    const timeout = window.setTimeout(() => {
      setPointerPreview(undefined);
      setDraggingWord(undefined);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [pointerPreview]);

  return (
    <div
      ref={poemRef}
      className={`max-w-[92vw] ${layoutAnimation?.settling ? "transition-none" : "transition-transform duration-[55ms] ease-out"}`}
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
            className={`_bg-purple-200 flex flex-row flex-wrap items-center justify-start mt-2 first:mt-0 pl-9 pr-5 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-full select-none`}
          >
            {poem[i].map((w: any, j: number) => {
              const isDragging = draggingWord?.word?.id == w?.id;
              const isPreviewSource = pointerPreview?.word?.id == w?.id;
              const isIdleDragHint = idleDragHint?.wordId == w?.id;
              const isIdleDragHintTarget = idleDragOverWordId == w?.id;
              const isDragTarget = dragOverTarget?.wordId == w?.id || isIdleDragHintTarget;
              const layoutOffset = layoutAnimation?.offsets?.[w?.id];
              const isDisplacedTarget = layoutAnimation?.targetWordId == w?.id;
              const isDroppedWord = layoutAnimation?.droppedWordId == w?.id;
              const isJustCorrect = layoutAnimation?.justCorrectWordIds?.[w?.id];
              // words that just became correct keep their tile look through the
              // settling frame, then fade it out
              const styleAsTile = !w?.correct || (isJustCorrect && layoutAnimation?.settling);
              return (
                <span
                  key={w?.id || `${i}-${j}`}
                  ref={(el) => {
                    if (w?.id) wordRefs.current[w.id] = el;
                  }}
                  data-word-id={w?.id}
                  data-line-number={i}
                  data-word-number={j}
                  style={{
                    visibility: isPreviewSource || isDragging ? "hidden" : undefined,
                    position: isIdleDragHint ? "relative" : undefined,
                    zIndex: isIdleDragHint ? 50 : isDragTarget ? 0 : 1,
                    touchAction: "none",
                    marginLeft: j === 0 ? "-1.5em" : undefined,
                  }}
                  onPointerDown={(event) => handlePointerDown(event, w, i, j)}
                >
                  <StyledLayers styles={solvedFlash ? styles : [styles[0]]}>
                    <div
                      ref={(el) => {
                        if (w?.id) wordTileRefs.current[w.id] = el;
                      }}
                      className={`px-1 ${w?.correct ? "" : "m-1"} ${layoutAnimation?.settling ? "transition-none" : isIdleDragHint ? "transition-transform duration-[650ms] ease-in-out" : isJustCorrect ? "transition-[transform,filter,opacity,background-color] duration-[110ms] ease-out" : isDisplacedTarget ? "transition-[transform,filter,opacity] duration-[110ms] ease-out" : "transition-[transform,filter,opacity] duration-[55ms] ease-out"} ${!w?.correct && "cursor-grab active:cursor-grabbing draggable-notsure-why-cant-inline"}`}
                      style={{
                        transitionTimingFunction: isIdleDragHint && idleDragHint.returning
                          ? "cubic-bezier(.34, 1.56, .64, 0.95)"
                          : undefined,
                        transitionDuration: isIdleDragHint && idleDragHint.returning
                          ? "300ms"
                          : isIdleDragHintTarget
                            ? "80ms"
                            : draggingWord
                              ? "200ms"
                              : undefined,
                        backgroundColor: styleAsTile
                          ? haiku?.bgColor || "lightgrey"
                          : undefined,
                        transform: layoutOffset && layoutAnimation.settling
                          ? `translate(${layoutOffset.dx}px, ${layoutOffset.dy}px)`
                          : isIdleDragHint && !idleDragHint.returning
                            ? `translate(${idleDragHint.dx}px, ${idleDragHint.dy}px)`
                            : isIdleDragHintTarget
                              ? `translate(${idleDragHint?.targetDx}px, ${idleDragHint?.targetDy}px)`
                              : dragOverTarget?.wordId == w?.id
                                ? `translate(${dragOverTarget.dx}px, ${dragOverTarget.dy}px)`
                                : undefined,
                        position: "relative",
                        zIndex: isIdleDragHint ? 50 : isDragTarget ? -1 : 0,
                        opacity: isDragTarget || (isDisplacedTarget && layoutAnimation?.settling) ? 0.2 : undefined,
                        filter: !styleAsTile
                          ? undefined
                          : isDragging || isIdleDragHint || isDragTarget || ((isDroppedWord || isDisplacedTarget) && layoutAnimation?.settling)
                            ? `drop-shadow(0px 3px 5px rgb(0 0 0 / 1))`
                            : draggingWord
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
                  </StyledLayers>
                </span>
              )
            })}
          </div>
        )
      })}
      {/* fades in once solved; absolute (like in HaikuPoem) so it doesn't
          affect the poem's centering; the margin lines the title up with the
          first word's text edge (line pl-9 - 1.5em pull + px-1 tile padding
          - the title's own 0.5rem indent) */}
      <div
        className="transition-opacity duration-[500ms] ease-out"
        style={{
          opacity: solvedFlash ? 1 : 0,
          pointerEvents: solvedFlash ? undefined : "none",
          transitionDelay: solvedFlash ? "250ms" : "0ms",
          marginLeft: "calc(2rem - 1.5em)",
        }}
      >
        <HaikuTitle
          haiku={haiku}
          mode={mode}
          styles={styles}
        />
      </div>
      {pointerPreview &&
        <div
          className="fixed z-[9999] pointer-events-none select-none"
          style={{
            left: (pointerPreview.startX ?? pointerPreview.x) - pointerPreview.offsetX,
            top: (pointerPreview.startY ?? pointerPreview.y) - pointerPreview.offsetY,
            width: pointerPreview.width,
            transform: pointerPreview.returning
              ? undefined
              : `translate(${pointerPreview.x - (pointerPreview.startX ?? pointerPreview.x)}px, ${pointerPreview.y - (pointerPreview.startY ?? pointerPreview.y)}px)`,
            transitionProperty: "transform",
            transitionDuration: pointerPreview.returning ? "300ms" : "0ms",
            transitionTimingFunction: pointerPreview.returning ? "cubic-bezier(.34, 1.56, .64, 0.95)" : undefined,
          }}
        >
          <div style={styles[0]}>
            <div
              className="px-1 m-1 cursor-grabbing"
              style={{
                backgroundColor: haiku?.bgColor || "lightgrey",
                filter: pointerDrag || pointerPreview.returning
                  ? `drop-shadow(0px 3px 5px rgb(0 0 0 / 1))`
                  : `drop-shadow(0px 2px 3px rgb(0 0 0 / 0.5))`,
              }}
            >
              {pointerPreview.word?.word}
            </div>
          </div>
        </div>
      }
    </div>
  )
}
