'use client'

import { capitalize } from "@desmat/utils/format";
import { Haiku } from "@/types/Haiku";
import { StyledLayers } from "./StyledLayers";

export const formatHaikuTitleAndAuthor = (haiku: Haiku, mode?: string) => {
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

export default function HaikuTitle({
  haiku,
  mode,
  styles,
  fontSize,
  onClick,
  cursor,
  title,
  children,
}: {
  haiku: Haiku,
  mode?: string,
  styles: any[],
  fontSize?: string | undefined,
  onClick?: any,
  cursor?: string,
  title?: string,
  children?: React.ReactNode,
}) {
  const showcaseMode = mode == "showcase";
  const maxHaikuTheme = showcaseMode ? 28 : 18;

  return (
    <div
      className="_bg-red-400 absolute md:text-[16pt] sm:text-[14pt] text-[12pt]"
      style={{
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
              onClick={onClick}
              style={{
                cursor: cursor || "",
              }}
              title={title || ""}
              dangerouslySetInnerHTML={{
                __html: `${formatHaikuTitleAndAuthor(haiku, mode).join((haiku?.title?.length ?? haiku?.theme?.length) > maxHaikuTheme
                  ? "<br/>"
                  : ", ")}`
              }}
            />
          </StyledLayers>

          {children}
        </div>
      </div>
    </div>
  )
}
