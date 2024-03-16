'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { IoSparkles, IoAddCircle, IoLinkSharp, IoHelpCircle, IoLogoGithub } from 'react-icons/io5';
import { MdMail, MdHome, MdDelete } from "react-icons/md";
import { TbSwitchVertical } from "react-icons/tb";
import { RiFullscreenLine } from "react-icons/ri";
import { BsChevronCompactRight, BsChevronCompactLeft, BsDashLg } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import * as font from "@/app/font";
import useUser from '@/app/_hooks/user';
import useHaikus from '@/app/_hooks/haikus';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { Haiku } from '@/types/Haiku';
import { User } from '@/types/User';
import { byCreatedAtDesc } from '@/utils/sort';
import { StyledLayers } from './StyledLayers';

export function Loading() {
  return (
    <div className='_bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 italic text-dark-2 opacity-5 animate-pulse'>Loading...</div>
  );
}

export function Logo({ mode, href, onClick, styles, altStyles }: { mode: string, href?: string, onClick?: any, styles?: any, altStyles?: any }) {
  const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode ? "text-[80pt]" : "text-[22pt] md:text-[28pt]"} font-semibold`}>
      AI
    </span>
  );

  const styledAi = altStyles
    ? (
      <StyledLayers styles={altStyles}>
        {ai}
      </StyledLayers>
    )
    : (
      <div>{ai}</div>
    );

  return (
    <Link
      onClick={onClick}
      href={href || "#"}
      className={`hover:no-underline ${isSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      <div className={`${font.architects_daughter.className} flex flex-row`}>
        <StyledLayers styles={styles}>h</StyledLayers>
        {styledAi}
        <StyledLayers styles={styles}>{isHaikudleMode || isSocialImgMode ? "kudle" : "ku"}</StyledLayers>
      </div>
    </Link>
  )
}

export function LyricleLogo({ mode, href, onClick, styles, altStyles }: { mode: string, href?: string, onClick?: any, styles?: any, altStyles?: any }) {
  const isSocialImgMode = mode == "social-img-lyricle";
  const isLyricleMode = mode == "lyricle";

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode ? "text-[80pt]" : "text-[22pt] md:text-[28pt]"} font-semibold`}>
      le
    </span>
  );

  const styledAi = altStyles
    ? (
      <StyledLayers styles={altStyles}>
        {(isLyricleMode || isSocialImgMode) && ai}
      </StyledLayers>
    )
    : (
      <div>{(isLyricleMode || isSocialImgMode) && ai}</div>
    );

  return (
    <Link
      onClick={onClick}
      href={href || "#"}
      className={`hover:no-underline ${isSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      <div className={`${font.architects_daughter.className} flex flex-row`}>
        <StyledLayers styles={styles}>{`Lyric${isLyricleMode || isSocialImgMode ? "" : "s"}`}</StyledLayers>
        {styledAi}
      </div>
    </Link>
  )
}

export function GenerateIcon({ onClick, sizeOverwrite }: { onClick?: any, sizeOverwrite?: string }) {

  return (
    <Link href="#" onClick={onClick}>
      <IoSparkles className={`_bg-orange-600 _hover: _text-purple-100 ${sizeOverwrite || "h-6 w-6 md:h-8 md:w-8"}`} />
    </Link>
  )
}

