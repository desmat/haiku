'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { IoSparkles, IoAddCircle, IoHelpCircle, IoLogoGithub } from 'react-icons/io5';
import { MdMail, MdHome, MdDelete, MdIosShare } from "react-icons/md";
import { TbSwitchVertical } from "react-icons/tb";
import { RiFullscreenLine } from "react-icons/ri";
import { BsChevronCompactRight, BsChevronCompactLeft, BsDashLg } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import * as font from "@/app/font";
import useAlert from '@/app/_hooks/alert';
import useUser from '@/app/_hooks/user';
import useHaikus from '@/app/_hooks/haikus';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { Haiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { User } from '@/types/User';
import { byCreatedAtDesc } from '@/utils/sort';
import { USAGE_LIMIT } from '@/types/Usage';
import { StyledLayers } from './StyledLayers';
import trackEvent from '@/utils/trackEvent';

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
      href={href || "/"}
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

export function GenerateIcon({ onClick, sizeOverwrite }: { onClick?: any, sizeOverwrite?: string }) {
  const icon = <IoSparkles className={`_bg-orange-600 _hover: _text-purple-100 ${sizeOverwrite || "h-6 w-6 md:h-8 md:w-8"}`} />;
  if (!onClick) {
    return icon;
  }
  return (
    <Link href="#" onClick={onClick}>
      {icon}
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
  const [alert] = useAlert((state: any) => [state.plain]);

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
            title="Copy direct link to share"
            className="cursor-copy"
            style={{
              filter: `${pop ? `drop-shadow(0px 0px 16px ${haiku.bgColor})` : ""}`,
            }}
            onClick={(e: any) => {
              e.preventDefault();
              setPop(true);
              setTimeout(() => setPop(false), 100);
              navigator.clipboard.writeText(`${mode == "haikudle" ? "https://haikudle.art" : "https://haiku.desmat.ca"}/${haiku.id}`);
              alert(`Link to this haiku copied to clipboard`, { closeDelay: 750 });
              trackEvent("haiku-shared", {
                userId: user.id,
                id: haiku.id,
              });
            }}
          >
            <MdIosShare className="text-xl mt-[-0.1rem]" />
          </Link>
        }
        {!haiku?.id &&
          <div className="opacity-30">
            <MdIosShare className="text-xl mt-[-0.1rem]" />
          </div>
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
        {["haikudle"].includes(mode) && user?.isAdmin &&
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
        {!["social-img"].includes(mode) && user?.isAdmin &&
          <Link
            key="socialImgMode"
            href={`/${haiku ? haiku?.id : ""}?mode=showcase`}
            title="Switch to showcase mode "
            onClick={async (e: any) => {
              e.preventDefault();
              await onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=showcase`);
            }}
          >
            <RiFullscreenLine className="text-xl" />
          </Link>
        }
      </div>
      {
        mode == "haiku" &&
        Object.entries(supportedLanguages)
          .filter((e: any) => (!lang && e[0] != "en") || (lang && lang != e[0]))
          .map(([k, v]: any) => (
            <Link
              key={k}
              href={`/${k != "en" ? `?lang=${k}` : ""}`}
            >
              {v.nativeName}
            </Link>
          ))
      }
    </div >
  )
}

function SidePanel({
  user,
  mode,
  styles,
  altStyles,
  bgColor,
  onShowAbout,
  onSelectHaiku,
}: {
  user: User,
  mode?: string
  styles: any[],
  altStyles: any[],
  bgColor: string,
  onShowAbout?: any,
  onSelectHaiku?: any,
}) {
  const [panelOpened, setPanelOpened] = useState(false);
  const [panelAnimating, setPanelAnimating] = useState(false);
  const [panelPinned, setPanelPinned] = useState(false);
  const pageSize = 20;
  const [numPages, setNumPages] = useState(1);
  const [listMode, setListMode] = useState<"haiku" | "dailyHaikudle">("haiku");
  const [
    loadHaikus,
    userHaikus,
    dailyHaikudles,
  ] = useHaikus((state: any) => [
    state.load,
    state.userHaikus ? Object.values(state.userHaikus) : [],
    state.dailyHaikudles ? Object.values(state.dailyHaikudles) : [],
  ]);

  // console.log(">> app._component.Nav.SidePanel.render()", { panelOpened, panelAnimating, dailyHaikudles, userHaikus });
  
  // TODO: move to shared lib between Nav and Layout
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
  const appDescription = isHaikudleMode
    ? "AI-generated daily art and haiku puzzles"
    : "AI-generated art and haiku poems";
  const thingName = "haiku";

  // console.log(">> app._component.SidePanel.render", { user, mode });

  const toggleMenuOpened = () => {
    // console.log(">> app._component.SidePanel.toggleMenuOpened", {});
    setPanelAnimating(true);
    setTimeout(() => setPanelAnimating(false), 100);

    if (panelOpened) setPanelPinned(false);
    setPanelOpened(!panelOpened);
  }

  const loadMore = (e: any) => {
    e.preventDefault();
    setNumPages(numPages * 2);
  };

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.SidePanel.handleKeyDown", { panelOpened, panelAnimating });
    if (e.key == "Escape") {
      setPanelOpened(false);
    }
  };

  const isUserAdmin = (userId?: string): boolean => {
    // @ts-ignore
    const ret = (process.env.ADMIN_USER_IDS || "").split(",").includes(userId);
    // console.log(">> app._component.SidePanel.isUserAdmin", { userId, adminUserIds: process.env.ADMIN_USER_IDS, isUserAdmin: ret });
    return ret;
  };

  const bySolvedOrCreatedAtDesc = (a: any, b: any) => {
    return (b.solvedAt || b.createdAt || 0) - (a.solvedAt || a.createdAt || 0)
  }

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { user, mode });
    if (user?.id && ["haiku", "haikudle"].includes(mode || "")) {
      loadHaikus({ mine: true }, mode);
    }
  }, [user?.id]);

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, []);

  if (!userHaikus.length) {
    return <></>
  }

  return (
    <div>
      {/* Area behind side panel but in front of main content to allow users to click and close the panel */}
      {panelOpened &&
        <div
          className="_bg-blue-400 absolute top-0 left-0 w-[100vw] h-[100vh] z-20"
          onClick={() => panelOpened && toggleMenuOpened()}
        >
        </div>
      }
      <div
        className={`_bg-pink-200 fixed top-0 h-full w-[27rem] max-w-[90vw] z-20 transition-all _blur-[10px]`}
        style={{
          backgroundColor: `${styles[1]?.color ? styles[0]?.color + "88" : "RGBA(0, 0, 0, 0.5)"}`,
          backdropFilter: "blur(10px)",
          left: panelOpened ? 0 : "-27rem"
        }}
        onMouseLeave={() => panelOpened && !panelPinned && toggleMenuOpened()}
      >
        <div className="_bg-pink-400 flex flex-col h-[100vh]">
          {/* hotspot to open the side panel on mouse hover */}
          <div
            className="_bg-red-400 group absolute top-[4rem] right-0 w-[1rem] mr-[-1rem] h-[calc(100vh-4rem)] z-90"
            onMouseEnter={() => !panelOpened && !panelAnimating && toggleMenuOpened()}
            onClick={() => panelOpened && toggleMenuOpened()}
          >
          </div>
          <div
            className="_bg-yellow-200 group absolute right-0 top-1/2 -translate-y-1/2 z-30 cursor-pointer text-[22pt] _md:text-[36pt] bold py-5 _opacity-40 hover:opacity-100 transition-all"
            onClick={() => {
              !panelOpened && !panelPinned && setPanelPinned(true);
              toggleMenuOpened();
            }}
            style={{
              filter: `drop-shadow(0px 0px 16px ${bgColor})`,
              marginRight: panelOpened ? "-0.2rem" : "-1.7rem",
              display: panelAnimating ? "none" : "block",
              transitionDuration: "80ms",
            }}
            title={panelOpened ? "Hide side panel" : "Show side panel"}
          >
            <StyledLayers styles={styles}>
              <div className="_bg-orange-400 rotate-90 group-hover:hidden ml-[-1rem]">
                <BsDashLg />
              </div>
              <div className="hidden group-hover:block">
                {panelOpened &&
                  <div className="mr-[0.1rem] _md:mr-[0.3rem]">
                    <BsChevronCompactLeft />
                  </div>
                }
                {!panelOpened &&
                  <div className="_bg-orange-400 mr-[-0.2rem] ml-[-0.8rem] _md:mr-[-0.3rem]">
                    <BsChevronCompactRight />
                  </div>
                }
              </div>
            </StyledLayers>
          </div>
          {/* Spacer for the logo to punch trough */}
          <div className="_bg-orange-400 flex flex-col h-[3rem] md:h-[4rem]">
          </div>
          <div className="_bg-yellow-400 flex flex-col h-full overflow-scroll px-3 md:px-4">
            <div className="py-2">
              <StyledLayers styles={styles}>
                {user?.isAdmin && listMode == "haiku" &&
                  <div
                    className="cursor-pointer"
                    title="Show daily haikudles"
                    onClick={() => setListMode("dailyHaikudle")}
                  >
                    Latest {thingName}s
                  </div>
                }
                {user?.isAdmin && listMode == "dailyHaikudle" &&
                  <div
                    className="cursor-pointer"
                    title="Show Haikus"
                    onClick={() => setListMode("haiku")}
                  >
                    Daily Haikudles
                  </div>
                }
                {!user.isAdmin &&
                  <>Your haikus</>
                }
              </StyledLayers>
            </div>
            {/* note: don't render when not opened to save on resources */}
            {listMode == "haiku" && (panelAnimating || panelOpened) && userHaikus
              // .filter((h: Haiku) => h.createdBy == user.id)
              .sort(user.isAdmin ? byCreatedAtDesc : bySolvedOrCreatedAtDesc)
              .slice(0, numPages * pageSize) // more than that and things blow up on safari
              .map((h: Haiku, i: number) => (
                <StyledLayers key={i} styles={altStyles}>
                  <Link
                    href={`/${h.id}`}
                    onClick={(e: any) => {
                      if (onSelectHaiku) {
                        e.preventDefault();
                        /* !panelPinned && */ toggleMenuOpened();
                        onSelectHaiku(h.id);
                      }
                    }}
                  >
                    <span className="capitalize font-semibold">&quot;{h.theme}&quot;</span>
                    {user?.isAdmin &&
                      <span className="font-normal"> generated {moment(h.createdAt).fromNow()} by {h.createdBy == user?.id ? "you" : `${isUserAdmin(h.createdBy) ? "admin" : "user"} ${h.createdBy}`}</span>
                    }
                    {!user?.isAdmin && h.solvedAt &&
                      <span className="font-normal"> solved {moment(h.solvedAt).fromNow()}{h.moves ? ` in ${h.moves} move${h.moves > 1 ? "s" : ""}` : ""}</span>
                    }
                    {!user?.isAdmin && !h.solvedAt && h.createdAt &&
                      <span className="font-normal"> generated {moment(h.createdAt).fromNow()}</span>
                    }
                  </Link>
                </StyledLayers>
              ))
            }
            {listMode == "dailyHaikudle" && user?.isAdmin && (panelAnimating || panelOpened) && dailyHaikudles
              // .filter((h: Haiku) => h.createdBy == user.id)
              .sort((a: any, b: any) => b.id - a.id)
              .slice(0, numPages * pageSize) // more than that and things blow up on safari
              .map((dh: DailyHaikudle, i: number) => (
                <StyledLayers key={i} styles={altStyles}>
                  <Link
                    href={`/${dh.haikuId}`}
                    onClick={(e: any) => {
                      if (onSelectHaiku) {
                        e.preventDefault();
                        /* !panelPinned && */ toggleMenuOpened();
                        onSelectHaiku(dh.haikuId);
                      }
                    }}
                  >
                    <span className="capitalize font-semibold">&quot;{dh.theme}&quot;</span>
                    <span className="font-normal"> {dh.id == moment().format("YYYYMMDD") ? "Today" : moment(dh.id).format('MMMM Do YYYY')}</span>
                  </Link>
                </StyledLayers>
              ))
            }
            {(listMode == "haiku" ? userHaikus : dailyHaikudles) && (Object.values(listMode == "haiku" ? userHaikus : dailyHaikudles).length > numPages * pageSize) &&
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
          <div className="_bg-purple-400 flex flex-row justify-center px-2 pt-4 pb-2 h-fit w-full">
            <StyledLayers styles={styles}>
              <div className="_bg-purple-200 flex flex-row gap-3">
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
  onSelectHaiku?: any,
}) {
  const router = useRouter();
  const [user] = useUser((state: any) => [state.user]);
  const [refreshDelay, setRefreshDelay] = useState(24 * 60 * 60 * 1000); // every day
  const [refreshTimeout, setRefreshTimeout] = useState<any>();
  const [resetAlert, alert] = useAlert((state: any) => [state.reset, state.plain]);

  // console.log(">> app._component.Nav.render", { mode, haikuId: haiku?.id });

  const switchMode = async () => {
    // console.log(">> app._component.Nav.switchMode", {});    
    await onSwitchMode();
    router.push(`/${haiku ? haiku?.id : ""}`);
  }

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.Nav.handleKeyDown", { mode });
    if (e.key == "Escape") {
      if (["showcase", "social-img"].includes(mode)) {
        switchMode();
      }
    }
  }

  const changeDelay = (val: number) => {
    setRefreshDelay(val);

    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(undefined);
    }

    setRefreshTimeout(setTimeout(onClickLogo, val));

    alert(
      `Refreshing every ${moment.duration(val).humanize()} (${Math.floor(val / 1000)} seconds)`,
      { closeDelay: 1000 }
    );
  }

  const increaseDelay = () => {
    // max value, otherwise is basically 0
    changeDelay(Math.min(refreshDelay * 2, 2147483647));
  }

  const decreaseDelay = () => {
    // less than 1000 and things get weird
    changeDelay(Math.max(refreshDelay / 2, 1000));
  }

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    if (mode == "showcase" && refreshDelay) {
      setRefreshTimeout(setTimeout(onClickLogo, refreshDelay));
    }

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown);

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        setRefreshTimeout(undefined);
      }
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
          <Logo styles={styles} altStyles={altStyles} mode={mode} href={`/${lang && lang != "en" && `?lang=${lang}` || ""}`} />
          <div
            className="_bg-pink-400 _opacity-50 fixed top-0 left-0 w-full h-full cursor-pointer"
            onClick={switchMode}
          />
        </div>
      }
      {["haikudle", "haiku"].includes(mode) &&
        <div className="fixed top-2.5 right-2.5 z-20">
          {(!onClickGenerate || !user?.isAdmin && user.usage?.haikusCreated >= USAGE_LIMIT.DAILY_CREATE_HAIKU) &&
            <div className="opacity-30" title="Exceeded daily limit: try again later">
              <StyledLayers styles={altStyles}>
                <GenerateIcon />
              </StyledLayers>
            </div>
          }
          {onClickGenerate && (user?.isAdmin || user?.usage?.haikusCreated < USAGE_LIMIT.DAILY_CREATE_HAIKU) &&
            <div title="Generate a new haiku">
              <StyledLayers styles={altStyles}>
                <GenerateIcon onClick={onClickGenerate} />
              </StyledLayers>
            </div>
          }
        </div>
      }

      <div
        className={`foo fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-10`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 35%, ${styles[0]?.color || "black"} 70%)`,
          opacity: 0.2,
        }}
      />

      {["haiku", "haikudle"].includes(mode) &&
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

      {["showcase", "social-img"].includes(mode) &&
        <>
          <div
            className="_bg-pink-400 fixed top-0 left-0 w-10 h-full z-10 cursor-pointer"
            title="Exit showcase mode"
            onClick={switchMode}
          />
          <div
            className="_bg-yellow-400 fixed bottom-0 left-0 w-10 h-10 z-40 cursor-pointer"
            title="Increase refresh time"
            onClick={increaseDelay}
          />
          <div
            className="_bg-yellow-400 fixed bottom-0 right-0 w-10 h-10 z-40 cursor-pointer"
            title="Decrease refresh time"
            onClick={decreaseDelay}
          />
        </>
      }

      {["haiku", "haikudle"].includes(mode) &&
        <SidePanel
          user={user}
          mode={mode}
          styles={styles}
          altStyles={altStyles}
          bgColor={haiku?.bgColor}
          onShowAbout={onShowAbout}
          onSelectHaiku={onSelectHaiku}
        />
      }
    </div>
  );
}
