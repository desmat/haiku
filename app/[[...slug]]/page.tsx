import MainPage from '@/app/_components/MainPage';
import NotFound from '@/app/not-found';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import MainServerSidePage from '../_components/MainServerSidePage';
import { Suspense } from 'react';
import MainClientSidePage from '../_components/MainClientSidePage';
import MainClientSideLoadHaikuPage from '../_components/MainClientSideLoadHaikuPage';
import { SafeHydrate } from '../_components/SafeHydrate';
import MainClientSideSafeHydratePage from '../_components/MainClientSideSafeHydratePage';
import MainClientSideSafeulyHydrateLoadHaikuPage from '../_components/MainClientSideSafeulyHydrateLoadHaikuPage';
import { NoSsr } from '../_components/NoSsr';

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: any }
  searchParams?: { [key: string]: string | undefined },
}) {
  let id = searchParams && searchParams["id"] || params.slug && params.slug[0];
  const lang = searchParams && searchParams["lang"] as LanguageType || "en";
  const mode = searchParams && searchParams["mode"] || process.env.EXPERIENCE_MODE || "haiku";
  const refreshDelay = searchParams && Number(searchParams["refreshDelay"]);
  console.log('>> app.[[...slugs]].page.render()', { slug: params.slug, searchParams, id, lang, mode });

  if (!isSupportedLanguage(lang)) {
    return <NotFound mode={mode} />
  }

  // not sure what's going on here
  if (id == "index") {
    id = undefined;
  }

  // if (id) {
  // return <MainServerSidePage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
  // } else {
  // return <MainPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
  // }

  const getUser = () => {
    return {
      id: "dummy",
      isAdmin: true,
    }
  }

  const user = getUser();

  if (mode == "haikudle") {
    return <MainPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
  }

  if (!user?.isAdmin || mode == "showcase") {
    return <MainServerSidePage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
  }

  return (
    <Suspense fallback={
      <MainServerSidePage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
    }>
      {/* <MainPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} /> */}
      {/* <MainClientSideLoadHaikuPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} /> */}
      {/* <SafeHydrate>
        <MainClientSideLoadHaikuPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
      </SafeHydrate> */}
      <NoSsr>
        <MainClientSideLoadHaikuPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
      </NoSsr>
      {/* <MainClientSideSafeHydratePage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} /> */}
      {/* <MainClientSideSafeulyHydrateLoadHaikuPage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} /> */}
    </Suspense>
  )
}
