'use client'

export default function AdjustLayoutControls({
  layout,
  adjustLayout,
}: {
  layout: any,
  adjustLayout?: any,
}) {
  const poemLayout = layout?.poem;
  return (
    <div className="adjust-layout-controls">
      <div
        className="_bg-blue-400 w-[25%] h-20 left-[50%] translate-x-[-50%] top-[50%] tranlate-y-[-50%] fixed cursor-move z-20"
        onClick={(e: any) => {
          adjustLayout({ poem: {} });
          e.preventDefault();
        }}
        title="Center poem"
      />
      <div
        className="_bg-pink-200 w-[25vw] h-10 left-[50%] translate-x-[-50%] -top-10 absolute cursor-n-resize z-30"
        onClick={(e: any) => {
          adjustLayout({
            poem: {
              top: poemLayout?.top ? poemLayout.top - 5 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom + 5 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) + 5,
            }
          });
          e.preventDefault();
        }}
        title="Move poem up slightly"
      />
      <div
        className="_bg-pink-400 w-[25vw] h-10 left-[50%] translate-x-[-50%] -top-20 absolute cursor-n-resize z-30"
        onClick={(e: any) => {
          adjustLayout({
            poem: {
              top: poemLayout?.top ? poemLayout.top - 15 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom + 15 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) + 15
            }
          });
          e.preventDefault();
        }}
        title="Move poem up"
      />
      <div
        className="_bg-pink-200 w-[25vw] h-10 left-[50%] translate-x-[-50%] -bottom-10 absolute cursor-s-resize z-30"
        onClick={(e: any) => {
          adjustLayout({
            poem: {
              top: poemLayout?.top ? poemLayout.top + 5 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom - 5 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 5,
            }
          });
          e.preventDefault();
        }}
        title="Move poem down slightly"
      />
      <div
        className="_bg-pink-400 w-[25vw] h-10 left-[50%] translate-x-[-50%] -bottom-20 absolute cursor-s-resize z-30"
        onClick={(e: any) => {
          adjustLayout({
            poem: {
              top: poemLayout?.top ? poemLayout.top + 15 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom - 15 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 15,
            }
          });
          e.preventDefault();
        }}
        title="Move poem down"
      />
      <div
        className="_bg-blue-200 w-[25vw] h-10 left-[50%] translate-x-[-50%] top-0 fixed cursor-move z-30"
        onClick={(e: any) => {
          adjustLayout({
            poem: {
              top: 5,
            }
          });
          e.preventDefault();
        }}
        title="Move poem to top"
      />
      <div
        className="_bg-blue-200 w-[25vw] h-10 left-[50%] translate-x-[-50%] bottom-0 fixed cursor-move z-30"
        onClick={(e: any) => {
          adjustLayout({
            poem: {
              bottom: 5
            }
          });
          e.preventDefault();
        }}
        title="Move poem to bottom"
      />
    </div>
  )
}
