'use client'

import { useEffect, useState } from "react";
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
  regenerateHaiku,
  regenerating,
  loading,
  refresh,
}: {
  mode: string,
  haiku?: Haiku,
  styles: any[],
  altStyles?: any[],
  popPoem?: boolean,
  regenerateHaiku?: any,
  regenerating?: boolean,
  loading?: boolean,
  refresh?: any,
}) {
  console.log('>> app._components.HaikuPage.render()', { mode, id: haiku.id, popPoem, haiku });

  const [user] = useUser((state: any) => [state.user]);
  const [_loading, setLoading] = useState(!popPoem);

  const blurValue = loading || _loading ? 8 : 0
  const saturateValue = loading || _loading ? 0.7 : 1

  // leverage css transition
  useEffect(() => {
    // under normal conditions give the page a blur transition
    // except if overwritten by param
    if (!loading) {
      setTimeout(() => setLoading(false), 1);
    }
  }, [haiku?.id]);

  return (
    <div>
      <div
        className="bar fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku?.bgImage}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: `brightness(1.2) blur(${blurValue}px) saturate(${saturateValue}) `,
          transition: "filter 0.5s ease-out",
        }}
      />
      <div className={`${font.architects_daughter.className} _bg-yellow-200 md:text-[26pt] sm:text-[22pt] text-[16pt] fixed top-0 left-0 right-0 bottom-0 m-auto w-fit h-fit z-10 transition-all `}>
        {(regenerating || _loading) &&
          <div className="relative opacity-50">
            <StyledLayers styles={styles}>
              <div className="animate-pulse">
                Loading...
              </div>
            </StyledLayers>
          </div>
        }
        {!regenerating && !_loading &&
          <div className="_bg-pink-200 relative">
            <HaikuPoem
              user={user}
              mode={mode}
              haiku={haiku}
              popPoem={popPoem}
              styles={styles}
              altStyles={altStyles}
              regenerate={regenerateHaiku}
              refresh={refresh}
            />
          </div>
        }
      </div>
    </div >
  )
}
