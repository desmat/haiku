'use client'

import { Haiku } from "@/types/Haiku"
import MainClientSidePage from "./MainClientSidePage"
import { SafeHydrate } from "./SafeHydrate"
import { LanguageType } from "@/types/Languages"

export default function MainClientSideSafeHydratePage({ haiku, mode, id, lang, refreshDelay }: { haiku: Haiku, mode: string, id?: string, lang?: undefined | LanguageType, refreshDelay?: number }) {
  return <SafeHydrate><MainClientSidePage haiku={haiku} mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} /></SafeHydrate>
}
