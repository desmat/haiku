'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { IoHelpCircle, IoLogoGithub, IoMenu } from 'react-icons/io5';
import { MdHome } from "react-icons/md";
import { BsChevronCompactRight, BsChevronCompactLeft, BsDashLg, BsDatabaseFillUp } from "react-icons/bs";
import * as font from "@/app/font";
import useUser from '@/app/_hooks/user';
import { Haiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { User } from '@/types/User';
import { formatTimeFromNow } from '@/utils/format';
import { byCreatedAtDesc } from '@/utils/sort';
import trackEvent from '@/utils/trackEvent';
import PopOnClick from './PopOnClick';
import { StyledLayers } from './StyledLayers';
import { Logo } from './Logo';

export default function SidePanel({
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
      {/* button to open side panel */}
      {true && //(!panelOpened && !panelAnimating) &&
        <div
          className={`_bg-pink-200 ${font.architects_daughter.className} absolute top-0 left-0 md:p-[0.9rem] md:mt-[-0.2rem] p-[0.6rem] ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement || "") ? "z-50" : "z-20"} cursor-pointer`}
          onClick={() => {
            !panelOpened && !panelPinned && setPanelPinned(true);
            toggleMenuOpened();
          }}
        >
          <StyledLayers styles={styles}>
            <PopOnClick>
              <IoMenu className="h-6 w-6 md:h-8 md:w-8" />
            </PopOnClick>
          </StyledLayers>
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


            <div className={`${font.architects_daughter.className} absolute top-[-0.1rem] left-2.5 md:left-3.5 ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement) ? "z-50" : "z-40"}`}>
              {/* <div className="onboarding-container"> */}
              {/* {onboardingElement && ["logo", "_logo-and-generate"].includes(onboardingElement) &&
                  <div className="onboarding-focus" />
                }
                {onboardingElement && ["_logo", "logo-and-generate"].includes(onboardingElement) &&
                  <div className="onboarding-focus double" />
                } */}
              <PopOnClick color={bgColor} active={onboardingElement == "logo"}>
                {/* TODO: href to support multi-language */}
                <Logo
                  styles={styles}
                  altStyles={altStyles}
                  mode={mode || "haiku"}
                  href={`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`}
                // onClick={onClickLogo}
                // onboardingElement={onboardingElement}
                />
              </PopOnClick>
              {/* </div> */}
            </div>


          </div>
          <div className="_bg-yellow-400 flex flex-col h-full overflow-scroll px-3 md:px-4">
            <div className="py-2">
              <StyledLayers styles={styles}>
                {user?.isAdmin && listMode == "haiku" &&
                  <div
                    className="cursor-pointer"
                    title="Show daily haikus"
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
    </div >
  )
}
