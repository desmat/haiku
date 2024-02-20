'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { BsGithub } from 'react-icons/bs';
import { IoSparkles, IoAddCircle, IoLinkSharp, IoHelpCircle } from 'react-icons/io5';
import { MdMail, MdHome, MdDelete } from "react-icons/md";
import { TbSwitchVertical } from "react-icons/tb";
import { RiFullscreenLine } from "react-icons/ri";
import { FaRandom } from "react-icons/fa";
import * as font from "@/app/font";
import useUser from '@/app/_hooks/user';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { StyledLayers } from './StyledLayers';
import { Haiku } from '@/types/Haiku';

export function Loading() {
  return (
    <div className='_bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 italic text-dark-2 opacity-5 animate-pulse'>Loading...</div>
  );
}

export function Logo({ mode, href, onClick }: { mode: string, href?: string, onClick?: any }) {
  const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";

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

export function BottomLinks({
  mode,
  haiku,
  lang,
  onRefresh,
  onSwitchMode,
  onDelete,
  onSaveHaikudle,
  onShowAbout,
}: {
  mode: string,
  haiku?: Haiku,
  lang?: LanguageType,
  onRefresh: any,
  onSwitchMode: any,
  onDelete: any,
  onSaveHaikudle: any,
  onShowAbout: any,
}) {
  // console.log("BottomLinks", { lang })
  const router = useRouter();
  const user = useUser((state: any) => state.user);

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
        >
          <BsGithub className="text-lg" />
        </Link>
        <Link
          key="web"
          href="https://www.desmat.ca"
          target="_blank"
        >
          <MdHome className="text-2xl" />
        </Link>
        <Link
          key="email"
          href="mailto:haiku@desmat.ca"
          target="_blank"
        >
          <MdMail className="text-xl" />
        </Link>
        <Link
          key="about"
          href="#"
          title="About"
          onClick={onShowAbout}
        >
          <IoHelpCircle className="text-2xl" />
        </Link>
        {haiku?.id && user?.isAdmin &&
          <Link
            key="link"
            href={`/${haiku ? haiku.id : ""}`}
          // target="_blank"
          >
            <IoLinkSharp className="text-xl" />
          </Link>
        }
        {haiku?.id && user?.isAdmin &&
          <Link
            key="refresh"
            href="#"
            onClick={onRefresh}
            title="Load random"
          >
            <FaRandom className="text-xl" />
          </Link>
        }
        {user?.isAdmin && haiku?.id &&
          <Link
            key="deleteHaiku"
            href="#"
            onClick={onDelete}
            title="Delete"
          >
            <MdDelete className="text-xl" />
          </Link>
        }
        {mode != "social-img" && user?.isAdmin &&
          <Link
            key="saveHaikudle"
            href="#"
            onClick={onSaveHaikudle}
            title="Save as daily Haikudle"
          >
            <IoAddCircle className="text-xl" />
          </Link>
        }
        {mode != "social-img" && user?.isAdmin &&
          <Link
            key="changeMode"
            href={`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : "haiku"}`}
            title="Switch between haiku/haikudle mode"
            onClick={async (e: any) => {
              e.preventDefault();
              await onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : "haiku"}`);
            }}
          >
            <TbSwitchVertical className="text-xl" />
          </Link>
        }
        {mode != "social-img" && user?.isAdmin &&
          <Link
            key="socialImgMode"
            href={`/${haiku ? haiku?.id : ""}?mode=social-img`}
            title="Switch to fullscreen mode (for social image)"
            onClick={async (e: any) => {
              e.preventDefault();
              await onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=social-img`);
            }}
          >
            <RiFullscreenLine className="text-xl" />
          </Link>
        }
      </div>
      {mode == "haiku" &&
        Object.entries(supportedLanguages)
          .filter((e: any) => (!lang && e[0] != "en") || (lang && lang != e[0]))
          .map(([k, v]: any) => (
            <Link
              key={k}
              href={`/${k != "en" ? `?lang=${k}` : ""}`}
            >
              {v.nativeName}
            </Link>
          ))}
    </div>
  )
}

export function NavOverlay({
  mode,
  styles,
  haiku,
  lang,
  onClickLogo,
  onClickGenerate,
  onSwitchMode,
  onDelete,
  onSaveHaikudle,
  onShowAbout,
}: {
  mode: string,
  styles: any[],
  haiku?: Haiku,
  lang?: LanguageType,
  onClickLogo?: any,
  onClickGenerate?: any,
  onSwitchMode?: any,
  onDelete?: any,
  onSaveHaikudle?: any,
  onShowAbout?: any
}) {
  const router = useRouter();
  // console.log(">> app._component.Nav.render");

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.Nav.handleKeyDown", { e });
    if (e.key == "Escape" && mode == "social-img") {
      await onSwitchMode();
      router.push(`/${haiku ? haiku?.id : ""}`);
    }
  }

  useEffect(() => {
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, haiku]);

  return (
    <div className="_bg-pink-200 z-90">
      {mode != "social-img" &&
        <div className={`${font.architects_daughter.className} fixed top-[-0.1rem] left-2.5 md:left-3.5 z-20`}>
          <StyledLayers styles={styles}>
            <Logo mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} onClick={onClickLogo} />
          </StyledLayers>
        </div>
      }
      {mode == "social-img" &&
        <div className={`${font.architects_daughter.className} fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-20`}>
          <StyledLayers styles={styles}>
            <Logo mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} onClick={onClickLogo} />
          </StyledLayers>
        </div>
      }

      {mode != "social-img" && onClickGenerate &&
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

      {mode != "social-img" &&
        <div className={`fixed bottom-2 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center z-20`}>
          <StyledLayers styles={styles}>
            <BottomLinks
              mode={mode}
              lang={lang}
              haiku={haiku}
              onRefresh={onClickLogo}
              onSwitchMode={onSwitchMode}
              onDelete={onDelete}
              onSaveHaikudle={onSaveHaikudle}
              onShowAbout={onShowAbout}
            />
          </StyledLayers>
        </div>
      }
    </div>
  );
}
