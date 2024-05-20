import moment from "moment";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { syllable } from "syllable";
import { FaEdit } from "react-icons/fa";
import { TbReload } from "react-icons/tb";
import useAlert from "@/app/_hooks/alert";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import { USAGE_LIMIT } from "@/types/Usage";
import { User } from "@/types/User";
import { capitalize, upperCaseFirstLetter } from "@/utils/format";
import trackEvent from "@/utils/trackEvent";
import { GenerateIcon } from "./Nav";
import PopOnClick from "./PopOnClick";
import { StyledLayers } from "./StyledLayers";

const formatHaikuTitleAndAuthor = (haiku: Haiku, mode?: string) => {
  return [
    `"${capitalize(haiku.theme)}", `,
    `${mode == "haikudle" ? "haikudle.art" : "haikugenius.io"}/${haiku.id}`
  ];
}

export const formatHaikuText = (haiku: Haiku, mode?: string) => {
  const haikuTitleAndAuthor = formatHaikuTitleAndAuthor(haiku, mode);

  return haiku.poem
    .map((value: string, i: number) => upperCaseFirstLetter(value))
    .join("\n")
    + `\n—${haikuTitleAndAuthor.join("")}\n`;
};

/**
 * Extra efforts at the UX with a controlled input.
 * Making sure that the following is smooth with respect to the input control:
 * - programmatically set focus
 * - programmatically select content
 * - correctly handle Enter, Esc, Tab and arrow keys
 * - smooth (apparent) transition between view and edit on mouse down
 * - normal cursor behaviour in all circumstances
 * Assumption: id will stay contant for each input,
 *  activeId will either be undefined (not editing) or a number
 *  corresponding to the input with matching id
 */
export function ControlledInput({
  id,
  activeId,
  value,
  placeholder,
  className,
  select,
  onChange,
}: {
  id: number,
  activeId?: number,
  value?: string,
  placeholder?: string,
  className?: string,
  select?: boolean,
  onChange?: any,
}) {
  const maxLength = 100; // kinda unreasonable for a haiku line but won't break the UI
  const active = undefined;
  // const [active, setActive] = useState(false);
  // const ref = useRef();
  // console.log('>> app._components.PoemLineInput.render()', { id, activeId, visible, select, value, updatedLine: localValue });

  return (
    <div
      //@ts-ignore
      // ref={ref}
      // contentEditable={active}
      // suppressContentEditableWarning={true}
      className={className || "_bg-pink-200 w-full _absolute top-0 left-[-0.01rem] px-[0.5rem]"}
      // onInput={handleInput}
      // onKeyDown={handleKeyDown}
    >
      {value}
    </div>
  )
}

