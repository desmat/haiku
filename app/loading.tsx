import HaikuPage from "@/app/_components/HaikuPage";
import { NavOverlay } from "@/app/_components/Nav";
import { loadingHaiku } from "@/services/stores/samples";
import { Haiku } from "@/types/Haiku";

export default async function LoadingPage({
  mode,
  haiku,
}: {
  mode?: string,
  haiku?: Haiku,
}) {
  const _mode = mode || process.env.EXPERIENCE_MODE || "haiku";
  const fontColor = "#555555";
  const bgColor = "lightgrey";
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
      {/* <NavOverlay mode={_mode} styles={textStyles} altStyles={altTextStyles} /> */}
      <HaikuPage mode={_mode} loading={true} haiku={haiku || loadingHaiku} styles={textStyles} />      
    </div>
  )
}
