// 'use client'

import * as font from "@/app/font";
import AdjustLayoutControls from "@/app/_components/nav/AdjustLayoutControls";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import { User } from "@/types/User";
import HaikuPoem from "./HaikuPoem";
import Loading from "./Loading";

export const bgImagePreviewMs = 12_000;
export const bgImageRevealMs = 350;
export const haikuLeaveMs = 250;

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
  preview,
  revealing,
  leaving,
  onLeft,
  imagePending,
  onboardingElement,
  refresh,
  saveHaiku,
  updateTitle,
  regeneratePoem,
  regenerateImage,
  copyHaiku,
  switchMode,
  adjustLayout,
  aligning,
  setAligning,
  filter,
  children,
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
  preview?: { poem?: string[], bgImage?: string, blur?: number },
  // Just replaced a loading page or preview: ease from its blur and image.
  // "image" leaves the poem alone.
  revealing?: "haiku" | "image",
  // Loading the next haiku: this one's poem fades out as the image blurs.
  leaving?: boolean,
  onLeft?: () => void,
  // Not decoded yet: hold the flat background colour rather than paint it partway.
  imagePending?: boolean,
  onboardingElement?: string,
  refresh?: any,
  saveHaiku?: any,
  updateTitle?: any,
  regeneratePoem?: any,
  regenerateImage?: any,
  copyHaiku?: any,
  switchMode?: any,
  adjustLayout?: any,
  aligning?: boolean,
  setAligning?: any,
  // The puzzle's blur, eased as it changes.
  filter?: { blur: number, saturate: number },
  // Shown over the background instead of the poem: the puzzle.
  children?: React.ReactNode,
}) {
  // console.log('app._components.HaikuPage.render()', { loading, mode, id: haiku?.id, poem: haiku?.poem, popPoem, haiku });
  const showcaseMode = mode == "showcase";
  // const [user] = useUser((state: any) => [state.user]);
  const previewImage = loading && preview?.bgImage;
  const previewPoem = loading && preview?.poem;
  const blurValue = previewImage ? preview.blur || 0 : loading || imagePending ? 40 : filter?.blur || 0;
  const saturateValue = (loading || imagePending) && !previewImage ? 0.6 : filter?.saturate ?? 1;
  const leavingPoem = !!(loading && leaving && !previewPoem && haiku?.poem);
  const poemLayout = /* showcaseMode && */ !regenerating && (!loading || leavingPoem)
    ? haiku?.layout?.poem
    : {};
  const canAdjustLayout = !!adjustLayout /* && showcaseMode */;
  // console.log('app._components.HaikuPage.render()', { poemLayout });

  return (
    <div>
      <div
        className="bgImage-container absolute _bg-pink-200 z-0 opacity-100"
        style={{
          backgroundImage: imagePending ? "none" : `url("${haiku?.bgImage}")`,
          backgroundPosition: "center",
          // backgroundSize: "max(60vh, 100vw)",
          backgroundRepeat: "no-repeat",
          backgroundColor: haiku?.bgColor || "#aaaaaa",
          filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
          // Chrome and Safari crossfade background-image. Firefox swaps it. Transitions start from
          // the current value, so a preview still easing in hands over smoothly.
          transition: previewImage
            ? ["filter", "background-image", "background-color"].map((p) => `${p} ${bgImagePreviewMs}ms ease-out`).join(", ")
            : revealing
              ? ["filter", "background-image", "background-color"].map((p) => `${p} ${bgImageRevealMs}ms ease-out`).join(", ")
              : leaving
                ? `filter ${haikuLeaveMs}ms ease-in`
                : loading ? "filter 0.2s ease-out" : filter ? "filter 0.5s ease-out" : "filter 0.1s ease-out",
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
      {children
        ? children
        : <div
          className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[16pt] absolute top-0 left-0 right-0 bottom-[5vh] ${showcaseMode ? "portrait:bottom-[10vh]" : "portrait:bottom-[12vh]"} bottom-[] m-auto w-fit h-fit ${onboardingElement && ["poem", "poem-actions", "poem-and-poem-actions"].includes(onboardingElement) ? "z-50" : "z-10"} mode-transition-position`}
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
          {canAdjustLayout && (user?.isAdmin || aligning) &&
            <AdjustLayoutControls
              layout={haiku.layout}
              adjustLayout={adjustLayout}
              styles={styles}
              altStyles={altStyles}
              adminMode={user?.isAdmin && !aligning}
            />
          }
          {(regenerating || loading) && !previewPoem && !leavingPoem &&
            <Loading styles={styles} />
          }
          {leavingPoem &&
            // Only once the poem is gone, and only if the next haiku is slow to arrive.
            <div style={{ animation: `haiku-fade-in ${bgImageRevealMs}ms ease-out ${haikuLeaveMs + 600}ms both` }}>
              <Loading styles={styles} />
            </div>
          }
          {!regenerating && (!loading || previewPoem || leavingPoem) && mode != "social-img" && mode != "haikudle-social-img" && !haiku.poemHashed &&
            <div
              className={`_bg-pink-200 _xtall:bg-orange-400 _tall:bg-pink-200 _wide:bg-yellow-200 relative z-20 ${leavingPoem ? "pointer-events-none" : ""}`}
              // Also a server component (page.tsx), where handlers aren't allowed. Never leaving there.
              onAnimationEnd={leavingPoem ? (e) => e.target == e.currentTarget && onLeft?.() : undefined}
              style={leavingPoem
                ? { animation: `haiku-fade-out ${haikuLeaveMs}ms ease-in forwards` }
                : revealing == "haiku"
                  ? { animation: `haiku-fade-in ${bgImageRevealMs}ms ease-out` }
                  : undefined}
            >
              <HaikuPoem
                user={user}
                mode={mode}
                haiku={haiku}
                popPoem={popPoem}
                styles={styles}
                altStyles={altStyles}
                fontSize={fontSize}
                onboardingElement={onboardingElement}
                regeneratePoem={regeneratePoem}
                regenerateImage={regenerateImage}
                refresh={refresh}
                saveHaiku={saveHaiku}
                copyHaiku={copyHaiku}
                switchMode={switchMode}
                updateTitle={updateTitle}
                aligning={aligning}
                setAligning={setAligning}
              />
            </div>
          }
        </div>
      }
    </div >
  )
}
