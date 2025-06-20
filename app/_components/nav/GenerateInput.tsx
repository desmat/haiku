'use client'

import moment from 'moment';
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { IoSparkles } from 'react-icons/io5';
import { StyledLayers } from '@/app/_components/StyledLayers';
import PopOnClick from '@/app/_components/PopOnClick';
import * as font from "@/app/font";
import trackEvent from '@/utils/trackEvent';
import { USAGE_LIMIT } from '@/types/Usage';
import { User } from '@/types/User';

const haikuThemeSuggestions = [
  "Create a haiku about… ",
  "Create a haiku about… ",
  "Create a haiku about… ",
  "Create a haiku about… ",
  "Create a haiku about… ",
  "Create a haiku about… nature",
  "Create a haiku about… mountains",
  "Create a haiku about… cherry blossoms",
  "Create a haiku about… spring",
  "Create a haiku about… summer",
  "Create a haiku about… autumn",
  "Create a haiku about… winter",
  "Create a haiku about… flowers",
  "Create a haiku about… summer in Paris",
  "Create a haiku ending with… Summer in Paris.",
  "Create a haiku about… evening in Paris in French",
  "Create a haiku about… city at night",
  "Create a haiku starting with… The city at night,",
  "Create a haiku about… springtime in Kyoto",
  "Create a haiku about… rainy morning",
  "Create a haiku about… sunset on the ocean",
  "Create a haiku about… sunrise on the lake",
  "Create a haiku starting with… Sunrise on the lake,",
  "Create a haiku starting with… Petals in the breeze,",
  "Create a haiku starting with… A leaf in the wind,",
  "Create a haiku starting with… Sun dips in twilight,",
  "Create a haiku starting with… Clouds drift in the sky,",
  "Create a haiku ending with… Nature's restless mood.",
  "Create a haiku ending with… Stars linger above.",
  "Create a haiku ending with… Silent moonlit night.",
  "Crea un haiku sobre… la lluvia de la mañana",
  "के बारे में एक हाइकु बनाएं… एक शांतिपूर्ण नदी",
  "について俳句を作ってみましょう… 桜",
  "創建一個俳句關於… 河流和山脈",
  "Tạo một bài thơ haiku về… những bông hoa",
];

export function GenerateIcon({
  onClick,
  sizeOverwrite,
  style,
  children,
  disabled,
}: {
  onClick?: any,
  sizeOverwrite?: string,
  style?: any
  children?: React.ReactNode,
  disabled?: boolean,
}) {
  const icon = <IoSparkles style={style} className={`_bg-orange-600 _hover: _text-purple-100 ${sizeOverwrite || "h-5 w-5 md:h-7 md:w-7 md:mt-[-0.3rem] mt-[-0.4rem]"}`} />;

  return (
    <Link
      className="generate-icon flex flex-row m-auto gap-2 hover:no-underline"
      style={{ cursor: !disabled && (style || onClick) ? "pointer" : "default" }}
      href="#"
      onClick={(e: any) => {
        e.preventDefault();
        onClick && onClick(e);
      }}
    >
      {children &&
        <div className={`${font.architects_daughter.className} _bg-yellow-200 md:mt-[-0.2rem] mt-[-0.2rem] md:text-[20pt] text-[16pt]`}>
          {children}
        </div>
      }
      <div className="_bg-yellow-300 m-auto">
        {icon}
      </div>
    </Link>
  )
}

