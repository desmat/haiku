'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { IoSparkles, IoAddCircle, IoHelpCircle, IoLogoGithub } from 'react-icons/io5';
import { FaShare, FaExpand, FaCopy } from "react-icons/fa";
import { HiSwitchVertical } from "react-icons/hi";
import { MdHome, MdDelete } from "react-icons/md";
import { BsDatabaseFillUp } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import * as font from "@/app/font";
import useAlert from '@/app/_hooks/alert';
import useUser from '@/app/_hooks/user';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { Haiku } from '@/types/Haiku';
import trackEvent from '@/utils/trackEvent';
import { USAGE_LIMIT } from '@/types/Usage';
import { StyledLayers } from './StyledLayers';
import { Logo } from './Logo';
import PopOnClick from './PopOnClick';
import SidePanel from './SidePanel';

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
        onClick && onClick(e);
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

export function GenerateInput({
  color,
  bgColor,
  styles,
  altStyles,
  generate,
  onboardingElement,
}: {
  color?: any,
  bgColor?: any,
  styles?: any,
  altStyles?: any,
  generate?: any,
  onboardingElement?: string | undefined,
}) {
  const [value, setValue] = useState<string | undefined>();
  const [active, setActive] = useState(false);
  const [clickingGenerate, setClickingGenerate] = useState(false);
  const ref = useRef();
  // console.log('>> app._components.PoemLineInput.render()', { id, activeId, visible, select, value, updatedLine: localValue });

  const onboarding = onboardingElement == "generate";

  const handleChange = (e: any) => {
    setActive(true);
    // setValue(e.target.value);
  }

  const handleKeyDown = (e: any) => {
    // console.log(">> app._components.Nav.GenerateInput.handleKeyDown()", { e, key: e.key });
    if (e.key == "Escape") {
      setActive(false);
      // @ts-ignore
      ref.current.value = "";
      // @ts-ignore
      ref.current.blur();
    } else if (e.key == "Enter") {
      handleClickedGenerate();
    }
  }

  const handleClickedGenerate = () => {
    // console.log('>> app._components.Nav.GenerateInput.handleClickedGenerate()', { ref, active: document.activeElement == ref.current });

    // if (!active) {
    //   setActive(true);
    //   // @ts-ignore
    //   ref.current.focus();
    //   return;
    // }

    setActive(false);
    setClickingGenerate(false);
    setValue(undefined);
    // @ts-ignore
    ref.current.blur();

    // console.log('>> app._components.Nav.GenerateInput.handleClickedGenerate() generate');
    // @ts-ignore
    generate && generate(ref.current.value || "");
  };

  return (
    <div
      onMouseOver={() => {
        setActive(true);
      }}
      onMouseOut={() => {
        // @ts-ignore
        if (!ref.current.value) {
          setActive(false);
        }
      }}
      className={`GenerateInput _bg-pink-200 absolute
        top-[0.6rem] md:top-[0.5rem] left-[2.8rem] md:left-1/2 md:transform md:-translate-x-1/2
        w-[calc(100vw-3.6rem)] md:w-[500px]
      `}
      style={{ zIndex: onboarding ? "50" : "20" }}
    >
      <div className="onboarding-container" style={{ width: "auto" }}>
        {onboarding &&
          <div className="onboarding-focus double" />
        }
        <StyledLayers styles={onboarding ? styles.slice(0, 3) : styles.slice(0, 2) }>
          <div className="bg-yellow-200 flex flex-row gap-0">
            <div className={`_bg-yellow-200 haiku-theme-input flex-grow text-[12pt] md:text-[16pt]`}>
              {/* note: https://stackoverflow.com/questions/28269669/css-pseudo-elements-in-react */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  .haiku-theme-input input {
                    background: none;
                    _background: pink; /* for debugging */
                    outline: 2px solid ${bgColor || ""}44;
                    background-color: ${bgColor || "white"}22;
                    caret-color: ${color || "black"};
                    border-radius: 5px;
                    height: auto;
                    WebkitTextStroke: 0.5px ${bgColor};
                    -webkit-text-stroke: 1.25px ${color}66;
                    text-stroke: 1.0px ${color}66;
                  }
                  .haiku-theme-input.poem-line-${/* !editing && */ /* !saving &&  !onboarding && aboutToEditLine */ 42} input {
                    outline: none;
                    background-color: ${bgColor || "white"}44;  
                  }
                  ${/* saving || */ onboarding ? "" : ".haiku-theme-input input:focus"} {
                    outline: 2px solid ${bgColor || ""}66;
                    background-color: ${bgColor || "white"}66;
                  }
                  ${/* saving || */ onboarding ? "" : ".haiku-theme-input input:focus::placeholder"} {
                    opacity: 0;
                  }
                  .haiku-theme-input input::selection { 
                    background: ${color || "black"}66 
                  }
                  .haiku-theme-input input::placeholder {
                    color: ${color || "black"};
                    -webkit-text-stroke: 1px ${color};
                    text-stroke: 1px ${color};
                    opacity: 0.3;
                    text-align: center; 
                  }
                  .haiku-theme-input input::-ms-input-placeholder { /* Edge 12 -18 */
                    color: ${color || "black"};
                    text-stroke: 1px ${color};
                    opacity: 0.3;
                    text-align: center; 
                  }`
                }}
              >
              </style>
              <div className="relative">
                {/* <StyledLayers styles={styles.slice(0, 2)}> */}
                <input
                  //@ts-ignore
                  ref={ref}
                  maxLength={36}
                  placeholder="Create with theme or surprise me!"
                  // value={value || ""}
                  onChange={handleChange}
                  onFocus={() => setActive(true)}
                  onBlur={() => (typeof (value) == "undefined") && setActive(false)}
                  onKeyDown={handleKeyDown}
                  className={`w-full absolute top-0 left-0
                  pt-[0.1rem] pr-[2.5rem] pb-[0.1rem] pl-[0.7rem] md:pr-[3rem]
                  mt-[-0.1rem] mr-[-0.1rem] mb-0 ml-0 md:mt-[0.1rem] md:mr-[0rem]      
              `}
                />
              </div>
            </div>
            <div className="relative w-0">
              <div
                className="_bg-pink-200 p-[0.5rem] absolute md:top-[-0.3rem] top-[-0.5rem] md:right-[-0.1rem] right-[-0.2rem] z-20 cursor-pointer"
                style={{ opacity: active ? "1" : "0.3" }}
                onMouseDown={() => setClickingGenerate(true)}
                onMouseUp={() => clickingGenerate && handleClickedGenerate()}
              >
                <PopOnClick>
                  <StyledLayers styles={active ? altStyles.slice(0, 2) : styles.slice(0, 1)}>
                    <GenerateIcon >
                      {/* Create */}
                    </GenerateIcon>
                  </StyledLayers>
                </PopOnClick>
              </div>
            </div>
          </div>
        </StyledLayers>
      </div>
    </div>
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
      {!loading && ["haikudle", "haiku"].includes(mode) &&
        <GenerateInput
          color={haiku?.color || "black"}
          bgColor={haiku?.bgColor || "white"}
          styles={styles}
          altStyles={altStyles}
          generate={onClickGenerate}
          onboardingElement={onboardingElement}
        />
      }

      {false && ["haikudle", "haiku"].includes(mode) &&
        <div className={`${font.architects_daughter.className} absolute top-[-0.1rem] left-2.5 md:left-3.5 ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement || "") ? "z-50" : "z-40"}`}>
          <div className="onboarding-container">
            {onboardingElement && ["logo", "_logo-and-generate"].includes(onboardingElement || "") &&
              <div className="onboarding-focus" />
            }
            {onboardingElement && ["_logo", "logo-and-generate"].includes(onboardingElement || "") &&
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
            {/* {onboardingElement && onboardingElement == "logo" &&
              <div className="onboarding-focus" />
            }
            {onboardingElement && onboardingElement == "logo-and-generate" &&
              <div className="onboarding-focus double" />
            } */}
            {/* {(!onClickGenerate || !user?.isAdmin && (user.usage[dateCode]?.haikusCreated || 0) >= USAGE_LIMIT.DAILY_CREATE_HAIKU) &&
              <div className="opacity-40" title={onClickGenerate ? "Exceeded daily limit: try again later" : ""}>
                <StyledLayers styles={altStyles}>
                  <GenerateIcon>
                    <div style={{ WebkitTextStroke: `1.2px ${altStyles[0].color}` }}>Create</div>
                  </GenerateIcon>
                </StyledLayers>
              </div>
            } */}
            {/* {onClickGenerate && (user?.isAdmin || (user?.usage[dateCode]?.haikusCreated || 0) < USAGE_LIMIT.DAILY_CREATE_HAIKU) &&
              <div title="Generate a new haiku">
                <PopOnClick color={haiku?.bgColor} active={!!onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement)}>
                  <StyledLayers styles={altStyles}>
                    <GenerateIcon onClick={onClickGenerate} >
                      <div style={{ WebkitTextStroke: `1.2px ${altStyles[0].color}` }}>Create</div>
                    </GenerateIcon>
                  </StyledLayers>
                </PopOnClick>
              </div>
            } */}
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
          onClickLogo={onClickLogo}
        />
      }
    </div>
  );
}
