'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { BsGithub } from "react-icons/bs";
import Link from "@/app/_components/Link"
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

  const textStyle = {
    color: haiku?.color || "#555555",
    filter: `drop-shadow(0px 0px 8px ${haiku?.bgColor || "lightgrey"})`,
  }

  const header = (
    <div>
      <div style={textStyle} className={`${font.architects_daughter.className} fixed top-2 left-3 z-20 text-[26pt] md:text-[32pt]`}>
        <Link
          onClick={handleGenerate}
          style="plain"
        >
          <span className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-2px] pr-[3px] pl-[1px] text-[18pt] md:text-[24pt] font-semibold`}>AI</span>ku</span>
        </Link>
      </div>
      <div className="fixed top-4 right-3 z-20">
        <NavProfileLink href="/profile" className="_bg-orange-600 _hover: text-purple-100" style={textStyle} />
      </div>
    </div>
  );

  const links = [
    <div key="web" style={textStyle}>
      <Link useClient={true} href="https://www.desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
        {/* <MdHome className=" _mt-[0.1rem] _mr-[-0.2rem] text-xl" /> */}
        www.desmat.ca
      </Link>
    </div>,
    <div key="email" style={textStyle}>
      <Link useClient={true} key="email" href="mailto:haiku@desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-1 items-center">
        {/* <MdMail className="_mt-[0.05rem] _mr-[-0.25rem] text-xl" /> */}
        @desmat.ca
      </Link>
    </div>,
    <div key="github" style={textStyle}>
      <Link useClient={true} key="github" href="https://github.com/desmat/haiku" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
        <BsGithub className="mt-[0.1rem] text-md" />
        desmat
      </Link>
    </div>,
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
          background: `radial-gradient(circle at center, white, #868686 50%, ${haiku.color} 85%)`,
          opacity: 0.6,
        }}
      />
      <div
        className={`${font.architects_daughter.className} text-overlay md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-20`}
        style={{
          ...textStyle,


        }}
      >
        {haiku.poem.map((s: string, i: number) => <div key={i}>{s}</div>)}
      </div>
    </Page>
  )
}