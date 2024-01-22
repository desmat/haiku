import Link from 'next/link'
import { IoSparkles } from 'react-icons/io5';
import * as font from "@/app/font";
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { BsGithub } from 'react-icons/bs';
import { StyledLayers } from './StyledLayers';

export function Loading() {
  return (
    <div className='_bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 italic text-dark-2 opacity-5 animate-pulse'>Loading...</div>
  );
}

export function Logo({ href, onClick }: { href?: string, onClick?: any }) {
  return (
    <Link
      onClick={onClick}
      href={href || "#"}
      className="hover:no-underline"
    >
      <span className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-2px] pr-[3px] pl-[1px] text-[18pt] md:text-[24pt] font-semibold`}>AI</span>ku</span>
    </Link>
  )
}

export function GenerateIcon({ onClick }: { onClick?: any }) {

  return (
    <Link href="#" onClick={onClick}>
      <IoSparkles className="_bg-orange-600 _hover: _text-purple-100 h-8 w-8 md:h-10 md:w-10" />
    </Link>
  )
}

export function BottomLinks({ lang }: { lang?: LanguageType | undefined }) {
  // console.log("BottomLinks", { lang })
  return (
    <div
      className="_bg-yellow-100 relative flex flex-row gap-3 items-center justify-center _font-semibold"
    >
      <Link
        key="github"
        href="https://github.com/desmat"
        target="_blank"
        className="_bg-yellow-200 flex flex-row gap-0.5 items-center"
      >
        <BsGithub className="mt-[0.1rem] text-md" />
        desmat
      </Link>
      {Object.entries(supportedLanguages)
        .filter((e: any) => (!lang && e[0] != "en") || (lang && lang != e[0]))
        .map(([k, v]: any) => (
          <Link
            key={k}
            href={`/${k != "en" ? k : ""}`}
          >
            {v.nativeName}
          </Link>
        ))}
    </div>
  )
}

export function NavOverlay({ styles, lang, onClickLogo, onClickGenerate }: { styles: any[], lang?: LanguageType | undefined, onClickLogo?: any, onClickGenerate?: any }) {

  return (
    <div className="_bg-pink-200">
      <div className={`${font.architects_daughter.className} fixed top-1 left-4 z-20 text-[26pt] md:text-[32pt]`}>
        <StyledLayers styles={styles}>
          <Logo href={`/${lang || ""}`} onClick={onClickLogo} />
        </StyledLayers>
      </div>

      {/* <div className="fixed top-4 right-3 z-20">
        <NavProfileLink href="/profile" className="_bg-orange-600 _hover: text-purple-100" style={textStyle} />
      </div> */}
      {onClickGenerate &&
        <div className="fixed top-4 right-4 z-20">
          <StyledLayers styles={styles}>
            <GenerateIcon onClick={onClickGenerate} />
          </StyledLayers>
        </div>
      }

      <div
        className={`fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 50%, ${styles[0]?.color || "black"} 85%)`,
          opacity: 0.6,
        }}
      />

      <div className={`fixed bottom-3 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center z-20`}>
        <StyledLayers styles={styles}>
          <BottomLinks lang={lang} />
        </StyledLayers>
      </div>
    </div>
  );
}
