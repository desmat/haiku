// 'use client'

import * as font from "@/app/font";
import AdjustLayoutControls from "@/app/_components/nav/AdjustLayoutControls";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import { User } from "@/types/User";
import HaikuPoem from "./HaikuPoem";
import Loading from "./Loading";

export default function HaikuPage({
  user,
  mode,
  haiku,
  styles,
  altStyles,
  fontSize,
  popPoem,
  regenerating,
  loading,
  onboardingElement,
  refresh,
  saveHaiku,
  updateTitle,
  regeneratePoem,
  regenerateImage,
  copyHaiku,
  switchMode,
  adjustLayout,
}: {
  user?: User,
  mode: ExperienceMode,
  haiku?: Haiku,
  styles: any[],
  altStyles?: any[],
  fontSize?: string | undefined,
  popPoem?: boolean,
  regenerating?: boolean,
  loading?: boolean,
  onboardingElement?: string,
  refresh?: any,
  saveHaiku?: any,
  updateTitle?: any,
  regeneratePoem?: any,
  regenerateImage?: any,
  copyHaiku?: any,
  switchMode?: any,
  adjustLayout?: any,
}) {
  // console.log('app._components.HaikuPage.render()', { loading, mode, id: haiku?.id, poem: haiku?.poem, popPoem, haiku });
  const showcaseMode = mode == "showcase";
  // const [user] = useUser((state: any) => [state.user]);
  const blurValue = loading ? 40 : 0;
  const saturateValue = loading ? 0.6 : 1;
  const poemLayout = showcaseMode && !regenerating && !loading
    ? haiku?.layout?.poem
    : {};
  const canAdjustLayout = !!adjustLayout && showcaseMode;
  // console.log('app._components.HaikuPage.render()', { poemLayout });

  return (
    <div>
      <div
        className="bgImage-container absolute _bg-pink-200 z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku?.bgImage}")`,
          backgroundPosition: "center",
          // backgroundSize: "max(60vh, 100vw)",
          backgroundRepeat: "no-repeat",
          backgroundColor: haiku?.bgColor || "#aaaaaa",
          filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
          transition: loading ? "filter 0.2s ease-out" : "filter 0.1s ease-out",
          // allow clipping horizontal edges up to a point
          top: "50dvh",
          left: "50vw",
          transform: "translate(-50%, -50%)",
          height: "100%",
          ...haiku?.bgImageDimensions?.height > haiku?.bgImageDimensions?.width
            ? {
              // portrait
              backgroundSize: "max(min(100vw, 150vh), 100vw) auto",
              width: "max(min(100vw, 150dvh), 100vw)",
            }
            : {
              // square/landscape
              backgroundSize: "auto max(min(150vw, 100vh), 100vw)",
              width: "max(min(150vw, 100dvh), 100vw)",
            }
        }}
      />
      <div
        className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[16pt] absolute top-0 left-0 right-0 bottom-[5vh] ${showcaseMode ? "portrait:bottom-[10vh]" : "portrait:bottom-[12vh]"} bottom-[] m-auto w-fit h-fit ${onboardingElement && ["poem", "poem-actions", "poem-and-poem-actions"].includes(onboardingElement) ? "z-50" : "z-10"} _transition-all `}
        style={{
          top: poemLayout?.top || poemLayout?.down
            ? `max(${poemLayout?.top || poemLayout?.down}vh + (100vh - max(min(100vh, 150vw), 100vw)) / 2, ${poemLayout?.top || poemLayout?.down}vh)`
            : poemLayout?.up
              ? `max(${-1 * poemLayout.up}vh + (100vh - max(min(100vh, 150vw), 100vw)) / 2, ${-1 * poemLayout.up}vh)`
              : undefined,
          bottom: poemLayout?.bottom ? `${poemLayout.bottom}vh` : undefined,
          marginTop: poemLayout?.top ? 0 : "auto",
          marginBottom: poemLayout?.bottom ? 0 : "auto",
        }}
      >
        {canAdjustLayout &&
          <AdjustLayoutControls
            layout={haiku.layout}
            adjustLayout={adjustLayout}
          />
        }
        {(regenerating || loading) &&
          <Loading styles={styles} />
        }
        {!regenerating && !loading && mode != "social-img" && mode != "haikudle-social-img" && !haiku.poemHashed &&
          <div
            className="_xtall:bg-orange-400 _tall:bg-pink-200 _wide:bg-yellow-200 relative z-20"
          >
            <HaikuPoem
              user={user}
              mode={mode}
              haiku={haiku}
              popPoem={popPoem}
              styles={styles}
              altStyles={altStyles}
              fontSize={fontSize ? fontSize : showcaseMode ? "110%" : undefined}
              onboardingElement={onboardingElement}
              regeneratePoem={regeneratePoem}
              regenerateImage={regenerateImage}
              refresh={refresh}
              saveHaiku={saveHaiku}
              copyHaiku={copyHaiku}
              switchMode={switchMode}
              updateTitle={updateTitle}
            />
          </div>
        }
      </div>
    </div >
  )
}
