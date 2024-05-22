import MainPage from '@/app/_components/MainPage';
import NotFound from '@/app/not-found';
import { ExperienceMode } from '@/types/ExperienceMode';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import { Suspense } from 'react';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
import { getDailyHaikudle, getHaikudle } from '@/services/haikudles';
import HaikuPage from '../_components/HaikuPage';
import { NavOverlay } from '../_components/Nav';
import { haikuStyles } from '@/types/Haiku';
import { User } from '@/types/User';
import { NoSsr } from '../_components/NoSsr';

const todaysHaiku = async () => {
  const todaysDailyHaiku = await getDailyHaiku();
  if (todaysDailyHaiku?.haikuId) {
    return getHaiku({} as User, todaysDailyHaiku?.haikuId);
  }
}

const todaysHaikudle = async () => {
  const todaysDailyHaikudle = await getDailyHaikudle();
  if (todaysDailyHaikudle?.haikudleId) {
    return getHaikudle({} as User, todaysDailyHaikudle?.haikudleId);
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
  const version = searchParams && searchParams["version"];
  const lang = searchParams && searchParams["lang"] as LanguageType || "en";
  const mode = (searchParams && searchParams["mode"] || process.env.EXPERIENCE_MODE) as ExperienceMode || "haiku";
  const refreshDelay = searchParams && Number(searchParams["refreshDelay"]);
  const fontSize = searchParams && searchParams["fontSize"];
  console.log('>> app.[[...slugs]].page.render()', { slug: params.slug, searchParams, id, version, lang, mode });

  if (!isSupportedLanguage(lang)) {
    return <NotFound mode={mode} />
  }

  // not sure what's going on here (only when deployed to vercel)
  if (id == "index") {
    id = undefined;
  }

  const haikudle = mode == "haikudle"
    ? id
      ? await getHaikudle({} as User, id)
      : await todaysHaikudle()
    : undefined

  if (mode == "haikudle" && !haikudle) {
    return <NotFound mode={mode} />
  }

  const haiku = haikudle
    ? await getHaiku({} as User, haikudle.haikuId, true, version)
    : id
      ? await getHaiku({} as User, id, false, version)
      : await todaysHaiku();

  if (!haiku) {
    return <NotFound mode={mode} />
  }

  const { textStyles, altTextStyles } = haikuStyles(haiku);

  return (
    <Suspense
      fallback={
        <div className="main-page _bg-yellow-400">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                  body {
                    background-color: ${haiku?.bgColor || "lightgrey"};
                  }
                `
            }}
          />
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
            fontSize={fontSize}
            loading={mode == "haikudle"}
          />
        </div>
      }
    >
      <NoSsr>
        <MainPage
          haiku={haiku}
          mode={mode}
          lang={lang}
          refreshDelay={refreshDelay}
          fontSize={fontSize}
        />
      </NoSsr>
    </Suspense>
  )
}
