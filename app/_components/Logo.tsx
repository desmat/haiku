import Link from 'next/link'
import HaikuGeniusIcon from "@/app/_components/HaikuGeniusIcon";
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
  const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";
  const isHaikudleSocialImgMode = mode == "haikudle-social-img";
  const onboarding = onboardingElement && onboardingElement.includes("logo");

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[80pt]" : "text-[22pt] md:text-[28pt]"} font-semibold`}>
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
      className={`logo hover:no-underline ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[100pt]" : "text-[26pt] md:text-[32pt]"}`}
    >
      {iconOnly &&
        <div className="HaikuGeniusIcon absolute top-[0.5rem] left-[-0.3rem] md:top-[.5rem] md:left-[-0.7rem] lg:top-[.5rem] lg:left-[-0.6rem]">
          <StyledLayers
            styles={onboardingElement
              ? styles.slice(0, 1)
              : styles
            }
          >
            <div className="onboarding-container" style={{ width: "auto" }}>
              {onboarding &&
                <div className="onboarding-focus" />
              }
              <HaikuGeniusIcon className="h-[2.8rem] w-[2.8rem] md:h-[3.5rem] md:w-[3.5rem]" />
            </div>
          </StyledLayers>
        </div>
      }
      {!iconOnly &&
        <div className={`${font.architects_daughter.className} flex flex-row`}>
          <StyledLayers
            styles={onboardingElement
              ? styles.slice(0, 1)
              : styles
            }
          >
            {(isSocialImgMode || isHaikudleSocialImgMode) &&
              <HaikuGeniusIcon className="h-[10rem] w-[10rem] mt-[1rem] mr-[-3rem]" />
            }
            {!(isSocialImgMode || isHaikudleSocialImgMode) &&
              <HaikuGeniusIcon className="h-[2.8rem] w-[2.8rem] md:h-[3.5rem] md:w-[3.5rem] mt-[0.3rem] mr-[-0.7rem] md:mt-[0.3rem] md:mr-[-0.9rem]" />
            }
          </StyledLayers>
          <span className="mt-[0.1rem] sm:mt-[0rem]">{styledAi}</span>
          <StyledLayers
            styles={onboardingElement
              ? styles.slice(0, 1)
              : styles
            }
          >{isHaikudleMode || isHaikudleSocialImgMode /* || isSocialImgMode */ ? "kudle" : "ku Genius"}</StyledLayers>
        </div>
      }
    </Link>
  )
}
