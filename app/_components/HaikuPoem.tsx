'use client'

import { capitalize, upperCaseFirstLetter } from "@desmat/utils/format";
import moment from "moment";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaArrowsAlt, FaEdit } from "react-icons/fa";
import { TbReload } from "react-icons/tb";
import useAlert from "@/app/_hooks/alert";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import { USAGE_LIMIT } from "@/types/Usage";
import { User } from "@/types/User";
import trackEvent from "@/utils/trackEvent";
import PopOnClick from "./PopOnClick";
import { StyledLayers } from "./StyledLayers";
import { GenerateIcon } from "./nav/GenerateInput";

let syllable: any;
import("syllable").then((s: any) => syllable = s.syllable);

const formatHaikuTitleAndAuthor = (haiku: Haiku, mode?: string) => {
  const title = haiku?.title ?? haiku?.theme;
  return [
    title && !title.toLowerCase().startsWith("art by") && !title.toLowerCase().startsWith("by") && !title.startsWith("-") && !title.startsWith("—") && !title.startsWith("—") && !title.startsWith('"')
      ? `"${capitalize(title)}"`
      : title
        ? `${title}`
        : undefined,
    `${mode == "haikudle" ? "haikudle.ai" : "haikugenius.ai"}/${haiku?.id}`
  ];
}

