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
  version,
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
  switchMode,
  updateLayout,
}: {
  user?: User,
  mode: ExperienceMode,
  haiku?: Haiku,
  version?: number,
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
  copyHaiku?: any,
  switchMode?: any,
  updateLayout?: any,
}) {
  // console.log('>> app._components.HaikuPage.render()', { loading, mode, id: haiku?.id, poem: haiku?.poem, popPoem, haiku });
  const showcaseMode = mode == "showcase";
  // const [user] = useUser((state: any) => [state.user]);
  const blurValue = loading ? 60 : 0;
  const saturateValue = loading ? 0.6 : 1;

  return (
    <div>
      <div
        className="absolute top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku?.bgImage}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
          transition: loading ? "filter 0.5s ease-out" : "filter 0.1s ease-out",
        }}
      />
      <div className={`poem-outer-container ${font.architects_daughter.className} _bg-pink-200 h-full flex justify-center md:text-[26pt] sm:text-[22pt] text-[16pt] absolute top-0 left-0 right-0 _bottom-[5vh] ${showcaseMode ? "_portrait:bottom-[10vh] _py-[2vh]" : "_portrait:bottom-[12vh] _pb-[5rem] _pt-[3rem]"} bottom-[] m-auto w-fit h-fit ${onboardingElement && ["poem", "poem-actions", "poem-and-poem-actions"].includes(onboardingElement) ? "z-50" : "z-10"} _transition-all `}>
        {(/* regenerating || */ loading) &&
          <Loading styles={styles} />
        }
        {/* !regenerating && */ !loading && mode != "social-img" && mode != "haikudle-social-img" && !haiku.poemHashed &&
          <div className="_xtall:bg-orange-400 _tall:bg-pink-200 _wide:bg-yellow-200 relative">
            <HaikuPoem
              user={user}
              mode={mode}
              haiku={haiku}
              version={version}
              popPoem={popPoem}
              styles={styles}
              altStyles={altStyles}
              fontSize={fontSize ? fontSize : showcaseMode ? "110%" : undefined}
              onboardingElement={onboardingElement}
              regeneratePoem={regeneratePoem}
              regenerateImage={regenerateImage}
              refresh={refresh}
              saveHaiku={saveHaiku}
              // copyHaiku={copyHaiku}
              switchMode={switchMode}
              regenerating={regenerating}
              updateLayout={updateLayout}
            />
          </div>
        }
      </div>
    </div >
  )
}
