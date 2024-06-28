'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { StyledLayers } from "@/app/_components/StyledLayers";
import { loadingMessages } from "@/app/_components/Loading";
import * as font from "@/app/font";

export default function Loading({ styles = [] }: { styles?: any }) {
  const [loadingMessage, setLoadingMessage] = useState(""); //loadingMessages[Math.floor(seedrandom(`${seed}`)() * loadingMessages.length)]);
  const [intervalId, setIntervalId] = useState<any>();
  const intervalValue = 4500;
  const initialTimeoutValue = intervalValue * 1 / 3;
  // console.log('>> app._components.client.Loading', { seed, random: seedrandom(`${seed}`)(), loadingMessage });

  useEffect(() => {
    // console.log('>> app._components.client.Loading useEffect', { loadingMessage });

    if (!intervalId && loadingMessages.length > 1) {
      setTimeout(() => {
        // initial loading message
        setLoadingMessage("Loading")

        // then cycle the other loading messages
        setIntervalId(
          setInterval(
            () => setLoadingMessage(
              loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
            ), intervalValue)
        );
      }, initialTimeoutValue);
    }

    return () => intervalId && clearInterval(intervalId);
  }, []);

  return (
    <Link
      href="/"
      className={`${font.architects_daughter.className} _bg-pink-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full p-2 z-50 md:text-[26pt] sm:text-[22pt] text-[16pt]`}
      style={{ textDecoration: "none" }}
    >      
      <StyledLayers styles={styles}>
        <div className="flex flex-col items-center">
          <div className={`_bg-pink-200 relative text-center w-[80vw] animate-pulse-offset`}>
            {loadingMessage ? `${loadingMessage}...` : ""}
          </div>
        </div>
      </StyledLayers>
    </Link>
  );
}
