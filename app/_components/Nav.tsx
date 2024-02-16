'use client'

import moment from 'moment';
import Link from 'next/link'
import { BsGithub } from 'react-icons/bs';
import { IoSparkles, IoAddCircle, IoLinkSharp } from 'react-icons/io5';
import { MdMail, MdHome } from "react-icons/md";
import * as font from "@/app/font";
import useHaikudle from '@/app/_hooks/haikudle';
import useUser from '@/app/_hooks/user';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { StyledLayers } from './StyledLayers';

export function Loading() {
  return (
    <div className='_bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 italic text-dark-2 opacity-5 animate-pulse'>Loading...</div>
  );
}

export function Logo({ href, onClick }: { href?: string, onClick?: any }) {
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
  const isSocialImgMode = process.env.EXPERIENCE_MODE == "social-img";

  return (
    <Link
      onClick={onClick}
      href={href || "#"}
      className={`hover:no-underline ${isSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      <span className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-1px] ${isSocialImgMode ? "text-[80pt]" : "text-[18pt] md:text-[24pt]"} font-semibold`}>AI</span>{isHaikudleMode || isSocialImgMode ? "kudle" : "ku"}</span>
    </Link>
  )
}

export function GenerateIcon({ onClick }: { onClick?: any }) {

  return (
    <Link href="#" onClick={onClick}>
      <IoSparkles className="_bg-orange-600 _hover: _text-purple-100 h-6 w-6 md:h-8 md:w-8" />
    </Link>
  )
}

export function BottomLinks({ haikuId, lang, onSaveHaikudle }: { haikuId?: string, lang?: LanguageType, onSaveHaikudle?: any }) {
  const [user] = useUser((state: any) => [state.user]);
  // console.log("BottomLinks", { lang })

  return (
    <div
      className="_bg-yellow-100 relative flex flex-row gap-3 items-center justify-center _font-semibold"
    >
      <div
        className="relative flex flex-row gap-2 items-center justify-center _font-semibold"
      >
        <Link
          key="github"
          href="https://github.com/desmat/haiku"
          target="_blank"
          className="flex flex-row gap-0.5 items-center"
        >
          <BsGithub className="text-lg" />
        </Link>
        <Link
          key="web"
          href="https://www.desmat.ca"
          target="_blank"
          className="flex flex-row gap-0.5 items-center"
        >
          <MdHome className="text-2xl" />
        </Link>
        <Link
          key="email"
          href="mailto:haiku@desmat.ca"
          target="_blank"
          className="_bg-yellow-200 flex flex-row gap-1 items-center"
        >
          <MdMail className="text-xl" />
        </Link>
        {haikuId && user?.isAdmin &&
          <Link
            key="link"
            href={`?id=${haikuId}`}
            target="_blank"
            className="_bg-yellow-200 flex flex-row gap-1 items-center"
          >
            <IoLinkSharp className="text-xl" />
          </Link>
        }
        {process.env.EXPERIENCE_MODE != "social-img" && user?.isAdmin && onSaveHaikudle &&
          <Link
            key="saveHaikudle"
            href="#"
            className="_bg-yellow-200 flex flex-row gap-1 items-center"
            onClick={onSaveHaikudle}
          >
            <IoAddCircle className="text-xl" />
          </Link>
        }
      </div>
      {process.env.EXPERIENCE_MODE == "haiku" &&
        Object.entries(supportedLanguages)
          .filter((e: any) => (!lang && e[0] != "en") || (lang && lang != e[0]))
          .map(([k, v]: any) => (
            <Link
              key={k}
              href={`/${k != "en" ? k : ""}`}
            >
              {v.nativeName}
            </Link>
          ))}
    </div>
  )
}

export function NavOverlay({ styles, lang, haikuId, onClickLogo, onClickGenerate }: { styles: any[], lang?: LanguageType, haikuId?: string, onClickLogo?: any, onClickGenerate?: any }) {
  const [user] = useUser((state: any) => [state.user, state.save]);
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  const [
    haikudleLoaded,
    loadHaikudle,
    haikudles,
    haiku,
    createHaikudle,
    haikudleInProgress,
  ] = useHaikudle((state: any) => [
    state.loaded,
    state.load,
    state._haikudles,
    state.haiku,
    state.create,
    state.inProgress,
  ]);

  const onSaveHaikudle = () => {
    // console.log('>> app._components.NavOverlay.onSaveHaikudle()', {});

    const ret = prompt("YYYYMMDD?", moment().format("YYYYMMDD"));
    if (ret) {
      createHaikudle(user, {
        id: haiku?.id,
        dateCode: ret,
        haikuId: haiku?.id,
        inProgress: haikudleInProgress,
      });
    }
  }

  return (
    <div className="_bg-pink-200">
      {process.env.EXPERIENCE_MODE != "social-img" &&
        <div className={`${font.architects_daughter.className} fixed top-[-0.1rem] left-2.5 md:left-3.5 z-20`}>
          <StyledLayers styles={styles}>
            <Logo href={`/${lang || ""}`} onClick={onClickLogo} />
          </StyledLayers>
        </div>
      }
      {process.env.EXPERIENCE_MODE == "social-img" &&
        <div className={`${font.architects_daughter.className} fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-20`}>
          <StyledLayers styles={styles}>
            <Logo href={`/${lang || ""}`} onClick={onClickLogo} />
          </StyledLayers>
        </div>
      }

      {/* <div className="fixed top-4 right-3 z-20">
        <NavProfileLink href="/profile" className="_bg-orange-600 _hover: text-purple-100" style={textStyle} />
      </div> */}
      {process.env.EXPERIENCE_MODE != "social-img" && onClickGenerate &&
        <div className="fixed top-2.5 right-2.5 z-20">
          <StyledLayers styles={styles}>
            <GenerateIcon onClick={onClickGenerate} />
          </StyledLayers>
        </div>
      }

      <div
        className={`fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 50%, ${styles[0]?.color || "black"} 85%)`,
          opacity: 0.6,
        }}
      />

      {process.env.EXPERIENCE_MODE != "social-img" &&
        <div className={`fixed bottom-2 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center z-20`}>
          <StyledLayers styles={styles}>
            <BottomLinks lang={lang} haikuId={haikuId} onSaveHaikudle={onSaveHaikudle} />
          </StyledLayers>
        </div>
      }
    </div>
  );
}
