import HaikuPage from '@/app/_components/HaikuPage';
import { NavOverlay } from '@/app/_components/nav/NavOverlay';
import { notFoundHaiku } from "@/services/stores/samples";
import { ExperienceMode } from '@/types/ExperienceMode';
import { haikuStyles } from '@/types/Haiku';
import { LanguageType } from '@/types/Languages';

export default function NotFound({
  mode,
  lang,
  onClickGenerate,
  onClickLogo,
}: {
  mode: ExperienceMode,
  lang?: undefined | LanguageType,
  onClickGenerate?: any,
  onClickLogo?: any
}) {
  // console.log('>> app.NotFound.render()');
  const { textStyles, altTextStyles } = haikuStyles(notFoundHaiku);

  return (
    <div className="_bg-yellow-200 _main-page relative h-[100vh] w-[100vw]">
      <NavOverlay
        mode={mode}
        styles={textStyles.slice(0, textStyles.length - 3)}
        altStyles={altTextStyles}
        onClickGenerate={onClickGenerate}
        onClickLogo={onClickLogo}
      />
      <HaikuPage
        mode={mode}
        haiku={notFoundHaiku}
        styles={textStyles}
        altStyles={altTextStyles}
      />
    </div>
  )
}
