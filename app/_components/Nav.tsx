'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { IoSparkles, IoAddCircle, IoHelpCircle, IoLogoGithub } from 'react-icons/io5';
import { FaShare, FaExpand, FaCopy } from "react-icons/fa";
import { HiSwitchVertical } from "react-icons/hi";
import { MdMail, MdHome, MdDelete } from "react-icons/md";
import { BsChevronCompactRight, BsChevronCompactLeft, BsDashLg, BsDatabaseFillUp } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import * as font from "@/app/font";
import useAlert from '@/app/_hooks/alert';
import useUser from '@/app/_hooks/user';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { Haiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { User } from '@/types/User';
import { formatTimeFromNow } from '@/utils/format';
import { byCreatedAtDesc } from '@/utils/sort';
import { USAGE_LIMIT } from '@/types/Usage';
import { StyledLayers } from './StyledLayers';
import PopOnClick from './PopOnClick';
import trackEvent from '@/utils/trackEvent';

export function Loading({ onClick }: { onClick?: any }) {
  const defaultOnClick = () => document.location.href = "/";
  return (
    <div
      onClick={onClick || defaultOnClick}
      className='_bg-pink-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-dark-2 opacity-5 animate-pulse cursor-pointer z-50'
    >
      <div className="animate-pulse flex flex-col items-center">
        <div>読込</div>
        <div>Loading</div>
      </div>
    </div>
  );
}

export function Logo({
  mode,
  href,
  onClick,
  styles,
  altStyles,
  onboardingElement,
}: {
  mode: string,
  href?: string,
  onClick?: any,
  styles?: any,
  altStyles?: any,
  onboardingElement?: string,
}) {
  const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode ? "text-[80pt]" : "text-[22pt] md:text-[28pt]"} font-semibold`}>
      AI
    </span>
  );

  const styledAi = altStyles
    ? (
      <StyledLayers
        styles={onboardingElement && !onboardingElement.startsWith("logo")
          ? altStyles.slice(0, 1)
          : altStyles
        }
      >
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
      className={`logo hover:no-underline ${isSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      <div className={`${font.architects_daughter.className} flex flex-row`}>
        <StyledLayers
          styles={onboardingElement && !onboardingElement.startsWith("logo")
            ? styles.slice(0, 1)
            : styles
          }
        >h</StyledLayers>
        {styledAi}
        <StyledLayers
          styles={onboardingElement && !onboardingElement.startsWith("logo")
            ? styles.slice(0, 1)
            : styles
          }
        >{isHaikudleMode /* || isSocialImgMode */ ? "kudle" : "kuGenius"}</StyledLayers>
      </div>
    </Link>
  )
}

export function GenerateIcon({
  onClick,
  sizeOverwrite,
  children,
}: {
  onClick?: any,
  sizeOverwrite?: string,
  children?: React.ReactNode,
}) {
  const icon = <IoSparkles className={`_bg-orange-600 _hover: _text-purple-100 ${sizeOverwrite || "h-6 w-6 md:h-8 md:w-8"}`} />;

  return (
    <Link
      className="generate-icon flex flex-row m-auto gap-2 hover:no-underline"
      style={{ cursor: onClick ? "pointer" : "default" }}
      href="#"
      onClick={(e: any) => {
        e.preventDefault();
        onClick && onClick();
      }}
    >
      {children &&
        <div className={`${font.architects_daughter.className} _bg-yellow-200 my-[-0.3rem] md:text-[24pt] sm:text-[22pt] text-[18pt]`}>
          {children}
        </div>
      }
      <div className="_bg-yellow-300 m-auto">
        {icon}
      </div>
    </Link>
  )
}

