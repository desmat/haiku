'use client'

import moment from "moment";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { syllable } from "syllable";
import { FaEdit, FaMagic } from "react-icons/fa";
import { TbReload } from "react-icons/tb";
import { useDebouncedCallback } from "use-debounce";
import useAlert from "@/app/_hooks/alert";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";
import { defaultPresetLayout, presetLayouts } from "@/types/Layout";
import { USAGE_LIMIT } from "@/types/Usage";
import { User } from "@/types/User";
import { capitalize, upperCaseFirstLetter } from "@/utils/format";
import trackEvent from "@/utils/trackEvent";
import PopOnClick from "./PopOnClick";
import { StyledLayers } from "./StyledLayers";
import { GenerateIcon } from "./nav/GenerateInput";

const formatHaikuTitleAndAuthor = (haiku: Haiku, mode?: string) => {
  return [
    `"${capitalize(haiku.theme)}", `,
    `limericks.ai/${haiku.id}`
  ];
}

export const formatHaikuText = (haiku: Haiku, mode?: string) => {
  const haikuTitleAndAuthor = formatHaikuTitleAndAuthor(haiku, mode);

  return haiku?.poem
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
  onChange: any,
}) {
  const maxLength = 100; // kinda unreasonable for a haiku line but won't break the UI
  const [active, setActive] = useState(false);
  const ref = useRef();
  // console.log('>> app._components.PoemLineInput.render()', { id, activeId, select, value });

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
    // console.log('>> app._components.PoemLineInput.handleKeyDown()', { e, key: e.key, selection: window.getSelection(), ref });
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
    // console.log('>> app._components.PoemLineInput.useEffect()', { id, activeId, visible, ref, value, updatedLine: localValue });

    if (typeof (activeId) == "number") {
      if (activeId == id && typeof (value) == "string" && !active) {
        // console.log('>> app._components.PoemLineInput.useEffect() setFocus', { id, activeId, visible, select, value, updatedLine: localValue });
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
        // console.log('>> app._components.PoemLineInput.useEffect() resetting', { id, visible, value, updatedLine: localValue, ref });
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
  version,
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
  regenerating,
  updateLayout,
}: {
  user?: User,
  mode: ExperienceMode,
  haiku: Haiku,
  version?: number,
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
  regenerating?: boolean,
  updateLayout?: any,
}) {
  // console.log('>> app._components.HaikuPoem.render()', { mode, haikuId: haiku?.id, version, status: haiku?.status, popPoem, haiku });
  const showcaseMode = mode == "showcase";
  const onboarding = typeof (onboardingElement) == "string"
  const maxHaikuTheme = showcaseMode ? 32 : 18;
  const dateCode = moment().format("YYYYMMDD");
  const layout = haiku?.layout?.custom || presetLayouts[defaultPresetLayout];

  const [updatedPoem, setUpdatedPoem] = useState<string[]>([]);
  const [editingLine, setEditingLine] = useState<number | undefined>();
  const [aboutToEditLine, setAboutToEditLine] = useState<number | undefined>();
  const [_saving, setSaving] = useState(false);
  const saving = _saving || regenerating;
  const [select, setSelection] = useState(false);
  const editing = typeof (editingLine) == "number";
  const aboutToEdit = typeof (aboutToEditLine) == "number";
  const switchModeAllowed = !!switchMode;
  const canSwitchMode = switchModeAllowed && !editing && !saving && process.env.EXPERIENCE_MODE != "haikudle";
  const copyAllowed = !!copyHaiku && !switchModeAllowed;
  const canCopy = copyAllowed && !editing && !saving;

  const editAllowed = false; // !showcaseMode && saveHaiku && (user?.isAdmin || haiku?.createdBy == user?.id) && saveHaiku;
  const canClickEdit = false; // editAllowed && !saving && !onboarding;
  const canEdit = false; //editAllowed && user?.isAdmin && !saving && !onboarding;

  const quickEditAllowed = haiku?.createdBy == user?.id || user?.isAdmin || haiku?.isDemo;
  const canClickQuickEdit = quickEditAllowed && !showcaseMode;
  let [quickEditing, setQuickEditing] = useState(false);
  const [lastVersion, setLastVersion] = useState<number | undefined>(haiku?.version);

  const updateLayoutAllowed = !!updateLayout && (user?.isAdmin || haiku?.createdBy && haiku?.createdBy == user?.id);
  const canUpdateLayout = updateLayoutAllowed && !editing && !saving && process.env.EXPERIENCE_MODE != "haikudle";

  const regeneratePoemAllowed = regeneratePoem && (user?.isAdmin || haiku?.createdBy == user?.id) && regeneratePoem;
  const regenerateImageAllowed = regenerateImage && (user?.isAdmin || haiku?.createdBy == user?.id) && regenerateImage;
  const canRegeneratePoem = regeneratePoemAllowed && !editing && !saving;
  const canRefresh = !!refresh;
  const canRegenerateImage = regenerateImageAllowed && !editing && !saving;
  // console.log('>> app._components.HaikuPage.HaikuPoem.render()', { editing, showcaseMode, canCopy, canSwitchMode });

  let [displayPoem, setDisplayPoem] = useState<string[][]>(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
  let [editPoem, setEditPoem] = useState<string[][]>(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
  let [currentPoem, setCurrentPoem] = useState<string[][]>(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
  let [lastPoem, setLastPoem] = useState<string[][]>();
  let refs = [
    [useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(),],
    [useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(),],
    [useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(),],
    [useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(),],
    [useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(), useRef(),],
  ]
  const longPressTimerRef = useRef();
  let [killingWords, setKillingWords] = useState(false);
  let [mouseDown, setMouseDown] = useState(false);
  let [firstWordPointerEnter, setFirstWordPointerEnter] = useState<number[]>();

  const handleLongPressHaiku = (e: any) => {
    // console.log('>> app._components.HaikuPoem.handleLongPressHaiku()', { mode, haikuId: haiku?.id, status: haiku?.status, popPoem, haiku });

    // TODO

    // e.preventDefault();
    setQuickEditing(true);

    longPressTimerRef.current = undefined;
  }

  const handleClickHaiku = (e: any) => {
    // console.log('>> app._components.HaikuPoem.handleClickHaiku()', { longPressTimerRef });
    if (longPressTimerRef.current) {
      return handleLongPressHaiku(e);
    }

    // return;

    console.log('>> app._components.HaikuPoem.handleClickHaiku()', { mode, haikuId: haiku?.id, status: haiku?.status, popPoem, haiku });

    if (quickEditing) return;

    // if (showcaseMode && canRefresh) {
    //   return refresh(e);
    // }

    if (canCopy) {
      trackEvent("haiku-copied", {
        userId: user?.id,
        id: haiku?.id,
        location: "haiku-poem",
      });

      return copyHaiku();
    }

    if (canSwitchMode) {
      trackEvent("switched-mode", {
        userId: user?.id,
        id: haiku?.id,
      });

      return switchMode(showcaseMode ? "" : "showcase");
    }
  }

  const startEdit = (inputIndex: number, select?: boolean) => {
    // console.log('>> app._components.HaikuPoem.startEdit()', { inputIndex, select, updatedPoem });
    setEditingLine(inputIndex);
    setSelection(!!select);
  }

  const cancelEdit = () => {
    // console.log('>> app._components.HaikuPoem.cancelEdit()', { haiku, poem: haiku?.poem, updatedLines: updatedPoem });
    setUpdatedPoem([]);
    setEditingLine(undefined);
  }

  const finishEdit = async () => {
    // console.log('>> app._components.HaikuPoem.finishEdit()', { haiku, poem: haiku?.poem, updatedLines: updatedPoem });
    setEditingLine(undefined);
    setAboutToEditLine(undefined);

    const hasUpdates = (original: string[], updates: string[]): boolean => {
      // console.log('>> app._components.HaikuPoem.finishEdit.hasUpdates()', { original, updates });
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
    // console.log('>> app._components.HaikuPoem.finishEdit()', { syllables });

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
    // console.log('>> app._components.HaikuPoem.handleInputChange()', { value, lineNumber });
    const update = [...updatedPoem];
    update[lineNumber] = upperCaseFirstLetter(value);
    setUpdatedPoem(update);
  };

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._component.HaikuPoem.handleKeyDown", { e, key: e.key });
    if (e.key == "Escape") {
      if (editing) {
        cancelEdit();
      } else if (quickEditing) {
        setQuickEditing(false);
      }
    } else if (e.key == "Enter") {
      if (editing) {
        finishEdit();
      } if (quickEditing) {
        setQuickEditing(false);
      }
    } else if (e.key == "Tab" && !editing) {
      e.preventDefault();
      startEdit(e.shiftKey ? haiku?.poem.length - 1 : 0, true);
    }
  };

  const debouncedSave = useDebouncedCallback(
    () => {
      setLastPoem(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
      // join the words then consolidate the possible "... ..." repetition
      const updatePoemRequest = editPoem.map((line: string[]) => line.join(" ").replaceAll(/(\.\.\.\s?)+/g, "..."));
      setSaving(true);

      saveHaiku({
        ...haiku,
        poem: updatePoemRequest,
      }).then((haiku: Haiku) => {
        setDisplayPoem(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
        setEditPoem(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
        setCurrentPoem(haiku && haiku.poem.map((line: string) => line.split(/\s+/).map((word: string) => word)));
        setSaving(false);
      });
    },
    2000
  );

  // console.log(">> app._component.HaikuPoem render", { displayPoem, editPoem });

  const debouncedSetPoemStates = useDebouncedCallback(
    () => {
      setDisplayPoem(displayPoem.map((line: string[]) => [...line]));
      setEditPoem(editPoem.map((line: string[]) => [...line]));
    },
    10
  )

  const killWords = async (words: any[]) => {
    // console.log(">> app._component.HaikuPoem.killWords", { words });

    if (!saving) { //!savingLine[lineNum]) {
      let someToKill = false;
      words.forEach((word: any) => {
        const [lineNum, wordNum] = word;
        if (displayPoem[lineNum][wordNum]) {
          displayPoem[lineNum][wordNum] = "";
          editPoem[lineNum][wordNum] = "...";
          someToKill = true;
        }
      })

      if (someToKill) {
        debouncedSetPoemStates();
      }

      debouncedSave();
    }
    // console.log(">> app._component.HaikuPoem.killWords", { displayPoem });
  };

  const handleMouseDownWord = async (e: any, lineNum: number, wordNum: number) => {
    if (!canClickQuickEdit) return;

    // @ts-ignore
    longPressTimerRef.current = setTimeout(() => {
      handlePointerEnterWord(e, lineNum, wordNum);
    }, 250);

    if (!quickEditing) return;
    // console.log(">> app._component.HaikuPoem.handleMouseDownWord", { e, lineNum, wordNum });

    mouseDown = true;
    setMouseDown(mouseDown);

    // start killing right away
    handleMouseMoveWord(e, lineNum, wordNum);
  };

  const handleMouseUp = async (e: any, lineNum?: number, wordNum?: number) => {
    longPressTimerRef.current && clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = undefined;

    if (!quickEditing) return;
    // console.log(">> app._component.HaikuPoem.handleMouseUp", { e });

    mouseDown = false;
    setMouseDown(mouseDown);
    killingWords = false;
    setKillingWords(killingWords);

    // TODO either bring this back or allow single-tap for showcase mode
    // if (typeof (lineNum) == "number" && typeof (wordNum) == "number") {
    //   killWords([[lineNum, wordNum]]);
    // }
  };

  const handleMouseMoveWord = async (e: any, lineNum: number, wordNum: number) => {
    if (!quickEditing) return;
    // console.log(">> app._component.HaikuPoem.handleMouseMoveWord", { e, lineNum, wordNum });

    if (mouseDown) {
      if (!killingWords) {
        killingWords = true;
        setKillingWords(killingWords);
      }

      killWords([[lineNum, wordNum]]);
    }
  };

  let [refBoundingClientRects, setRefBoundingClientRects] = useState<any[][]>();
  let [lastTouchXY, setLastTouchXY] = useState<[number, number]>();

  const debouncedSetLastTouchXY = useDebouncedCallback(
    () => {
      setLastTouchXY(lastTouchXY);
    },
    100
  )

  const handlePointerEnterWord = async (e: any, lineNum: number, wordNum: number) => {
    // console.log(">> app._component.HaikuPoem.handlePointerEnterWord", { quickEditing, mouseDown, killingWords });
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined;

      quickEditing = true;
      setQuickEditing(quickEditing);
      handleMouseDownWord(e, lineNum, wordNum);
    }

    if (!quickEditing) return;

    // console.log(">> app._component.HaikuPoem.handlePointerEnterWord", { e, lineNum, wordNum });

    refBoundingClientRects = refs
      .map((line: any[]) => line
        .map((ref: any) => ref?.current && ref.current.getBoundingClientRect()).filter(Boolean)
      );
    setRefBoundingClientRects(refBoundingClientRects);
    firstWordPointerEnter = [lineNum, wordNum];
    setFirstWordPointerEnter(firstWordPointerEnter);
    // console.log(">> app._component.HaikuPoem.handlePointerEnterWord", { refBoundingClientRects, firstWordPointerEnter });

    lastTouchXY = [e.clientX, e.clientY];
    // setLastTouchXY(lastTouchXY);
    debouncedSetLastTouchXY();
  }

  const findMovedOver = (e: any) => {
    // var touch = e.originalEvent?.touches && e.originalEvent?.touches[0] || e.originalEvent?.changedTouches && e.originalEvent?.changedTouches[0];
    const touch = e.touches[0];
    const touchX = touch.pageX;
    const touchY = touch.pageY;

    const lastTouchX = lastTouchXY && lastTouchXY.length >= 1 && lastTouchXY[0] || touchX;
    const lastTouchY = lastTouchXY && lastTouchXY.length >= 2 && lastTouchXY[1] || touchY;

    lastTouchXY = [touchX, touchY];
    debouncedSetLastTouchXY();
    // setLastTouchXY(lastTouchXY);

    // console.log(">> app._component.HaikuPoem.findMovedOver", { touchX, touchY, lastTouchX, lastTouchY, refBoundingClientRects });

    const overWords = refBoundingClientRects && refBoundingClientRects
      .map((line: any[], i: number) => line
        .map((rects: any, j: number) => {
          const { x, y, width, height } = rects;

          if (touchX >= x && lastTouchX <= x + width
            && touchY >= y && lastTouchY <= y + height
          ) {
            return [i, j]
          }
        }))
      .flat()
      .filter(Boolean);

    const overWord = overWords && overWords[0];
    // console.log("app._component.HaikuPoem.findMovedOver", { x: touchX, y: touchY, overWord, overWords });

    if (overWord && overWord.length >= 2 && displayPoem[overWord[0]][overWord[1]]) {
      killWords(overWords);
      // debouncedKillWords(overWords);
    }
  }

  const debouncedTouchMoved = useDebouncedCallback(
    (e: any) => {
      // make sure the first move kills the first word right away
      if (firstWordPointerEnter) {
        killWords([firstWordPointerEnter])
        firstWordPointerEnter = undefined;
        setFirstWordPointerEnter(firstWordPointerEnter);
      }

      findMovedOver(e);
    },
    1
  );

  const handleTouchMove = async (e: any) => {
    // console.log("app._component.HaikuPoem.handleTouchMove", { quickEditing, mouseDown, killingWords });
    if (!quickEditing) return;
    // console.log("app._component.HaikuPoem.handleTouchMove", { e });
    debouncedTouchMoved(e);
    // findMovedOver(e);

    if (!killingWords) {
      killingWords = true;
      setKillingWords(killingWords);
    }
  }

  const PoemButtons = () => {
    return (
      <div
        className="poem-buttons onboarding-container group/actions _bg-yellow-200 flex flex-row md:gap-3 gap-[0.5rem]"
        onClick={(e: any) => e.preventDefault()}
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
            className={`${!saving ? "cursor-pointer" : "cursor-default"} sm:mt-[-0.15rem] mt-[-0.1rem]`}
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
            h-[1.2rem] w-[1.2rem] md:h-6 md:w-6 
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
        {quickEditAllowed &&
          <div
            className={`${!saving ? "cursor-pointer" : "cursor-default"} md:mt-[0.05rem] mt-[0.03rem]`}
            title="Edit this haiku"
            onClick={(e: any) => {
              e.preventDefault();
              if (canClickQuickEdit) {
                setQuickEditing(!quickEditing);
              }
            }}
          >
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <FaMagic className={`
                  h-4 w-4 md:h-5 md:w-5 
                  ${quickEditing ? "animate-pulse" : ""}
                  ${editing || onboardingElement == "poem-actions"
                    ? "opacity-100"
                    : saving || !canClickQuickEdit
                      ? "opacity-60"
                      : canClickQuickEdit
                        ? "opacity-100"
                        : ""
                  }
                `} />
              </PopOnClick>
            </StyledLayers>
          </div>
        }
        {regeneratePoemAllowed &&
          <div className="_bg-pink-200 md:mt-[-0.02rem] mt-[0]">
            {!user?.isAdmin && (user?.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
              <span title="Exceeded daily limit: try again later">
                <StyledLayers styles={altStyles || []}>
                  <GenerateIcon sizeOverwrite={`
                    h-[1.1rem] w-[1.1rem] md:h-6 md:w-6
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
                        h-[1.1rem] w-[1.1rem] md:h-6 md:w-6 
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
          <div className="_bg-pink-200 md:mt-[-0.05rem] mt-[-0.02rem] md:ml-[-0.2rem] ml-[-0.1rem]">
            {!user?.isAdmin && (user?.usage[dateCode]?.haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU &&
              <span title="Exceeded daily limit: try again later">
                <StyledLayers styles={altStyles || []}>
                  <TbReload className={`
                h-[1.2rem] w-[1.2rem] md:h-6 md:w-6 
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
                  h-[1.2rem] w-[1.2rem] md:h-6 md:w-6 
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
    )
  }

  useEffect(() => {
    // console.log(">> app._component.SidePanel.useEffect", { mode, haiku });
    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, []);

  useEffect(() => {
    if (haiku?.version && haiku.version != lastVersion) {
      setQuickEditing(false);
      setLastVersion(haiku.version);
    }

  }, [haiku?.version]);

  console.log(">> app._component.SidePanel.useEffect", { currentPoem, editPoem, displayPoem, lastPoem });

  return (
    <div className="relative h-full">
      {/* allow editors to click out and finish */}
      {!showcaseMode &&
        <div
          className={`_bg-pink-100 fixed top-0 left-0 w-full h-full ${saving ? " opacity-50" : ""}`}
          onClick={() => editing && finishEdit() || quickEditing && setQuickEditing(false)}
        />
      }

      {/* note: https://stackoverflow.com/questions/28269669/css-pseudo-elements-in-react */}
      {/*
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .poem-line-input div {
              background: none;
              _background: pink; / * for debugging * /
              caret-color: ${haiku?.color || "#000000"};
              border-radius: 0.4rem;
              height: auto;
              padding: 0.15rem 0.5rem;
              outline: 1px solid ${haiku?.bgColor || ""}00;
            }
            .poem-line-input.poem-line-${/ * !editing && * / !saving && !onboarding && aboutToEditLine} div {
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
      */}
      <div className="onboarding-container flex"
        style={{
          height: "100%",
        }}
      >
        {onboardingElement && ["poem"].includes(onboardingElement) &&
          <div className="onboarding-focus double" />
        }
        {onboardingElement && ["poem-and-poem-actions"].includes(onboardingElement) &&
          <div className="onboarding-focus" />
        }
        <div
          className={`h-full _bg-pink-200 _p-[2.5rem] m-auto ${canEdit ? "group/edit" : ""} ${saving ? "animate-pulse" : ""}`}
          style={{
            cursor: showcaseMode ? "pointer" : "",
            fontSize,
            width: "calc(100vw - 64px)",
            maxWidth: layout?.spacing ? "calc(100vw - 64px)" : "90vh",
            minWidth: "200px",
            height: showcaseMode ? "calc(100vh - 64px)" : "120vw",
            minHeight: showcaseMode ? "" : "50vh",
            maxHeight: showcaseMode ? "" : "calc(100vh - 192px)"
          }}
          onTouchMove={handleTouchMove}
          onMouseLeave={handleMouseUp}
          onMouseEnter={handleMouseUp}
        >
          <div
            className="h-full _bg-purple-200 flex flex-col _transition-all w-fit m-auto md:text-[26pt] sm:text-[22pt] text-[18pt]"
            onClick={handleClickHaiku}
            title={canUpdateLayout
              ? "Update layout"
              : false //showcaseMode && canRefresh
                ? "Refresh"
                : canEdit
                  ? "Click to edit"
                  : canCopy
                    ? "Click to copy haiku poem"
                    : showcaseMode
                      ? "Click to switch to edit mode"
                      : canSwitchMode
                        ? "Click to switch to showcase mode"
                        : canUpdateLayout
                          ? "Click to change layout"
                          : ""
            }
            style={{
              cursor: canUpdateLayout
                ? "row-resize"
                : showcaseMode
                  ? "pointer"
                  : "",
              fontSize,
            }}
          >
            <PopOnClick
              color={quickEditing ? haiku?.color : haiku?.bgColor}
              force={popPoem || quickEditing || haiku?.version && haiku.version != lastVersion}
              disabled={editing || quickEditing || (!canCopy && !canSwitchMode && !canUpdateLayout)}
              active={/*quickEditing || */  !!(onboardingElement && onboardingElement.includes("poem"))}
              className={`h-full`}
              hoverSupported={false}

            >
              <div className="h-full inner-container _bg-yellow-200 flex flex-col justify-between gap-1">
                {
                  Array.apply(0, new Array(currentPoem.length * 2 + 1))
                    .map((_: any, j: number) => { return { spacer: !(j % 2), i: Math.floor(j / 2) } })
                    .map(({ spacer, i }) => (
                      <div
                        key={`${spacer ? "spacer-" + i : "line-" + i}`}
                        className={`line-and-spacer ${spacer ? "spacer-" + i : "line-" + i} flex flex-col ${spacer ? "_flex-grow" : "_flex-grow-0"}`}
                        style={{
                          flexGrow: spacer && layout?.spacing && layout?.spacing[i] || 0
                        }}
                      >
                        {layout?.spacing && spacer &&
                          <div
                            className="spacer _bg-orange-200 flex h-full w-full"
                            style={{
                              // flexGrow: 1
                            }}
                          >
                          </div>
                        }
                        {!spacer && i < currentPoem.length &&
                          <div
                            key={i}
                            className={`
                            _bg-pink-200 line-container flex md:my-[0.05rem] sm:my-[0.03rem] my-[0.15rem] _transition-all md:leading-[2.2rem] leading-[1.5rem]                            
                            ${layout?.alignments[i] == "center"
                                ? "m-auto"
                                : layout?.alignments[i] == "end"
                                  ? "my-auto ml-auto"
                                  : "my-auto mr-auto"
                              }
                          `}
                          >
                            <StyledLayers
                              className={`_bg-yellow-200 `}
                              styles={styles}>
                              <div
                                className="relative m-[0rem] _transition-all"
                                onKeyDown={(e: any) => (canEdit || editing) && handlePoemLineKeyDown(e, i)}
                                onMouseOver={() => canEdit && setAboutToEditLine(i)}
                                onMouseOut={() => canEdit && setAboutToEditLine(undefined)}
                                onMouseDown={(e: any) => canEdit && startEdit(i, false) /* setTimeout(() => startEdit(i, false), 10) */}
                              >
                                {/* set the width while editing */}
                                <div
                                  className={`poem-line-input poem-line-${i} _bg-orange-400 flex flex-row flex-wrap items-center gap-[0.5rem] _opacity-50 md:min-h-[3.5rem] sm:min-h-[3rem] min-h-[2.5rem] 
                                    ${canUpdateLayout
                                      ? "cursor-row-resize"
                                      : canUpdateLayout
                                        ? "cursor-row-resize"
                                        : showcaseMode || canSwitchMode
                                          ? "cursor-pointer"
                                          : !canEdit && canCopy
                                            ? "cursor-copy"
                                            : ""
                                    }`}
                                  style={{
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    WebkitTouchCallout: "none",
                                    MozUserSelect: "none",
                                    msUserSelect: "none",
                                    WebkitTapHighlightColor: "rgba(0,0,0,0)",
                                    justifyContent: layout?.alignments[i] || "start"
                                  }}
                                // onMouseLeave={(e: any) => handleMouseLeaveLine(e, i)}
                                >
                                  {currentPoem[i].map((word: string, j: number) => (
                                    <div
                                      key={`line-${i}-word-${j}`}
                                      // @ts-ignore
                                      ref={refs[i][j]}
                                      className={`poem-line-word poem-line-word-${j} _bg-yellow-200 relative _mx-[-0.7rem] 
                                        ${saving
                                          ? "cursor-wait opacity-50 animate-pulse"
                                          : quickEditing
                                            ? "cursor-crosshair opacity-80"
                                            : canUpdateLayout
                                              ? "cursor-row-resize"
                                              : canCopy || canSwitchMode
                                                ? "cursor-pointer" : ""
                                        }`}
                                      style={{
                                        transition: "opacity 0.5s ease-out",
                                      }}
                                      onMouseDown={(e: any) => handleMouseDownWord(e, i, j)}
                                      onTouchStart={(e: any) => handleMouseDownWord(e, i, j)}
                                      onMouseUp={(e: any) => handleMouseUp(e, i, j)}
                                      onTouchEnd={(e: any) => handleMouseUp(e, i, j)}
                                      onMouseMove={(e: any) => handleMouseMoveWord(e, i, j)}
                                      onPointerEnter={(e: any) => handlePointerEnterWord(e, i, j)}
                                    >
                                      <div
                                        // className="absolute top-0 left-0 w-0 h-0"
                                        className={`${displayPoem[i][j] ? "opacity-100" : "opacity-20"} transition-opacity`}
                                      >
                                        <PopOnClick
                                          color={haiku?.color}
                                          force={!displayPoem[i][j] || !!(lastPoem && lastPoem[i][j] && lastPoem[i][j] != currentPoem[i][j])}
                                          disabled={!quickEditing || quickEditing && !displayPoem[i][j]}
                                          hoverSupported={true}
                                        >
                                          {j == 0 &&
                                            <span>{upperCaseFirstLetter(currentPoem[i][j])}</span>
                                          }
                                          {j != 0 &&
                                            <span>{currentPoem[i][j]}</span>
                                          }
                                        </PopOnClick>
                                      </div>
                                    </div>
                                  ))
                                  }
                                  {false && !spacer && i == currentPoem.length - 1 && !showcaseMode && (copyAllowed || editAllowed || regeneratePoemAllowed || quickEditAllowed) &&
                                    <div className="flex flex-grow-0 justify-end relative _h-0">
                                      <div className="_absolute top-0 right-0">
                                        <PoemButtons />
                                      </div>
                                    </div>
                                  }
                                  {/* <ControlledInput
                                    id={i}
                                    activeId={editingLine}
                                    value={upperCaseFirstLetter(saving
                                      ? typeof (updatedPoem[i]) == "string"
                                        ? updatedPoem[i]
                                        : upperCaseFirstLetter(poemLine)
                                      : upperCaseFirstLetter(poemLine))}
                                    select={select}
                                    onChange={(value: string) => handleInputChange(value, i)}
                                  /> */}
                                </div>
                              </div>
                            </StyledLayers>
                          </div>
                        }
                        {!spacer && i == currentPoem.length - 1 && !showcaseMode && (copyAllowed || editAllowed || regeneratePoemAllowed || quickEditAllowed) &&
                          <div className="flex flex-grow-0 justify-end relative h-0">
                            <div className="absolute top-0 right-0 z-40"
                              onMouseDown={(e: any) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                              }}
                              onClick={(e: any) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                              }}
                            >
                              <PoemButtons />
                            </div>
                          </div>
                        }

                      </div>
                    ))}
              </div>
            </PopOnClick>
          </div>

          {false &&
            <div
              className={`_bg-red-400 relative md:text-[16pt] sm:text-[14pt] text-[12pt] 
                ${canUpdateLayout
                  ? "cursor-row-resize"
                  : showcaseMode || canSwitchMode
                    ? "cursor-pointer"
                    : !canEdit && canCopy
                      ? "cursor-copy"
                      : ""
                }`}
              style={{
                // background: "pink",
                fontSize: "60%",
              }}
            >
              <div
                className={showcaseMode
                  ? "_bg-yellow-200 fixed bottom-4 right-8 w-max flex flex-row"
                  : "_bg-orange-200 flex flex-row w-max ml-[0rem] mt-[0.5rem] md:mt-[0.8rem] leading-5"
                }
                style={{ fontSize }}
              >
                <div
                  className="poem-title _transition-all _bg-pink-400"
                  onClick={(e: any) => !showcaseMode && handleClickHaiku(e)}
                  title={showcaseMode || canSwitchMode ? "" : canCopy ? "Copy to clipboard" : ""}
                  style={{
                    cursor: canUpdateLayout
                      ? "cursor-row-resize"
                      : showcaseMode || canSwitchMode
                        ? "pointer"
                        : !canEdit && canCopy
                          ? "copy"
                          : ""
                  }}
                >
                  <StyledLayers
                    styles={
                      saving
                        ? styles.slice(0, 3)
                        : onboardingElement && !(onboardingElement || "").includes("poem")
                          ? styles.slice(0, 2)
                          : styles
                    }
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: `${formatHaikuTitleAndAuthor(haiku, mode).join(haiku?.theme?.length > maxHaikuTheme
                          ? "<br/>&nbsp;"
                          : "")}`
                      }}
                    />
                  </StyledLayers>
                </div>

                {!showcaseMode && (copyAllowed || editAllowed || regeneratePoemAllowed || quickEditAllowed) &&
                  <div
                    className="md:mt-[-0.1rem] md:pt-[0rem] sm:pt-[0.0rem] md:pb-[0.1rem] sm:pb-[0.5rem] pb-[0.4rem] md:pl-[0.9rem] sm:pl-[0.8rem] pl-[0.7rem]"
                  >
                    <PoemButtons />
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div >
    </div >
  )
}
