import { default as NextLink } from 'next/link'

export default function Link({
  children, href, className, onClick, style, title, target, useClient
}: {
  children: React.ReactNode,
  href?: string,
  className?: string,
  onClick?: (e?: any) => void,
  style?: string,
  title?: string,
  target?: string,
  useClient?: boolean
}) {
  // console.log('components.Link.render()', { isActive });

  const styleSet = new Set(style && style.split(/\s+/));
  const computedClassName = "  "
    + (styleSet.has("parent") ? " group" : "")
    + (styleSet.has("child") ? " group-active:text-light-1 group-hover:underline" : "")
    + (!styleSet.has("plain") && !styleSet.has("secondary") && !styleSet.has("parent") ? " text-dark-2" : "")
    + (styleSet.has("plain") || styleSet.has("parent") ? " hover:no-underline" : " active:text-light-1")
    + (styleSet.has("secondary") ? " hover:text-dark-2 " : "")
    + (styleSet.has("warning") ? " hover:text-light-2 _px-1" : "")
    + (styleSet.has("light") ? " opacity-40 hover:opacity-100 group-hover:opacity-100" : "")
    + (styleSet.has("disabled") ? " cursor-not-allowed hover:no-underline" : " cursor-pointer")
    + " " + className;

  if (styleSet.has("child")) {
    return (
      <span className={computedClassName}>
        {children}
      </span>
    )
  }

  if (useClient && onClick) {
    console.warn("Link component cannot have both useClient and onClick parameters");
  }

  if (useClient) {
    return (
      <NextLink
        href={href || "#"}
        title={title || ""}
        target={target || ""}
        className={computedClassName}
      >
        {children}
      </NextLink>
    )
  }

  return (
    <NextLink
      href={href || "#"}
      onClick={(e) => { if (onClick) { e.preventDefault(); onClick(e); } else if (!href) { e.preventDefault(); } }}
      title={title || ""}
      target={target || ""}
      className={computedClassName}
    >
      {children}
    </NextLink>
  )
}
