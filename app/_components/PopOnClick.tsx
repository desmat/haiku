'use client'

import { useEffect, useState } from 'react';

export default function PopOnClick({
  color = "#ffffff",
  active,
  disabled,
  force,
  hoverSupported,
  className,
  children,
}: {
  color?: string,
  active?: boolean,
  disabled?: boolean,
  force?: boolean,
  hoverSupported?: boolean,
  className?: string,
  children: React.ReactNode,
}) {
  const [pop, setPop] = useState(false);
  const doPop = () => {
    // console.log(">> PopOnClick.doPop");
    setPop(true);
    setTimeout(() => setPop(false), 100);
  };
  const handleMouseDown = () => !disabled && setPop(true);
  const handleMouseUp = () => !disabled && doPop()

  useEffect(() => {
    if (force) {
      doPop();
    }
  }, [force]);

  return (
    <div
      className={className || ""}
      style={{
        filter: `${pop || active ? `drop-shadow(0px 0px 16px ${color})` : ""}`,
      }}
      onMouseDown={handleMouseDown}
      onPointerEnter={() => hoverSupported && handleMouseDown()}
      onMouseUp={handleMouseUp}
      onPointerLeave={() => hoverSupported && handleMouseUp()}
    >
      {children}
    </div>
  );
};
