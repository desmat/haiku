'use client'

import { BsArrowsCollapse, BsChevronBarDown, BsChevronBarUp, BsChevronCompactDown, BsChevronCompactUp, BsChevronDoubleUp, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { StyledLayers } from "../StyledLayers";
import PopOnClick from "../PopOnClick";

export default function AdjustLayoutControls({
  layout,
  adjustLayout,
  styles,
  altStyles,
}: {
  layout: any,
  adjustLayout?: any,
  styles: any[],
  altStyles?: any[],
}) {
  const poemLayout = layout?.poem;
  // console.log("app._components.nav.AdjustLayouts", { poemLayout });

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
      {!(poemLayout?.top && poemLayout?.top >= 20)
        && !(poemLayout?.bottom && poemLayout?.bottom >= 20)
        && !(!poemLayout?.top && !poemLayout?.bottom) &&
        <div
          className="_bg-blue-400 _opacity-30 w-[60vw] h-40 left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] fixed cursor-move z-20 flex justify-center items-center opacity-80 hover:opacity-100"
          onClick={(e: any) => {
            adjustLayoutClamped({ poem: {} });
            e.preventDefault();
          }}
          title="Center poem"
        >
          <StyledLayers styles={altStyles || []}>
            <PopOnClick>
              <BsChevronCompactDown className=" text-[2.0rem] mb-[-1.15rem]" />
              <BsChevronCompactUp className=" text-[2.0rem] mt-[-1.15rem]" />
            </PopOnClick>
          </StyledLayers>
        </div>
      }
      {(!poemLayout?.top || poemLayout?.top > 15) &&
        <div
          className="_bg-blue-200 _opacity-30 w-[60vw] h-[6rem] left-[50%] translate-x-[-50%] top-0 fixed cursor-move z-20 flex justify-center items-end opacity-80 hover:opacity-100"
          onClick={(e: any) => {
            adjustLayoutClamped({
              top: 15,
            });
          }}
          title="Move poem to top"
        >
          <StyledLayers styles={altStyles || []}>
            <PopOnClick>
              <BsChevronBarUp className=" text-[2.5rem]" />
            </PopOnClick>
          </StyledLayers>
        </div>
      }
      {(!poemLayout?.bottom || poemLayout?.bottom > 15) &&
        <div
          className="_bg-blue-200 _opacity-30 w-[60vw] h-[6rem] left-[50%] translate-x-[-50%] bottom-0 fixed cursor-move z-20 flex justify-center items-start opacity-80 hover:opacity-100"
          onClick={(e: any) => {
            adjustLayoutClamped({
              bottom: 15
            });
          }}
          title="Move poem to bottom"
        >
          <StyledLayers styles={altStyles || []}>
            <PopOnClick>
              <BsChevronBarDown className=" text-[2.5rem]" />
            </PopOnClick>
          </StyledLayers>
        </div>
      }
      {!(poemLayout?.top && poemLayout?.top <= 10) &&
        <div
          className="_bg-pink-200 _opacity-30 w-[60vw] h-10 left-[50%] translate-x-[-50%] -top-10 absolute cursor-n-resize z-20 flex justify-center items-end opacity-80 hover:opacity-100"
          onClick={(e: any) => {
            adjustLayoutClamped({
              top: poemLayout?.top ? poemLayout.top - 5 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom + 5 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) + 5,
            });
            e.preventDefault();
          }}
          title="Move poem up"
        >
          <StyledLayers styles={altStyles || []}>
            <PopOnClick>
              <BsChevronUp className=" text-[2.0rem]" />
            </PopOnClick>
          </StyledLayers>
        </div>
      }
      {/* <div
        className={`_bg-pink-400 _opacity-30 w-[60vw] h-10 left-[50%] translate-x-[-50%] -top-20 absolute cursor-n-resize z-20 
          flex justify-center items-end opacity-80 hover:opacity-100`}
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? poemLayout.top - 15 : undefined,
            bottom: poemLayout?.bottom ? poemLayout.bottom + 15 : undefined,
            up: poemLayout?.top ? undefined : (poemLayout?.up || 0) + 15,
          });
          e.preventDefault();
        }}
        title="Move poem up more"
      >
        <StyledLayers styles={altStyles || []}>
          <PopOnClick>
            <BsChevronDoubleUp className=" text-[2.0rem]" />
            {/ * <BsChevronBarUp className=" text-[2.5rem]" /> * /}
          </PopOnClick>
        </StyledLayers>
      </div> */}
      {!(poemLayout?.bottom && poemLayout?.bottom <= 10) &&
        <div
          className="_bg-pink-200 _opacity-30 w-[60vw] h-10 left-[50%] translate-x-[-50%] -bottom-10 absolute cursor-s-resize z-20 flex justify-center items-start opacity-80 hover:opacity-100"
          onClick={(e: any) => {
            adjustLayoutClamped({
              top: poemLayout?.top ? poemLayout.top + 5 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom - 5 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 5,
            });
            e.preventDefault();
          }}
          title="Move poem down"
        >
          <StyledLayers styles={altStyles || []}>
            <PopOnClick>
              <BsChevronDown className=" text-[2.0rem]" />
            </PopOnClick>
          </StyledLayers>
        </div>
      }
      {/* <div
        className="bg-pink-400 opacity-30 w-[60vw] h-10 left-[50%] translate-x-[-50%] -bottom-20 absolute cursor-s-resize z-20"
        onClick={(e: any) => {
          adjustLayoutClamped({
            top: poemLayout?.top ? poemLayout.top + 15 : undefined,
            bottom: poemLayout?.bottom ? poemLayout.bottom - 15 : undefined,
            up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 15,
          });
          e.preventDefault();
        }}
        title="Move poem down more"
      /> */}
    </div>
  )
}
