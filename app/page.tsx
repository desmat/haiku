'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { BsGithub } from "react-icons/bs";
// import Link from "@/app/_components/Link"
import Link from 'next/link';
import Page from "@/app/_components/Page";
import * as users from "@/services/users";
import * as font from "./font";
import { Haiku } from "@/types/Haiku";
import { NavProfileLink } from "./_components/nav/clientComponents";
import useHaikus from "./_hooks/haikus";
import useAlert from './_hooks/alert';
import * as samples from "@/services/stores/samples";

export default function Component() {
  // console.log('>> app.page.render()');
  // const token = cookies().get("session")?.value;
  // const user = token && (await users.getUserFromToken(token))?.user;
  const router = useRouter();
  const params = useSearchParams();
  const [id, setId] = useState(params.get("id"));
  const [generating, setGenerating] = useState(false);
  const [colorOffsets, setColorOffsets] = useState({ front: 0, back: 1 });

  const [
    haikusLoaded,
    loadHaikus,
    findHaikus,
    getHaiku,
    generateHaiku,
  ] = useHaikus((state: any) => [
    state.loaded,
    state.load,
    state.find,
    state.get,
    state.generate
  ]);

  const loaded = id && haikusLoaded(id) || haikusLoaded();
  const haikus = !id && findHaikus();
  const haiku = id && (getHaiku(id) || samples.haikus["-1"]) || haikus[Math.floor(Math.random() * haikus.length)];

  // id = id || `${loaded && haikus && haikus.length > 0 && Math.floor(Math.random() * haikus.length) || -1}`;
  // const haiku = id && (getHaiku(id) || samples.haikus["-1"]) || ;
  // const haiku = haikus[Math.floor(Math.random() * haikus.length)];

  console.log('>> app.page.render()', { haikus, haiku, loaded, id });

  if (loaded && haiku?.id == "-1") {
    console.error("NOT FOUND", { id });
  }

  useEffect(() => {
    if (!loaded) {
      id && loadHaikus(id) || loadHaikus();
    }
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    const ret = await generateHaiku({ uuid: "ASDF" }, { ...haiku, id: "ASDF" });
    console.log('>> app.page.handleGenerate()', { ret });

    if (ret?.id) {
      // router.push(`/?id=${ret.id}`);
      setId(ret.id);
      setGenerating(false);
    }
  }

  const fontColor = haiku?.colorPalette && haiku.colorPalette[colorOffsets.front] || haiku?.color || "#555555";
  const bgColor = haiku?.colorPalette && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";
  const textStyle = {
    color: fontColor,
    filter: `drop-shadow(0px 0px 8px ${bgColor})`,
    // WebkitTextStroke: `0.6px ${bgColor}`,
  }

  const header = (
    <div>
      <div className={`${font.architects_daughter.className} fixed top-2 left-3 z-20 text-[26pt] md:text-[32pt]`}>
        <Link
          onClick={handleGenerate}
          href="#"
          className="hover:no-underline"

        >
          <span style={textStyle} className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-2px] pr-[3px] pl-[1px] text-[18pt] md:text-[24pt] font-semibold`}>AI</span>ku</span>
        </Link>
      </div>
      {/* <div className="fixed top-4 right-3 z-20">
        <NavProfileLink href="/profile" className="_bg-orange-600 _hover: text-purple-100" style={textStyle} />
      </div> */}
    </div>
  );

  const links = [
    <Link key="web" style={textStyle} href="https://www.desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
      {/* <MdHome className=" _mt-[0.1rem] _mr-[-0.2rem] text-xl" /> */}
      www.desmat.ca
    </Link>,
    <Link key="email" style={textStyle} href="mailto:haiku@desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-1 items-center">
      {/* <MdMail className="_mt-[0.05rem] _mr-[-0.25rem] text-xl" /> */}
      @desmat.ca
    </Link>,
    <Link key="github" style={textStyle} href="https://github.com/desmat/haiku" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
      <BsGithub className="mt-[0.1rem] text-md" />
      desmat
    </Link>,
  ];

  if (!loaded || generating) {
    return (
      <Page
        loading={true}
        bottomLinks={links}
      >
        {header}
      </Page>
    )
  }

  if (!haiku) {
    // alertError(`Haiku not found: ${id}`);

    return (
      <Page
        title="Not found"
        subtitle={id}
        bottomLinks={links}
      >
        {header}
      </Page>
    )
  }

  return (
    <Page
      // title="Haiku"
      // subtitle="Perfect workout plans, just for you!"
      bottomLinks={links}
    >
      {header}
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
        className={`fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 50%, ${textStyle.color} 85%)`,
          opacity: 0.6,
        }}
      />
      <div
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-20`}
        style={{
          ...textStyle,

        }}
      >
        {haiku.poem.map((s: string, i: number) => <div key={i}>{s}</div>)}
      </div>
      <div className="bg-pink-200 flex flex-row fixed bottom-10 left-1/2 transform -translate-x-1/2">
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
              {/* {i == colorOffsets.front && "F"}
              {i == colorOffsets.back && "B"} */}
            </div>
          )
        })}
      </div>
    </Page>
  )
}
