"use client";

import React, { Suspense } from "react";
import { useMounted } from "@/app/_hooks/mounted";

export function SafeHydrate({ children }: { children: React.ReactNode }) {
  const isMounted = useMounted();
  return (
    <Suspense key={isMounted ? "client" : "server"}>{children}</Suspense>
  );
}
