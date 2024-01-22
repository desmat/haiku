import { Loading, NavOverlay } from "./_components/Nav";

export default async function Page() {
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

  return (
    <div>
      <NavOverlay styles={textStyles} />
      <Loading />
    </div>
  )
}
