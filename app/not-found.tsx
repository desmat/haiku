import HaikuPage from '@/app/_components/HaikuPage';
import { NavOverlay } from '@/app/_components/Nav';
import { notFoundHaiku } from "@/services/stores/samples";
import { LanguageType } from '@/types/Languages';

export default function NotFound({ mode, lang, onClickGenerate }: { mode: string, lang?: undefined | LanguageType, onClickGenerate?: any }) {
  // console.log('>> app.NotFound.render()');

  const fontColor = notFoundHaiku?.color || "#555555";

  // const bgColor = haiku?.colorPalette && colorOffsets.back >= 0 && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";
  const bgColor = notFoundHaiku?.bgColor || "lightgrey";

  const textStyles = [
    {
      color: fontColor,
      filter: `drop-shadow(0px 0px 8px ${bgColor})`,
      WebkitTextStroke: `1.5px ${fontColor}`,
      fontWeight: 300,
    },
    {
      color: fontColor,
      filter: `drop-shadow(0px 0px 2px ${bgColor})`,
    }
  ];

  return (
    <div>
      <NavOverlay mode={mode} styles={textStyles} onClickGenerate={onClickGenerate} />
      <HaikuPage mode={mode} haiku={notFoundHaiku} styles={textStyles} />
    </div>
  )
}