function BottomLinks({
  mode,
  haiku,
  lang,
  styles,
  backupInProgress,
  onboardingElement,
  onRefresh,
  onSwitchMode,
  onDelete,
  onSaveDailyHaiku,
  onShowAbout,
  onBackup,
  onCopyHaiku,
  onCopyLink,
}: {
  mode: string,
  haiku?: Haiku,
  lang?: LanguageType,
  styles?: any,
  backupInProgress?: boolean,
  onboardingElement?: string | undefined,
  onRefresh: any,
  onSwitchMode: any,
  onDelete: any,
  onSaveDailyHaiku: any,
  onShowAbout: any,
  onBackup?: any,
  onCopyHaiku?: any,
  onCopyLink?: any,
}) {
  // console.log("BottomLinks", { lang })
  const router = useRouter();
  const user = useUser((state: any) => state.user);
  const [alert] = useAlert((state: any) => [state.plain]);

  return (
    <div
      className="_bg-yellow-100 bottom-links relative flex flex-row gap-3 items-center justify-center _font-semibold"
    >
      <div
        className="relative flex flex-row gap-2 items-center justify-center _font-semibold"
      >
        <div
          key="about"
          className="cursor-pointer"
          title="About"
          onClick={() => {
            trackEvent("clicked-about", {
              userId: user?.id,
              location: "bottom-links",
            });
            onShowAbout && onShowAbout();
          }}
        >
          <PopOnClick color={haiku?.bgColor}>
            <IoHelpCircle className="text-2xl" />
          </PopOnClick>
        </div>
        <Link
          key="github"
          href="https://github.com/desmat/haiku"
          target="_blank"
          onClick={() => {
            trackEvent("clicked-github", {
              userId: user?.id,
              location: "bottom-links",
            });
          }}
        >
          <PopOnClick color={haiku?.bgColor}>
            <IoLogoGithub className="text-xl" />
          </PopOnClick>
        </Link>
        <Link
          key="web"
          href="https://www.desmat.ca"
          target="_blank"
          onClick={() => {
            trackEvent("clicked-web", {
              userId: user?.id,
              location: "bottom-links",
            });
          }}
        >
          <PopOnClick color={haiku?.bgColor}>
            <MdHome className="text-2xl" />
          </PopOnClick>
        </Link>
        {/* <Link
          key="email"
          href={`mailto:haiku${mode == "haikudle" ? "dle" : ""}@desmat.ca`}
          target="_blank"
        >
          <MdMail className="text-xl" />
        </Link> */}
        <div
          key="copy"
          className={haiku?.id && onCopyHaiku ? "cursor-copy" : "opacity-40"}
          title="Copy haiku poem "
          onClick={() => {
            if (onCopyHaiku) {
              trackEvent("haiku-copied", {
                userId: user.id,
                id: haiku.id,
                location: "bottom-links",
              });
              onCopyHaiku();
            }
          }}
        >
          <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onCopyHaiku}>
            <FaCopy className="text-xl" />
          </PopOnClick>
        </div>
        {haiku?.id && onCopyLink &&
          <div className="onboarding-container">
            {onboardingElement == "bottom-links-share" &&
              <div className="onboarding-focus" />
            }
            <StyledLayers
              styles={styles}
              disabled={onboardingElement != "bottom-links-share"}
            >
              <Link
                key="link"
                href={`/${haiku.id}`}
                title="Copy link to share"
                className="cursor-copy"
                onClick={(e: any) => {
                  e.preventDefault();
                  onCopyLink()
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
                  <FaShare className="text-xl" />
                </PopOnClick>
              </Link>
            </StyledLayers>
          </div>
        }
        {(!haiku?.id || !onCopyLink) &&
          <div className="opacity-40">
            <FaShare className="text-xl" />
          </div>
        }
        {user?.isAdmin &&
          <div
            key="refresh"
            className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
            onClick={() => haiku?.id && onRefresh && onRefresh()}
            title="Load random"
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
              <FaRandom className="text-xl" />
            </PopOnClick>
          </div>
        }
        {user?.isAdmin &&
          <div
            key="deleteHaiku"
            className={haiku?.id && onDelete ? "cursor-pointer" : "opacity-40"}
            onClick={() => haiku?.id && onDelete && onDelete()}
            title="Delete"
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onDelete}>
              <MdDelete className="text-xl" />
            </PopOnClick>
          </div>
        }
        {user?.isAdmin &&
          <div
            key="saveHaiku"
            className={haiku?.id && onSaveDailyHaiku ? "cursor-pointer" : "opacity-40"}
            onClick={haiku?.id && onSaveDailyHaiku && onSaveDailyHaiku}
            title={`Save as daily ${mode}`}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
              <IoAddCircle className="text-xl" />
            </PopOnClick>

          </div>
        }
        {user?.isAdmin &&
          <div
            key="backup"
            onClick={() => !backupInProgress && onBackup && onBackup()}
            title={backupInProgress ? "Database backup in progress..." : "Backup database"}
            className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
          >
            <PopOnClick color={haiku?.bgColor} disabled={backupInProgress || !haiku?.id || !onBackup}>
              <BsDatabaseFillUp className="text-xl" />
            </PopOnClick>
          </div>
        }
        {mode != "social-img" && user?.isAdmin &&
          <Link
            key="changeMode"
            href={`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : "haiku"}`}
            className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
            title="Switch between haiku/haikudle mode"
            onClick={async (e: any) => {
              e.preventDefault();
              haiku?.id && onSwitchMode && onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : "haiku"}`);
            }}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
              <HiSwitchVertical className="text-xl" />
            </PopOnClick>
          </Link>
        }
        {user?.isAdmin &&
          <Link
            key="socialImgMode"
            href={`/${haiku ? haiku?.id : ""}?mode=showcase`}
            className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
            title="Switch to showcase mode "
            onClick={(e: any) => {
              haiku?.id && onSwitchMode && onSwitchMode("showcase");
            }}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
              <FaExpand className="text-xl" />
            </PopOnClick>
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
              <PopOnClick color={haiku?.bgColor}>
                {v.nativeName}
              </PopOnClick>
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
  onboardingElement,
  onShowAbout,
  onSelectHaiku,
}: {
  user: User,
  mode?: string
  styles: any[],
  altStyles: any[],
  bgColor: string,
  onboardingElement?: string,
  onShowAbout?: any,
  onSelectHaiku?: any,
}) {
  const [panelOpened, setPanelOpened] = useState(false);
  const [panelAnimating, setPanelAnimating] = useState(false);
  const [panelPinned, setPanelPinned] = useState(false);
  const pageSize = 20;
  const [numPages, setNumPages] = useState(1);
  const [listMode, setListMode] = useState<"haiku" | "dailyHaiku" | "dailyHaikudle">("haiku");

  const [
    userHaikus,
    userDailyHaikus,
    userDailyHaikudles,
  ] = useUser((state: any) => [
    state.haikus ? Object.values(state.haikus) : [],
    state.dailyHaikus ? Object.values(state.dailyHaikus) : [],
    state.dailyHaikudles ? Object.values(state.dailyHaikudles) : [],
  ]);
  const onboarding = !!(onboardingElement && ["side-panel", "side-panel-and-bottom-links"].includes(onboardingElement));
  // console.log(">> app._component.Nav.SidePanel.render()", { user, userUser, userState, panelOpened, panelAnimating, dailyHaikudles: userDailyHaikudles, userHaikus });

  const toggleMenuOpened = () => {
    // console.log(">> app._component.SidePanel.toggleMenuOpened", {});
    if (onboardingElement) return;

    setPanelAnimating(true);
    setTimeout(() => setPanelAnimating(false), 100);

    if (!panelOpened) {
      trackEvent("side-panel-opened", {
        userId: user?.id,
      });
    }

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

  const byGeneratedOrSolvedOrViewedDesc = (a: any, b: any) => {
    return (b.generatedAt || b.solvedAt || b.viewedAt || 0) - (a.generatedAt || a.solvedAt || a.viewedAt || 0)
  }

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
    <div className="side-panel">
      {/* Area behind side panel but in front of main content to allow users to click and close the panel */}
      {panelOpened &&
        <div
          className="_bg-blue-400 absolute top-0 left-0 w-[100vw] h-[100vh] z-20"
          onClick={() => panelOpened && toggleMenuOpened()}
        >
        </div>
      }
      <div
        className={`_bg-pink-200 absolute top-0 h-full w-[27rem] max-w-[90vw] ${onboarding ? "z-50" : "z-20"} ${!onboarding && "transition-all"} _blur-[10px]`}
        style={{
          backgroundColor: `${styles[styles.length - 1]?.color ? styles[styles.length - 1]?.color + "88" : "RGBA(0, 0, 0, 0.5)"}`,
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
              if (!panelOpened) {
                trackEvent("clicked-open-side-panel", {
                  userId: user?.id,
                });
              }
              !panelOpened && !panelPinned && setPanelPinned(true);
              toggleMenuOpened();
            }}
            style={{
              // filter: `drop-shadow(0px 0px 16px ${bgColor})`, // what does this even do?!
              marginRight: panelOpened ? "-0.2rem" : "-1.7rem",
              display: panelAnimating ? "none" : "block",
              transitionDuration: "80ms",
            }}
            title={panelOpened ? "Hide side panel" : "Show side panel"}
          >
            <div className="onboarding-container">
              {onboardingElement && ["side-panel", "_side-panel-and-bottom-links"].includes(onboardingElement) &&
                <div className="onboarding-focus" />
              }
              {onboardingElement && ["_side-panel", "side-panel-and-bottom-links"].includes(onboardingElement) &&
                <div className="onboarding-focus double" />
              }
              <PopOnClick
                active={!!(onboardingElement && onboardingElement.includes("side-panel"))}
              >
                <StyledLayers
                  styles={onboardingElement && !onboardingElement.includes("side-panel")
                    ? styles.slice(0, 1)
                    : styles
                  }
                >
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
              </PopOnClick>
            </div>
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
                    onClick={() => setListMode("dailyHaiku")}
                  >
                    Latest Haikus
                  </div>
                }
                {user?.isAdmin && listMode == "dailyHaiku" &&
                  <div
                    className="cursor-pointer"
                    title="Show daily haikudles"
                    onClick={() => setListMode("dailyHaikudle")}
                  >
                    Daily Haikus
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
              .sort(user.isAdmin ? byCreatedAtDesc : byGeneratedOrSolvedOrViewedDesc)
              .slice(0, numPages * pageSize) // more than that and things blow up on safari
              .map((h: Haiku, i: number) => (
                <StyledLayers key={i} styles={altStyles}>
                  <Link
                    href={`/${h.haikuId || h.id}`}
                    onClick={(e: any) => {
                      e.preventDefault();
                      /* !panelPinned && */ toggleMenuOpened();
                      onSelectHaiku && onSelectHaiku(h.haikuId || h.id);
                    }}
                  >
                    <span className="capitalize font-semibold">&quot;{h.theme}&quot;</span>
                    {user?.isAdmin &&
                      <span className="font-normal"> generated {formatTimeFromNow(h.createdAt)} by {h.createdBy == user?.id ? "you" : `${isUserAdmin(h.createdBy) ? "admin" : "user"} ${h.createdBy}`}</span>
                    }
                    {!user?.isAdmin && h.generatedAt &&
                      <span className="font-normal"> generated {formatTimeFromNow(h.generatedAt)}</span>
                    }
                    {!user?.isAdmin && !h.generatedAt && h.solvedAt &&
                      <span className="font-normal"> solved {formatTimeFromNow(h.solvedAt)}{h.moves ? ` in ${h.moves} move${h.moves > 1 ? "s" : ""}` : ""}</span>
                    }
                    {!user?.isAdmin && !h.generatedAt && !h.solvedAt && h.viewedAt &&
                      <span className="font-normal"> viewed {formatTimeFromNow(h.viewedAt)}</span>
                    }
                  </Link>
                </StyledLayers>
              ))
            }
            {["dailyHaiku", "dailyHaikudle"].includes(listMode) && user?.isAdmin && (panelAnimating || panelOpened) && (listMode == "dailyHaiku" && userDailyHaikus || userDailyHaikudles)
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
            {(Object.values(listMode == "haiku" ? userHaikus : userDailyHaikudles).length > numPages * pageSize) &&
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
                    trackEvent("clicked-about", {
                      userId: user?.id,
                      location: "side-panel",
                    });
                    toggleMenuOpened();
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
                  onClick={() => {
                    trackEvent("clicked-github", {
                      userId: user?.id,
                      location: "side-panel",
                    });
                    toggleMenuOpened();
                  }}
                >
                  <IoLogoGithub className="text-xl mt-[0.2rem]" />
                  github.com/desmat
                </Link>
                <Link
                  key="web"
                  className="flex flex-row gap-1"
                  href="https://www.desmat.ca"
                  target="_blank"
                  onClick={() => {
                    trackEvent("clicked-web", {
                      userId: user?.id,
                      location: "side-panel",
                    });
                    toggleMenuOpened();
                  }}
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
  loading,
  styles,
  altStyles,
  haiku,
  lang,
  refreshDelay = 24 * 60 * 60 * 1000,
  backupInProgress,
  onboardingElement,
  onClickLogo,
  onClickGenerate,
  onClickRandom,
  onSwitchMode,
  onDelete,
  onSaveDailyHaiku,
  onShowAbout,
  onSelectHaiku,
  onChangeRefreshDelay,
  onBackup,
  onCopyHaiku,
  onCopyLink,
}: {
  mode: string,
  loading?: boolean,
  styles: any[],
  altStyles: any[],
  haiku?: Haiku,
  lang?: LanguageType,
  refreshDelay?: number,
  backupInProgress?: boolean,
  onboardingElement?: string,
  onClickLogo?: any,
  onClickGenerate?: any,
  onClickRandom?: any,
  onSwitchMode?: any,
  onDelete?: any,
  onSaveDailyHaiku?: any,
  onShowAbout?: any,
  onSelectHaiku?: any,
  onChangeRefreshDelay?: any,
  onBackup?: any,
  onCopyHaiku?: any,
  onCopyLink?: any,
}) {
  const dateCode = moment().format("YYYYMMDD");
  const [user] = useUser((state: any) => [state.user]);
  const onboarding = !!(onboardingElement && ["bottom-links", "side-panel-and-bottom-links"].includes(onboardingElement));
  // console.log(">> app._component.Nav.render", { mode, haikuId: haiku?.id });

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.Nav.handleKeyDown", { mode });
    if (e.key == "Escape" && ["showcase", "social-img"].includes(mode) && onSwitchMode) {
      onSwitchMode();
    }
  }

  const increaseDelay = () => {
    // max value, otherwise is basically 0
    onChangeRefreshDelay(Math.min(refreshDelay * 2, 2147483647));
  }

  const decreaseDelay = () => {
    // less than 1000 and things get weird
    onChangeRefreshDelay(Math.max(refreshDelay / 2, 1000));
  }

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown);
    }
  }, [mode, haiku]);

  return (
    <div className="_bg-pink-200 nav-overlay relative h-full w-full z-1">
      {["haikudle", "haiku"].includes(mode) &&
        <div className={`${font.architects_daughter.className} fixed top-[-0.1rem] left-2.5 md:left-3.5 ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement) ? "z-50" : "z-40"}`}>
          <div className="onboarding-container">
            {onboardingElement && ["logo", "_logo-and-generate"].includes(onboardingElement) &&
              <div className="onboarding-focus" />
            }
            {onboardingElement && ["_logo", "logo-and-generate"].includes(onboardingElement) &&
              <div className="onboarding-focus double" />
            }
            <PopOnClick color={haiku?.bgColor} active={onboardingElement == "logo"}>
              {/* TODO: href to support multi-language */}
              <Logo
                styles={styles}
                altStyles={altStyles}
                mode={mode}
                href={`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`}
                onClick={onClickLogo}
                onboardingElement={onboardingElement}
              />
            </PopOnClick>
          </div>
        </div>
      }
      {mode == "social-img" &&
        <div className={`${font.architects_daughter.className} absolute top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-30`}>
          <PopOnClick color={haiku?.bgColor}>
            {/* TODO: href to support multi-language */}
            <Logo
              styles={styles}
              altStyles={altStyles}
              mode={mode}
              href={`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`}
            />
            <div
              className="_bg-pink-400 _opacity-50 absolute top-0 left-0 w-full h-full cursor-pointer"
              onClick={() => onSwitchMode && onSwitchMode(process.env.EXPERIENCE_MODE)}
            />
          </PopOnClick>
        </div>
      }
      {["haikudle", "haiku"].includes(mode) &&
        <div className={`fixed top-2.5 right-2.5 ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement) ? "z-50" : "z-20"}`}>
          <div className="onboarding-container">
            {onboardingElement && onboardingElement == "logo" &&
              <div className="onboarding-focus" />
            }
            {onboardingElement && onboardingElement == "logo-and-generate" &&
              <div className="onboarding-focus double" />
            }
            {(!onClickGenerate || !user?.isAdmin && (user.usage[dateCode]?.haikusCreated || 0) >= USAGE_LIMIT.DAILY_CREATE_HAIKU) &&
              <div className="opacity-40" title={onClickGenerate ? "Exceeded daily limit: try again later" : ""}>
                <StyledLayers styles={altStyles}>
                  <GenerateIcon>
                    <div style={{ WebkitTextStroke: `1.2px ${altStyles[0].color}` }}>Create</div>
                  </GenerateIcon>
                </StyledLayers>
              </div>
            }
            {onClickGenerate && (user?.isAdmin || (user?.usage[dateCode]?.haikusCreated || 0) < USAGE_LIMIT.DAILY_CREATE_HAIKU) &&
              <div title="Generate a new haiku">
                <PopOnClick color={haiku?.bgColor} active={!!onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement)}>
                  <StyledLayers styles={altStyles}>
                    <GenerateIcon onClick={onClickGenerate} >
                      <div style={{ WebkitTextStroke: `1.2px ${altStyles[0].color}` }}>Create</div>
                    </GenerateIcon>
                  </StyledLayers>
                </PopOnClick>
              </div>
            }
          </div>
        </div>
      }

      <div
        className={`absolute top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-10`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 35%, ${styles[0]?.color || "black"} 70%)`,
          opacity: 0.2,
        }}
      />

      {["haiku", "haikudle"].includes(mode) &&
        <div className={`fixed bottom-2 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center ${onboardingElement && onboardingElement.startsWith("bottom-links") ? "z-50" : "z-20"}`}>
          <div className="onboarding-container">
            {onboardingElement && ["bottom-links", "_side-panel-and-bottom-links"].includes(onboardingElement) &&
              <div className="onboarding-focus" />
            }
            {onboardingElement && ["_bottom-links", "side-panel-and-bottom-links"].includes(onboardingElement) &&
              <div className="onboarding-focus double" />
            }

            <PopOnClick
              disabled={!onboarding}
              active={onboarding}
            >
              <StyledLayers
                styles={onboardingElement && !onboardingElement.includes("bottom-links")
                  ? styles.slice(0, 1)
                  : styles
                }
                disabled={onboardingElement == "bottom-links-share"}
              >
                <BottomLinks
                  mode={mode}
                  lang={lang}
                  haiku={haiku}
                  styles={styles}
                  backupInProgress={backupInProgress}
                  onboardingElement={onboardingElement}
                  onRefresh={onClickRandom}
                  onSwitchMode={onSwitchMode}
                  onDelete={onDelete}
                  onSaveDailyHaiku={onSaveDailyHaiku}
                  onShowAbout={onShowAbout}
                  onBackup={onBackup}
                  onCopyHaiku={onCopyHaiku}
                  onCopyLink={onCopyLink}
                />
              </StyledLayers>
            </PopOnClick>
          </div>
        </div>
      }

      {["showcase", "social-img"].includes(mode) &&
        <>
          {onSwitchMode &&
            <div
              className="_bg-pink-400 absolute top-0 left-0 w-[10vw] h-full z-40 cursor-pointer"
              title="Exit showcase mode"
              onClick={() => onSwitchMode()}
            />
          }
          {increaseDelay &&
            <div
              className="_bg-yellow-400 absolute bottom-0 left-0 w-[10vw] h-[10vw] z-40 cursor-pointer"
              title="Increase refresh time"
              onClick={increaseDelay}
            />
          }
          {decreaseDelay &&
            <div
              className="_bg-yellow-400 absolute bottom-0 right-0 w-[10vw] h-[10vw] z-40 cursor-pointer"
              title="Decrease refresh time"
              onClick={decreaseDelay}
            />
          }
        </>
      }

      {!loading && ["haiku", "haikudle"].includes(mode) &&
        <SidePanel
          user={user}
          mode={mode}
          styles={styles}
          altStyles={altStyles}
          bgColor={haiku?.bgColor}
          onboardingElement={onboardingElement}
          onShowAbout={onShowAbout}
          onSelectHaiku={onSelectHaiku}
        />
      }
    </div>
  );
}
