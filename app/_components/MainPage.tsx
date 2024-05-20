'use client'

import moment from 'moment';
import { Suspense, useEffect, useState } from 'react';
import { syllable } from 'syllable';
import { Haiku } from "@/types/Haiku";
import { NavOverlay } from '@/app/_components/Nav';
import Loading from "@/app/_components/Loading";
import HaikuPage from '@/app/_components/HaikuPage';
import useAlert from '@/app/_hooks/alert';
import useHaikus from "@/app/_hooks/haikus";
import useHaikudle from '@/app/_hooks/haikudle';
import useOnboarding from '@/app/_hooks/onboarding';
import useUser from '@/app/_hooks/user';
import NotFound from '@/app/not-found';
import { ExperienceMode } from '@/types/ExperienceMode';
import { Haikudle } from '@/types/Haikudle';
import { LanguageType } from '@/types/Languages';
import { haikuGeneratedOnboardingSteps, haikuOnboardingSteps, haikuPromptSteps, haikudleOnboardingSteps } from '@/types/Onboarding';
import trackEvent from '@/utils/trackEvent';
import HaikudlePage from './HaikudlePage';
import { formatHaikuText } from './HaikuPoem';
import { useMounted } from '../_hooks/mounted';

export default function MainPage({
  mode,
  id,
  version,
  lang,
  refreshDelay,
  fontSize,
}: {
  mode: ExperienceMode,
  id?: string,
  version?: string,
  lang?: undefined | LanguageType,
  refreshDelay?: number,
  fontSize?: string | undefined,
}) {
  // console.log('>> app.MainPage.render()', { mode, id, lang });

  const haikuMode = mode == "haiku";
  const haikudleMode = mode == "haikudle";
  const showcaseMode = mode == "showcase";
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
    userHaikus,
    nextDailyHaikuId,
    nextDailyHaikudleId,
  ] = useUser((state: any) => [
    state.user,
    state.save,
    state.incUserUsage,
    state.getToken,
    state.haikus,
    state.nextDailyHaikuId,
    state.nextDailyHaikudleId,
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
    createDailyHaiku,
    haikuAction,
    saveHaiku,
  ] = useHaikus((state: any) => [
    state.loaded(haikuId),
    state.load,
    state.get,
    state.generate,
    state.regenerate,
    state.reset,
    state.delete,
    state.createDailyHaiku,
    state.action,
    state.save,
  ]);

  const [
    haikudleReady,
    haikudleLoaded,
    loadHaikudle,
    deleteHaikudle,
    haikudleHaiku,
    resetHaikudles,
    createHaikudle,
    haikudleInProgress,
    previousDailyHaikudleId,
    haikudleSolved,
    haikudleSolvedJustNow,
  ] = useHaikudle((state: any) => [
    state.ready,
    state.loaded(haikuId || { lang }),
    state.load,
    state.delete,
    state.haiku,
    state.reset,
    state.create,
    state.inProgress,
    state.previousDailyHaikudleId,
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

  const loaded = haikudleMode ? (haikudleLoaded && haikudleReady) /* || haikusLoaded */ : haikusLoaded;
  let [loading, setLoading] = useState(false);
  let [loadingUI, setLoadingUI] = useState(false);
  let [haiku, setHaiku] = useState<Haiku | undefined>();

  // const haikus = await loadHaikus(id);
  // const haiku = haikus?.haikus[0];
  loadHaikus(id).then((haikus: any) => {
    console.log("FDSFASS");
    setHaiku(haikus[0]);
  })

  let solvedHaikudleHaiku = {
    ...haiku,
    poem: haikudleInProgress
      .map((line: any) => line
        .map((word: any) => word.word)
        .join(" "))
  }

  const userGeneratedHaiku = haiku?.createdBy == user?.id && !user?.isAdmin;
  // console.log('>> app.MainPage.render()', { loading, loaded, haikuId, haiku_Id: haiku?.id, getHaiku: getHaiku(haikuId), haikudleHaiku });

  const isPuzzleMode = haikudleMode &&
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

  const loadPage = async (random?: boolean | undefined) => {
    // console.log('>> app.MainPage.loadPage', { haikuId, mode, random, loaded, loading, user, haiku });
    return;

    if (!loading) {
      loading = true; // race condition at initial load
      setLoading(true);
      setLoadingUI(true);

      haikudleMode
        ? loadHaikudle(haikuId || (random ? { random: true, lang } : { lang }))
          .then((haikudles: Haikudle | Haikudle[]) => {
            // console.log('>> app.MainPage.loadPage loadHaikudle.then', { haikudles });
            const loadedHaikudle = haikudles[0] || haikudles;
            setHaiku(loadedHaikudle?.haiku);
            setHaikuId(loadedHaikudle?.haiku?.id);
          })
        : loadHaikus(haikuId || (random ? { random: true, lang } : { lang }), mode, version)
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

    if (haiku.dailyHaikuId && haiku.dailyHaikudleId) {
      infoAlert(`This haiku is featured as both daily haiku and haikudle: ${haiku.dailyHaikuId} and ${haiku.dailyHaikudleId}`, {
        closeDelay: 3000
      });
      return;
    }

    if (haiku.dailyHaikuId) {
      infoAlert(`This haiku is featured as a daily haiku: ${haiku.dailyHaikuId}`, {
        closeDelay: 3000
      });
      return;
    }

    if (haiku.dailyHaikudleId) {
      infoAlert(`This haiku is featured as a daily haikudle: ${haiku.dailyHaikudleId}`, {
        closeDelay: 3000
      });
      return;
    }

    if (haiku.status == "created" && !isCorrect) {
      warningAlert(`This haiku doesn't follow the correct form of 5/7/5 syllables: ${syllables.join("/")}`, {
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
          if (haikudleMode) {
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
  }, [haikuId, haiku?.id, haiku?.version, loading, loaded]);

  useEffect(() => {
    // console.log('>> app.page useEffect []', { user, haikudleReady, previousDailyHaikudleId, userGeneratedHaiku, preferences: user?.preferences, test: !user?.preferences?.onboarded });
    // @ts-ignore
    let timeoutId;
    if (user && (haikudleMode && haikudleReady || !haikudleMode)) {
      if (previousDailyHaikudleId && !user?.preferences?.onboardedPreviousDaily) {
        timeoutId = setTimeout(showAboutPreviousDaily, 2000);
      } else if (userGeneratedHaiku && !user?.preferences?.onboardedGenerated) {
        timeoutId = setTimeout(showAboutGenerated, 2000);
      } else if ((haikuMode || haikudleMode) && !previousDailyHaikudleId && !user?.preferences?.onboarded) {
        timeoutId = setTimeout(haikudleMode ? startFirstVisitHaikudleOnboarding : startFirstVisitOnboarding, 2000);
      }
    }

    return () => {
      // @ts-ignore
      timeoutId && clearTimeout(timeoutId);
    }
  }, [user, haikudleReady, previousDailyHaikudleId, userGeneratedHaiku]);

  useEffect(() => {
    // console.log('>> app.page useEffect [haiku?.id, loadingUI, isShowcaseMode, _refreshDelay]', { haiku_id: haiku?.id, loadingUI, isShowcaseMode, _refreshDelay });

    if (showcaseMode && !loadingUI && _refreshDelay) {
      window.history.replaceState(null, '', `/${haiku?.id || ""}?mode=showcase${_refreshDelay ? `&refreshDelay=${_refreshDelay}` : ""}${fontSize ? `&fontSize=${encodeURIComponent(fontSize)}` : ""}`);
      // setRefreshTimeout(setTimeout(loadRandom, _refreshDelay));
      setRefreshTimeout(setTimeout(loadHomePage, _refreshDelay));
    }

    // in case we're in showcase mode and refresh didn't work:
    // refresh after loading for 10 seconds
    const retryInterval = loadingUI && showcaseMode && setInterval(() => {
      // console.log('>> app.page useEffect [loadingUI, isShowcaseMode] forcing refresh after waiting too long');
      setLoadingUI(false);
      document.location.href = `/${haiku?.id || ""}?mode=showcase${_refreshDelay ? `&refreshDelay=${_refreshDelay}${fontSize ? `&fontSize=${encodeURIComponent(fontSize)}` : ""}` : ""}`;
    }, 10000);

    return () => {
      retryInterval && clearInterval(retryInterval);

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        setRefreshTimeout(undefined);
      }
    }
  }, [haiku?.id, loadingUI, showcaseMode, _refreshDelay]);

  // TODO update haikudle onboarding with this variation
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

  const saveUserOnboarded = () => {
    saveUser({
      ...user,
      preferences: {
        ...user.preferences, onboarded: true
      }
    });
  };

  const startFirstVisitHaikudleOnboarding = () => {
    // show first message normally then show as onboarding: 
    // first step is just a plain alert, rest of steps are onboarding
    plainAlert(haikudleOnboardingSteps[0].message, {
      onDismiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
      style: haikudleOnboardingSteps[0].style,
      customActions: [
        {
          label: "Close",
          action: "close"
        },
        {
          label: "Tell me more!",
          action: () => {
            trackEvent("onboarding-started", {
              userId: user.id,
              type: "haikudle-fist-visit",
            });

            startOnboarding(
              haikudleOnboardingSteps.slice(1),
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-dismissed", {
                  userId: user.id,
                  type: "haikudle-fist-visit",
                });
              },
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-completed", {
                  userId: user.id,
                  type: "haikudle-fist-visit",
                });
              }
            );
          }
        },
      ]
    });
  }

  const startFirstVisitOnboarding = () => {
    // show first message normally then show as onboarding: 
    // first step is just a plain alert, rest of steps are onboarding
    plainAlert(haikuOnboardingSteps[0].message, {
      onDismiss: () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
      style: haikuOnboardingSteps[0].style,
      customActions: [
        {
          label: "Close",
          action: "close"
        },
        {
          label: "Tell me more!",
          action: () => {
            trackEvent("onboarding-started", {
              userId: user.id,
              type: "haiku-fist-visit",
            });

            startOnboarding(
              haikuOnboardingSteps.slice(1),
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-dismissed", {
                  userId: user.id,
                  type: "haiku-fist-visit",
                });
              },
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-completed", {
                  userId: user.id,
                  type: "haiku-fist-visit",
                });
              }
            );
          }
        },
      ]
    });
  }

  const showAboutGenerated = () => {
    startOnboarding(
      haikuGeneratedOnboardingSteps(haiku),
      () => saveUser({ ...user, preferences: { ...user.preferences, onboardedGenerated: true } })
    );
  }

  const showHaikuDetails = () => {
    startOnboarding(
      haikuPromptSteps(haiku),
      // () => saveUser({ ...user, preferences: { ...user.preferences, onboardedGenerated: true } })
    );
  }

  const startGenerateHaiku = async (theme?: string) => {
    // console.log('>> app.page.startGenerateHaiku()', { theme });
    trackEvent("clicked-generate-haiku", {
      userId: user?.id,
      theme,
    });

    const subject = typeof (theme) == "undefined"
      ? prompt(`Haiku's theme or subject? ${process.env.OPENAI_API_KEY == "DEBUG" ? "(Use 'DEBUG' for simple test poem)" : "(For example 'nature', 'cherry blossoms', or leave blank)"}`)
      : theme;

    if (typeof (subject) == "string") {
      const artStyle = ""; //prompt(`Art style? (For example 'watercolor', 'Japanese woodblock print', 'abstract oil painting with large strokes', or leave blank for a style picked at random)"`);

      resetAlert();
      setGenerating(true);
      const ret = await generateHaiku(user, { lang, subject, artStyle });
      // console.log('>> app.page.startGenerateHaiku()', { ret });

      if (ret?.id) {
        incUserUsage(user, "haikusCreated");
        setHaikuId(ret.id);
        window.history.replaceState(null, '', `/${ret.id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
        setGenerating(false);
      }
    } else {
      trackEvent("cancelled-generate-haiku", {
        userId: user?.id,
      });
    }
  }

  const startRegenerateHaiku = async () => {
    // console.log('>> app.page.startRegenerateHaiku()');

    trackEvent("clicked-regenerate-haiku", {
      userId: user?.id,
    });

    if (user?.isAdmin || haiku?.createdBy == user.id) {
      resetAlert();
      setRegenerating(true);
      const ret = await regenerateHaiku(user, haiku, "poem");
      // console.log('>> app.page.startRegenerateHaiku()', { ret });
      incUserUsage(user, "haikusRegenerated");
      setHaiku(ret);
      setRegenerating(false);
    }
  }

  const startRegenerateHaikuImage = async () => {
    // console.log('>> app.page.startRegenerateHaiku()');

    trackEvent("clicked-regenerate-image", {
      userId: user?.id,
    });

    if (user?.isAdmin || haiku?.createdBy == user.id) {
      const artStyle = user.isAdmin
        ? prompt(`Art style? (For example 'watercolor', 'Japanese woodblock print', 'abstract oil painting with large strokes', or leave blank for a style picked at random)"`, haiku.artStyle)
        : "";

      if (typeof (artStyle) == "string") {
        resetAlert();
        setRegenerating(true);
        const ret = await regenerateHaiku(user, haiku, "image", { artStyle });
        // console.log('>> app.page.startRegenerateHaiku()', { ret });
        incUserUsage(user, "haikusCreated"); // TODO haikuImageRegenerated?
        setHaiku(ret);
        setRegenerating(false);
      } else {
        trackEvent("cancelled-regenerate-image", {
          userId: user?.id,
        });
      }
    }
  }

  const loadRandom = () => {
    return;
    // console.log('>> app.page.loadRandom()', {});

    if (/* haikudleMode && */ !user.isAdmin) {
      return loadHomePage();
    }

    if (haikuId) {
      window.history.replaceState(null, '', `/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
    }

    // resetAlert();
    setLoading(true);
    setLoadingUI(true);
    // loadingUI = true;
    // setHaiku(undefined); // keep the old one around to smooth out style transition
    setHaikuId(undefined);

    haikudleMode
      ? loadHaikudle(haikuId || { random: true, lang })
        .then((haikudles: Haikudle | Haikudle[]) => {
          // console.log('>> app.MainPage.loadPage loadRandom.then', { haikudles });
          const loadedHaikudle = haikudles[0] || haikudles;
          setHaiku(loadedHaikudle?.haiku);
          setHaikuId(loadedHaikudle?.haiku?.id);
        })
      : loadHaikus({ random: true, lang }, mode, version)
        .then((haikus: Haiku | Haiku[]) => {
          // console.log('>> app.MainPage.loadPage loadRandom.then', { haikus });
          const loadedHaiku = haikus[0] || haikus;
          window.history.replaceState(null, '', `/${loadedHaiku?.id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
          setHaiku(loadedHaiku);
          setHaikuId(loadedHaiku?.id);
        });


  }

  const loadHomePage = () => {
    // console.log('>> app.page.loadHomePage()', { mode });
    trackEvent("clicked-logo", {
      userId: user?.id,
    });

    window.history.replaceState(null, '', `/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);

    resetAlert();
    setLoadingUI(true);
    // setHaiku(undefined); // keep the old one around to smooth out style transition
    setHaikuId(undefined);
    // loadPage(); //useEffect will kick off
  }

  const switchMode = async (newMode?: string) => {
    // console.log('>> app.page.switchMode()', { mode, newMode });
    const url = newMode
      ? `/${haikuId || ""}?mode=${newMode}`
      // @ts-ignore
      : `/${haikuId || ""}?mode=${mode == "haiku" ? "haikudle" : mode != "haiku" ? "haiku" : process.env.EXPERIENCE_MODE}`

    setLoadingUI(true);
    window.history.replaceState(null, '', url);
    document.location.href = url;
  };

  const doDelete = async () => {
    // console.log('>> app.page.doDelete()', {});
    if (haikudleMode) {
      if (haiku?.id && confirm("Delete this Haikudle?")) {
        window.history.replaceState(null, '', `/`);
        deleteHaikudle(haiku.id); // don't wait
        loadHomePage();
      }
    } else {
      if (haiku?.id && confirm("Delete this Haiku (and any associated Haikudle)?")) {
        window.history.replaceState(null, '', `/`);
        deleteHaiku(haiku.id); // don't wait
        loadHomePage();
      }
    }
  }

  const saveDailyHaiku = () => {
    // console.log('>> app._components.MainPage.saveDailyHaiku()', {});
    if (haikudleMode) {
      const ret = prompt("YYYYMMDD?", nextDailyHaikudleId || moment().format("YYYYMMDD"));
      if (ret) {
        createHaikudle(user, {
          id: haiku?.id,
          dateCode: ret,
          haikuId: haiku?.id,
          inProgress: haikudleInProgress,
        });
      }
    } else {
      const ret = prompt("YYYYMMDD?", nextDailyHaikuId || moment().format("YYYYMMDD"));
      if (ret) {
        createDailyHaiku(ret, haiku?.id);
      }
    }
  }

  const selectHaiku = (id: string) => {
    // console.log('>> app._components.MainPage.selectHaiku()', { id, loading, loaded, haikuId, haiku_id: haiku?.id });

    if (id == haikuId) return;

    trackEvent("haiku-selected", {
      userId: user?.id,
      haikuId: id,
    });

    setHaikuId(id);
    window.history.replaceState(null, '', `/${id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
  }

  const changeRefreshDelay = (val: number) => {
    setRefreshDelay(val);
    window.history.replaceState(null, '', `/${haiku?.id || ""}$?mode=showcase&refreshDelay=${val}${fontSize ? `&fontSize=${encodeURIComponent(fontSize)}` : ""}`);

    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(undefined);
    }

    setRefreshTimeout(setTimeout(loadRandom, val));

    plainAlert(
      `Refreshing every ${moment.duration(val).humanize()} (${Math.floor(val / 1000)} seconds)`,
      { closeDelay: 1000 }
    );
  }

  const startBackup = async () => {
    // console.log('>> app._components.MainPage.startBackup()', {});

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

  const copyHaiku = () => {
    if (haikudleMode && haikudleSolved || !haikudleMode) {
      navigator.clipboard.writeText(formatHaikuText(haikudleSolved ? solvedHaikudleHaiku : haiku, mode));
      plainAlert(`Haiku poem copied to clipboard`, { closeDelay: 750 });
    }
  }

  const doSaveHaiku = async (haiku: Haiku) => {
    // console.log(">> app.MainPage.doSaveHaiku", { haiku });
    const savedHaiku = await saveHaiku(user, haiku);
    // console.log(">> app.MainPage.doSaveHaiku", { savedHaiku });
    setHaiku(savedHaiku);
    setHaikuId(savedHaiku?.id);

    return savedHaiku;
  }

  const copyLink = () => {
    if (haikudleMode && haikudleSolved || !haikudleMode) {
      navigator.clipboard.writeText(`${mode == "haikudle" ? "https://haikudle.art" : "https://haikugenius.io"}/${haiku.id}`);
      plainAlert(`Link to this haiku copied to clipboard`, { closeDelay: 750 });
      trackEvent("haiku-shared", {
        userId: user.id,
        id: haiku.id,
      });
    }
  }

  const likeHaiku = () => {
    // console.log('>> app._components.MainPage.likeHaiku()', { haikuId });

    const userHaiku = userHaikus[haiku.id];
    const value = userHaiku?.likedAt ? undefined : moment().valueOf();

    return haikuAction(haikuId, "like", value);
  }

  if (!loaded || loading || loadingUI || generating) {
    return (
      <div>
        {haiku?.bgColor &&
          <style
            dangerouslySetInnerHTML={{
              __html: `
                body {
                  background-color: ${haiku?.bgColor};         
                }
              `
            }}
          />
        }
        <NavOverlay loading={true} mode={mode} styles={textStyles.slice(0, textStyles.length - 3)} altStyles={altTextStyles} onClickLogo={loadHomePage} />
        <Loading styles={textStyles} />
        {/* <HaikuPage mode={mode} loading={true} haiku={loadingHaiku} styles={textStyles} />       */}
      </div>
    )
  }

  if (loaded && !loading && !haiku) {
    return <NotFound mode={mode} lang={lang} onClickGenerate={startGenerateHaiku} onClickLogo={loadHomePage} />
  }

  return (
    <div className="_bg-yellow-200 main-page relative h-[100vh] w-[100vw]">
      <NavOverlay
        mode={mode}
        lang={lang}
        haiku={{
          ...(haikudleSolved ? solvedHaikudleHaiku : haiku),
          likedAt: userHaikus[haiku.id]?.likedAt,
        }}
        refreshDelay={_refreshDelay}
        backupInProgress={backupInProgress}
        styles={textStyles.slice(0, textStyles.length - 3)}
        altStyles={altTextStyles}
        onboardingElement={onboardingElement}
        onClickLogo={loadHomePage}
        onClickGenerate={startGenerateHaiku}
        onClickRandom={loadRandom}
        onSwitchMode={switchMode}
        onDelete={doDelete}
        onSaveDailyHaiku={saveDailyHaiku}
        onShowAbout={
          user?.isAdmin
            ? showHaikuDetails
            : userGeneratedHaiku
              ? showAboutGenerated
              : haikudleMode
                ? previousDailyHaikudleId
                  ? showAboutPreviousDaily // with onboarding?
                  : startFirstVisitHaikudleOnboarding
                : startFirstVisitOnboarding
        }
        onSelectHaiku={selectHaiku}
        onChangeRefreshDelay={changeRefreshDelay}
        onBackup={startBackup}
        onCopyHaiku={(haikudleMode && haikudleSolved || !haikudleMode) && copyHaiku}
        onCopyLink={(haikudleMode && haikudleSolved || !haikudleMode) && copyLink}
        onLikeHaiku={(haikudleMode && haikudleSolved || !haikudleMode) && likeHaiku}
      />

      {isPuzzleMode &&
        <HaikudlePage
          mode={mode}
          haiku={haiku}
          styles={textStyles}
          regenerating={regenerating}
          onboardingElement={onboardingElement}
        />
      }

      {!isPuzzleMode &&
        <HaikuPage
          mode={mode}
          haiku={haikudleSolved ? solvedHaikudleHaiku : haiku}
          styles={textStyles}
          altStyles={altTextStyles}
          fontSize={fontSize}
          popPoem={haikudleMode && haikudleSolvedJustNow}
          regenerating={regenerating}
          onboardingElement={onboardingElement}
          refresh={loadRandom}
          saveHaiku={doSaveHaiku}
          regeneratePoem={() => ["haiku", "haikudle"].includes(mode) && (user?.isAdmin || haiku?.createdBy == user?.id) && startRegenerateHaiku && startRegenerateHaiku()}
          regenerateImage={() => ["haiku", "haikudle"].includes(mode) && (user?.isAdmin || haiku?.createdBy == user?.id) && startRegenerateHaikuImage && startRegenerateHaikuImage()}
          copyHaiku={copyHaiku}
        />
      }
    </div>
  )
}
