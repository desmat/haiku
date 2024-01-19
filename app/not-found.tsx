import HaikuPage from '@/app/_components/HaikuPage';
import { NavOverlay } from '@/app/_components/Nav';
import { notFoundHaiku } from "@/services/stores/samples";
import { LanguageType } from '@/types/Languages';

export default function NotFound({ lang, onClickGenerate }: { lang?: undefined | LanguageType, onClickGenerate?: any }) {
  // console.log('>> app.NotFound.render()');

  const fontColor = notFoundHaiku?.color || "#555555";

  // const bgColor = haiku?.colorPalette && colorOffsets.back >= 0 && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";
  const bgColor = notFoundHaiku?.bgColor || "lightgrey";

  const textStyle = {
    color: fontColor,
    filter: `drop-shadow(0px 0px 8px ${bgColor})`,
    WebkitTextStroke: `1px ${fontColor}`,
  };

  return (
    <div>
      <NavOverlay textStyle={textStyle} onClickGenerate={onClickGenerate} />
      <HaikuPage haiku={notFoundHaiku} />
    </div>
  )
}
