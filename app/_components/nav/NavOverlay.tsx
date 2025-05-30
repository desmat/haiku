'use client'

import { useEffect } from 'react';
import * as font from "@/app/font";
import PopOnClick from '@/app/_components/PopOnClick';
import { StyledLayers } from '@/app/_components/StyledLayers';
import useUser from '@/app/_hooks/user';
import { ExperienceMode } from '@/types/ExperienceMode';
import { Haiku } from '@/types/Haiku';
import { LanguageType } from '@/types/Languages';
import trackEvent from '@/utils/trackEvent';
import { Logo } from './Logo';
import SidePanel from './SidePanel';
import BottomLinks from './BottomLinks';
import GenerateInput from './GenerateInput';

export function NavOverlay({
  mode,
  loading,
  styles,
  altStyles,
  haiku,
  album,
  lang,
  refreshDelay = 12 * 60 * 60 * 1000,
  backupInProgress,
  onboardingElement,
  generatingTheme,
  onClickLogo,
  onClickGenerate,
  onClickRandom,
  onSwitchMode,
  onDelete,
  onSaveDailyHaiku,
  onAddToAlbum,
  onShowAbout,
  onSelectHaiku,
  onChangeRefreshDelay,
  onBackup,
  onCopyHaiku,
  onCopyLink,
  onLikeHaiku,
  onUploadImage,
  onUpdateImage,
  exitImpersonation,
  updateLayout,
}: {
  mode: ExperienceMode,
  loading?: boolean,
  styles: any[],
  altStyles: any[],
  haiku?: Haiku,
  album?: string,
  lang?: LanguageType,
  refreshDelay?: number,
  backupInProgress?: boolean,
  onboardingElement?: string,
  generatingTheme?: string,
  onClickLogo?: any,
  onClickGenerate?: any,
  onClickRandom?: any,
  onSwitchMode?: any,
  onDelete?: any,
  onSaveDailyHaiku?: any,
  onAddToAlbum?: any
  onShowAbout?: any,
  onSelectHaiku?: any,
  onChangeRefreshDelay?: any,
  onBackup?: any,
  onCopyHaiku?: any,
  onCopyLink?: any,
  onLikeHaiku?: any,
  onUploadImage?: any,
  onUpdateImage?: any,
  exitImpersonation?: any,
  updateLayout?: any,
}) {
  const [user] = useUser((state: any) => [state.user]);
  const onboarding = !!(onboardingElement && ["bottom-links", "side-panel-and-bottom-links"].includes(onboardingElement));
  // console.log("app._component.Nav.render", { mode, haikuId: haiku?.id });

  const handleKeyDown = async (e: any) => {
    // console.log("app._component.Nav.handleKeyDown", { mode });
    if (e.key == "Escape" && ["showcase", "social-img"].includes(mode) && onSwitchMode) {
      onSwitchMode("haiku");
      e.preventDefault();
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
    // console.log("app._component.Nav.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown);
    }
  }, [mode, haiku]);

  return (
    <div className="_bg-pink-200 nav-overlay relative h-full w-full z-1">
      {["haikudle", "haiku"].includes(mode) &&
        <GenerateInput
          user={user}
          color={haiku?.color || "#000000"}
          bgColor={haiku?.bgColor || "#ffffff"}
          styles={styles}
          altStyles={altStyles}
          generate={!loading && onClickGenerate}
          onboardingElement={onboardingElement}
          generatingTheme={generatingTheme}
        />
      }

      {["haikudle", "haiku"].includes(mode) &&
        <div
          className={`${font.architects_daughter.className} overlayed-control absolute top-[-0.1rem] left-2.5 md:left-3.5 
            ${onboardingElement && ["logo", "logo-and-generate"].includes(onboardingElement || "") ? "z-50" : "z-20"} 
            ${loading ? "" : "overlayed-control"}
          `}
        >
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
                iconOnly={true}
                styles={styles}
                altStyles={altStyles}
                mode={mode}
                href={`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`}
                onClick={() => {
                  trackEvent("clicked-logo", {
                    userId: user?.id,
                  });

                  onClickLogo && onClickLogo();
                }}
                onboardingElement={onboardingElement}
              />
            </PopOnClick>
          </div>
        </div>
      }
      {["social-img", "haikudle-social-img"].includes(mode) &&
        <div
          className={`${font.architects_daughter.className} absolute top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-30`}
        >
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
              onClick={() => user?.isAdmin && onClickRandom ? onClickRandom() : onSwitchMode && onSwitchMode("haiku")}
            />
          </PopOnClick>
        </div>
      }
      <div
        className={`absolute top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-10`}
        style={{
          background: `radial-gradient(circle at 50% ${haiku?.layout?.poem?.bottom
            ? 90 - haiku?.layout?.poem?.bottom
            : haiku?.layout?.poem?.top
              ? 10 + haiku?.layout?.poem?.top
              : haiku?.layout?.poem?.up
                ? 45 - haiku?.layout?.poem?.up / 2
                : 45}%, white, ${styles[0]?.bgColor || "lightgrey"} 35%, ${styles[0]?.color || "black"} 60%)`,
          opacity: 0.2,
        }}
      />

      {["haiku", "haikudle"].includes(mode) &&
        <div
          className={`
            fixed bottom-2 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center 
            ${onboardingElement && onboardingElement.startsWith("bottom-links") ? "z-50" : "z-20"} 
            ${onboardingElement && ["bottom-links", "side-panel-and-bottom-links"].includes(onboardingElement) ? "" : "overlayed-control"}
          `}
        >
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
                  altStyles={altStyles}
                  backupInProgress={backupInProgress}
                  onboardingElement={onboardingElement}
                  onRefresh={(options: any) => onClickRandom(options)}
                  onSwitchMode={onSwitchMode}
                  onDelete={onDelete}
                  onSaveDailyHaiku={onSaveDailyHaiku}
                  onAddToAlbum={onAddToAlbum}
                  onShowAbout={onShowAbout}
                  onBackup={onBackup}
                  onCopyHaiku={onCopyHaiku}
                  onCopyLink={onCopyLink}
                  onLikeHaiku={onLikeHaiku}
                  onUploadImage={onUploadImage}
                  onUpdateImage={onUpdateImage}
                  exitImpersonation={exitImpersonation}
                  updateLayout={updateLayout}
                />
              </StyledLayers>
            </PopOnClick>
          </div>
        </div>
      }

      {["showcase", "social-img", "haikudle-social-img"].includes(mode) &&
        <>
          {onSwitchMode &&
            <div
              className={`_bg-pink-400 absolute top-0 left-0 ${user?.isAdmin ? "w-[10vw] z-40" : "w-full z-10"} h-full cursor-pointer`}
              title="Exit showcase mode"
              onClick={() => onSwitchMode("haiku")}
            />
          }
          {increaseDelay && user?.isAdmin &&
            <div
              className="_bg-yellow-400 absolute bottom-0 left-0 w-[10vw] h-[10vw] z-40 cursor-pointer"
              title="Increase refresh time"
              onClick={increaseDelay}
            />
          }
          {decreaseDelay && user?.isAdmin &&
            <div
              className="_bg-yellow-400 absolute bottom-0 right-0 w-[10vw] h-[10vw] z-40 cursor-pointer"
              title="Decrease refresh time"
              onClick={decreaseDelay}
            />
          }
        </>
      }

      {["haiku", "haikudle"].includes(mode) &&
        <SidePanel
          user={user}
          album={album}
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
