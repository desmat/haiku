import Loading from "./Loading"

export default function Page({
  children,
  title,
  subtitle,
  links,
  topLinks,
  bottomLinks,
  className,
  loading,
}: {
  children?: React.ReactNode,
  title?: React.ReactNode,
  subtitle?: React.ReactNode,
  links?: React.ReactNode[],
  topLinks?: React.ReactNode[],
  bottomLinks?: React.ReactNode[],
  className?: string,
  loading?: boolean,
}) {
  return (
    <main className={`_bg-pink-200 relative flex flex-col items-left _max-w-4xl min-h-[calc(100dvh+0rem)] h-full ${className ? " " + className : ""}`}>
      {loading &&
        <Loading />
      }
      {/* {!loading &&
        <> */}
      {title &&
        <h1 className="flex justify-center text-center capitalize">{title}</h1>
      }
      {subtitle &&
        <p className='italic text-center mb-2'>{subtitle}</p>
      }
      {(topLinks || links) &&
        <div className={`mt-2 mb-4`}>
          <PageLinks loading={loading}>
            {topLinks || links}
          </PageLinks>
        </div>
      }
      {loading &&
        <p className='italic text-center opacity-20 animate-pulse'>Loading</p>
      }
      {!loading &&
        <div className="px-2 flex flex-col align-center self-center w-fit">
          {/* <> */}
          {children}
          {/* </> */}
        </div>
      }
      {(bottomLinks || links) &&
        <div className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 flex-grow items-end justify-center`}>
          <PageLinks loading={loading}>
            {bottomLinks || links}
          </PageLinks>
        </div>
        //   }
        // </>
      }
    </main>
  )
}

export function PageLinks({
  children,
  loading,
}: {
  children: React.ReactNode,
  loading?: boolean,
}) {
  return (
    <div className="_bg-yellow-100 relative flex flex-row gap-3 items-center justify-center font-semibold">
      {/* {loading &&
        <div className="_bg-pink-100 absolute left-0 top-0 w-full h-full z-10 cursor-not-allowed opacity-50" />
      } */}
      {children}
    </div>
  )
}
