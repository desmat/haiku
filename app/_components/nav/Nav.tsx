import Link from 'next/link'
import { IoSparkles } from 'react-icons/io5';
import * as font from "@/app/font";
import { LanguageType, supportedLanguages } from '@/types/Languages';
import { BsGithub } from 'react-icons/bs';

export function Loading() {
  return (
    <div className='_bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 italic text-dark-2 opacity-5 animate-pulse'>Loading...</div>
  );
}

export function Logo({ textStyle, href, onClick }: { textStyle?: any, href?: string, onClick?: any }) {
  return (
    <Link
      onClick={onClick}
      href={href || "#"}
      className="hover:no-underline"
      style={textStyle}
    >
      <span className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-2px] pr-[3px] pl-[1px] text-[18pt] md:text-[24pt] font-semibold`}>AI</span>ku</span>
    </Link>
  )
}

export function GenerateIcon({ textStyle, onClick }: { textStyle?: any, onClick?: any }) {

  return (
    <Link href="#" onClick={onClick}>
      <IoSparkles
        className="_bg-orange-600 _hover: _text-purple-100 h-8 w-8 md:h-10 md:w-10" style={textStyle}
      />
    </Link>
  )
}

export function BottomLinks({ textStyle, lang }: { textStyle?: any, lang?: LanguageType | undefined }) {
  // console.log("BottomLinks", { lang })
  return (
    <div className="_bg-yellow-100 relative flex flex-row gap-3 items-center justify-center font-semibold">
      <Link
        key="github"
        style={{ ...textStyle, WebkitTextStroke: undefined }}
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
            style={{ ...textStyle, WebkitTextStroke: undefined }}
            href={`/${k != "en" ? k : ""}`}
          >
            {v.nativeName}
          </Link>
        ))}
    </div>
  )
}

export function NavOverlay({ textStyle, lang, onClickLogo, onClickGenerate }: { textStyle?: any, lang?: LanguageType | undefined, onClickLogo?: any, onClickGenerate?: any }) {

  return (
    <div className="bg-pink-200">
      <div className={`${font.architects_daughter.className} fixed top-1 left-4 z-20 text-[26pt] md:text-[32pt]`}>
        <Logo textStyle={textStyle} href={`/${lang || ""}`} onClick={onClickLogo} />
      </div>
      {/* <div className="fixed top-4 right-3 z-20">
        <NavProfileLink href="/profile" className="_bg-orange-600 _hover: text-purple-100" style={textStyle} />
      </div> */}
      {onClickGenerate &&
        <div className="fixed top-4 right-4 z-20">
          <GenerateIcon textStyle={textStyle} onClick={onClickGenerate} />
        </div>
      }

      <div
        className={`fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 50%, ${textStyle?.color || "black"} 85%)`,
          opacity: 0.6,
        }}
      />

      <div className={`fixed bottom-3 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center z-20`}>
        <BottomLinks textStyle={textStyle} lang={lang} />
      </div>
    </div>
  );
}

// export default async function Nav() {
//   return (
//     <div className="bg-dark-1 text-dark-3 fixed z-10 w-full h-10 lg:w-32 lg:h-screen flex flex-row lg:flex-col">
//       <div className="flex flex-grow-0 p-2 -ml-1 lg:ml-0 lg:-mt-1">
//         <NavLink href="/" className="_bg-yellow-600 hover:no-underline">
//           <div className="Logo my-auto">Workout</div>
//         </NavLink>
//       </div>
//       <Suspense
//         fallback={<NavLinks />}
//       >
//         {/* <ClientNavLinks /> */}
//       </Suspense>
//       <div className="flex flex-col p-2 -mr-1 lg:mr-0 lg:-mb-1">
//         <Suspense
//           fallback={<NavNotLoggedInLink />}
//         >
//           <NavProfileLink href="/profile" className="_bg-orange-600" />
//         </Suspense>
//       </div>
//     </div>
//   )
// }

// function NavLinks() {
//   return (
//     <div className="flex flex-grow flex-row lg:flex-col space-x-4 lg:space-x-0 pl-2 pr-0 py-2 lg:py-0 lg:px-2 -mx-2 -my-0 lg:mx-0 lg:-my-2 _bg-yellow-100">
//       {menuItems({}).map((menuItem: any) => (
//         <div key={menuItem.name}>
//           <NavLink
//             className={`_bg-pink-300 hidden md:flex ${menuItem.className}`}
//             title={menuItem.title}
//             href={menuItem.href}
//             isActive={menuItem.isActive}
//           >
//             {menuItem.icon}
//             <div className="my-auto">{menuItem.name}</div>
//           </NavLink>
//         </div>
//       ))}
//       {/* <NavPopup /> */}
//     </div>
//   )
// }

// function NavLink({
//   children, href, className, title, isMenu, isActive,
// }: {
//   children: React.ReactNode,
//   href?: string,
//   className?: string,
//   title?: string
//   isMenu?: boolean,
//   isActive?: boolean
// }) {
//   // console.log('>> components.NavLink.render()', { isActive });

//   return (
//     <div className="flex w-max" title={title}
//     // onClick={() => onClick && onClick()}
//     >
//       <Link
//         href={href || "#"}
//         className={(
//           isActive
//             ? (isMenu ? "text-dark-1" : "text-slate-100")
//             : (isMenu ? "text-dark-2" : "text-slate-300")
//         ) + (isMenu
//           ? ""
//           : " _hover:text-slate-100"
//           ) + " flex flex-row ellipsis whitespace-nowrap lg:whitespace-normal space-x-2 h-full lg:h-fit my-0 lg:my-1 mx-1 lg:mx-0 align-middle " + className}
//       >
//         {children}
//       </Link>
//     </div>
//   )
// }

// async function NavNotLoggedInLink() {
//   return (
//     <Link
//       title="(Not logged in)"
//       href=""
//       className={("text-slate-300") + " flex flex-auto ellipsis whitespace-nowrap lg:whitespace-normal space-x-2 h-full lg:h-fit -my-0.5 lg:my-0 mx-1 lg:mx-auto _hover:text-slate-100 align-middle text-ellipsis "}
//     >
//       <FaRegUserCircle className="my-auto h-7 w-7 lg:h-12 lg:w-12" />
//     </Link>
//   )
// }
