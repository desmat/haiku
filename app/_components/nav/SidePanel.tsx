'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { IoHelpCircle, IoLogoGithub, IoMenu } from 'react-icons/io5';
import { MdHome } from "react-icons/md";
import * as font from "@/app/font";
import PopOnClick from '@/app/_components/PopOnClick';
import { StyledLayers } from '@/app/_components/StyledLayers';
import useUser from '@/app/_hooks/user';
import { ExperienceMode } from '@/types/ExperienceMode';
import { UserHaiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { User } from '@/types/User';
import { formatTimeFromNow } from '@/utils/format';
import * as sort from '@/utils/sort';
import trackEvent from '@/utils/trackEvent';
import { Logo } from './Logo';

function OpenCloseButton({
  styles,
  title,
  onboardingElement,
  onClick,
}: {
  styles: any,
  title?: string,
  onboardingElement?: string,
  onClick?: any,
}) {
  const onboarding = false; //onboardingElement && onboardingElement.includes("side-panel");

  return (
    <div
      className={`_bg-pink-200 open-side-panel-icon ${font.architects_daughter.className} absolute top-0 right-0 md:p-[0.8rem] mt-[0.1rem] md:mt-[0.1rem] p-[0.6rem] ${onboarding ? "z-50" : "z-20"} cursor-pointer`}
      onClick={onClick}
      title={title}
    >
      <StyledLayers styles={styles}>
        <PopOnClick>
          <div className="onboarding-container" style={{ width: "auto" }}>
            {onboarding &&
              <div className="onboarding-focus" />
            }
            <IoMenu className="h-7 w-7 md:h-8 md:w-8" />
          </div>
        </PopOnClick>
      </StyledLayers>
    </div>
  )
}

export default function SidePanel({
  user,
  mode,
  styles,
  altStyles,
  bgColor,
  onboardingElement,
  onShowAbout,
  onSelectHaiku,
  onClickLogo: _onClickLogo,
}: {
  user: User,
  mode?: ExperienceMode,
  styles: any[],
  altStyles: any[],
  bgColor: string,
  onboardingElement?: string,
  onShowAbout?: any,
  onSelectHaiku?: any,
  onClickLogo?: any,
}) {
  const [panelOpened, setPanelOpened] = useState(false);
  const [panelAnimating, setPanelAnimating] = useState(false);
  const [panelPinned, setPanelPinned] = useState(false);
  const pageSize = 20;
  const [numPages, setNumPages] = useState(1);
  const [listMode, setListMode] = useState<"haiku" | "dailyHaiku" | "dailyHaikudle">("haiku");
  type FilterType = "generated" | "liked" | "viewed"
  const [filter, setFilter] = useState<FilterType | undefined>();
  const onboarding = !!(onboardingElement && ["side-panel", "side-panel-and-bottom-links"].includes(onboardingElement));

  const [
    userHaikus,
    userDailyHaikus,
    userDailyHaikudles,
    userLoaded,
    userLoading,
    loadUser,
  ] = useUser((state: any) => [
    user?.isAdmin && !filter
      ? state.allHaikus ? Object.values(state.allHaikus) : []
      : state.haikus ? Object.values(state.haikus) : [],
    state.dailyHaikus ? Object.values(state.dailyHaikus) : [],
    state.dailyHaikudles ? Object.values(state.dailyHaikudles) : [],
    state.loaded,
    state.loading,
    state.load,
  ]);

  // if (!user && !userLoaded && !userLoading) {
  //   loadUser().then((u: User) => user = u);
  // }

  // console.log(">> app._component.Nav.SidePanel.render()", { user, userHaikus,panelOpened, panelAnimating, dailyHaikudles: userDailyHaikudles, styles, altStyles });

  const onClickLogo = () => {
    toggleMenuOpened();
    _onClickLogo && _onClickLogo();
  }

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

  const sortByAllFields = (a: any, b: any) => {
    return (b.generatedAt || b.solvedAt || a.likedAt || b.viewedAt || 0) - (a.generatedAt || a.solvedAt || a.likedAt || a.viewedAt || 0)
  }

  const filterBy = (haiku: UserHaiku) => {
    switch (filter) {
      case "generated":
        return !!haiku.generatedAt;
      case "liked":
        return !!haiku.likedAt;
      case "viewed":
        return !haiku.likedAt && !!haiku.viewedAt;
    }

    return true;
  }

  const handleClickedFilter = (filterType: FilterType) => {
    trackEvent("clicked-filter", {
      userId: user?.id,
      value: filter,
    });

    setFilter(filter == filterType ? undefined : filterType);
  }

  const handleClickedOpenCloseButton = () => {
    trackEvent("clicked-open-side-panel", {
      userId: user?.id,
    });
    !panelOpened && !panelPinned && setPanelPinned(true);
    toggleMenuOpened();
  }

  useEffect(() => {
    // console.log(">> app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, []);

  return (
    <div className="side-panel">
      {/* Area behind side panel but in front of main content to allow users to click and close the panel */}
      {panelOpened &&
        <div
          className="_bg-blue-400 close-side-panel-hotspot absolute top-0 right-0 w-[100vw] h-[100vh] z-20"
          onClick={() => panelOpened && toggleMenuOpened()}
        >
        </div>
      }
      {/* button to open side panel */}
      {true && //(!panelOpened && !panelAnimating) &&
        <OpenCloseButton
          styles={styles}
          title="Open side panel"
          onboardingElement={onboardingElement}
          onClick={handleClickedOpenCloseButton}
        />
      }

      {/* hotspot to open the side panel on mouse hover */}
      <div
        className="_bg-red-400 open-side-panel-hoverspot group absolute top-[4rem] right-[0rem] w-[1rem] mr-[0rem] h-[calc(100vh-4rem)] _z-50"
        style={{
          zIndex: 99,
          display: panelOpened ? "none" : "block",
        }}
        onMouseEnter={() => !panelOpened && !panelAnimating && toggleMenuOpened()}
        onClick={() => panelOpened && toggleMenuOpened()}
      />

      <div
        className={`_bg-pink-200 absolute top-0 h-full ${onboarding ? "z-50" : "z-20"} ${!onboarding && "transition-[right]"} _blur-[10px]`}
        style={{
          backgroundColor: `${styles[styles.length - 1]?.color ? styles[styles.length - 1]?.color + "88" : "RGBA(0, 0, 0, 0.5)"}`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",

          // note: animating on the position is prettier but causes issues on mobile
          // right: panelOpened ? 0 : "-27rem",
          // width: panelOpened || panelAnimating ? "27rem" : "0rem",
          right: 0,
          width: "27rem",
          maxWidth: "95vw",
          display: panelOpened ? "block" : "none",
        }}
        onMouseLeave={() => panelOpened && !panelPinned && toggleMenuOpened()}
      >
        <div className="_bg-pink-400 flex flex-col h-[100vh]">

          {/* close button and logo */}
          <div className="block _sm:hidden">
            <div className="_bg-orange-400 flex flex-col h-[3rem]">
              {/* Logo */}
              <div className={`${font.architects_daughter.className} absolute top-[-0.1rem] left-0 w-full ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement) ? "z-50" : "z-40"}`}>
                <div className="flex flex-row justify-center">
                  <PopOnClick color={bgColor} active={onboarding}>
                    {/* TODO: href to support multi-language */}
                    <Logo
                      styles={styles}
                      altStyles={altStyles}
                      mode={mode || "haiku"}
                      href={`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`}
                      onClick={onClickLogo}
                    // onboardingElement={onboardingElement}
                    />
                  </PopOnClick>
                </div>
              </div>
            </div>
          </div>
          {/* Close button inside panel */}
          <div className="absolute top-0 right-0 z-50">
            <OpenCloseButton
              styles={styles}
              title="Close side panel"
              onboardingElement={onboardingElement}
              onClick={handleClickedOpenCloseButton}
            />
          </div>

          {/* your haikus */}
          <div className="_bg-yellow-400 flex flex-col h-full overflow-scroll px-3 md:px-4 sm:mt-[0.2rem] md:mt-[0.6rem]">
            <div className="py-2 text-[1.2rem] md:text-[1.2rem]">
              {(!user?.isAdmin || listMode == "haiku") &&
                <div className="flex flex-row gap-3 group">
                  {user?.isAdmin &&
                    <div
                      className="cursor-pointer"
                      title="Show daily limerics"
                      onClick={() => setListMode("dailyHaiku")}
                    >
                      <StyledLayers styles={styles}>
                        All Limerics
                      </StyledLayers>
                    </div>
                  }
                  {!user?.isAdmin &&
                    <StyledLayers styles={styles}>
                      "Your Haikus"
                    </StyledLayers>
                  }
                  {/* <StyledLayers styles={styles.slice(0, 1)} className="my-auto">
                    <div className="flex flex-row gap-1 my-auto pt-[0.1rem]">
                      <div
                        title="Filter haikus generated by you"
                        className={`cursor-pointer ${filter == "generated" ? "" : "opacity-40"} group-hover:opacity-100`}
                        style={{ color: filter == "generated" ? bgColor : "" }}
                        onClick={() => handleClickedFilter("generated")}
                      >
                        <IoSparkles className="mt-[-0.1rem]" />
                      </div>
                      <div
                        title="Filter liked haikus"
                        className={`cursor-pointer ${filter == "liked" ? "" : "opacity-40"} group-hover:opacity-100`}
                        style={{ color: filter == "liked" ? bgColor : "" }}
                        onClick={() => handleClickedFilter("liked")}
                      >
                        <IoHeartSharp />
                      </div>
                      <div
                        title="Filter viewed haikus"
                        className={`cursor-pointer ${filter == "viewed" ? "" : "opacity-40"} group-hover:opacity-100`}
                        style={{ color: filter == "viewed" ? bgColor : "" }}
                        onClick={() => handleClickedFilter("viewed")}
                      >
                        <IoEyeSharp />
                      </div>
                    </div>
                  </StyledLayers> */}
                </div>
              }
              {user?.isAdmin && listMode == "dailyHaiku" &&
                <div
                  className="cursor-pointer"
                  title="Show all limerics"
                  onClick={() => setListMode("haiku")}
                >
                  <StyledLayers styles={styles}>
                    Daily Limerics
                  </StyledLayers>
                </div>
              }
              {user?.isAdmin && listMode == "dailyHaikudle" &&
                <div
                  className="cursor-pointer"
                  title="Show limericks"
                  onClick={() => setListMode("haiku")}
                >
                  <StyledLayers styles={styles}>
                    Daily Haikudles
                  </StyledLayers>
                </div>
              }
            </div>
            {/* note: don't render when not opened to save on resources */}
            {listMode == "haiku" && (panelAnimating || panelOpened) && userHaikus
              .filter(filterBy)
              .sort(user?.isAdmin ? sort.byCreatedAtDesc : sortByAllFields)
              .slice(0, numPages * pageSize) // more than that and things blow up on safari
              .map((h: UserHaiku, i: number) => (
                <StyledLayers key={i} styles={altStyles}>
                  <Link
                    href={`/${h.haikuId || h.id}`}
                    onClick={(e: any) => {
                      if (onSelectHaiku) {
                        e.preventDefault();
                      /* !panelPinned && */ toggleMenuOpened();
                        onSelectHaiku(h.haikuId || h.id);
                      }
                    }}
                  >
                    <span className="capitalize font-semibold">&quot;{h.theme}&quot;</span>
                    {user?.isAdmin &&
                      <span className="font-normal"> generated {formatTimeFromNow(h.createdAt || 0)} by {h.createdBy == user?.id ? "you" : `${isUserAdmin(h.createdBy) ? "admin" : "user"} ${h.createdBy}`}</span>
                    }
                    {!user?.isAdmin && h.generatedAt &&
                      <span className="font-normal"> generated {formatTimeFromNow(h.generatedAt)}</span>
                    }
                    {!user?.isAdmin && !h.generatedAt && h.solvedAt &&
                      <span className="font-normal"> solved {formatTimeFromNow(h.solvedAt)}{h.moves ? ` in ${h.moves} move${h.moves > 1 ? "s" : ""}` : ""}</span>
                    }
                    {!user?.isAdmin && !h.generatedAt && !h.solvedAt && h.likedAt &&
                      <span className="font-normal"> liked {formatTimeFromNow(h.likedAt || 0)}</span>
                    }
                    {!user?.isAdmin && !h.generatedAt && !h.solvedAt && !h.likedAt && h.viewedAt &&
                      <span className="font-normal"> viewed {formatTimeFromNow(h.viewedAt)}</span>
                    }
                  </Link>
                </StyledLayers>
              ))
            }
            {["dailyHaiku", "dailyHaikudle"].includes(listMode) && user?.isAdmin && (panelAnimating || panelOpened) && (listMode == "dailyHaiku" && userDailyHaikus || userDailyHaikudles)
              // .filter((h: Haiku) => h.createdBy == user?.id)
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
            {((listMode == "haiku" ? userHaikus : userDailyHaikudles)
              .filter(filterBy)
              .length > numPages * pageSize) &&
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
              <div className="_bg-purple-200 flex flex-row gap-4">
                <Link
                  key="about"
                  className="flex flex-row gap-1"
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
                  <IoHelpCircle className="mt-[-0.2rem] md:mt-[-0.3rem] text-[2rem] md:text-[2.1rem]" />
                  <div>
                    About
                  </div>
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
                  <MdHome className="mt-[-0.2rem] md:mt-[-0.3rem] text-[2rem] md:text-[2.1rem]" />
                  desmat.ca
                </Link>
                <Link
                  key="github"
                  className="flex flex-row gap-2"
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
                  <IoLogoGithub className="mt-[0rem] md:mt-[-0.1rem] text-[1.7rem] md:text-[1.8rem]" />
                  <div className="sm:block hidden">
                    github/desmat
                  </div>
                  <div className="block sm:hidden">
                    github
                  </div>
                </Link>
              </div>
            </StyledLayers>
          </div>
        </div>
      </div>
    </div >
  )
}
