import Link from 'next/link'
import { StyledLayers } from '@/app/_components/StyledLayers';
import HaikuGeniusIcon from "@/app/_components/nav/HaikuGeniusIcon";
import * as font from "@/app/font";
import { ExperienceMode } from '@/types/ExperienceMode';

export function Logo({
  mode,
  href,
  onClick,
  styles = [],
  altStyles = [],
  onboardingElement,
  iconOnly,
}: {
  mode: ExperienceMode,
  href?: string,
  onClick?: any,
  styles?: any,
  altStyles?: any,
  onboardingElement?: string,
  iconOnly?: boolean,
}) {
  // const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";
  // const isHaikudleSocialImgMode = mode == "haikudle-social-img";
  const onboarding = onboardingElement && onboardingElement.includes("logo");

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode ? "text-[80pt]" : "text-[22pt] md:text-[28pt]"} font-semibold`}>
      AI
    </span>
  );

  const styledAi = altStyles
    ? (
      <StyledLayers
        styles={onboardingElement
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
      className={`logo hover:no-underline ${isSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      {iconOnly &&
        <div className="HaikuGeniusIcon absolute flex flex-row top-[0.6rem] left-[-0.1rem] md:top-[0.6rem] md:left-[-0.1rem] lg:top-[0.6rem] lg:left-[-0.1rem]">
          <StyledLayers
            styles={onboardingElement
              ? styles.slice(0, 1)
              : styles
            }
          >
            <HaikuGeniusIcon color={styles[0].color} className="h-[9rem] w-[9rem] md:h-[12rem] md:w-[12rem]" />
          </StyledLayers>
        </div>
      }
      {!iconOnly &&
        <div className={`HaikuGeniusIcon ${font.architects_daughter.className} flex flex-row`}>
          <StyledLayers
            styles={onboardingElement
              ? styles.slice(0, 1)
              : styles
            }
          >limericks</StyledLayers>
          <span className="mt-[0.1rem] sm:mt-[0rem]">{styledAi}</span>
        </div>
      }
    </Link>
  )
}