export const formatHaikuText = (haiku: Haiku, mode?: string) => {
  const haikuTitleAndAuthor = formatHaikuTitleAndAuthor(haiku, mode);

  return haiku?.poem
    .map((value: string, i: number) => upperCaseFirstLetter(value))
    .join("\n")
    + `\n${haikuTitleAndAuthor.join(", ")}\n`;
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
  onChange: any,
}) {
  const maxLength = 100; // kinda unreasonable for a haiku line but won't break the UI
  const [active, setActive] = useState(false);
  const ref = useRef();
  // console.log('app._components.PoemLineInput.render()', { id, activeId, select, value });

  // https://stackoverflow.com/questions/6139107/programmatically-select-text-in-a-contenteditable-html-element
  function selectElementContents(el: any) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    // @ts-ignore
    sel.removeAllRanges();
    // @ts-ignore
    sel.addRange(range);
  }

  // https://codepen.io/feketegy/pen/RwGBgyq
  function getCaret(el: any) {
    let caretAt = 0;
    const sel = window.getSelection();

    if (sel?.rangeCount == 0) { return caretAt; }

    // @ts-ignore
    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(range.endContainer, range.endOffset);
    caretAt = preRange.toString().length;

    return caretAt;
  }

  function setCaret(el: any, offset: number) {
    let sel = window.getSelection();
    let range = document.createRange();
    let start = el.childNodes[0];
    if (!start) return;

    range.setStart(start, offset);
    range.collapse(true);
    // @ts-ignore
    sel.removeAllRanges();
    // @ts-ignore
    sel.addRange(range);
  }

  function handleInput(e: any) {
    const caret = getCaret(ref.current) || 0;
    let val = e.target.innerText.replaceAll(/\n/g, ""); // remove newlines

    if (val.length > maxLength) {
      // somehow handleKeyDown didn't catch (ex: pasted long text)
      val = val.slice(0, maxLength);
      e.target.innerText = val;
      setCaret(ref.current, maxLength);
      return onChange(val);
    }

    e.target.innerText = val;
    setCaret(ref.current, Math.min(caret, maxLength));
    return onChange(val);
  }

  function handleKeyDown(e: any) {
    // console.log('app._components.PoemLineInput.handleKeyDown()', { e, key: e.key, selection: window.getSelection(), ref });
    const val = e.target.innerText;
    if (["Delete", "Backspace", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) || e.metaKey) {
      // always allow
      return true;
    }

    if (val.length >= maxLength && window.getSelection()?.type != "Range") {
      e.preventDefault();
      return false;
    }
  }

  useEffect(() => {
    // console.log('app._components.PoemLineInput.useEffect()', { id, activeId, visible, ref, value, updatedLine: localValue });

    if (typeof (activeId) == "number") {
      if (activeId == id && typeof (value) == "string" && !active) {
        // console.log('app._components.PoemLineInput.useEffect() setFocus', { id, activeId, visible, select, value, updatedLine: localValue });
        setActive(true);

        // https://stackoverflow.com/questions/2388164/set-focus-on-div-contenteditable-element      
        setTimeout(() => {
          // @ts-ignore
          ref.current.focus();
        }, 0);

        if (select) {
          selectElementContents(ref.current);
        }
      } else {
        // console.log('app._components.PoemLineInput.useEffect() resetting', { id, visible, value, updatedLine: localValue, ref });
        setActive(false);
        // ref?.current && ref.current.blur();
      }
    } else {
      setActive(false);
    }
  }, [value, id, activeId]);

  return (
    <div
      //@ts-ignore
      ref={ref}
      contentEditable={active}
      suppressContentEditableWarning={true}
      className={className || "_bg-pink-200 w-full _absolute top-0 left-[-0.01rem]"}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
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
  copyHaiku,
  switchMode,
  updateTitle,
  aligning,
  setAligning,
}: {
  user?: User,
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
  switchMode?: any,
  updateTitle?: any,
  aligning?: boolean,
  setAligning?: any,
}) {
  // console.log('app._components.HaikuPoem.render()', { mode, haikuId: haiku?.id, status: haiku?.status, popPoem, haiku });
  const showcaseMode = mode == "showcase";
  const onboarding = typeof (onboardingElement) == "string"
  const maxHaikuTheme = showcaseMode ? 28 : 18;
  const dateCode = moment().format("YYYYMMDD");

  const [updatedPoem, setUpdatedPoem] = useState<string[]>([]);
  const [editingLine, setEditingLine] = useState<number | undefined>();
  const [aboutToEditLine, setAboutToEditLine] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [select, setSelection] = useState(false);
  const editing = typeof (editingLine) == "number";
  const aboutToEdit = typeof (aboutToEditLine) == "number";
  const switchModeAllowed = !!switchMode;
  const canSwitchMode = switchModeAllowed && !editing && !saving && process.env.EXPERIENCE_MODE != "haikudle";
  const copyAllowed = !!copyHaiku && !switchModeAllowed;
  const canCopy = copyAllowed && !editing && !saving;
  const editAllowed = !showcaseMode && saveHaiku && (user?.isAdmin || haiku?.createdBy == user?.id);
  const canClickEdit = editAllowed && !saving && !onboarding && !aligning;
  const canEdit = editAllowed && user?.isAdmin && !saving && !onboarding && !aligning;
  const alignAllowed = !showcaseMode && setAligning && (user?.isAdmin || haiku?.createdBy == user?.id);
  const canAlign = alignAllowed && !editing;
  const regeneratePoemAllowed = regeneratePoem && (user?.isAdmin || haiku?.createdBy == user?.id) && regeneratePoem;
  const regenerateImageAllowed = regenerateImage && (user?.isAdmin || haiku?.createdBy == user?.id) && regenerateImage;
  const canRegeneratePoem = regeneratePoemAllowed && !editing && !saving && !aligning;
  const canRegenerateImage = regenerateImageAllowed && !editing && !saving && !aligning;
  const canRefresh = !!refresh;
  // console.log('app._components.HaikuPage.HaikuPoem.render()', { editing, showcaseMode, canCopy, canSwitchMode });

  const handleClickHaiku = (e: any) => {
    // console.log('app._components.HaikuPoem.handleClickHaiku()', { mode, haikuId: haiku?.id, status: haiku?.status, popPoem, haiku });
    if (aligning) {
      return setAligning && setAligning(false);
    }

    if (showcaseMode && canRefresh) {
      return refresh(e);
    }

    if (canCopy) {
      return copyHaiku();
    }

    if (canSwitchMode) {
      trackEvent("switched-mode", {
        userId: user?.id,
        id: haiku?.id,
      });

      return switchMode(showcaseMode ? "haiku" : "showcase");
    }

  }

  const startEdit = (inputIndex: number, select?: boolean) => {
    // console.log('app._components.HaikuPoem.startEdit()', { inputIndex, select, updatedPoem });
    setEditingLine(inputIndex);
    setSelection(!!select);
  }

  const cancelEdit = () => {
    // console.log('app._components.HaikuPoem.cancelEdit()', { haiku, poem: haiku?.poem, updatedLines: updatedPoem });
    setUpdatedPoem([]);
    setEditingLine(undefined);
  }

  const finishEdit = async () => {
    // console.log('app._components.HaikuPoem.finishEdit()', { haiku, poem: haiku?.poem, updatedLines: updatedPoem });
    setEditingLine(undefined);
    setAboutToEditLine(undefined);

    const hasUpdates = (original: string[], updates: string[]): boolean => {
      return original
        .reduce((reduced: boolean, value: string, i: number) => {
          return reduced || typeof (updates[i]) == "string" && updates[i] != value;
        }, false);
    }

    if (!hasUpdates(haiku?.poem, updatedPoem)) {
      // no updates to save
      setUpdatedPoem([]);
      return;
    }

    setSaving(true);

    const syllables = haiku?.poem
      .map((value: string, i: number) => (updatedPoem[i] || value || "").split(/\s/)
        .map((word: string) => syllable(word))
        .reduce((a: number, v: number) => a + v, 0))
    // console.log('app._components.HaikuPoem.finishEdit()', { syllables });

    const updatedOpen = haiku?.poem
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
        originalPoem: haiku?.originalPoem || haiku?.poem,
        poem: updatedOpen,
      });
      // console.log('app._components.HaikuPoem.finishEdit()', {});
    } catch (error: any) {
      // console.log('app._components.HaikuPoem.finishEdit()', { error });
      // assumption that saveHaiku store showed an error alert
    }

    setUpdatedPoem([]);
    setSaving(false);
  }

  const handlePoemLineKeyDown = (e: any, lineNumber: number) => {
    // console.log("app._components.HaikuPoem.handlePoemLineKeyDown", { e, key: e.key, lineNumber });
    if (e.key == "Escape") {
      cancelEdit();
    } else if (e.key == "Enter") {
      if (editing) {
        finishEdit();
      }
    } else if (e.key == "Tab") {
      e.preventDefault();
      if (lineNumber == 0 && e.shiftKey) {
        startEdit(haiku?.poem.length - 1, true);
      } else if (lineNumber == haiku?.poem.length - 1 && !e.shiftKey) {
        startEdit(0, true);
      } else {
        startEdit(lineNumber + (e.shiftKey ? -1 : 1), true);
      }
    } else if (e.key == "ArrowUp" && lineNumber > 0) {
      e.preventDefault();
      startEdit(lineNumber - 1, true);
    } else if (e.key == "ArrowDown" && lineNumber < haiku?.poem.length - 1) {
      e.preventDefault();
      startEdit(lineNumber + 1, true);
    } else if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (value: string, lineNumber: number) => {
    // console.log('app._components.HaikuPoem.handleInputChange()', { value, lineNumber });
    const update = [...updatedPoem];
    update[lineNumber] = upperCaseFirstLetter(value);
    setUpdatedPoem(update);
  };

  const handleKeyDown = (e: any) => {
    // console.log("app._component.HaikuPoem.handleKeyDown", { e, key: e.key, editing, aligning });
    if (["Escape", "Enter"].includes(e.key) && aligning) {
      e.preventDefault();
      setAligning && setAligning(false);
    } else if (e.key == "Tab" && !editing) {
      e.preventDefault();
      startEdit(e.shiftKey ? haiku?.poem.length - 1 : 0, true);
    }
  };

  useEffect(() => {
    // console.log("app._component.SidePanel.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, [editing, aligning]);

  return (
    <div className="relative">
      {/* allow editors to click out and finish */}
      {!showcaseMode && (editing || aligning) &&
        <div
          className={`_bg-pink-400 fixed top-0 left-0 w-full h-full ${saving || editing || aligning ? " opacity-50" : "opacity-0"}`}
          onClick={() => editing && finishEdit() || aligning && setAligning(false)}
        />
      }

      {/* note: https://stackoverflow.com/questions/28269669/css-pseudo-elements-in-react */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .poem-line-input div {
              background: none;
              _background: pink; /* for debugging */
              caret-color: ${haiku?.color || "#000000"};
              border-radius: 0.4rem;
              height: auto;
              padding: 0.15rem 0.5rem;
              outline: 1px solid ${haiku?.bgColor || ""}00;
            }
            .poem-line-input.poem-line-${/* !editing && */ !saving && !onboarding && aboutToEditLine} div {
              outline: 1px solid ${haiku?.bgColor || ""}66;
              background-color: ${haiku?.bgColor || "#ffffff"}44;  
            }
            .poem-line-input div:focus {
              outline: 1px solid ${haiku?.bgColor || ""}66;
              background: ${haiku?.bgColor || "#ffffff"}66;
            }
            .poem-line-input div::selection, .poem-title span::selection {
              background: ${haiku?.color || "#000000"}66;
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
          color={haiku?.bgColor}
          force={popPoem}
          disabled={editing || canEdit || aligning || showcaseMode || (!canEdit && !canSwitchMode)}
        >
          <div
            className={`_bg-pink-200 px-[1.5rem] ${canEdit ? "group" : ""} ${saving ? "animate-pulse" : ""}`}
            style={{
              cursor: showcaseMode ? "pointer" : "",
              fontSize,
              maxWidth: "1000px",
              minWidth: "200px",
            }}
          >
            <div
              className="_bg-purple-200 flex flex-col _transition-all md:text-[26pt] sm:text-[22pt] text-[18pt]"
              onClick={handleClickHaiku}
              title={aligning
                ? "Click to finish aligning"
                : showcaseMode && canRefresh
                  ? "Refresh"
                  : canEdit
                    ? "Click to edit"
                    : canCopy
                      ? "Click to copy haiku poem"
                      : showcaseMode
                        ? "Click to switch to edit mode"
                        : canSwitchMode
                          ? "Click to switch to showcase mode" : ""}
              style={{
                cursor: showcaseMode ? "pointer" : "",
                fontSize,
              }}
            >
              <PopOnClick
                color={haiku?.bgColor}
                force={popPoem}
                disabled={editing || aligning || !showcaseMode || (!canCopy && !canSwitchMode)}
                active={!!(onboardingElement && onboardingElement.includes("poem"))}
              >
                {haiku?.poem.map((poemLine: string, i: number) => (
                  <StyledLayers
                    key={i}
                    styles={
                      aboutToEdit || editing || saving
                        ? styles.slice(0, 1)
                        : onboardingElement && !onboardingElement.includes("poem")
                          ? styles.slice(0, 2)
                          : saving
                            ? styles.slice(0, 3)
                            : styles
                    }>
                    <div
                      className="relative m-[0rem] _transition-all"
                      onKeyDown={(e: any) => (canEdit || editing) && handlePoemLineKeyDown(e, i)}
                      onMouseOver={() => canEdit && setAboutToEditLine(i)}
                      onMouseOut={() => canEdit && setAboutToEditLine(undefined)}
                      onMouseDown={(e: any) => canEdit && startEdit(i, false) /* setTimeout(() => startEdit(i, false), 10) */}
                    >
                      {/* set the width while editing */}
                      <div className={`poem-line-input poem-line-${i} _bg-orange-400 _opacity-50 ${showcaseMode || canSwitchMode ? "cursor-pointer" : !canEdit && canCopy ? "cursor-copy" : ""} ${showcaseMode ? "md:my-[0.8rem] sm:my-[0.6rem] my-[0.3rem] md:leading-[3.5rem] sm:leading-[2.6rem] leading-[2rem]" : ""}`}>
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
                    </div>
                  </StyledLayers>
                ))}
              </PopOnClick>
            </div>

            <div
              className="_bg-red-400 relative md:text-[16pt] sm:text-[14pt] text-[12pt]"
              style={{
                // background: "pink",
                fontSize: showcaseMode ? "50%" : "60%",
              }}
            >
              <div
                className={showcaseMode
                  ? "_bg-yellow-200 fixed w-max right-[1.5rem] bottom-[1rem] flex flex-row"
                  : "_bg-orange-200 flex flex-row w-max ml-[0.5rem] mt-[-0.2rem] md:mt-[0.2rem] leading-5"
                }
                style={{
                  fontSize,
                  // display: "none",
                }}
              >
                <div
                  className="poem-title relative _transition-all _bg-pink-400"
                >
                  <StyledLayers
                    className={showcaseMode
                      ? "md:leading-[2rem] sm:leading-[1.8rem] leading-[1.4rem]"
                      : "opacity-70 hover:opacity-100 md:leading-[1.75rem] sm:leading-[1.5rem] leading-[1rem]"}
                    styles={styles.slice(0, 3)}
                  >
                    <span
                      onClick={() => !showcaseMode && updateTitle && updateTitle()}
                      style={{
                        cursor: updateTitle || canCopy
                          ? "pointer"
                          : ""
                      }}
                      title={
                        updateTitle
                          ? "Update title" :
                          canCopy
                            ? "Copy to clipboard"
                            : ""
                      }

                      dangerouslySetInnerHTML={{
                        __html: `${formatHaikuTitleAndAuthor(haiku, mode).join((haiku?.title?.length ?? haiku?.theme?.length) > maxHaikuTheme
                          ? "<br/>"
                          : ", ")}`
                      }}
                    />
                  </StyledLayers>

                  {!showcaseMode && (copyAllowed || editAllowed || regeneratePoemAllowed) &&
                    <div
                      className="_bg-blue-200 absolute"
                      style={{
                        top: "50%",
                        right: 0,
                        transform: "translate(calc(100% + 0.5rem), calc(-50% - 0.1rem))"
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      <div
                        className={`
                          onboarding-container group/actions _bg-yellow-200 flex flex-row gap-[0.35rem] 
                          
                          ${editing || aligning ? "" : "opacity-60"} group-hover:opacity-100 transition-opacity`}
                        onClick={(e) => e.preventDefault()}
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
                            className={`${!saving && !aligning ? "cursor-pointer" : "cursor-default"}`}
                            title="Edit this haiku"
                            onClick={(e: any) => {
                              e.preventDefault();
                              if (editAllowed) {
                                editing
                                  ? finishEdit()
                                  : canClickEdit
                                    ? startEdit(0, true)
                                    : undefined;
                              }
                            }}
                          >
                            <StyledLayers styles={altStyles || []}>
                              <PopOnClick>
                                <FaEdit className={`
                            h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 
                            ${editing || onboardingElement == "poem-actions"
                                    ? "opacity-100"
                                    : saving || !canClickEdit
                                      ? "opacity-60"
                                      : canClickEdit
                                        ? "opacity-100"
                                        : ""
                                  }
                          `} />
                              </PopOnClick>
                            </StyledLayers>
                          </Link>
                        }
                        {alignAllowed &&
                          <Link
                            href="#"
                            className={canAlign ? "cursor-pointer" : "cursor-default"}
                            title="Align this haiku"
                            onClick={(e: any) => {
                              e.preventDefault();
                              if (alignAllowed) {
                                aligning
                                  ? setAligning && setAligning(false)
                                  : canAlign
                                    ? setAligning && setAligning(true)
                                    : undefined;
                              }
                            }}
                          >
                            <StyledLayers styles={altStyles || []}>
                              <PopOnClick>
                                <FaArrowsAlt className={`
                                  h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 
                                  ${aligning || onboardingElement == "poem-actions"
                                    ? "opacity-100"
                                    : canAlign
                                      ? "opacity-100"
                                      : "opacity-60"
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
                                      onClick={canRegeneratePoem && regeneratePoem}
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
                            {!user?.isAdmin && (user?.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
                              <span title="Exceeded daily limit: try again later">
                                <StyledLayers styles={altStyles || []}>
                                  <TbReload className={`
                                h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 
                                ${onboardingElement == "poem-actions" ? "opacity-100" : "opacity-60"}
                              `} />
                                </StyledLayers>
                              </span>
                            }
                            {(user?.isAdmin || (user?.usage[dateCode]?.haikusRegenerated || 0) < USAGE_LIMIT.DAILY_REGENERATE_HAIKU) &&
                              <span title="Regenerate this haiku's art with the same theme">
                                <StyledLayers styles={altStyles || []}>
                                  <PopOnClick>
                                    <TbReload
                                      onClick={() => canRegenerateImage && regenerateImage()}
                                      className={`
                                    h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 
                                    ${canRegenerateImage || onboardingElement == "poem-actions" ? "cursor-pointer opacity-100" : "opacity-60"} 
                                `}
                                    />
                                  </PopOnClick>
                                </StyledLayers>
                              </span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </PopOnClick >
      </div>
    </div >
  )
}
