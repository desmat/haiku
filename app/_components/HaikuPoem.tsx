'use client'

import moment from "moment";
import { useEffect, useState } from "react";
import useAlert from "@/app/_hooks/alert";
import { Haiku } from "@/types/Haiku";
import { USAGE_LIMIT } from "@/types/Usage";
import { User } from "@/types/User";
import { capitalize, upperCaseFirstLetter } from "@/utils/format";
import trackEvent from "@/utils/trackEvent";
import { StyledLayers } from "./StyledLayers";
import { GenerateIcon } from "./Nav";
import PopOnClick from "./PopOnClick";

export default function HaikuPoem({
  user,
  mode,
  haiku,
  popPoem,
  styles,
  altStyles,
  regenerate,
  refresh,
}: {
  user: User,
  mode: string,
  haiku: Haiku,
  popPoem?: boolean,
  styles: any[],
  altStyles?: any[],
  regenerate?: any,
  refresh?: any
}) {
  // console.log('>> app._components.HaikuPoem.render()', { mode, haikuId: haiku?.id, popPoem });
  const isHaikudleMode = mode == "haikudle";
  const isShowcaseMode = mode == "showcase";
  const maxHaikuTheme = isShowcaseMode ? 32 : 18;
  const dateCode = moment().format("YYYYMMDD");
  const [alert] = useAlert((state: any) => [state.plain]);

  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { poem, pop });

  const haikuTitleAndAuthorTag = [
    `"${capitalize(haiku.theme)}", `,
    `${isHaikudleMode || isShowcaseMode ? "haikudle.art" : "haiku.desmat.ca"} (${moment(haiku.createdAt).format("YYYY")})`
  ];

  const handleClickHaiku = (e: any) => {
    if (mode == "showcase") {
      return refresh && refresh(e);
    }

    const haikuToCopy = haiku.poem
      .map((line: string, i: number) => upperCaseFirstLetter(line))
      .join("\n")
      + `\n—${haikuTitleAndAuthorTag.join("")}\n`;

    // console.log('>> app._components.HaikuPage.handleClickHaiku()', { haikuToCopy });
    navigator.clipboard.writeText(haikuToCopy);

    alert(`Haiku poem copied to clipboard`, { closeDelay: 750 });

    trackEvent("haiku-copied", {
      userId: user.id,
      id: haiku.id,
    });
  }

  return (
    <PopOnClick color={haiku.bgColor} force={popPoem} disabled={isShowcaseMode}>
      <div>
        <PopOnClick color={haiku.bgColor} force={popPoem} disabled={!isShowcaseMode}>
          <div
            className="_bg-purple-200 flex flex-col gap-[-0.5rem] _transition-all md:text-[26pt] sm:text-[22pt] text-[18pt]"
            onClick={handleClickHaiku}
            title={mode == "showcase" ? "Refresh" : "Copy to clipboard"}
            style={{
              cursor: mode == "showcase" ? "pointer" : "copy"
            }}
          >
            {haiku.poem.map((line: string, i: number) => (
              <StyledLayers key={i} styles={styles}>
                <div className="my-[-0.1rem] transition-all">
                  {upperCaseFirstLetter(line)}
                </div>
              </StyledLayers>
            ))}
          </div>
        </PopOnClick>
        <div
          className="_bg-pink-200 relative md:text-[16pt] sm:text-[14pt] text-[12pt] md:mt-[-0.3rem] sm:mt-[-0.2rem] mt-[-0.1rem]"
          style={{
            // background: "pink",
            height: isHaikudleMode
              ? ""
              : isShowcaseMode
                ? "" //"8rem" // looks better when pushed up a bit
                : haiku.theme?.length > maxHaikuTheme
                  ? "2.6rem"
                  : "1.3rem"
          }}
        >
          <div
            className={isShowcaseMode
              ? "fixed bottom-2 right-4 w-max flex flex-row"
              : "absolute w-max flex flex-row"
            }
          >
            <div
              className="transition-all"
              onClick={(e: any) => !isShowcaseMode && handleClickHaiku(e)}
              title={isShowcaseMode ? "" : "Copy to clipboard"}
              style={{
                cursor: isShowcaseMode ? "default" : "copy"
              }}
            >
              <StyledLayers styles={styles.slice(2)}>
                <span
                  dangerouslySetInnerHTML={{ __html: `${haikuTitleAndAuthorTag.join(haiku.theme?.length > maxHaikuTheme ? "<br/>&nbsp;" : "")}` }}
                />
              </StyledLayers>
            </div>

            {regenerate && !isShowcaseMode && (user?.isAdmin || haiku.createdBy == user?.id) &&
              <div
                className="mt-auto md:pt-[0.1rem] sm:pt-[0.2rem] mdpb-[0.4rem] sm:pb-[0.3rem] pb-[0.2rem] md:pl-[0.9rem] sm:pl-[0.7rem] pl-[0.5rem]"
                title="Regenerate this haiku with the same theme"
              >
                {!user?.isAdmin && (user.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
                  <span className="opacity-40" title="Exceeded daily limit: try again later">
                    <StyledLayers styles={altStyles || []}>
                      <GenerateIcon sizeOverwrite="h-4 w-4 md:h-6 md:w-6" />
                    </StyledLayers>
                  </span>
                }
                {(user?.isAdmin || (user.usage[dateCode]?.haikusRegenerated || 0) < USAGE_LIMIT.DAILY_REGENERATE_HAIKU) &&
                  <StyledLayers styles={altStyles || []}>
                    <GenerateIcon onClick={() => regenerate && regenerate()} sizeOverwrite="h-4 w-4 md:h-6 md:w-6" />
                  </StyledLayers>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </PopOnClick>
  )
}

