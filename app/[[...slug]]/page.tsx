import moment from 'moment';
import { Suspense } from 'react';
import HaikuPage from '@/app/_components/HaikuPage';
import MainPage from '@/app/_components/MainPage';
import { NavOverlay } from '@/app/_components/nav/NavOverlay';
import { NoSsr } from '@/app/_components/NoSsr';
import NotFound from '@/app/not-found';
import { ExperienceMode } from '@/types/ExperienceMode';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
import { getDailyHaikudle, getDailyHaikudles, getHaikudle } from '@/services/haikudles';
import { notFoundHaiku } from '@/services/stores/samples';
import { haikuStyles } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import { User } from '@/types/User';

const user = {} as User;

const todaysHaiku = async () => {
  const todaysDailyHaiku = await getDailyHaiku();
  if (todaysDailyHaiku?.haikuId) {
    return getHaiku(user, todaysDailyHaiku?.haikuId);
  }
}

const todaysHaikudle = async () => {
  const todaysDailyHaikudle = await getDailyHaikudle();
  if (todaysDailyHaikudle?.haikudleId) {
    return getHaikudle(user, todaysDailyHaikudle?.haikudleId);
  }
}

const getTheHaikudle = async (id: string) => {
  const todaysDateCode = moment().format("YYYYMMDD");
  const dailyHaikudles = await getDailyHaikudles();
  const dailyHaikudle = dailyHaikudles
    .filter((dh: DailyHaikudle) => dh.id < todaysDateCode && dh.haikudleId == id)[0];

  const haiku = await getHaiku(user, id, !dailyHaikudle?.id);
  if (!haiku) return;

  const haikudle = await getHaikudle(user, id);
  if (!haikudle) return;

  return {
    ...haikudle,
    previousDailyHaikudleId: dailyHaikudle?.id,
    haiku: haiku,
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: any }
  searchParams?: { [key: string]: string | undefined },
}) {
  const versionSeparator = "%3A"; // url-encoded ':'
  const ids =
    searchParams && searchParams["id"] && searchParams["id"].split(versionSeparator) ||
    params.slug && params.slug[0] && params.slug[0].split(versionSeparator);
  let id = ids && ids[0];
  const version = ids && ids[1] || searchParams && searchParams["version"];
  const lang = searchParams && searchParams["lang"] as LanguageType || "en";
  let mode = (searchParams && searchParams["mode"] || process.env.EXPERIENCE_MODE) as ExperienceMode || "haiku";
  const refreshDelay = searchParams && Number(searchParams["refreshDelay"]);
  const fontSize = searchParams && searchParams["fontSize"];
  const noOnboarding = searchParams && searchParams["noOnboarding"] == "true";
  // console.log('>> app.[[...slugs]].page.render()', { slug: params.slug, searchParams, id, version, lang, mode });

  // can't switch modes in puzzle mode
  if (process.env.EXPERIENCE_MODE == "haikudle" && mode != process.env.EXPERIENCE_MODE) {
    mode = "haikudle";
  }

  if (!isSupportedLanguage(lang)) {
    return <NotFound mode={mode} />
  }

  // not sure what's going on here (only when deployed to vercel)
  if (id == "index") {
    id = undefined;
  }

  const haikudle = mode == "haikudle"
    ? id
      ? await getTheHaikudle(id)
      : await todaysHaikudle()
    : undefined

  if (mode == "haikudle" && !haikudle) {
    return <NotFound mode={mode} />
  }

  let haiku = haikudle
    ? await getHaiku({} as User, haikudle.haikuId, !haikudle?.previousDailyHaikudleId, version)
    : id
      ? await getHaiku({} as User, id, false, version)
      : await todaysHaiku();

  haiku = {
    ...(haiku || notFoundHaiku),
    previousDailyHaikudleId: haikudle?.previousDailyHaikudleId,
  };
  const { textStyles, altTextStyles } = haikuStyles(haiku);

  return (
    <Suspense
      fallback={
        <div className="main-page _bg-yellow-400">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                  body {
                    background-color: ${haiku?.bgColor || "#aaaaaa"};
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
            haiku={mode == "haikudle" && !haikudle.previousDailyHaikudleId
              ? { ...haiku, poem: undefined }
              : haiku
            }
            mode={mode}
            styles={textStyles}
            altStyles={altTextStyles}
            fontSize={fontSize}
            loading={mode == "haikudle" && !haikudle.previousDailyHaikudleId}
          />
        </div>
      }
    >
      <NoSsr>
        <MainPage
          haiku={haiku}
          haikudle={haikudle}
          mode={mode}
          lang={lang}
          refreshDelay={refreshDelay}
          fontSize={fontSize}
          noOnboarding={noOnboarding}
        />
      </NoSsr>
    </Suspense>
  )
}
