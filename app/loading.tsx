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
      <NavOverlay mode="loading" styles={textStyles} altStyles={altTextStyles} />
      <Loading />
    </div>
  )
}
