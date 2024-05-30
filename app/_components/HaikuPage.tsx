// 'use client'

// import useUser from "@/app/_hooks/user";
import * as font from "@/app/font";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import HaikuPoem from "./HaikuPoem";
import Loading from "./Loading";
import { User } from "@/types/User";

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
  regeneratePoem,
  regenerateImage,
  copyHaiku,
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
  saveHaiku?: any
  regeneratePoem?: any,
  regenerateImage?: any,
  copyHaiku?: any
}) {
  // console.log('>> app._components.HaikuPage.render()', { mode, id: haiku?.id, popPoem, haiku });
  const showcaseMode = mode == "showcase";
  // const [user] = useUser((state: any) => [state.user]);
  const blurValue = loading ? 50 : 0;
  const saturateValue = loading ? 0 : 1;
  const tallBottomClassName = showcaseMode ? "tall:bottom-[15vh]" : "tall:bottom-[12vh]";

  return (
    <div>
      <div
        className="absolute top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku?.bgImage}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
          transition: loading ? "filter 0.2s ease-out" : "filter 0.1s ease-out",
        }}
      />
      <div className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[16pt] absolute top-0 left-0 right-0 bottom-[0vh] ${tallBottomClassName} xtall:bottom-[18vh] m-auto w-fit h-fit ${onboardingElement && ["poem", "poem-actions", "poem-and-poem-actions"].includes(onboardingElement) ? "z-50" : "z-10"} _transition-all `}>
        {(regenerating || loading) &&
          <Loading styles={styles} />
        }
        {!regenerating && !loading && mode != "social-img" && mode != "haikudle-social-img" && !haiku.poemHashed && 
          <div className="_xtall:bg-orange-400 _tall:bg-pink-200 _wide:bg-yellow-200 relative">
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
            />
          </div>
        }
      </div>
    </div >
  )
}
