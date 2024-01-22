// 'use client'

// import { useEffect, useState } from 'react';
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
// import { useState } from "react";

export default function HaikuPage({ haiku }: { haiku?: Haiku }) {
  // console.log('>> app._components.HaikuPage.render()', { lang });
    
  // const [colorOffsets, setColorOffsets] = useState({ front: -1, back: -1 });

  // const fontColor = haiku?.colorPalette && colorOffsets.front >= 0 && haiku.colorPalette[colorOffsets.front] || haiku?.color || "#555555";
  const fontColor = haiku?.color || "#555555";
  
  // const bgColor = haiku?.colorPalette && colorOffsets.back >= 0 && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";
  const bgColor = haiku?.bgColor || "lightgrey";
  
  const textStyle = {
    color: fontColor,
    filter: `drop-shadow(0px 0px 8px ${bgColor})`,
    WebkitTextStroke: `1px ${fontColor}`,
  }

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

      <div
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-10`}
        style={{
          ...textStyle,

        }}
      >
        {haiku.poem.map((s: string, i: number) => <div key={i}>{s}</div>)}
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