export default function GenerateInput({
  user,
  color,
  bgColor,
  styles,
  altStyles,
  generate,
  generatingTheme,
  onboardingElement,
}: {
  user: User,
  color?: any,
  bgColor?: any,
  styles?: any,
  altStyles?: any,
  generate?: any,
  generatingTheme?: string,
  onboardingElement?: string | undefined,
}) {
  const [active, setActive] = useState(false);
  const [focus, setFocus] = useState(false);
  const [clickingGenerate, setClickingGenerate] = useState(false);
  const [haikuTheme, setHaikuTheme] = useState(haikuThemeSuggestions[0]);
  const [intervalId, setIntervalId] = useState<any | undefined>();
  const [inputRows, setInputRows] = useState(1);
  const ref = useRef();
  // console.log('app._components.PoemLineInput.render()', { id, activeId, visible, select, value, updatedLine: localValue });

  const onboarding = onboardingElement && onboardingElement.includes("generate");
  const dateCode = moment().format("YYYYMMDD");
  const exceededUsageLimit = !user?.isAdmin && (user?.usage && user?.usage[dateCode]?.haikusCreated || 0) >= USAGE_LIMIT.DAILY_CREATE_HAIKU;
  const placeholder = generatingTheme == "" ? "Creating a haiku..." : generatingTheme ? `Creating a haiku about ${generatingTheme}...` : haikuTheme;
  
  const handleChange = (e: any) => {
    // const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    // console.log("handleChange", { text });

    setActive(true);

    // adjust textarea rows
    // @ts-ignore
    const lines = ref.current.value.split("\n");
    setInputRows(Math.min(lines.length, 3));
  }

  const handleKeyDown = (e: any) => {
    // console.log("app._components.Nav.GenerateInput.handleKeyDown()", { e, key: e.key });
    if (e.key == "Escape") {
      // trackEvent("cancelled-generate-haiku", {
      //   userId: user?.id,
      // });
      setActive(false);
      // @ts-ignore
      ref.current.value = "";
      // @ts-ignore
      ref.current.blur();
    } else if (e.key == "Enter" && !e.shiftKey) {
      !exceededUsageLimit && handleClickedGenerate && handleClickedGenerate();
    }
  }

  const handleFocus = () => {
    // trackEvent("clicked-generate-haiku-input", {
    //   userId: user?.id,
    // });

    setActive(true);
    setFocus(true);

    // @ts-ignore
    if (!ref.current.value) {
      // @ts-ignore
      ref.current.value = haikuTheme.split("…")[1].trim();
      // @ts-ignore
      ref.current.select();
    }
  }

  const handleBlur = () => {
    setActive(false);
    setFocus(false);
  }

  const handleClickedGenerate = () => {
    // @ts-ignore
    // console.log('app._components.Nav.GenerateInput.handleClickedGenerate()', { ref, active, value: ref.current.value, focus });

    setActive(false);
    setFocus(false);
    setClickingGenerate(false);
    // @ts-ignore
    ref.current.blur();

    // console.log('app._components.Nav.GenerateInput.handleClickedGenerate() generate');
    // @ts-ignore
    const theme = focus || ref.current.value ? ref.current.value : haikuTheme.split("…")[1].trim();
    generate && generate(theme);
    // @ts-ignore
    ref.current.value = "";
  };

  useEffect(() => {
    !intervalId && setIntervalId(
      setInterval(() => {
        setHaikuTheme(haikuThemeSuggestions[Math.floor(Math.random() * haikuThemeSuggestions.length)]);
      }, 5000)
    );

    return () => intervalId && clearInterval(intervalId);
  }, []);

  return (
    <div
      onMouseOver={() => {
        !exceededUsageLimit && generate && setActive(true);
      }}
      onMouseOut={() => {
        // @ts-ignore
        if (!ref.current.value) {
          setActive(false);
        }
      }}
      className={`GenerateInput _bg-pink-200 absolute
        top-[0.8rem] md:top-[0.8rem] right-[3.2rem] md:right-[3.8rem] md:left-1/2 lg:transform md:-translate-x-1/2
        w-[calc(100vw-6.5rem)] md:w-[600px] transition-opacity
        ${generate ? "overlayed-control" : "disabled"}
      `}
      style={{ zIndex: onboarding ? "50" : "20" }}
    >
      <div className="onboarding-container" style={{ width: "auto" }}>
        {onboarding &&
          <div className="onboarding-focus double" />
        }
        <StyledLayers styles={onboarding ? styles.slice(0, 3) : styles.slice(0, 2)}>
          <div className="bg-yellow-200 flex flex-row gap-0">
            <div className={`_bg-yellow-200 haiku-theme-input flex-grow text-[12pt] md:text-[16pt]`}>
              {/* note: https://stackoverflow.com/questions/28269669/css-pseudo-elements-in-react */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  .GenerateInput {
                    opacity: ${onboarding || active || focus ? "1" : "0.5"};
                  }
                  .GenerateInput:not(.disabled):hover {
                    opacity: 1;
                  }
                  .haiku-theme-input textarea {
                    background: none;
                    _background: pink; /* for debugging */
                    outline: 2px solid ${bgColor || ""}88;
                    background-color: ${bgColor || "#ffffff"}44;
                    caret-color: ${color || "#000000"};
                    border-radius: 5px;
                    height: auto;
                    WebkitTextStroke: 0.5px ${bgColor};
                    -webkit-text-stroke: 1.25px ${color}66;
                    text-stroke: 1.0px ${color}66;                   
                  }
                  .haiku-theme-input.poem-line-${/* !editing && */ /* !saving &&  !onboarding && aboutToEditLine */ 42} input {
                    outline: none;
                    background-color: ${bgColor || "#ffffff"}44;  
                  }
                  ${/* saving || */ onboarding ? "" : ".haiku-theme-input textarea:focus"} {
                    outline: 2px solid ${bgColor || ""}88;
                    background-color: ${bgColor || "#ffffff"}66;
                  }
                  ${/* saving || */ onboarding ? "" : ".haiku-theme-input textarea:focus::placeholder"} {
                    opacity: 0;
                  }
                  .haiku-theme-input textarea::selection { 
                    background: ${color || "#000000"}66 
                  }
                  .haiku-theme-input textarea::placeholder {
                    color: ${color || "#000000"};
                    -webkit-text-stroke: 1px ${color};
                    text-stroke: 1px ${color};
                    opacity: 0.4;
                    text-align: center; 
                  }
                  .haiku-theme-input textarea::-ms-input-placeholder { /* Edge 12 -18 */
                    color: ${color || "#000000"};
                    text-stroke: 1px ${color};
                    opacity: 0.4;
                    text-align: center; 
                  }`
                }}
              >
              </style>
              <div className="relative">
                {/* <StyledLayers styles={styles.slice(0, 2)}> */}
                <textarea
                  // @ts-ignore
                  rows={
                    // @ts-ignore
                    // ref.current.value.split(/\n/).length || 1
                    inputRows
                  }
                  resize="none"
                  //@ts-ignore
                  ref={ref}
                  maxLength={256}
                  placeholder={placeholder}
                  disabled={exceededUsageLimit || !generate}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className={`w-full absolute top-0 left-0
                    pt-[0.1rem] pr-[2rem]  md:pr-[2.6rem] pb-[0.1rem] pl-[0.7rem]
                    mt-[-0.1rem] mr-[-0.1rem] mb-0 ml-0 md:mt-[0.1rem] md:mr-[0rem]      
                  `}
                  style={{
                    cursor: exceededUsageLimit ? "not-allowed" : generate ? "text" : "default",
                    resize: "none",
                  }}
                  title={exceededUsageLimit
                    ? "Exceeded daily limit: try again later"
                    : "Enter theme, subject or leave blank, and click the button to create a new haiku"
                  }
                />
              </div>
            </div>
            <div className="relative w-0">
              <div
                className="_bg-pink-200 p-[0.5rem] absolute md:top-[0.1rem] _top-[-0.5rem] md:right-[-0.1rem] right-[-0.2rem] z-20"
                style={{
                  opacity: active ? "1" : "0.6",
                }}
                onMouseDown={() => !exceededUsageLimit && setClickingGenerate(true)}
                onMouseUp={() => clickingGenerate && !exceededUsageLimit && handleClickedGenerate()}
                title={exceededUsageLimit ? "Exceeded daily limit: try again later" : "Create a new haiku"}
              >
                <PopOnClick disabled={!generate}>
                  <StyledLayers styles={altStyles.slice(0, 2)}>
                    <GenerateIcon
                      disabled={!generate}
                      style={{ cursor: exceededUsageLimit ? "not-allowed" : generate ? "pointer" : "default" }}
                    />
                  </StyledLayers>
                </PopOnClick>
              </div>
            </div>
          </div>
        </StyledLayers>
      </div>
    </div>
  )
}
