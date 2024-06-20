import HaikuPage from "@/app/_components/HaikuPage";
import { NavOverlay } from "@/app/_components/nav/NavOverlay";
import Loading from "@/app/_components/Loading";
import { loadingHaiku } from "@/services/stores/samples";
import { ExperienceMode } from "@/types/ExperienceMode";
import { Haiku } from "@/types/Haiku";

export default async function LoadingPage({
  mode,
  haiku,
}: {
  mode?: string,
  haiku?: Haiku,
}) {
  // console.log('>> app.loading.render()', { mode, haikuId: haiku?.id });

  const _mode = (mode || process.env.EXPERIENCE_MODE) as ExperienceMode || "haiku";
  const fontColor = "#555555";
  const bgColor = "#aaaaaa";
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
  const altTextStyles = [
    {
      color: bgColor,
      filter: `drop-shadow(0px 0px 3px ${fontColor})`,
      WebkitTextStroke: `0.5px ${bgColor}`,
      fontWeight: 300,
    },
    {
      color: bgColor,
      filter: `drop-shadow(0px 0px 1px ${fontColor})`,
    }
  ];

  return (
    <div>
      <NavOverlay mode={_mode} styles={textStyles} altStyles={altTextStyles} />
      <Loading styles={textStyles} />
      {/* <HaikuPage mode={_mode} loading={true} haiku={haiku || loadingHaiku} styles={textStyles} />       */}
    </div>
  )
}
