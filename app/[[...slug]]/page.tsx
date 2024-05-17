import React from 'react';
import MainPage from '@/app/_components/MainPage';
import NotFound from '@/app/not-found';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import { Suspense } from 'react';
import MainClientSidePage from '@/app/_components/MainClientSidePage';
import { NoSsr } from '../_components/NoSsr';
import moment from 'moment';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
import HaikuPage from '../_components/HaikuPage';
import { NavOverlay } from '../_components/Nav';
import { haikuStyles } from '@/types/Haiku';

const todaysHaiku = async () => {
  const todaysDateCode = moment().format("YYYYMMDD");
  const todaysDailyHaiku = await getDailyHaiku(todaysDateCode);
  if (todaysDailyHaiku?.haikuId) {
    return getHaiku(todaysDailyHaiku?.haikuId);
  }
}

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

  const haiku = id ? await getHaiku(id) : await todaysHaiku();
  const { textStyles, altTextStyles } = haikuStyles(haiku);

  return (
    <Suspense
      fallback={
        <div className="main-page">
          <NavOverlay
            haiku={haiku}
            mode={mode}
            lang={lang}
            styles={textStyles.slice(0, textStyles.length - 3)}
            altStyles={altTextStyles}
          />
          <HaikuPage
            haiku={haiku}
            mode={mode}
            styles={textStyles}
            altStyles={altTextStyles}
          />
        </div>
      }
    >
      <NoSsr>
        <MainClientSidePage
          id={id}
          haiku={haiku}
          mode={mode}
          lang={lang}
          refreshDelay={refreshDelay}
        />
      </NoSsr>
    </Suspense>
  )
}
