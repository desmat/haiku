"use client";
import React from "react";
import { useMounted } from "../_hooks/mounted";

// @ts-ignore
export function NoSsr({ children }) {
  // console.log('>> app._components.NoSsr');

  const mounted = useMounted();
  if (!mounted) return null;
  return <>{children}</>;
}
