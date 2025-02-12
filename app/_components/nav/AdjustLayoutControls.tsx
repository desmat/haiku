'use client'

import { BsChevronBarUp, BsChevronCompactDown, BsChevronCompactUp, BsChevronDoubleDown, BsChevronDoubleUp, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { StyledLayers } from "../StyledLayers";
import PopOnClick from "../PopOnClick";

export default function AdjustLayoutControls({
  layout,
  adjustLayout,
  styles,
  altStyles,
  adminMode,
}: {
  layout: any,
  adjustLayout?: any,
  styles: any[],
  altStyles?: any[],
  adminMode?: boolean,
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
          className="_bg-blue-400 _opacity-30 w-40 h-40 left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] fixed z-30 flex justify-center items-center opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "move" : "pointer" }}
          onClick={(e: any) => {
            adjustLayoutClamped({ poem: {} });
            e.preventDefault();
          }}
          title="Center poem"
        >
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <BsChevronCompactDown className=" text-[2.0rem] mb-[-1.15rem]" />
                <BsChevronCompactUp className=" text-[2.0rem] mt-[-1.15rem]" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
      {(!poemLayout?.top || poemLayout?.top > 15) &&
        <div
          className="_bg-blue-200 _opacity-30 w-40 h-[6rem] left-[50%] translate-x-[-50%] top-0 fixed z-30 flex justify-center items-end opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "move" : "pointer" }}
          onClick={(e: any) => {
            adjustLayoutClamped({
              top: 15,
            });
          }}
          title="Move poem to top"
        >
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <BsChevronBarUp className=" text-[2.5rem]" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
      {(!poemLayout?.bottom || poemLayout?.bottom > 15) &&
        <div
          className="_bg-blue-200 _opacity-30 w-40 h-[6rem] left-[50%] translate-x-[-50%] bottom-0 fixed z-30 flex justify-center items-start opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "move" : "pointer" }}
          onClick={(e: any) => {
            adjustLayoutClamped({
              bottom: 15
            });
          }}
          title="Move poem to bottom"
        >
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                {/* why does it look bigger than the below? <BsChevronBarDown className="text-[2.5rem]" /> */}
                <BsChevronBarUp className="text-[2.5rem] rotate-180" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
      {!(poemLayout?.top && poemLayout?.top <= 10) &&
        <div
          className="_bg-pink-200 _opacity-30 w-40 h-10 left-[50%] translate-x-[-50%] -top-10 absolute z-30 flex justify-center items-end opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "n-resize" : "pointer" }}
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
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <BsChevronUp className=" text-[2.0rem]" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
      {adminMode &&
        <div
          className="_bg-pink-400 _opacity-30 w-40 h-10 left-[50%] translate-x-[-50%] -top-20 absolute z-30 flex justify-center items-end opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "n-resize" : "pointer" }}
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
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <BsChevronDoubleUp className=" text-[2.0rem]" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
      {!(poemLayout?.bottom && poemLayout?.bottom <= 10) &&
        <div
          className="_bg-pink-200 _opacity-30 w-40 h-10 left-[50%] translate-x-[-50%] -bottom-10 absolute z-30 flex justify-center items-start opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "s-resize" : "pointer" }}
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
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <BsChevronDown className=" text-[2.0rem]" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
      {adminMode &&
        <div
          className="_bg-pink-400 _opacity-30 w-40 h-10 left-[50%] translate-x-[-50%] -bottom-20 absolute z-30 flex justify-center items-start opacity-80 hover:opacity-100"
          style={{ cursor: adminMode ? "s-resize" : "pointer" }}
          onClick={(e: any) => {
            adjustLayoutClamped({
              top: poemLayout?.top ? poemLayout.top + 15 : undefined,
              bottom: poemLayout?.bottom ? poemLayout.bottom - 15 : undefined,
              up: poemLayout?.top ? undefined : (poemLayout?.up || 0) - 15,
            });
            e.preventDefault();
          }}
          title="Move poem down more"
        >
          {!adminMode &&
            <StyledLayers styles={altStyles || []}>
              <PopOnClick>
                <BsChevronDoubleDown className=" text-[2.0rem]" />
              </PopOnClick>
            </StyledLayers>
          }
        </div>
      }
    </div>
  )
}
