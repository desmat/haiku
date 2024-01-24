'use client'

// import { useEffect, useState } from 'react';
import { syllable } from 'syllable'
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
import { StyledLayers } from "./StyledLayers";
import { useEffect, useState } from "react";
import shuffleArray from "@/utils/shuffleArray";
import useHaikudle from '../_hooks/haikudle';
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
  ] = useHaikudle((state: any) => [
    state.inProgress,
    state.words,
    state.solved,
    state.init,
    state.pick,
    state.remove,
  ]);

  const someCorrect = inProgress.flat().reduce((a: boolean, m: any, i: number) => a || m.correct, false);

  console.log('>> app._components.HaikuPage.render()', { inProgress, solved });

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
      <div
        className="fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku.bgImage}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "brightness(1.2)",
        }}
      />

      {/* cheater */}
      {/* <div
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-10`}
      >
        <StyledLayers styles={styles}>
          {haiku.poem.map((s: string, i: number) => <div key={i}>{s}</div>)}
        </StyledLayers>
      </div> */}

      <div
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-10`}
      // onClick={() => init(haiku)}
      >
        {haiku.poem.map((s: string, i: number) => (
          <div
            key={i}
            className={`_bg-purple-200 capitalize-first-letter relative flex flex-row items-center justify-start my-1 px-2 sm:min-h-[2.8rem] md:min-h-[3.4rem] min-h-[2.4rem] h-fit w-fit ${i == 1 ? "sm:min-w-[24rem] md:min-w-[28rem] min-w-[18rem]" : "sm:min-w-[22rem] md:min-w-[24rem] min-w-[16rem]"}`}
            style={{
              // ...styles[0],
              backgroundColor: solved || someCorrect
                ? undefined
                : haiku?.bgColor || "lightgrey",
              // borderColor: haiku?.color || "#555555",
              // borderColor: haiku?.bgColor || "lightgrey",
              // borderStyle: "solid",
              // borderWidth: "1px",
            }}
          >
            {inProgress[i].map((w: any, j: number) => (
              <span
                key={j}
                className={!solved && i > 0 ? "cursor-pointer" : ""}
                onClick={() => !solved && i > 0 ? remove(i, j, w) : undefined}
              >
                <StyledLayers key={i} styles={solved || w.correct ? styles : [styles[0]]}>
                  <div
                    className="px-1"
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
            ))}
            {!solved &&
              <div className="absolute left-[-2rem] top-0">
                {countSyllables(inProgress[i].map((w: any) => w.word).join(" "))}
              </div>
            }
          </div>
        ))}
      </div>

      <div className="_bg-pink-200 fixed bottom-16 left-1/2 transform -translate-x-1/2 w-[calc(100vw-3rem)] h-fit flex flex-row gap-2 justify-center flex-wrap">
        {words?.map((w: any, i: number) => {
          return (
            // <StyledLayers key={i} styles={w.picked ? [] : [styles[0]]}>
              <div
                style={{ 
                  color: styles[0].color,
                  // filter: `drop-shadow(0px 0px 8px ${bgColor})`,
                  WebkitTextStroke: styles[0].WebkitTextStroke,
                  fontWeight: styles[0].fontWeight,
                  backgroundColor: haiku?.bgColor || "lightgrey" 
                }}
                className={`${font.architects_daughter.className} ${w.picked ? "invisible" : "cursor-pointer"} p-1 md:text-[26pt] sm:text-[22pt] text-[16pt]`}
                onClick={() => !w.picked && pick(w.offset)}
              >
                {w.word}
              </div>
            // </StyledLayers>
          )
        })}
      </div>

      {/* <div className="_bg-pink-200 flex flex-row fixed bottom-10 left-1/2 transform -translate-x-1/2">
        {haiku.colorPalette?.map((c: string, i: number) => {
          return (
            <div
              key={i}
              className="w-8 h-8 text-center"
              style={{
                backgroundColor: c,
                boxSizing: "border-box",
                border: i == colorOffsets.front || i == colorOffsets.back ? "black 2px solid" : ""
              }}
              onClick={() => setColorOffsets({
                front: i,
                back: Math.floor(Math.random() * haiku?.colorPalette?.length),
              })}
            >
            </div>
          )
        })}
      </div> */}
    </div>
  )
}
