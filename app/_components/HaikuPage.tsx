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

  // const [inProgress, setInProgress] = useState(["", "", ""]);
  // const [left, setLeft] = useState<string[]>([]);

  const [
    inProgress, 
    left, 
    init, 
    pick,
  ] = useHaikudle((state: any) => [
    state.inProgress, 
    state.left, 
    state.init, 
    state.pick,
  ])

  console.log('>> app._components.HaikuPage.render()', { inProgress });

  const upperCaseFirstLetter = (s: string) => {
    if (!s || s.length == 0) return "";
    return s.substring(0, 1).toUpperCase() + s.substring(1);
  }

  const countSyllables = () => {
    // @ts-ignore
    const r = inProgress.map((line: string) => {
      console.log('>> app._components.HaikuPage.countSyllables()', { line });
      // @ts-ignore
      return line.split(/\s+/).reduce((total: number, v: string) => {
        // @ts-ignore
        const v2 = v.toLowerCase().replace(/[,.]/, "");
        // @ts-ignore
        console.log('>> app._components.HaikuPage.countSyllables()', { v, v2, c: syllable(v2) });
        // @ts-ignore
        return total + (syllable(v2) || 0);
      }, 0);
    });

    console.log('>> app._components.HaikuPage.countSyllables()', { r });
    return r;
  }

  // const resetInProgress = () => {
  //   setInProgress([
  //     haiku.poem[0],
  //     "",
  //     ""
  //   ]);

  //   setLeft(
  //     // shuffleArray(
  //     [haiku.poem[1], haiku.poem[2]]
  //       .join(" ")
  //       .split(/\s/)
  //       .map((w: string) => w.toLowerCase().replace(/[.,]/, ""))
  //     // )
  //   );
  // };

  useEffect(() => {
    init(haiku);
  }, [haiku.id]);

  console.log('>> app._components.HaikuPage.render()', { left });

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
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-10`}
      >
        <StyledLayers styles={styles}>
          {haiku.poem.map((s: string, i: number) => <div key={i}>{s}</div>)}
        </StyledLayers>
      </div> */}

      <div
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-10`}
        onClick={() => init(haiku)}
      >
        {/* {inProgress.map((s: string, i: number) => ( */}
        {haiku.poem.map((s: string, i: number) => (
          <StyledLayers key={i} styles={[styles[0]]}>
            <div
              key={i}
              className={`_bg-purple-200 capitalize-first-letter relative flex flex-row items-center justify-start my-1 px-2 min-h-[2.4rem] md:min-h-[3.2rem] h-fit w-fit ${i == 1 ? "min-w-[20rem] md:min-w-[36rem]" : "min-w-[16rem] md:min-w-[28rem]"}`}
              style={{
                backgroundColor: haiku?.bgColor || "lightgrey",
                // borderColor: haiku?.color || "#555555",
                // borderColor: haiku?.bgColor || "lightgrey",
                // borderStyle: "solid",
                // borderWidth: "1px",
              }}
            >
              {upperCaseFirstLetter(inProgress[i])}
              {/* {s} */}
              <div className="absolute left-[-2rem] top-0">
                {countSyllables()[i]}
              </div>
            </div>
          </StyledLayers>
        ))}
      </div>

      <div className="_bg-pink-200 fixed bottom-12 left-1/2 transform -translate-x-1/2 w-[calc(100vw-3rem)] h-fit flex flex-row gap-2 justify-center flex-wrap">
        {left?.map((w: string, i: number) => {
          let lw = w.toLowerCase();
          return (
            <StyledLayers key={i} styles={[styles[0]]}>
              <div
                style={{ backgroundColor: haiku?.bgColor || "lightgrey" }}
                className={`${font.architects_daughter.className} p-1 md:text-[26pt] sm:text-[22pt] text-[16pt]`}
                onClick={() => pick(i)}
              >
                {w}
              </div>
            </StyledLayers>
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
