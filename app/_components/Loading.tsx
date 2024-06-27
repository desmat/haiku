import moment from "moment";
import Link from "next/link";
import { Suspense } from "react";
import seedrandom from "seedrandom";
import * as font from "@/app/font";
import { StyledLayers } from "./StyledLayers";
import { default as ClientLoading } from "@/app/_components/client/Loading";

export const loadingMessages = [
  "Tickling Leprachans",
  "Milking Unicorns",
  "Separating Green Skittles",
  "Befriending Ghosts in the Attic",
  "Arm Wrestling with Mannequins",
  "Brewing Coffee for Sleepwalkers",
  "Negotiating with Noisy Neighbors",
  "Pillow Fighting with Pirates",
  "Serenading Seahorses",
  "Training Turtles for the Olympics",
  "Playing Poker with Parrots",
  "Crocheting Cozies for Bald Eagles",
  "Waltzing with Washing Machines",
  "Squishing Marshmallows on Millionaires",
  "Sipping Secrets from Soup Spoons",
  "Gossiping with Goldfishes",
  "Knitting Sweaters for Snakes",
  "Babysitting Bandicoots",
  "Tickling Turtles with Feathers",
  "Serenading Sandwiches at Midnight",
];

export default function Loading({ styles = [] }: { styles?: any }) {
  // const seed = Math.floor(moment().valueOf() / (5 * 60 * 1000)); // make sure client and server sides render the same within a reasonable window
  // @ts-ignore
  const loadingMessage = ""; //loadingMessages[Math.floor(seedrandom(`${seed}`)() * loadingMessages.length)];
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
