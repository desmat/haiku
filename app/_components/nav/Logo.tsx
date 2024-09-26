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
  const isHaikudleMode = mode == "haikudle";
  const isSocialImgMode = mode == "social-img";
  const isHaikudleSocialImgMode = mode == "haikudle-social-img";
  const onboarding = onboardingElement && onboardingElement.includes("logo");

  const ai = (
    <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[72pt]" : "text-[32pt] md:text-[38pt]"} font-semibold`}>
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
      className={`logo hover:no-underline ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[92pt]" : "text-[36pt] md:text-[42pt]"}`}
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
              <HaikuGeniusIcon color={styles[0].color} className="h-[2.8rem] w-[2.8rem] md:h-[3.5rem] md:w-[3.5rem]" />
            </div>
          </StyledLayers>
        </div>
      }
      {!iconOnly &&
        <div className={`HaikuGeniusIcon ${font.architects_daughter.className} flex flex-row`}>
          
          <span className="mt-[0rem] sm:mt-[0rem]">{styledAi}</span>
          <StyledLayers
            styles={onboardingElement
              ? styles.slice(0, 1)
              : styles
            }
          >{isHaikudleMode || isHaikudleSocialImgMode /* || isSocialImgMode */ ? "kudle" : "fails"}</StyledLayers>
          <span className="ml-[0.15em]">
            <StyledLayers
              styles={onboardingElement
                ? styles.slice(0, 1)
                : styles
              }
            >
              <span className={`${font.inter.className} tracking-[-2px] ml-[1px] mr-[2px] ${isSocialImgMode || isHaikudleSocialImgMode ? "text-[72pt]" : "text-[20pt] md:text-[26pt]"} font-normal _md:font-medium`}>
                
              </span>
            </StyledLayers>
          </span>
        </div>
      }
    </Link>
  )
}
