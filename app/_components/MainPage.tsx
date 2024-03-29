'use client'

import moment from 'moment';
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';
import { syllable } from 'syllable';
import { Haiku } from "@/types/Haiku";
import { Loading, NavOverlay } from '@/app/_components/Nav';
import HaikuPage from '@/app/_components/HaikuPage';
import useAlert from '@/app/_hooks/alert';
import useHaikus from "@/app/_hooks/haikus";
import useHaikudle from '@/app/_hooks/haikudle';
import useUser from '@/app/_hooks/user';
import LoadingPage from '@/app/loading';
import NotFound from '@/app/not-found';
import { LanguageType } from '@/types/Languages';
import { Haikudle } from '@/types/Haikudle';

export default function MainPage({ mode, id, lang }: { mode: string, id?: string, lang?: undefined | LanguageType }) {
  // console.log('>> app.MainPage.render()', { mode, id, lang });
  const isHaikuMode = mode == "haiku";
  const isHaikudleMode = mode == "haikudle";
  const isLyricleMode = mode == "lyricle";
  const router = useRouter();
  let [haikuId, setHaikuId] = useState(id);
  // console.log('>> app.MainPage.render()', { haikuId });

  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [
    user,
    saveUser,
    incUserUsage
  ] = useUser((state: any) => [
    state.user,
    state.save,
    state.incUserUsage
  ]);

  const [
    resetAlert,
    plainAlert,
    warningAlert,
    infoAlert
  ] = useAlert((state: any) => [
    state.reset,
    state.plain,
    state.warning,
    state.info
  ]);

  const [
    haikusLoaded,
    loadHaikus,
    haikus,
    getHaiku,
    generateHaiku,
    regenerateHaiku,
    resetHaikus,
    deleteHaiku,
  ] = useHaikus((state: any) => [
    state.loaded(haikuId || { random: true, lang }),
    state.load,
    state.find({ lang }),
    state.get,
    state.generate,
    state.regenerate,
    state.reset,
    state.delete,
  ]);

  const [
    haikudleReady,
    haikudleLoaded,
    loadHaikudle,
    haikudleHaiku,
    resetHaikudles,
    createHaikudle,
    haikudleInProgress,
    previousDailyHaikudleId,
    nextDailyHaikudleId,
  ] = useHaikudle((state: any) => [
    state.ready,
    state.loaded(haikuId || { lang }),
    state.load,
    state.haiku,
    state.reset,
    state.create,
    state.inProgress,
    state.previousDailyHaikudleId,
    state.nextDailyHaikudleId,
  ]);

  let [loading, setLoading] = useState(false);
  const loaded = isHaikudleMode || isLyricleMode ? haikudleLoaded : haikusLoaded;
  const haiku = !loading && (
    isHaikudleMode || isLyricleMode
      ? haikudleHaiku
      : haikuId && getHaiku(haikuId) || haikus[0]);
  // let [previousHaiku, setPreviousHaiku] = useState<Haiku | undefined>(haiku);
  const userGeneratedHaiku = haiku?.createdBy == user?.id && !user?.isAdmin;

  const fontColor = haiku?.color || "#555555";
  const bgColor = haiku?.bgColor || "lightgrey";
  const textStyles = [
    {
      color: fontColor,
      bgColor,
      filter: `drop-shadow(0px 0px 8px ${bgColor})`,
      WebkitTextStroke: `1.5px ${fontColor}`,
      fontWeight: 300,
    },
    {
      filter: `drop-shadow(0px 0px 2px ${bgColor})`,
    },
    {
      filter: `drop-shadow(0px 0px 12px ${bgColor}44)`,
    },
  ];
  const altTextStyles = [
    {
      color: bgColor,
      filter: `drop-shadow(0px 0px 3px ${fontColor})`,
      WebkitTextStroke: `0.5px ${bgColor}`,
      fontWeight: 300,
    },
    {
      color: bgColor,
      filter: `drop-shadow(0px 0px 1px ${fontColor})`,
    }
  ];

  console.log('>> app.MainPage.render()', { haikuId, mode, loaded, loading, user, haiku });
  // console.log('>> app.MainPage.render()', { previousHaikuId: previousHaiku?.id, previousHaiku });

  // useEffect(() => {
  //   console.log('>> app.page useEffect (initial)', { haikuId, mode, loaded, loading, user, haiku });
  // }, []);

  // useEffect(() => {
  //   console.log('>> app.page useEffect (mode)', { haikuId, mode, loaded, loading, user, haiku });
  // }, [mode]);

  const loadPage = async () => {
    // console.log('>> app.MainPage.loadPage', { haikuId, mode, loaded, loading, user, haiku });

    // race conditions
    setLoading(true);
    loading = true;
    // previousHaiku = await getHaiku(haikuId);
    // setPreviousHaiku(previousHaiku);

    isHaikudleMode || isLyricleMode
      ? loadHaikudle(haikuId || { lang })
        .then((haikudle: Haikudle) => {
          setLoading(false);
          loading = false; // race condition
        })
      : loadHaikus(haikuId || { random: true, lang }, mode)
        .then((haikus: Haiku | Haiku[]) => {
          console.log('>> app.MainPage.loadPage loadHaikus.then', { haikus });
          setHaikuId(haikus.id || haikus[0]?.id || haikuId);
          loading = false; // race condition
          setLoading(loading);
          // previousHaiku = haikus[0] || haikus; // race condition      
          // setPreviousHaiku(previousHaiku);
        });
  }

  useEffect(() => {
    // console.log('>> app.page useEffect [haikuId, lang, mode]', { haikuId, mode, loaded, loading, user, haiku });
    if (!loaded && !loading) {
      loadPage();
    }
  }, [haikuId, lang, mode]);

  useEffect(() => {
    // console.log('>> app.page useEffect [haiku, loading, loaded]', { haikuId, mode, loaded, loading, user, haiku });
    if (loaded && !loading && haiku && mode == "haiku") {
      const syllables = haiku.poem
        .map((line: string) => line.split(/\s/)
          .map((word: string) => syllable(word))
          .reduce((a: number, v: number) => a + v, 0))
      const isCorrect = syllables[0] == 5 && syllables[1] == 7 && syllables[2] == 5
      // console.log(">> app.page useEffect [haiku, loading, loaded]", { syllables });

      if (user.isAdmin && haiku.status == "created" && !isCorrect) {
        warningAlert(
          `This haiku doesn't follow the correct form of 5/7/5 syllables: ${syllables.join("/")}`,
          {
            closeDelay: 3000
          }
        );
        return;
      }

      if (user.isAdmin && haiku.dailyHaikudleId) {
        infoAlert(
          `This haiku was previously featured as a daily haikudle: ${haiku.dailyHaikudleId}`,
          {
            closeDelay: 3000
          }
        );
        return;
      }
    }
  }, [haiku, loaded, loading]);

  useEffect(() => {
    // @ts-ignore
    let timeoutId;
    if (user && (isHaikudleMode && haikudleReady || !isHaikudleMode)) {
      if (previousDailyHaikudleId && user && !user?.preferences?.onboardedPreviousDaily) {
        timeoutId = setTimeout(handleShowAboutPreviousDaily, 2000);
      } else if (userGeneratedHaiku && user && !user?.preferences?.onboardedGenerated) {
        timeoutId = setTimeout(handleShowAboutGenerated, 2000);
      } else if ((isHaikuMode || isHaikudleMode || isLyricleMode) && user && !user?.preferences?.onboarded) {
        timeoutId = setTimeout(handleShowAbout, 2000);
      }
    }

    return () => {
      // @ts-ignore
      timeoutId && clearTimeout(timeoutId);
    }
  }, [user, haikudleReady, previousDailyHaikudleId, userGeneratedHaiku]);

  const handleShowAbout = () => {
    plainAlert(
      isLyricleMode
        ? `<div style="display: flex; flex-direction: column; gap: 0.4rem">
          <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
          <div>Drag-and-drop the scrabbled words to solve today's <b>lyrics</b> from a popular song!</div>
        </div>`
        : isHaikudleMode
          ? `<div style="display: flex; flex-direction: column; gap: 0.4rem">
              <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
              <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
              <div>Drag-and-drop the scrabbled words to solve today's AI-generated <b>Haikudle</b>!</div>
            </div>`
          : `<div style="display: flex; flex-direction: column; gap: 0.4rem">
              <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
              <div>This haiku poem and art were generated by ChatGPT and DALL-E, respectively. Hit the logo to see another one, and the top-right button to generate a brand new one!</div>
              <div>Try also Haikudle, a daily puzzle version: <b><a href="https://haikudle.art/">haikudle.art</a></b>.</div>
            </div>`,
      {
        onDissmiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
        closeLabel: "Got it!",
      }
    );
  }

  const handleShowAboutPreviousDaily = () => {
    const previousDailyHaikudleDate = moment(previousDailyHaikudleId, "YYYYMMDD")
    const calendarFormat = {
      sameDay: '[today]',
      nextDay: '[tomorrow]',
      nextWeek: 'dddd',
      lastDay: '[yesterday]',
      lastWeek: '[last] dddd',
      sameElse: (now: any) => now.diff(previousDailyHaikudleDate, "years") ? 'MMM Do YYYY' : 'MMM Do',
    };

    plainAlert(
      `<div style="display: flex; flex-direction: column; gap: 0.4rem">
        <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
        <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
        <div>This was ${previousDailyHaikudleDate.calendar(null, calendarFormat)}'s daily haiku puzzle, try solving today's <b><a href="https://haikudle.art/">Haikudle</a></b>!</div>
      </div>`
      ,
      {
        onDissmiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboardedPreviousDaily: true } }),
        closeLabel: "Got it!",
      }
    );
  }

  const handleShowAboutGenerated = () => {
    plainAlert(
      `<div style="display: flex; flex-direction: column; gap: 0.4rem">
        <div>This haiku was generated for you on the theme <i>${haiku?.theme}</i>${haiku?.mood ? ` with a <i>${haiku?.mood}</i> mood using <b>ChatGPT</b>` : ""}.</div>
        <div>The same theme and mood were used to generate the art in the background using <b>DALL-E</b> with a curated prompt, aiming to harmonize with the haiku poem.</div>
        <div>Curious about those prompts? See <b><a href="https://github.com/desmat/haiku/blob/main/services/openai.ts#L106-L108" target="_blank">here</a></b> and <b><a href="https://github.com/desmat/haiku/blob/main/services/openai.ts#L17-L31" target="_blank">here</a></b> in the source code.</b></div>
        <div>Generated art and poems are sometimes great, sometimes not! Try the <b>✨</b> button next to the poem to regenerate.</div>
      </div>`,
      {
        onDissmiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboardedGenerated: true } }),
        closeLabel: "Got it!",
      }
    );
  }

  const handleGenerate = async (e: any) => {
    // console.log('>> app.page.handleGenerate()');
    e.preventDefault();

    const subject = user?.isAdmin
      ? prompt("Subject? (For example 'nature', 'sunset', or leave blank)")
      : "";

    if (typeof (subject) == "string") {
      resetAlert();
      setGenerating(true);
      const ret = await generateHaiku(user, { lang, subject });
      // console.log('>> app.page.handleGenerate()', { ret });

      if (ret?.id) {
        // router.push(`/?id=${ret.id}`);
        setHaikuId(ret.id);
        setGenerating(false);
        incUserUsage(user, "haikusCreated");
      }
    }
  }

  const handleRegenerateHaiku = async (e: any) => {
    // console.log('>> app.page.handleRegenerateHaiku()');
    e.preventDefault();

    if (user?.isAdmin || haiku.createdBy == user.id) {
      resetAlert();
      setRegenerating(true);
      const ret = await regenerateHaiku(user, haiku);
      // console.log('>> app.page.handleRegenerateHaiku()', { ret });
      setRegenerating(false);
      incUserUsage(user, "haikusRegenerated");
    }
  }

  const handleRefresh = (e?: any) => {
    // console.log('>> app.page.handleRefresh()', {  });
    e && e.preventDefault();

    if (isHaikudleMode && !user.isAdmin) {
      router.push("/");
      setHaikuId(undefined);
      haikuId = undefined;
      loadPage();
      return;
    }

    if (haikuId) {
      router.push(`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
    }

    resetAlert();
    setLoading(true);
    loadHaikus({ random: true, lang }, mode)
      .then((haikus: Haiku[]) => {
        setLoading(false);
        if (isHaikudleMode || isLyricleMode && haikus?.length > 0) {
          loadHaikudle(haikus[0]?.id || { lang });
          setHaikuId(haikus[0].id);
        }
      });
  }

  const handleSwitchMode = async (e: any) => {
    return Promise.all([
      resetHaikus(),
      resetHaikudles()
    ]);
  };

  const handleDelete = () => {
    if (confirm("Delete this Haiku?")) {
      deleteHaiku(haiku?.id);
    }
  }

  const handleSaveHaikudle = () => {
    // console.log('>> app._components.NavOverlay.onSaveHaikudle()', {});
    const ret = prompt("YYYYMMDD?", nextDailyHaikudleId);
    if (ret) {
      createHaikudle(user, {
        id: haiku?.id,
        dateCode: ret,
        haikuId: haiku?.id,
        inProgress: haikudleInProgress,
      });
    }
  }

  const handleSelectHaiku = (id: string) => {
    console.log('>> app._components.MainPage.handleSelectHaiku()', { id });
    setHaikuId(id);
    window.history.replaceState(null, '', `/${id}`);
  }

  if (!loaded || loading || generating) {
    // using previousHaiku doesn't work given the messy load sequence
    return <LoadingPage mode={mode} /* haiku={previousHaiku} */ />
  }

  if (loaded && !loading && !haiku) {
    return <NotFound mode={mode} lang={lang} onClickGenerate={handleGenerate} />
  }

  return (
    <div>
      <NavOverlay
        mode={mode}
        lang={lang}
        haiku={haiku}
        // haikus={haikus}
        styles={textStyles}
        altStyles={altTextStyles}
        onClickLogo={handleRefresh}
        onClickGenerate={handleGenerate}
        onSwitchMode={handleSwitchMode}
        onDelete={handleDelete}
        onSaveHaikudle={handleSaveHaikudle}
        onShowAbout={userGeneratedHaiku
          ? handleShowAboutGenerated
          : previousDailyHaikudleId
            ? handleShowAboutPreviousDaily
            : handleShowAbout
        }
        onSelectHaiku={handleSelectHaiku}
      />
      <HaikuPage
        mode={mode}
        haiku={haiku}
        // haikus={haikus}
        styles={textStyles}
        altStyles={altTextStyles}
        regenerateHaiku={(user.isAdmin || haiku.createdBy == user.id) && handleRegenerateHaiku}
        regenerating={regenerating}
        refresh={handleRefresh}
      />
    </div>
  )
}
