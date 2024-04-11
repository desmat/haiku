'use client'

import { useEffect, useState } from 'react';

export default function PopOnClick({
  color = "white",
  active,
  disabled,
  force,
  children,
}: {
  color?: string,
  active?: boolean,
  disabled?: boolean,
  force?: boolean,
  children: React.ReactNode,
}) {
  const [pop, setPop] = useState(false);
  const doPop = () => {
    // console.log(">> PopOnClick.doPop");
    setPop(true);
    setTimeout(() => setPop(false), 100);
  };

  useEffect(() => {
    if (force) {
      doPop();
    }
  }, [force]);

  return (
    <div
      style={{
        filter: `${pop || active ? `drop-shadow(0px 0px 16px ${color})` : ""}`,
      }}
      onMouseDown={() => !disabled && setPop(true)}
      onMouseUp={() => !disabled && doPop()}
    >
      {children}
    </div>
  );
};
