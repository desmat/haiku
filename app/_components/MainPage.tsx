'use client'

import moment from 'moment';
import { useEffect, useState } from 'react';
import { syllable } from 'syllable';
import { Haiku } from "@/types/Haiku";
import { Loading, NavOverlay } from '@/app/_components/Nav';
import HaikuPage from '@/app/_components/HaikuPage';
import useAlert from '@/app/_hooks/alert';
import useHaikus from "@/app/_hooks/haikus";
import useHaikudle from '@/app/_hooks/haikudle';
import useOnboarding from '@/app/_hooks/onboarding';
import useUser from '@/app/_hooks/user';
import NotFound from '@/app/not-found';
import { LanguageType } from '@/types/Languages';
import { Haikudle } from '@/types/Haikudle';
import HaikudlePage from './HaikudlePage';

export default function MainPage({ mode, id, lang, refreshDelay }: { mode: string, id?: string, lang?: undefined | LanguageType, refreshDelay?: number }) {
  // console.log('>> app.MainPage.render()', { mode, id, lang });

  const isHaikuMode = mode == "haiku";
  const isHaikudleMode = mode == "haikudle";
  const isShowcaseMode = mode == "showcase";
  let [haikuId, setHaikuId] = useState(id);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [_refreshDelay, setRefreshDelay] = useState(refreshDelay || 24 * 60 * 60 * 1000); // every day
  const [refreshTimeout, setRefreshTimeout] = useState<any>();
  const [backupInProgress, setBackupInProgress] = useState(false);

  // console.log('>> app.MainPage.render()', { haikuId });

  const [
    user,
    saveUser,
    incUserUsage,
    getUserToken,
  ] = useUser((state: any) => [
    state.user,
    state.save,
    state.incUserUsage,
    state.getToken,
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
    getHaiku,
    generateHaiku,
    regenerateHaiku,
    resetHaikus,
    deleteHaiku,
  ] = useHaikus((state: any) => [
    state.loaded(haikuId),
    state.load,
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
    haikudleSolved,
    haikudleSolvedJustNow,
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
    state.solved,
    state.solvedJustNow,
  ]);

  const [
    onboardingElement,
    startOnboarding,
  ] = useOnboarding((state: any) => [
    state.focus,
    state.start,
  ]);

  const loaded = isHaikudleMode ? (haikudleLoaded && haikudleReady) /* || haikusLoaded */ : haikusLoaded;
  let [loading, setLoading] = useState(false);
  let [loadingUI, setLoadingUI] = useState(false);
  let [haiku, setHaiku] = useState<Haiku | undefined>();
  const userGeneratedHaiku = haiku?.createdBy == user?.id && !user?.isAdmin;
  // console.log('>> app.MainPage.render()', { loading, loaded, haikuId, haiku_Id: haiku?.id, getHaiku: getHaiku(haikuId), haikudleHaiku });

  const isPuzzleMode = isHaikudleMode &&
    !haikudleSolved &&
    (!previousDailyHaikudleId || user?.isAdmin) &&
    (!(haiku?.createdBy == user?.id) || user?.isAdmin);

  const fontColor = haiku?.color || "#555555";
  const bgColor = haiku?.bgColor || "lightgrey";

  const textStyles = [
    {
      color: fontColor,
      bgColor,
      filter: `drop-shadow(0px 0px 8px ${bgColor})`,
      WebkitTextStroke: `1px ${fontColor}`,
      fontWeight: 300,
    },
    {
      filter: `drop-shadow(0px 0px 2px ${bgColor})`,
    },
    {
      filter: `drop-shadow(0px 0px 4px ${bgColor}99)`,
    },
    {
      filter: `drop-shadow(0px 0px 8px ${bgColor}66)`,
    },
    {
      filter: `drop-shadow(0px 0px 12px ${bgColor}33)`,
    },
    {
      filter: `drop-shadow(0px 0px 18px ${bgColor}22)`,
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
      filter: `drop-shadow(0px 0px 1px ${fontColor})`,
    },
    {
      filter: `drop-shadow(0px 0px 8px ${bgColor}55)`,
    },
    {
      filter: `drop-shadow(0px 0px 12px ${bgColor}33)`,
    },
    {
      filter: `drop-shadow(0px 0px 18px ${bgColor}11)`,
    },
  ];

  // console.log('>> app.MainPage.render()', { haikuId, mode, loaded, loading, user, haiku });

  const loadPage = async () => {
    // console.log('>> app.MainPage.loadPage', { haikuId, mode, loaded, loading, user, haiku });

    if (!loading) {
      loading = true; // race condition at initial load
      setLoading(true);
      setLoadingUI(true);

      isHaikudleMode
        ? loadHaikudle(haikuId || { lang })
          .then((haikudles: Haikudle | Haikudle[]) => {
            // console.log('>> app.MainPage.loadPage loadHaikudle.then', { haikudles });
            const loadedHaikudle = haikudles[0] || haikudles;
            setHaiku(loadedHaikudle?.haiku);
            setHaikuId(loadedHaikudle?.haiku?.id);
          })
        : loadHaikus(haikuId || { random: true, lang }, mode)
          .then((haikus: Haiku | Haiku[]) => {
            // console.log('>> app.MainPage.loadPage loadHaikus.then', { haikus });
            const loadedHaiku = haikus[0] || haikus;
            setHaiku(loadedHaiku);
            setHaikuId(loadedHaiku?.id);
          });
    }
  }

  const checkHaiku = () => {
    // console.log('>> app.MainPage.checkHaiku', { user, haiku });

    const syllables = haiku.poem
      .map((line: string) => line.split(/\s/)
        .map((word: string) => syllable(word))
        .reduce((a: number, v: number) => a + v, 0))
    const isCorrect = syllables[0] == 5 && syllables[1] == 7 && syllables[2] == 5

    if (haiku.status == "created" && !isCorrect) {
      warningAlert(`This haiku doesn't follow the correct form of 5/7/5 syllables: ${syllables.join("/")}`, {
        closeDelay: 3000
      });
      return;
    }

    if (haiku.dailyHaikudleId) {
      infoAlert(`This haiku was previously featured as a daily haikudle: ${haiku.dailyHaikudleId}`, {
        closeDelay: 3000
      });
      return;
    }
  }

  useEffect(() => {
    // console.log('>> app.page useEffect [haikuId, haiku?.id, loading, loaded]', { loading: loading, loading2: loadingUI, loaded, haikuId, haiku_id: haiku?.id, haikudleHaiku });

    if (loading) {
      if (loaded) {
        const loadedHaiku = getHaiku(haikuId) || haikudleHaiku;
        // console.log('>> app.page useEffect [haikuId, haiku?.id, loading, loaded] setting haiku', { loadedHaiku });
        if (loadedHaiku) {
          setHaikuId(loadedHaiku.id);
          setHaiku(loadedHaiku);
          setLoading(false);
          setLoadingUI(false);
        }
      }
    } else { // !loading 
      // console.log('>> app.page useEffect [haikuId, haiku?.id, loading, loaded] haikuId != haiku?.id', { val: haikuId != haiku?.id, haikuId, haiku_id: haiku?.id });
      if (loaded) {
        if (haikuId != haiku?.id) {
          if (isHaikudleMode) {
            if (!haikuId && haikudleHaiku) {
              // initial page load with no params: what we loaded from API is today's haikudle
              setHaiku(haikudleHaiku);
              setHaikuId(haikudleHaiku.id);
            } else {
              setHaiku(undefined);
              resetHaikudles().then(loadPage);
            }
          } else {
            const loadedHaiku = getHaiku(haikuId);
            // console.log('>> app.page useEffect [haikuId, haiku?.id, loading, loaded]', { loadedHaiku });
            if (loadedHaiku) {
              setHaiku(loadedHaiku);
              setHaikuId(loadedHaiku.id);
            }
          }
        }
        else if (process.env.OPENAI_API_KEY != "DEBUG" && user?.isAdmin && mode == "haiku" && haiku?.poem) {
          checkHaiku();
        }
      } else { // !loading && !loaded
        loadPage();
      }
    }
  }, [haikuId, haiku?.id, loading, loaded]);

  useEffect(() => {
    // @ts-ignore
    let timeoutId;
    if (user && (isHaikudleMode && haikudleReady || !isHaikudleMode)) {
      if (previousDailyHaikudleId && user && !user?.preferences?.onboardedPreviousDaily) {
        timeoutId = setTimeout(showAboutPreviousDaily, 2000);
      } else if (userGeneratedHaiku && user && !user?.preferences?.onboardedGenerated) {
        timeoutId = setTimeout(showAboutGenerated, 2000);
      } else if ((isHaikuMode || isHaikudleMode) && !previousDailyHaikudleId && user && !user?.preferences?.onboarded) {
        // timeoutId = setTimeout(showAbout, 2000);
        timeoutId = setTimeout(startOnboarding, 2000);
      }
    }

    return () => {
      // @ts-ignore
      timeoutId && clearTimeout(timeoutId);
    }
  }, [user, haikudleReady, previousDailyHaikudleId, userGeneratedHaiku]);

  useEffect(() => {
    // console.log('>> app.page useEffect [haiku?.id, loadingUI, isShowcaseMode, _refreshDelay]', { haiku_id: haiku?.id, loadingUI, isShowcaseMode, _refreshDelay });

    if (isShowcaseMode && !loadingUI && _refreshDelay) {
      window.history.replaceState(null, '', `/${haiku?.id || ""}?mode=showcase${_refreshDelay ? `&refreshDelay=${_refreshDelay}` : ""}`);
      setRefreshTimeout(setTimeout(doRefresh, _refreshDelay));
    }

    // in case we're in showcase mode and refresh didn't work:
    // refresh after loading for 10 seconds
    const retryInterval = loadingUI && isShowcaseMode && setInterval(() => {
      // console.log('>> app.page useEffect [loadingUI, isShowcaseMode] forcing refresh after waiting too long');
      setLoadingUI(false);
      document.location.href = `/${haiku?.id || ""}?mode=showcase${_refreshDelay ? `&refreshDelay=${_refreshDelay}` : ""}`;
    }, 10000);

    return () => {
      retryInterval && clearInterval(retryInterval);

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        setRefreshTimeout(undefined);
      }
    }
  }, [haiku?.id, loadingUI, isShowcaseMode, _refreshDelay]);

  const showAbout = () => {
    plainAlert(
      isHaikudleMode
        ? `<div style="display: flex; flex-direction: column; gap: 0.4rem">
              <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
              <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
              <div>Drag-and-drop the scrabbled words to solve today's AI-generated <b>Haikudle</b>!</div>
            </div>`
        : `<div style="display: flex; flex-direction: column; gap: 0.4rem">
              <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
              <div>This haiku poem and art were generated by ChatGPT and DALL-E, respectively. Hit the logo to see another one, and the top-right button to generate a brand new one!</div>
              <div>Try also Haikudle, a daily puzzle version: <b><a href="https://haikudle.art/">haikudle.art</a></b>.</div>
            </div>`, {
      onDismiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
      closeLabel: "Got it!",
    });
  }

  const showAboutPreviousDaily = () => {
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
        <div>This haiku poem and art were generated by ChatGPT and DALL-E, respectively. Hit the top-right <b>✨</b> button to generate a brand new haiku!</div>
        <div>This was ${previousDailyHaikudleDate.calendar(null, calendarFormat)}'s daily haiku puzzle, try solving today's <b><a href="https://haikudle.art/">Haikudle</a></b>!</div>
      </div>`, {
      onDismiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboardedPreviousDaily: true } }),
      closeLabel: "Got it!",
    });
  }

  const showAboutGenerated = () => {
    plainAlert(
      `<div style="display: flex; flex-direction: column; gap: 0.4rem">
        <div>This haiku was generated for you on the theme <i>${haiku?.theme}</i>${haiku?.mood ? ` with a <i>${haiku?.mood}</i> mood using <b>ChatGPT</b>` : ""}.</div>
        <div>The same theme and mood were used to generate the art in the background using <b>DALL-E</b> with a curated prompt, aiming to harmonize with the haiku poem.</div>
        <div>Curious about those prompts? See <b><a href="https://github.com/desmat/haiku/blob/main/services/openai.ts#L106-L108" target="_blank">here</a></b> and <b><a href="https://github.com/desmat/haiku/blob/main/services/openai.ts#L17-L31" target="_blank">here</a></b> in the source code.</b></div>
        <div>Generated art and poems are sometimes great, sometimes not! Try the <b>✨</b> button next to the poem to regenerate.</div>
      </div>`, {
      onDismiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboardedGenerated: true } }),
      closeLabel: "Got it!",
    });
  }

  const startGenerateHaiku = async () => {
    // console.log('>> app.page.startGenerateHaiku()');

    const subject = true // user?.isAdmin
      ? prompt(`Subject? ${process.env.OPENAI_API_KEY == "DEBUG" ? "(Use 'DEBUG' for simple test poem)" : "(For example 'nature', 'sunset', or leave blank)"}`)
      : "";

    if (typeof (subject) == "string") {
      resetAlert();
      setGenerating(true);
      const ret = await generateHaiku(user, { lang, subject });
      // console.log('>> app.page.startGenerateHaiku()', { ret });

      if (ret?.id) {
        incUserUsage(user, "haikusCreated");
        setHaikuId(ret.id);
        window.history.replaceState(null, '', `/${ret.id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
        setGenerating(false);
      }
    }
  }

  const startRegenerateHaiku = async () => {
    // console.log('>> app.page.startRegenerateHaiku()');

    if (user?.isAdmin || haiku?.createdBy == user.id) {
      resetAlert();
      setRegenerating(true);
      const ret = await regenerateHaiku(user, haiku);
      // console.log('>> app.page.startRegenerateHaiku()', { ret });
      incUserUsage(user, "haikusRegenerated");
      setHaiku(ret);
      setRegenerating(false);
    }
  }

  const doRefresh = () => {
    // console.log('>> app.page.doRefresh()', {});

    if (isHaikudleMode && !user.isAdmin) {
      // TODO: figure out visual glitch
      haiku = undefined;
      haikuId = undefined;
      loading = true;

      window.location.href = `/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`;
      return;
    }

    if (haikuId) {
      window.history.replaceState(null, '', `/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
    }

    resetAlert();
    setLoadingUI(true);

    if (isHaikudleMode) {
      loadHaikus({ random: true, lang }, mode)
        .then((haikus: Haiku | Haiku[]) => {
          // console.log('>> app.MainPage.doRefresh loadHaikus.then', { haikus });
          const loadedHaiku = haikus[0] || haikus;
          setHaiku(loadedHaiku);
          setHaikuId(loadedHaiku?.id);
        });
    } else {
      setHaiku(undefined);
      setHaikuId(undefined);
    }
  }

  const switchMode = async (newMode?: string) => {
    console.log('>> app.page.switchMode()', { mode, newMode });
    const url = newMode
      ? `/${haikuId || ""}?mode=${newMode}`
      : `/${haikuId || ""}?mode=${mode == "haiku" ? "haikudle" : mode != "haiku" ? "haiku" : process.env.EXPERIENCE_MODE}`

    setLoadingUI(true);
    window.history.replaceState(null, '', url);
    document.location.href = url;
  };

  const doDelete = async () => {
    // console.log('>> app.page.doDelete()', {});
    if (haiku?.id && confirm("Delete this Haiku?")) {
      window.history.replaceState(null, '', `/`);
      deleteHaiku(haiku.id); // don't wait
      doRefresh();
    }
  }

  const doSaveHaikudle = () => {
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

  const selectHaiku = (id: string) => {
    // console.log('>> app._components.MainPage.selectHaiku()', { id, loading, loaded, haikuId, haiku_id: haiku?.id });

    if (id == haikuId) return;

    setHaikuId(id);
    window.history.replaceState(null, '', `/${id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
  }

  const changeRefreshDelay = (val: number) => {
    setRefreshDelay(val);
    window.history.replaceState(null, '', `/${haiku?.id || ""}$?mode=showcase&refreshDelay=${val}`);

    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(undefined);
    }

    setRefreshTimeout(setTimeout(doRefresh, val));

    plainAlert(
      `Refreshing every ${moment.duration(val).humanize()} (${Math.floor(val / 1000)} seconds)`,
      { closeDelay: 1000 }
    );
  }

  const startBackup = async () => {
    console.log('>> app._components.MainPage.startBackup()', {});

    const token = await getUserToken();
    setBackupInProgress(true);
    const res = await fetch("/api/admin/backup", {
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });

    setBackupInProgress(false);

    // console.log('>> app._components.MainPage.doBackup()', { ret });
    if (res.status != 200) {
      warningAlert(`Error saving backup: ${res.status} (${res.statusText})`);
      return;
    }

    const data = await res.json();
    plainAlert(`Backup successful: ${JSON.stringify(data)}`, {
      // closeDelay: 3000
    });
  }

  if (!loaded || loading || loadingUI || generating) {
    // return <LoadingPage mode={mode} /* haiku={haiku} */ />
    return (
      <div>
        <NavOverlay mode={mode} styles={textStyles.slice(0, textStyles.length - 3)} altStyles={altTextStyles} onClickLogo={doRefresh} />
        <Loading onClick={isShowcaseMode && doRefresh} />
        {/* <HaikuPage mode={mode} loading={true} haiku={loadingHaiku} styles={textStyles} />       */}
      </div>
    )
  }

  if (loaded && !loading && !haiku) {
    return <NotFound mode={mode} lang={lang} onClickGenerate={startGenerateHaiku} onClickLogo={doRefresh} />
  }

  return (
    <div className="_bg-yellow-200 main-page relative h-[100vh] w-[100vw]">
      <NavOverlay
        mode={mode}
        lang={lang}
        haiku={haiku}
        refreshDelay={_refreshDelay}
        backupInProgress={backupInProgress}
        styles={textStyles.slice(0, textStyles.length - 3)}
        altStyles={altTextStyles}
        onboardingElement={onboardingElement}
        onClickLogo={doRefresh}
        onClickGenerate={startGenerateHaiku}
        onSwitchMode={switchMode}
        onDelete={doDelete}
        onSaveHaikudle={doSaveHaikudle}
        onShowAbout={userGeneratedHaiku
          ? showAboutGenerated
          : previousDailyHaikudleId
            ? showAboutPreviousDaily
            : showAbout
        }
        onSelectHaiku={selectHaiku}
        onChangeRefreshDelay={changeRefreshDelay}
        onBackup={startBackup}
      />

      {isPuzzleMode &&
        <HaikudlePage
          mode={mode}
          haiku={haiku}
          styles={textStyles}
          regenerating={regenerating}
        />
      }

      {!isPuzzleMode &&
        <HaikuPage
          mode={mode}
          haiku={haikudleSolved ?
            {
              ...haiku,
              poem: haikudleInProgress
                .map((line: any) => line
                  .map((word: any) => word.word)
                  .join(" "))
            }
            : haiku}
          styles={textStyles}
          altStyles={altTextStyles}
          popPoem={isHaikudleMode && haikudleSolvedJustNow}
          regenerating={regenerating}
          onboardingElement={onboardingElement}
          refresh={doRefresh}
          regenerateHaiku={() => ["haiku", "haikudle"].includes(mode) && (user?.isAdmin || haiku?.createdBy == user?.id) && startRegenerateHaiku && startRegenerateHaiku()}
        />
      }
    </div>
  )
}