function BottomLinks({
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
  const [pop, setPop] = useState(false);

  return (
    <div
      className="_bg-yellow-100 relative flex flex-row gap-3 items-center justify-center _font-semibold"
    >
      <div
        className="relative flex flex-row gap-2 items-center justify-center _font-semibold"
      >
        <Link
          key="about"
          href="#"
          title="About"
          onClick={(e: any) => {
            e.preventDefault();
            onShowAbout && onShowAbout();
          }}
        >
          <IoHelpCircle className="text-2xl" />
        </Link>
        <Link
          key="github"
          href="https://github.com/desmat/haiku"
          target="_blank"
        >
          <IoLogoGithub className="text-xl" />
        </Link>
        <Link
          key="web"
          href="https://www.desmat.ca"
          target="_blank"
        >
          <MdHome className="text-2xl" />
        </Link>
        {/* <Link
          key="email"
          href={`mailto:haiku${mode == "haikudle" ? "dle" : ""}@desmat.ca`}
          target="_blank"
        >
          <MdMail className="text-xl" />
        </Link> */}
        {haiku?.id &&
          <Link
            key="link"
            href={haiku.id}
            title="Copy direct link"
            className="cursor-copy"
            style={{
              filter: `${pop ? `drop-shadow(0px 0px 16px ${haiku?.bgColor})` : ""}`,
            }}
            onClick={(e: any) => {
              e.preventDefault();
              setPop(true);
              setTimeout(() => setPop(false), 100);
              navigator.clipboard.writeText(`${mode == "haikudle" ? "https://haikudle.art" : mode == "lycicle" ? "https://lyricle.desmat.ca" : "https://haiku.desmat.ca"}/${haiku.id}`);
            }}
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
        {["lyricle", "haikudle"].includes(mode) && user?.isAdmin &&
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
            href={`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : mode == "haikudle" ? "haiku" : mode == "lyricle" ? "lyrics" : "lyricle"}`}
            title="Switch between haiku/haikudle mode"
            onClick={async (e: any) => {
              e.preventDefault();
              await onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : mode == "haikudle" ? "haiku" : mode == "lyricle" ? "lyrics" : "lyricle"}`);
            }}
          >
            <TbSwitchVertical className="text-xl" />
          </Link>
        }
        {!["social-img", "social-img-lyricle"].includes(mode) && user?.isAdmin &&
          <Link
            key="socialImgMode"
            href={`/${haiku ? haiku?.id : ""}?mode=social-img${["lyrics", "lyricle"].includes(mode) ? "-lyricle" : ""}`}
            title="Switch to fullscreen mode (for social image)"
            onClick={async (e: any) => {
              e.preventDefault();
              await onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=social-img${["lyrics", "lyricle"].includes(mode) ? "-lyricle" : ""}`);
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

function SlidingMenu({
  user,
  styles,
  altStyles,
  haiku,
  myHaikus,
  onShowAbout,
  onSelectHaiku,
}: {
  user: User,
  styles: any[],
  altStyles: any[],
  haiku?: Haiku,
  myHaikus?: Haiku[],
  onShowAbout?: any,
  onSelectHaiku?: any,
}) {
  const [menuOpened, setMenuOpened] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const pageSize = 20;
  const [numPages, setNumPages] = useState(1);

  // console.log(">> app._component.Nav.render", { menuOpened, menuAnimating });

  // TODO: move to shared lib between Nav and Layout
  const isLyricleMode = process.env.EXPERIENCE_MODE == "lyricle";
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
  const appDescription = isLyricleMode
    ? "Daily lyric puzzles"
    : isHaikudleMode
      ? "AI-generated daily art and haiku puzzles"
      : "AI-generated art and haiku poems";
  const thingName = isLyricleMode
    ? "Lyricle"
    : isHaikudleMode
      ? "Haikudle"
      : "Haiku";

  // console.log(">> app._component.SlidingMenu.render", { user });

  const toggleMenuOpened = () => {
    // console.log(">> app._component.Nav.toggleMenuOpened", {});
    setMenuAnimating(true);
    setTimeout(() => setMenuAnimating(false), 100);
    setMenuOpened(!menuOpened);
  }

  function loadMore(e: any) {
    e.preventDefault();
    setNumPages(numPages * 2);
  }

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.Nav.handleKeyDown", { menuOpened, menuAnimating });
    setMenuOpened(false);
  }

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, []);

  return (
    <div>
      {menuOpened &&
        <div
          className="_bg-blue-400 absolute top-0 left-0 w-[100vw] h-[100vh] z-20"
          onClick={() => menuOpened && toggleMenuOpened()}>
        </div>
      }
      <div
        className={`_bg-pink-200 fixed top-0 h-full w-[30rem] max-w-[90vw] z-20 transition-all _blur-[10px]`}
        style={{
          backgroundColor: `${styles[1]?.color ? styles[0]?.color + "88" : "RGBA(0, 0, 0, 0.5)"}`,
          backdropFilter: "blur(10px)",
          left: menuOpened ? 0 : "-30rem"
        }}
      >
        <div className="_bg-pink-400 flex flex-col h-[100vh]">
          <div
            className="_bg-yellow-200 group absolute right-0 top-1/2 -translate-y-1/2 z-30 cursor-pointer text-[32pt] _md:text-[36pt] bold _pl-2 py-5 opacity-40 hover:opacity-100 transition-all"
            onClick={toggleMenuOpened}
            style={{
              filter: `drop-shadow(0px 0px 16px ${haiku?.bgColor})`,
              marginRight: menuOpened ? "-0.5rem" : "-2.2rem",
              display: menuAnimating ? "none" : "block",
              transitionDuration: "80ms",
            }}
            title={menuOpened ? "Hide menu" : "Show menu"}
          >
            <StyledLayers styles={styles}>
              <div className="rotate-90 group-hover:hidden">
                <BsDashLg />
              </div>
              <div className="hidden group-hover:block">
                {menuOpened &&
                  <div className="mr-[0.2rem] _md:mr-[0.3rem]">
                    <BsChevronCompactLeft />
                  </div>
                }
                {!menuOpened &&
                  <div className="mr-[-0.2rem] _md:mr-[-0.3rem]">
                    <BsChevronCompactRight />
                  </div>
                }
              </div>
            </StyledLayers>
          </div>
          <div className="_bg-orange-400 flex flex-col h-[3rem] md:h-[4rem]">
          </div>
          <div className="_bg-yellow-400 flex flex-col h-full overflow-scroll px-3 md:px-4">
            <div className="pt-2">
              <StyledLayers styles={styles}>
                Latest {thingName}s
              </StyledLayers>
            </div>
            {/* note: don't render when not opened to save on resources */}
            {(menuAnimating || menuOpened) && myHaikus && myHaikus
              // .filter((h: Haiku) => h.createdBy == user.id)
              .sort(byCreatedAtDesc)
              .slice(0, numPages * pageSize) // more than that and things blow up on safari
              .map((h: Haiku, i: number) => (
                <StyledLayers key={i} styles={altStyles}>
                  <Link
                    href={`/${h.id}`}
                    onClick={(e: any) => {
                      if (onSelectHaiku) {
                        e.preventDefault();
                        toggleMenuOpened();
                        onSelectHaiku(h.id);
                      }
                    }}
                  >
                    <div style={{ fontWeight: 400 }}>
                      <span className="capitalize">&quot;{h.theme}&quot;</span> generated {moment(h.createdAt).fromNow()}{h.createdBy != user.id && ` by ${user?.isAdmin ? "admin" : "user"} ${h.createdBy}`}
                    </div>
                  </Link>
                </StyledLayers>
              ))}
            {myHaikus && (Object.values(myHaikus).length > numPages * pageSize) &&
              <div
                className="py-2 cursor-pointer"
                onClick={loadMore}
              >
                <StyledLayers styles={styles}>
                  Load more
                </StyledLayers>
              </div>
            }
          </div>
          <div className="_bg-purple-400 flex flex-row sm:justify-center justify-start px-2 pt-4 pb-2 h-fit w-full">
            <StyledLayers styles={styles}>
              <div className="_bg-purple-200 flex sm:flex-row flex-col sm:gap-3 gap-2">
                <Link
                  key="about"
                  className="flex flex-row"
                  href="#"
                  title="About"
                  onClick={(e: any) => {
                    e.preventDefault();
                    onShowAbout && onShowAbout();
                  }}
                >
                  <IoHelpCircle className="text-2xl" />
                  About
                </Link>
                <Link
                  key="github"
                  className="flex flex-row gap-1"
                  href="https://github.com/desmat/haiku"
                  target="_blank"
                >
                  <IoLogoGithub className="text-xl mt-[0.2rem]" />
                  github.com/desmat
                </Link>
                <Link
                  key="web"
                  className="flex flex-row gap-1"
                  href="https://www.desmat.ca"
                  target="_blank"
                >
                  <MdHome className="text-2xl" />
                  www.desmat.ca
                </Link>
              </div>
            </StyledLayers>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NavOverlay({
  mode,
  styles,
  altStyles,
  haiku,
  // haikus,
  lang,
  onClickLogo,
  onClickGenerate,
  onSwitchMode,
  onDelete,
  onSaveHaikudle,
  onShowAbout,
  onSelectHaiku,
}: {
  mode: string,
  styles: any[],
  altStyles: any[],
  haiku?: Haiku,
  // haikus?: Haiku[],
  lang?: LanguageType,
  onClickLogo?: any,
  onClickGenerate?: any,
  onSwitchMode?: any,
  onDelete?: any,
  onSaveHaikudle?: any,
  onShowAbout?: any,
  onSelectHaiku?: any
}) {
  const router = useRouter();
  const [user] = useUser((state: any) => [state.user]);
  const [loadHaikus, myHaikus] = useHaikus((state: any) => [state.load, state.myHaikus]);

  // console.log(">> app._component.Nav.render", {  });

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.Nav.handleKeyDown", {  });
    if (e.key == "Escape") {
      if (["social-img", "social-img-lyricle"].includes(mode)) {
        await onSwitchMode();
        router.push(`/${haiku ? haiku?.id : ""}`);
      }
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadHaikus({ /* createdBy: user.id */ mine: true }, mode);
    }
  }, [user?.id]);

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, haiku]);

  return (
    <div className="_bg-pink-200 z-90">
      {["haikudle", "haiku"].includes(mode) &&
        <div className={`${font.architects_daughter.className} fixed top-[-0.1rem] left-2.5 md:left-3.5 z-30`}>
          <Logo styles={styles} altStyles={altStyles} mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} onClick={onClickLogo} />
        </div>
      }
      {mode == "social-img" &&
        <div className={`${font.architects_daughter.className} fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-30`}>
          <Logo styles={styles} altStyles={altStyles} mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} onClick={onClickLogo} />
        </div>
      }
      {["lyrics", "lyricle"].includes(mode) &&
        <div className={`${font.architects_daughter.className} fixed top-[-0.1rem] left-2.5 md:left-3.5 z-30`}>
          <LyricleLogo styles={styles} altStyles={altStyles} mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} onClick={onClickLogo} />
        </div>
      }
      {mode == "social-img-lyricle" &&
        <div className={`${font.architects_daughter.className} fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-30`}>
          <LyricleLogo styles={styles} altStyles={altStyles} mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} onClick={onClickLogo} />
        </div>
      }

      {["lyricle", "haikudle", "haiku"].includes(mode) && onClickGenerate &&
        <div className="fixed top-2.5 right-2.5 z-20">
          <StyledLayers styles={altStyles}>
            <GenerateIcon onClick={onClickGenerate} />
          </StyledLayers>
        </div>
      }

      <div
        className={`foo fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-10`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 35%, ${styles[0]?.color || "black"} 70%)`,
          opacity: 0.2,
        }}
      />

      {!["social-img", "social-img-lyricle"].includes(mode) &&
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

      {user?.isAdmin && !["social-img", "social-img-lyricle"].includes(mode) && // myHaikus?.length > 0 &&
        <SlidingMenu
          user={user}
          styles={styles}
          altStyles={altStyles}
          haiku={haiku}
          myHaikus={myHaikus ? Object.values(myHaikus) : []}
          onShowAbout={onShowAbout}
          onSelectHaiku={onSelectHaiku}
        />
      }
    </div>
  );
}