export default function HaikuPoem({
  user,
  mode,
  haiku,
  popPoem,
  styles,
  altStyles,
  fontSize,
  onboardingElement,
  regeneratePoem,
  regenerateImage,
  refresh,
  saveHaiku,
  copyHaiku
}: {
  user: User,
  mode: ExperienceMode,
  haiku: Haiku,
  popPoem?: boolean,
  styles: any[],
  altStyles?: any[],
  fontSize?: string | undefined,
  onboardingElement?: string,
  regeneratePoem?: any,
  regenerateImage?: any,
  refresh?: any,
  saveHaiku?: any,
  copyHaiku?: any,
}) {
  // console.log('>> app._components.HaikuPoem.render()', { mode, haikuId: haiku?.id, status: haiku.status, popPoem, haiku });
  const haikudleMode = mode == "haikudle";
  const showcaseMode = mode == "showcase";
  const onboarding = typeof (onboardingElement) == "string"
  const maxHaikuTheme = showcaseMode ? 32 : 18;
  const dateCode = moment().format("YYYYMMDD");

  // const [updatedPoem, setUpdatedPoem] = useState<string[]>([]);
  // const [editingLine, setEditingLine] = useState<number | undefined>();
  // const [aboutToEditLine, setAboutToEditLine] = useState<number | undefined>();
  // const [saving, setSaving] = useState(false);
  // const [select, setSelection] = useState(false);
  // const [alert] = useAlert((state: any) => [state.plain]);
  const editingLine = undefined;
  const aboutToEditLine = undefined;
  const saving = undefined;
  
  const editing = typeof (editingLine) == "number";
  const aboutToEdit = typeof (aboutToEditLine) == "number";
  const copyAllowed = true;
  const canCopy = copyAllowed && !editing && !saving;
  const editAllowed = !showcaseMode && (user?.isAdmin || haiku.createdBy == user?.id) && saveHaiku;
  const canEdit = editAllowed && !saving && !onboarding;
  const regeneratePoemAllowed = (user?.isAdmin || haiku.createdBy == user?.id) && regeneratePoem;
  const regenerateImageAllowed = (user?.isAdmin || haiku.createdBy == user?.id) && regenerateImage;
  const canRegeneratePoem = regeneratePoemAllowed && !editing && !saving;
  const canRegenerateImage = regenerateImageAllowed && !editing && !saving;
  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { haiku, updatedPoem, editingPoemLine });

  return (
    <div className="relative">
      {/* allow editors to click out and finish */}
      <div
        className={`_bg-pink-100 absolute top-0 left-0 w-[100vw] h-[100vh]${saving ? " opacity-50" : ""}`}
        // onClick={() => editing && finishEdit()}
      />

      {/* note: https://stackoverflow.com/questions/28269669/css-pseudo-elements-in-react */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .poem-line-input div {
              background: none;
              _background: pink; /* for debugging */
              caret-color: ${haiku?.color || "black"};
              border-radius: 0.4rem;
              height: auto;
              padding: 0.15rem 0.5rem;
              outline: 1px solid ${haiku?.bgColor || ""}00;
            }
            .poem-line-input.poem-line-${/* !editing && */ !saving && !onboarding && aboutToEditLine} div {
              outline: 1px solid ${haiku?.bgColor || ""}66;
              background-color: ${haiku?.bgColor || "white"}44;  
            }
            .poem-line-input div:focus {
              outline: 1px solid ${haiku?.bgColor || ""}66;
              background: ${haiku?.bgColor || "white"}66;
            }
            .poem-line-input div::selection { 
              background: ${haiku.color || "black"}66;
            }`
        }}
      >
      </style>
      <div className="onboarding-container">
        {onboardingElement && ["poem"].includes(onboardingElement) &&
          <div className="onboarding-focus double" />
        }
        {onboardingElement && ["poem-and-poem-actions"].includes(onboardingElement) &&
          <div className="onboarding-focus" />
        }
        <PopOnClick
          color={haiku.bgColor}
          force={popPoem}
          disabled={editing || canEdit || showcaseMode}
        >
          <div
            className={`_bg-pink-200 px-[1.5rem] ${canEdit ? "group/edit" : ""} ${saving ? "animate-pulse" : ""}`}
            style={{
              cursor: showcaseMode ? "pointer" : "",
              fontSize,
              maxWidth: showcaseMode ? "calc(100vw - 64px)" : "800px",
              minWidth: "200px",
            }}
          >
            <div
              className="_bg-purple-200 flex flex-col _transition-all md:text-[26pt] sm:text-[22pt] text-[18pt]"
              // onClick={handleClickHaiku}
              title={showcaseMode ? "Refresh" : "Click to edit"}
              style={{
                cursor: showcaseMode ? "pointer" : "",
                fontSize,
              }}
            >
              <PopOnClick
                color={haiku.bgColor}
                force={popPoem}
                disabled={editing || !showcaseMode}
                active={!!(onboardingElement && onboardingElement.includes("poem"))}
              >
                {haiku.poem.map((poemLine: string, i: number) => (
                  <div key={i} className="md:my-[0.05rem] sm:my-[0.03rem] my-[0.15rem] transition-all">
                    <StyledLayers styles={
                      aboutToEdit || editing || saving
                        ? styles.slice(0, 1)
                        : onboardingElement && !onboardingElement.includes("poem")
                          ? styles.slice(0, 2)
                          : saving
                            ? styles.slice(0, 3)
                            : styles
                    }>
                      <div
                        className="relative m-[0rem] transition-all"
                        // onKeyDown={(e: any) => canEdit && handlePoemLineKeyDown(e, i)}
                        // onMouseOver={() => canEdit && setAboutToEditLine(i)}
                        // onMouseOut={() => canEdit && setAboutToEditLine(undefined)}
                        // onMouseDown={(e: any) => canEdit && startEdit(i, false) /* setTimeout(() => startEdit(i, false), 10) */}
                      >
                        {/* set the width while editing */}
                        {editAllowed &&
                          <div className={`poem-line-input poem-line-${i} _opacity-50 md:leading-[3rem] sm:leading-[2.5rem] leading-[2rem]`}>
                            <ControlledInput
                              id={i}
                              activeId={editingLine}
                              value={
                                // upperCaseFirstLetter(saving
                                // ? typeof (updatedPoem[i]) == "string"
                                //   ? updatedPoem[i]
                                //   : upperCaseFirstLetter(poemLine)
                                // : upperCaseFirstLetter(poemLine))
                                upperCaseFirstLetter(poemLine)
                              }
                              // select={select}
                              // onChange={(value: string) => handleInputChange(value, i)}
                            />
                          </div>
                        }
                        {!editAllowed &&
                          <div
                            className={`_bg-purple-400 my-[0.05rem] ${showcaseMode ? "cursor-pointer" : "cursor-copy"}`}
                          >
                            {upperCaseFirstLetter(poemLine)}
                          </div>
                        }
                      </div>
                    </StyledLayers>
                  </div>
                ))}
              </PopOnClick>
            </div>

            <div
              className="_bg-pink-200 relative md:mt-[-0.3rem] sm:mt-[-0.2rem] my-[-0.15rem] md:text-[16pt] sm:text-[14pt] text-[12pt]"
              style={{
                // background: "pink",
                height: haikudleMode
                  ? ""
                  : showcaseMode
                    ? "" //"8rem" // maybelooks better when pushed up a bit
                    : haiku.theme?.length > maxHaikuTheme
                      ? "2.6rem"
                      : "1.3rem",
                fontSize: "60%",
              }}
            >
              <div
                className={showcaseMode
                  ? "_bg-yellow-200 fixed bottom-4 right-8 w-max flex flex-row"
                  : "_bg-orange-200 flex flex-row absolute w-max ml-[0.5rem] mt-[0.1rem]"
                }
                style={{ fontSize }}
              >
                <div
                  className="transition-all _bg-pink-400"
                  // onClick={(e: any) => !showcaseMode && handleClickHaiku(e)}
                  title={showcaseMode ? "" : "Copy to clipboard"}
                  style={{
                    cursor: showcaseMode
                      ? "pointer"
                      : !editAllowed && canCopy
                        ? "copy"
                        : ""
                  }}
                >
                  <StyledLayers
                    styles={
                      saving
                        ? styles.slice(0, 3)
                        : onboardingElement && !onboardingElement.includes("poem")
                          ? styles.slice(0, 2)
                          : styles
                    }
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: `${formatHaikuTitleAndAuthor(haiku, mode).join(haiku.theme?.length > maxHaikuTheme
                          ? "<br/>&nbsp;"
                          : "")}`
                      }}
                    />
                  </StyledLayers>
                </div>

                {!showcaseMode && (copyAllowed || editAllowed || regeneratePoemAllowed) &&
                  <div
                    className="onboarding-container group/actions _bg-yellow-200 flex flex-row gap-2 mt-auto md:pt-[0rem] sm:pt-[0.0rem] md:pb-[0.2rem] sm:pb-[0.5rem] pb-[0.4rem] md:pl-[0.9rem] sm:pl-[0.7rem] pl-[0.5rem]"
                  >
                    {onboardingElement && ["poem-actions"].includes(onboardingElement) &&
                      <div className="onboarding-focus" />
                    }
                    {onboardingElement && ["poem-and-poem-actions"].includes(onboardingElement) &&
                      <div className="onboarding-focus double" />
                    }
                    {editAllowed &&
                      <Link
                        href="#"
                        className={`${!saving ? "cursor-pointer" : "cursor-default"}`}
                        title="Edit this haiku"
                        // onClick={(e: any) => {
                        //   e.preventDefault();
                        //   if (editAllowed) {
                        //     editing
                        //       ? finishEdit()
                        //       : canEdit
                        //         ? startEdit(0, true)
                        //         : undefined;
                        //   }
                        // }}
                      >
                        <StyledLayers styles={altStyles || []}>
                          <PopOnClick>
                            <FaEdit className={`
                            h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 
                            ${editing || onboardingElement == "poem-actions"
                                ? "opacity-100"
                                : saving || !canEdit
                                  ? "opacity-60"
                                  : canEdit
                                    ? "opacity-100"
                                    : ""
                              }
                          `} />
                          </PopOnClick>
                        </StyledLayers>
                      </Link>
                    }
                    {regeneratePoemAllowed &&
                      <div className="_bg-pink-200">
                        {!user?.isAdmin && (user?.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
                          <span title="Exceeded daily limit: try again later">
                            <StyledLayers styles={altStyles || []}>
                              <GenerateIcon sizeOverwrite={`
                                h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 
                                ${onboardingElement == "poem-actions" ? "opacity-100" : "opacity-60"}
                              `} />
                            </StyledLayers>
                          </span>
                        }
                        {(user?.isAdmin || (user?.usage[dateCode]?.haikusRegenerated || 0) < USAGE_LIMIT.DAILY_REGENERATE_HAIKU) &&
                          <span title="Regenerate this haiku with the same theme">
                            <StyledLayers styles={altStyles || []}>
                              <PopOnClick>
                                <GenerateIcon
                                  onClick={() => canRegeneratePoem && regeneratePoem()}
                                  sizeOverwrite={`
                                  h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 
                                  ${canRegeneratePoem || onboardingElement == "poem-actions" ? "cursor-pointer opacity-100" : "opacity-60"} 
                                `}
                                />
                              </PopOnClick>
                            </StyledLayers>
                          </span>
                        }
                      </div>
                    }
                    {regenerateImageAllowed &&
                      <div className="_bg-pink-200">
                        {!user?.isAdmin && (user.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
                          <span title="Exceeded daily limit: try again later">
                            <StyledLayers styles={altStyles || []}>
                              <TbReload className={`
                                h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 
                                ${onboardingElement == "poem-actions" ? "opacity-100" : "opacity-60"}
                              `} />
                            </StyledLayers>
                          </span>
                        }
                        {(user?.isAdmin || (user.usage[dateCode]?.haikusRegenerated || 0) < USAGE_LIMIT.DAILY_REGENERATE_HAIKU) &&
                          <span title="Regenerate this haiku's art with the same theme">
                            <StyledLayers styles={altStyles || []}>
                              <PopOnClick>
                                <TbReload
                                  onClick={() => canRegenerateImage && regenerateImage()}
                                  className={`
                                  h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 
                                  ${canRegeneratePoem || onboardingElement == "poem-actions" ? "cursor-pointer opacity-100" : "opacity-60"} 
                                `}
                                />
                              </PopOnClick>
                            </StyledLayers>
                          </span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </PopOnClick >
      </div>
    </div >
  )
}
