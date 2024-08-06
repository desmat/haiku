import Link from "next/link";
import { Suspense } from "react";
import * as font from "@/app/font";
import { StyledLayers } from "./StyledLayers";
import { default as ClientLoading } from "@/app/_components/client/Loading";

export const loadingMessages = [
  "Loading",
];

export default function Loading({ styles = [] }: { styles?: any }) {
  const loadingMessage = "";
  // console.log('>> app._components.Loading', { seed, random: seedrandom(`${seed}`)(), loadingMessage });

  return (
    <Suspense
      fallback={
        <Link
          href="/"
          className={`${font.architects_daughter.className} _bg-pink-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full p-2 opacity-50 cursor-pointer z-50 md:text-[26pt] sm:text-[22pt] text-[16pt]`}
          style={{ textDecoration: "none" }}
        >
          <StyledLayers styles={styles}>
            <div className="animate-pulse flex flex-col items-center">
              <div className="_bg-pink-200 relative text-center w-[80vw]">
                {loadingMessage ? `${loadingMessage}...` : ""}
              </div>
            </div>
          </StyledLayers>
        </Link>
      }
    >
      <ClientLoading styles={styles} />
    </Suspense>
  );
}
