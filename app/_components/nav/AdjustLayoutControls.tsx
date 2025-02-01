'use client'

export default function AdjustLayoutControls({
  layout,
  adjustLayout,
}: {
  layout: any,
  adjustLayout?: any,
}) {
  const poemLayout = layout?.poem;

  const adjustLayoutClamped = (layout: any) => {
    adjustLayout({
      poem: {
        top: layout?.top < 5 ? 5 : layout?.top,
        bottom: layout?.bottom < 5 ? 5 : layout?.bottom,
        up: layout?.up < -95 ? -95 : layout?.up > 95 ? 95 : layout?.up,
      }
    })
  };

  return (
    <div className="adjust-layout-controls">
      <div
        className="bg-blue-400 opacity-30 w-[40vw] h-40 left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] fixed cursor-move z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({ poem: {} });
          e.preventDefault();
        }}
        title="Center poem"
      />
      <div
        className="bg-blue-200 opacity-30 w-[40vw] h-[8rem] left-[50%] translate-x-[-50%] top-0 fixed cursor-move z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? 5 : 15,
          });
        }}
        title="Move poem to top"
      />
      <div
        className="bg-blue-200 opacity-30 w-[40vw] h-[8rem] left-[50%] translate-x-[-50%] bottom-0 fixed cursor-move z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            bottom: poemLayout?.bottom ? 5 : 15
          });
        }}
        title="Move poem to bottom"
      />
      <div
        className="bg-pink-200 opacity-30 w-[40vw] h-10 left-[50%] translate-x-[-50%] -top-10 absolute cursor-n-resize z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? poemLayout.top - 5 : undefined,
            bottom: poemLayout?.bottom ? poemLayout.bottom + 5 : undefined,
            up: poemLayout?.top ? undefined : (poemLayout?.up || 0) + 5,
          });
          e.preventDefault();
        }}
        title="Move poem up"
      />
      <div
        className="bg-pink-400 opacity-30 w-[40vw] h-10 left-[50%] translate-x-[-50%] -top-20 absolute cursor-n-resize z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? poemLayout.top - 15 : undefined,
            bottom: poemLayout?.bottom ? poemLayout.bottom + 15 : undefined,
            up: poemLayout?.top ? undefined : (poemLayout?.up || 0) + 15,
          });
          e.preventDefault();
        }}
        title="Move poem up more"
      />
      <div
        className="bg-pink-200 opacity-30 w-[40vw] h-10 left-[50%] translate-x-[-50%] -bottom-10 absolute cursor-s-resize z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? poemLayout.top + 5 : undefined,
            bottom: poemLayout?.bottom ? poemLayout.bottom - 5 : undefined,
            up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 5,
          });
          e.preventDefault();
        }}
        title="Move poem down"
      />
      <div
        className="bg-pink-400 opacity-30 w-[40vw] h-10 left-[50%] translate-x-[-50%] -bottom-20 absolute cursor-s-resize z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? poemLayout.top + 15 : undefined,
            bottom: poemLayout?.bottom ? poemLayout.bottom - 15 : undefined,
            up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 15,
          });
          e.preventDefault();
        }}
        title="Move poem down more"
      />
    </div>
  )
}
