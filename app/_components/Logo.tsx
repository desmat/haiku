import Link from 'next/link'
import * as font from "@/app/font";
import { ExperienceMode } from '@/types/ExperienceMode';
import { StyledLayers } from './StyledLayers';

export function Logo({
  mode,
  href,
  onClick,
  styles,
  altStyles,
  onboardingElement,
  forceFull,
}: {
  mode: ExperienceMode,
  href?: string,
  onClick?: any,
  styles?: any,
  altStyles?: any,
  onboardingElement?: string,
  forceFull?: boolean,
}) {
  const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";
  const isHaikudleSocialImgMode = mode == "haikudle-social-img";

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[80pt]" : "text-[22pt] md:text-[28pt]"} font-semibold`}>
      AI
    </span>
  );

  const styledAi = altStyles
    ? (
      <StyledLayers
        styles={onboardingElement && !onboardingElement.startsWith("logo")
          ? altStyles.slice(0, 1)
          : altStyles
        }
      >
        {ai}
      </StyledLayers>
    )
    : (
      <div>{ai}</div>
    );

  return (
    <Link
      onClick={() => onClick && onClick()}
      href={href || "/"}
      className={`logo hover:no-underline ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      <div className={`${font.architects_daughter.className} flex flex-row`}>
        <span className={forceFull ? "" : "hidden sm:block"}>
          <StyledLayers
            styles={onboardingElement && !onboardingElement.startsWith("logo")
              ? styles.slice(0, 1)
              : styles
            }
          >h</StyledLayers>
        </span>
        <span className="mt-[0.1rem] sm:mt-[0rem]">{styledAi}</span>
        <span className={forceFull ? "" : "hidden sm:block"}>
          <StyledLayers
            styles={onboardingElement && !onboardingElement.startsWith("logo")
              ? styles.slice(0, 1)
              : styles
            }
          >{isHaikudleMode || isHaikudleSocialImgMode /* || isSocialImgMode */ ? "kudle" : "kuGenius"}</StyledLayers>
        </span>
      </div>
    </Link>
  )
}
