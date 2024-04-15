'use client'

import useUser from "@/app/_hooks/user";
import * as font from "@/app/font";
import { Haiku } from "@/types/Haiku";
import { StyledLayers } from "./StyledLayers";
import HaikuPoem from "./HaikuPoem";

export default function HaikuPage({
  mode,
  haiku,
  styles,
  altStyles,
  popPoem,
  regenerating,
  loading,
  onboardingElement,
  refresh,
  regenerateHaiku,
  copyHaiku,
}: {
  mode: string,
  haiku?: Haiku,
  styles: any[],
  altStyles?: any[],
  popPoem?: boolean,
  regenerating?: boolean,
  loading?: boolean,
  onboardingElement?: string,
  refresh?: any,
  regenerateHaiku?: any,
  copyHaiku?: any
}) {
  // console.log('>> app._components.HaikuPage.render()', { mode, id: haiku.id, popPoem, haiku });

  const [user] = useUser((state: any) => [state.user]);
  const blurValue = loading ? 8 : 0
  const saturateValue = loading ? 0.7 : 1

  return (
    <div>
      <div
        className="absolute top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku?.bgImage}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
          transition: "filter 0.5s ease-out",
        }}
      />
      <div className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[16pt] absolute top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit ${onboardingElement && ["poem", "poem-actions", "poem-and-poem-actions"].includes(onboardingElement) ? "z-50" : "z-10"} _transition-all `}>
        {(regenerating || loading) &&
          <div className="relative opacity-50">
            <StyledLayers styles={styles}>
              <div className="animate-pulse flex flex-col items-center">
                <div>読込</div>
                <div>Loading</div>
              </div>
            </StyledLayers>
          </div>
        }
        {!regenerating && !loading && mode != "social-img" && 
          <div className="_bg-pink-200 relative">
            <HaikuPoem
              user={user}
              mode={mode}
              haiku={haiku}
              popPoem={popPoem}
              styles={styles}
              altStyles={altStyles}
              onboardingElement={onboardingElement}
              regenerate={regenerateHaiku}
              refresh={refresh}
              copyHaiku={copyHaiku}
            />
          </div>
        }
      </div>
    </div >
  )
}
