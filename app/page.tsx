'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { BsGithub } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
// import Link from "@/app/_components/Link"
import Link from 'next/link';
import Page from "@/app/_components/Page";
import * as users from "@/services/users";
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
import { NavProfileLink } from "@/app/_components/nav/clientComponents";
import useHaikus from "@/app/_hooks/haikus";
import useAlert from '@/app/_hooks/alert';
import NotFound from '@/app/not-found';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import * as samples from "@/services/stores/samples";

export default function Component({ lang }: { lang?: undefined | LanguageType }) {
  console.log('>> app.page.render()', { lang });
  // const token = cookies().get("session")?.value;
  // const user = token && (await users.getUserFromToken(token))?.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState(searchParams.get("id"));
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

  const loaded = id && haikusLoaded(JSON.stringify({ id })) || haikusLoaded(JSON.stringify({ lang: lang || "en" }));
  const haikus = findHaikus({ lang: lang || "en" });
  const haiku = id && getHaiku(id) || haikus[Math.floor(Math.random() * haikus.length)] || samples.notFoundHaiku;
  const [colorOffsets, setColorOffsets] = useState({ front: -1, back: -1 });

  console.log('>> app.page.render()', { haikus, haiku, loaded, id });

  useEffect(() => {
    if (!loaded) {
      id && loadHaikus({ id }) || loadHaikus({ lang: lang || "en" });
    }
  }, [id, lang]);

  const handleGenerate = async (e: any) => {
    e.preventDefault();
    setGenerating(true);
    const ret = await generateHaiku({ uuid: "ASDF" }, { ...haiku, id: "ASDF", lang });
    // console.log('>> app.page.handleGenerate()', { ret });

    if (ret?.id) {
      // router.push(`/?id=${ret.id}`);
      setId(ret.id);
      setGenerating(false);
    }
  }

  const handleRefresh = (e: any) => {
    e.preventDefault();

    if (!(haikus?.length > 1)) return;

    const notCurrentHaikus = haikus.map((h: Haiku) => h.id).filter((id: string) => id != haiku.id);
    setId(notCurrentHaikus[Math.floor(Math.random() * notCurrentHaikus.length)]);
  }

  const fontColor = haiku?.colorPalette && colorOffsets.front >= 0 && haiku.colorPalette[colorOffsets.front] || haiku?.color || "#555555";
  const bgColor = haiku?.colorPalette && colorOffsets.back >= 0 && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";
  const textStyle = {
    color: fontColor,
    filter: `drop-shadow(0px 0px 8px ${bgColor})`,
    WebkitTextStroke: `1px ${fontColor}`,
  }

  const header = (
    <div>
      <div className={`${font.architects_daughter.className} fixed top-1 left-4 z-20 text-[26pt] md:text-[32pt]`}>
        <Link
          onClick={handleRefresh}
          href="#"
          className="hover:no-underline"
          style={textStyle}
        >
          <span className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-2px] pr-[3px] pl-[1px] text-[18pt] md:text-[24pt] font-semibold`}>AI</span>ku</span>
        </Link>
      </div>
      {/* <div className="fixed top-4 right-3 z-20">
        <NavProfileLink href="/profile" className="_bg-orange-600 _hover: text-purple-100" style={textStyle} />
      </div> */}
      <Link href="#" onClick={handleGenerate} className="fixed top-4 right-4 z-20">
        <IoSparkles
          className="_bg-orange-600 _hover: _text-purple-100 h-8 w-8 md:h-10 md:w-10" style={textStyle}
        />
      </Link>
    </div>
  );

  const links = [
    // <Link key="web"
    //   style={{ ...textStyle, WebkitTextStroke: undefined }}
    //   href="https://www.desmat.ca"
    //   target="_blank"
    //   className="_bg-yellow-200 flex flex-row gap-0.5 items-center"
    // >
    //   {/* <MdHome className=" _mt-[0.1rem] _mr-[-0.2rem] text-xl" /> */}
    //   www.desmat.ca
    // </Link>,
    // <Link key="email" style={{...textStyle, WebkitTextStroke: undefined }} href="mailto:haiku@desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-1 items-center">
    //   {/* <MdMail className="_mt-[0.05rem] _mr-[-0.25rem] text-xl" /> */}
    //   @desmat.ca
    // </Link>,
    <Link
      key="github"
      style={{ ...textStyle, WebkitTextStroke: undefined }}
      href="https://github.com/desmat"
      target="_blank"
      className="_bg-yellow-200 flex flex-row gap-0.5 items-center"
    >
      <BsGithub className="mt-[0.1rem] text-md" />
      desmat
    </Link>,
    lang && lang != "en" && <Link
      key="en"
      style={{ ...textStyle, WebkitTextStroke: undefined }}
      href="/"
    >
      {supportedLanguages["en"]?.nativeName}
    </Link>,
    lang != "de" && <Link
      key="de"
      style={{ ...textStyle, WebkitTextStroke: undefined }}
      href="/de"
    >
      {supportedLanguages["de"]?.nativeName}
    </Link>,
    lang != "es" && <Link
      key="es"
      style={{ ...textStyle, WebkitTextStroke: undefined }}
      href="/es"
    >
      {supportedLanguages["es"]?.nativeName}
    </Link>,
    lang != "fr" && <Link
      key="fr"
      style={{ ...textStyle, WebkitTextStroke: undefined }}
      href="/fr"
    >
      {supportedLanguages["fr"]?.nativeName}
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

  if (loaded && !haiku) {
    return <NotFound lang={lang} />
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
    </Page>
  )
}
