'use client'

import moment from "moment";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { syllable } from "syllable";
import { FaEdit } from "react-icons/fa";
import { TbReload } from "react-icons/tb";
import useAlert from "@/app/_hooks/alert";
import useHaikus from "@/app/_hooks/haikus";
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
  select,
  onChange,
}: {
  id: number,
  activeId?: number,
  value?: string,
  select?: boolean,
  onChange: any,
}) {
  const [localValue, setLocalValue] = useState<string>(upperCaseFirstLetter(value || ""));
  const [active, setActive] = useState(false);
  const ref = useRef();
  // console.log('>> app._components.PoemLineInput.render()', { id, activeId, visible, select, value, updatedLine: localValue });

  useEffect(() => {
    // console.log('>> app._components.PoemLineInput.useEffect()', { id, activeId, visible, ref, value, updatedLine: localValue });

    if (typeof (activeId) == "number") {
      if (activeId == id && typeof (value) == "string" && !active) {
        // console.log('>> app._components.PoemLineInput.useEffect() setFocus', { id, activeId, visible, select, value, updatedLine: localValue });
        setActive(true);

        // @ts-ignore
        ref?.current && ref.current.focus();

        if (select) {
          // @ts-ignore
          ref?.current && ref.current.select();
        }
      } else {
        // console.log('>> app._components.PoemLineInput.useEffect() resetting', { id, visible, value, updatedLine: localValue, ref });
        setActive(false);
        // @ts-ignore
        ref?.current && ref.current.blur();
      }
    } else {
      // console.log('>> app._components.PoemLineInput.useEffect() resetting', { id, activeId, visible, select, value, updatedLine: localValue });
      // @ts-ignore
      ref?.current && ref.current.blur();
      setLocalValue(value || "");
      setActive(false);
    }
  }, [value, id, activeId]);

  return (
    <input
      //@ts-ignore
      ref={ref}
      className="w-full absolute top-0 left-[-0.01rem] px-[0.5rem]"
      onChange={(e: any) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      value={localValue}
    />
  )
}

export default function HaikuPoem({
  user,
  mode,
  haiku,
  popPoem,
  styles,
  altStyles,
  onboardingElement,
  regeneratePoem,
  regenerateImage,
  refresh,
  saveHaiku,
  copyHaiku
}: {
  user: User,
  mode: string,
  haiku: Haiku,
  popPoem?: boolean,
  styles: any[],
  altStyles?: any[],
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

  const [updatedPoem, setUpdatedPoem] = useState<string[]>([]);
  const [editingLine, setEditingLine] = useState<number | undefined>();
  const [aboutToEditLine, setAboutToEditLine] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [select, setSelection] = useState(false);
  const [alert] = useAlert((state: any) => [state.plain]);
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

  const handleClickHaiku = (e: any) => {
    // console.log('>> app._components.HaikuPoem.handleClickHaiku()', { mode, haikuId: haiku?.id, status: haiku.status, popPoem, haiku });
    if (showcaseMode) {
      return refresh && refresh(e);
    }

    if (!canEdit && copyHaiku) {
      trackEvent("haiku-copied", {
        userId: user.id,
        id: haiku.id,
        location: "haiku-poem",
      });

      copyHaiku();
    }
  }

  const startEdit = (inputIndex: number, select?: boolean) => {
    // console.log('>> app._components.HaikuPoem.startEdit()', { inputIndex, select, updatedPoem });
    setEditingLine(inputIndex);
    setSelection(!!select);
  }

  const cancelEdit = () => {
    // console.log('>> app._components.HaikuPoem.cancelEdit()', { haiku, poem: haiku.poem, updatedLines: updatedPoem });
    setUpdatedPoem([]);
    setEditingLine(undefined);
  }

  const finishEdit = async () => {
    // console.log('>> app._components.HaikuPoem.finishEdit()', { haiku, poem: haiku.poem, updatedLines: updatedPoem });
    setEditingLine(undefined);
    setAboutToEditLine(undefined);

    const hasUpdates = (original: string[], updates: string[]): boolean => {
      return original
        .reduce((reduced: boolean, value: string, i: number) => {
          return reduced || typeof (updates[i]) == "string" && updates[i] != value;
        }, false);
    }

    if (!hasUpdates(haiku.poem, updatedPoem)) {
      // no updates to save
      setUpdatedPoem([]);
      return;
    }

    setSaving(true);

    const syllables = haiku.poem
      .map((value: string, i: number) => (updatedPoem[i] || value || "").split(/\s/)
        .map((word: string) => syllable(word))
        .reduce((a: number, v: number) => a + v, 0))
    // console.log('>> app._components.HaikuPoem.finishEdit()', { syllables });

    const updatedOpen = haiku.poem
      .map((value: string, i: number) => {
        if (updatedPoem[i] == "") return "...";
        if (updatedPoem[i] && (updatedPoem[i].includes("...") || updatedPoem[i].includes("…"))) return updatedPoem[i].trim();
        if ((i == 0 || i == 2) && syllables[i] <= 3) return `... ${(updatedPoem[i] || value).trim()} ...`;
        if (i == 1 && syllables[i] <= 5) return `... ${(updatedPoem[i] || value).trim()} ...`;
        return updatedPoem[i] || value;
      });

    try {
      await saveHaiku({
        ...haiku,
        originalPoem: haiku.originalPoem || haiku.poem,
        poem: updatedOpen,
      });
      // console.log('>> app._components.HaikuPoem.finishEdit()', {});
    } catch (error: any) {
      // console.log('>> app._components.HaikuPoem.finishEdit()', { error });
      // assumption that saveHaiku store showed an error alert
    }

    setUpdatedPoem([]);
    setSaving(false);
  }

  const handlePoemLineKeyDown = (e: any, lineNumber: number) => {
    // console.log(">> app._components.HaikuPoem.handlePoemLineKeyDown", { e, key: e.key, lineNumber });
    if (e.key == "Escape") {
      cancelEdit();
    } else if (e.key == "Enter") {
      if (editing) {
        finishEdit();
      }
    } else if (e.key == "Tab") {
      e.preventDefault();
      if (lineNumber == 0 && e.shiftKey) {
        startEdit(haiku.poem.length - 1, true);
      } else if (lineNumber == haiku.poem.length - 1 && !e.shiftKey) {
        startEdit(0, true);
      } else {
        startEdit(lineNumber + (e.shiftKey ? -1 : 1), true);
      }
    } else if (e.key == "ArrowUp" && lineNumber > 0) {
      e.preventDefault();
      startEdit(lineNumber - 1, true);
    } else if (e.key == "ArrowDown" && lineNumber < haiku.poem.length - 1) {
      e.preventDefault();
      startEdit(lineNumber + 1, true);
    } else if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (value: string, lineNumber: number) => {
    // console.log('>> app._components.HaikuPoem.handleInputChange()', { value, lineNumber });
    const update = [...updatedPoem];
    update[lineNumber] = upperCaseFirstLetter(value);
    setUpdatedPoem(update);
  };

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.SidePanel.handleKeyDown", { panelOpened, panelAnimating });
    if (e.key == "Tab" && !editing) {
      e.preventDefault();
      startEdit(0, true);
    }
  };

  useEffect(() => {
    // console.log(">> app._component.SidePanel.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, []);

  return (
    <div className="relative">
      {/* allow editors to click out and finish */}
      <div
        className={`_bg-pink-100 absolute top-0 left-0 w-[100vw] h-[100vh]${saving ? " opacity-50" : ""}`}
        onClick={() => editing && finishEdit()}
      />

      <div className="onboarding-container">
        {onboardingElement && ["poem"].includes(onboardingElement) &&
          <div className="onboarding-focus" />
        }
        {onboardingElement && ["poem-and-poem-actions"].includes(onboardingElement) &&
          <div className="onboarding-focus double" />
        }
        <PopOnClick
          color={haiku.bgColor}
          force={popPoem}
          disabled={editing || canEdit || showcaseMode}
        >
          <div className={`_bg-pink-200 ${canEdit ? "group/edit" : ""} p-2 ${saving ? "animate-pulse" : ""}`}>
            <div
              className="_bg-purple-200 flex flex-col gap-[2rem] _transition-all md:text-[26pt] sm:text-[22pt] text-[18pt]"
              onClick={handleClickHaiku}
              title={showcaseMode ? "Refresh" : "Click to edit"}
              style={{
                cursor: showcaseMode ? "pointer" : ""
              }}
            >
              <PopOnClick
                color={haiku.bgColor}
                force={popPoem}
                disabled={editing || !showcaseMode}
                active={!!(onboardingElement && onboardingElement.includes("poem"))}
              >
                {haiku.poem.map((poemLine: string, i: number) => (
                  <div key={i} className="my-[0.05rem] transition-all">
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
                        onKeyDown={(e: any) => canEdit && handlePoemLineKeyDown(e, i)}
                        onMouseOver={() => canEdit && setAboutToEditLine(i)}
                        onMouseOut={() => canEdit && setAboutToEditLine(undefined)}
                        onMouseDown={(e: any) => canEdit && startEdit(i, false) /* setTimeout(() => startEdit(i, false), 10) */}
                      >
                        {/* set the width while editing */}
                        {editAllowed &&
                          <>
                            <div
                              className="_bg-pink-200 invisible px-[0.5rem] h-[2.2rem] sm:h-[2.6rem] md:h-[3.2rem]"
                            >
                              {/* keep at minimum original width to avoid wierd alignment issues */}
                              <div className="bg-orange-200 h-0 invisible">
                                {upperCaseFirstLetter(saving
                                  ? typeof (updatedPoem[i]) == "string"
                                    ? updatedPoem[i]
                                    : poemLine
                                  : poemLine)}
                              </div>
                              {/* and stretch if updates are longer */}
                              <div className="bg-orange-400 h-0 invisible">
                                {upperCaseFirstLetter(saving
                                  ? typeof (updatedPoem[i]) == "string"
                                    ? updatedPoem[i]
                                    : poemLine
                                  : updatedPoem[i])}
                              </div>
                            </div>

                            {/* input field used in both view and edit modes */}
                            {/* note: https://stackoverflow.com/questions/28269669/css-pseudo-elements-in-react */}
                            <style
                              dangerouslySetInnerHTML={{
                                __html: `
                                  .poem-line-input input {
                                    background: none;
                                    _background: pink; /* for debugging */
                                    caret-color: ${haiku?.color || "black"};
                                    border-radius: 5px;
                                    height: auto;
                                  }
                                  .poem-line-input.poem-line-${/* !editing && */ !saving && !onboarding && aboutToEditLine} input {
                                    outline: none; //1px solid ${haiku?.bgColor || ""}66;
                                    background-color: ${haiku?.bgColor || "white"}44;  
                                  }
                                  ${saving || onboarding ? "" : ".poem-line-input input:focus"} {
                                    outline: none; // 1px solid ${haiku?.bgColor || ""}88;
                                    background-color: ${haiku?.bgColor || "white"}66;
                                  }
                                  .poem-line-input input::selection { 
                                    background: ${haiku.color || "black"}66 
                                  }`
                              }}
                            >
                            </style>
                            <div className={`poem-line-input poem-line-${i}`}>
                              <ControlledInput
                                id={i}
                                activeId={editingLine}
                                value={upperCaseFirstLetter(saving
                                  ? typeof (updatedPoem[i]) == "string"
                                    ? updatedPoem[i]
                                    : upperCaseFirstLetter(poemLine)
                                  : upperCaseFirstLetter(poemLine))}
                                select={select}
                                onChange={(value: string) => handleInputChange(value, i)}
                              />
                            </div>
                          </>
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
              className="_bg-pink-200 relative md:text-[16pt] sm:text-[14pt] text-[12pt] md:mt-[-0.3rem] sm:mt-[-0.2rem] mt-[-0.1rem]"
              style={{
                // background: "pink",
                height: haikudleMode
                  ? ""
                  : showcaseMode
                    ? "" //"8rem" // maybelooks better when pushed up a bit
                    : haiku.theme?.length > maxHaikuTheme
                      ? "2.6rem"
                      : "1.3rem"
              }}
            >
              <div
                className={showcaseMode
                  ? "_bg-yellow-200 fixed bottom-2 right-4 w-max flex flex-row"
                  : "_bg-orange-200 flex flex-row absolute w-max ml-[0.5rem] mt-[0.1rem]"
                }
              >
                <div
                  className="transition-all _bg-pink-400"
                  onClick={(e: any) => !showcaseMode && handleClickHaiku(e)}
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
                        onClick={(e: any) => {
                          e.preventDefault();
                          if (editAllowed) {
                            editing
                              ? finishEdit()
                              : canEdit
                                ? startEdit(0, true)
                                : undefined;
                          }
                        }}
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
                        {!user?.isAdmin && (user.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
                          <span title="Exceeded daily limit: try again later">
                            <StyledLayers styles={altStyles || []}>
                              <GenerateIcon sizeOverwrite={`
                                h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 
                                ${onboardingElement == "poem-actions" ? "opacity-100" : "opacity-60"}
                              `} />
                            </StyledLayers>
                          </span>
                        }
                        {(user?.isAdmin || (user.usage[dateCode]?.haikusRegenerated || 0) < USAGE_LIMIT.DAILY_REGENERATE_HAIKU) &&
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
