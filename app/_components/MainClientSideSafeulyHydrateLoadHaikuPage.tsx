'use client'

import { LanguageType } from '@/types/Languages';
import MainClientSideLoadHaikuPage from './MainClientSideLoadHaikuPage';
import { NoSsr } from './NoSsr';

export default async function MainClientSideSafeulyHydrateLoadHaikuPage({ mode, id, lang, refreshDelay }: { mode: string, id?: string, lang?: undefined | LanguageType, refreshDelay?: number }) {
  console.log('>> app.MainClientSideSafeulyHydrateLoadHaikuPage.render()', { mode, id, lang });

  return (
    <NoSsr>
      <MainClientSideLoadHaikuPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
    </NoSsr>
  )
}