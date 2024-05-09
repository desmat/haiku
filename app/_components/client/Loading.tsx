'use client'

import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
import seedrandom from "seedrandom";
import { StyledLayers } from "@/app/_components/StyledLayers";
import { loadingMessages } from "@/app/_components/Loading";
import * as font from "@/app/font";

export default function Loading({ styles = [] }: { styles?: any }) {
  const seed = Math.floor(moment().valueOf() / (5 * 60 * 1000)); // make sure client and server sides render the same within a reasonable window
  // @ts-ignore
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[Math.floor(seedrandom(`${seed}`)() * loadingMessages.length)]);
  const [intervalId, setIntervalId] = useState<any>();
  const intervalValue = 3000;
  // console.log('>> app._components.client.Loading', { seed, random: seedrandom(`${seed}`)(), loadingMessage });

  useEffect(() => {
    // console.log('>> app._components.client.Loading useEffect', { loadingMessage });

    if (!intervalId && loadingMessages.length > 1) {
      setTimeout(() => {
        setIntervalId(
          setInterval(() => {
            setLoadingMessage(
              loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
            );
          }, intervalValue)
        );
      }, intervalValue);
    }

    return () => intervalId && clearInterval(intervalId);
  }, []);

  return (
    <Link
      href="/"
      className={`${font.architects_daughter.className} _bg-pink-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full p-2 opacity-50 z-50 md:text-[26pt] sm:text-[22pt] text-[16pt]`}
      style={{ textDecoration: "none" }}
    >
      <StyledLayers styles={styles}>
        <div className="animate-pulse flex flex-col items-center">
          <div>{loadingMessage}...</div>
        </div>
      </StyledLayers>
    </Link>
  );
}
