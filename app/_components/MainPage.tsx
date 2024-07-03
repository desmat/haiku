'use client'

import moment from 'moment';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Haiku, haikuStyles } from "@/types/Haiku";
import { NavOverlay } from '@/app/_components/nav/NavOverlay';
import Loading from "@/app/_components/Loading";
import HaikuPage from '@/app/_components/HaikuPage';
import useAlert from '@/app/_hooks/alert';
import useHaikus from "@/app/_hooks/haikus";
import useHaikudle from '@/app/_hooks/haikudle';
import useOnboarding from '@/app/_hooks/onboarding';
import useUser from '@/app/_hooks/user';
import NotFound from '@/app/not-found';
import trackEvent from '@/utils/trackEvent';
import { ExperienceMode } from '@/types/ExperienceMode';
import { Haikudle } from '@/types/Haikudle';
import { LanguageType } from '@/types/Languages';
import { defaultPresetLayout, presetLayouts } from '@/types/Layout';
import { haikuGeneratedOnboardingSteps, haikuMultiLanguageSteps, haikuOnboardingSteps, haikuPromptSteps, haikudleGotoHaikuGenius, haikudleOnboardingSteps, notShowcase_notOnboardedFirstTime_onboardedShowcase, showcase_notOnboardedFirstTime, showcase_onboardedFirstTime, showcase_onboardedFirstTime_admin, limerickPromptSteps } from '@/types/Onboarding';
import { User } from '@/types/User';
import HaikudlePage from './HaikudlePage';
import { formatHaikuText } from './HaikuPoem';

export default function MainPage({
  haiku: _haiku,
  haikudle: _haikudle,
  mode,
  lang,
  refreshDelay,
  fontSize,
  noOnboarding,
}: {
  haiku: Haiku,
  haikudle?: Haikudle,
  mode: ExperienceMode,
  lang?: undefined | LanguageType,
  refreshDelay?: number,
  fontSize?: string | undefined,
  noOnboarding?: boolean | undefined,
}) {
  // console.log('>> app.MainPage.render()', { mode, lang, _haiku, _haikudle });

  const haikuMode = mode == "haiku";
  const haikudleMode = mode == "haikudle";
  const showcaseMode = mode == "showcase";
  // TODO clean up generatedJustNow business
  let [haiku, setHaiku] = useState<Haiku | undefined>({ ..._haiku, generatedJustNow: false });
  let [haikudle, setHaikudle] = useState<Haiku | undefined>(_haikudle);
  let [haikuId, setHaikuId] = useState(_haiku?.id);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [_refreshDelay, setRefreshDelay] = useState(refreshDelay || 24 * 60 * 60 * 1000); // every day
  const [refreshTimeout, setRefreshTimeout] = useState<any>();
  const [backupInProgress, setBackupInProgress] = useState(false);
  const previousDailyHaikudleId = haiku?.previousDailyHaikudleId || haikudle?.previousDailyHaikudleId;

  // console.log('>> app.MainPage.render()', { previousDailyHaikudleId });

  const [
    user,
    saveUser,
    incUserUsage,
    getUserToken,
    userHaikus,
    nextDailyHaikuId,
    nextDailyHaikudleId,
    userLoaded,
    userLoading,
    loadUser,
    addUserHaiku,
  ] = useUser((state: any) => [
    state.user,
    state.save,
    state.incUserUsage,
    state.getToken,
    state.haikus,
    state.nextDailyHaikuId,
    state.nextDailyHaikudleId,
    state.loaded,
    state.loading,
    state.load,
    state.addUserHaiku,
  ]);

  const [
    resetAlert,
    plainAlert,
    warningAlert,
    infoAlert,
    errorAlert,
  ] = useAlert((state: any) => [
    state.reset,
    state.plain,
    state.warning,
    state.info,
    state.error,
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
    initHaiku,
    uploadHaikuImage,
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
    state.init,
    state.uploadImage,
  ]);

  let [
    haikudleReady,
    haikudleLoaded,
    loadHaikudle,
    deleteHaikudle,
    createHaikudle,
    haikudleInProgress,
    haikudleSolved,
    haikudleSolvedJustNow,
  ] = useHaikudle((state: any) => [
    state.ready,
    state.loaded(haikuId || { lang }),
    state.load,
    state.delete,
    state.create,
    state.inProgress,
    state.solved,
    state.solvedJustNow,
  ]);

  // let [haikudleLoaded, setHaikudleLoaded] = useState(false);

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

  // console.log('>> app.MainPage.render()', { loadingUI, generating, haikudleLoaded, haikudleReady });

  let solvedHaikudleHaiku = {
    ...haiku,
    poemHashed: false,
    poem: haikudleInProgress
      .map((line: any) => line
        .map((word: any) => word.word)
        .join(" "))
  }

  const userGeneratedHaiku = haiku?.createdBy == user?.id && !user?.isAdmin;
  // console.log('>> app.MainPage.render()', { loading, loaded, haikuId, haiku_Id: haiku?.id, getHaiku: getHaiku(haikuId), haikudleHaiku });

  const isPuzzleMode = haikudleMode &&
    !haikudleSolved &&
    (!previousDailyHaikudleId || user?.isAdmin);
  //&& (!(haiku?.createdBy == user?.id) || user?.isAdmin);
  // console.log('>> app.MainPage.render()', { isPuzzleMode, haikudleSolved, previousDailyHaikudleId, user_isAdmin: user?.isAdmin, haiku_createdBy: haiku?.createdBy });

  const { textStyles, altTextStyles } = haikuStyles(haiku);

  // console.log('>> app.MainPage.render()', { haikuId, mode, loaded, loading, user, haiku });

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
        <div>This was ${previousDailyHaikudleDate.calendar(null, calendarFormat)}'s daily haiku puzzle, try solving <b><a href="https://haikudle.art/">today's Haikudle</a></b>!</div>
        </div>`, {
      onDismiss: () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedPreviousDaily: true } }),
      closeLabel: "Got it!",
      style: { bottom: "50%", transform: "translateY(50%)" },
    });
  }

  const saveUserOnboarded = () => {
    saveUser({
      ...user,
      preferences: {
        ...user?.preferences,
        onboarded: true,
        onboardedMultiLanguage: true,
        onboardedGotoHaikuGenius: true,
      }
    });
  };

  const startFirstVisitHaikudleOnboarding = () => {
    // show first message normally then show as onboarding: 
    // first step is just a plain alert, rest of steps are onboarding
    plainAlert(haikudleOnboardingSteps[0].message, {
      onDismiss: () => saveUser({
        ...user,
        preferences: {
          ...user?.preferences,
          onboarded: true,
          onboardedGotoHaikuGenius: true,
        }
      }),
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
              userId: user?.id,
              type: "haikudle-fist-visit",
            });

            startOnboarding(
              haikudleOnboardingSteps.slice(1),
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-dismissed", {
                  userId: user?.id,
                  type: "haikudle-fist-visit",
                });
              },
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-completed", {
                  userId: user?.id,
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
    // console.log('>> app.page.startFirstVisitOnboarding()', { user });

    const firstStep = user?.preferences?.onboardedShowcase
      ? notShowcase_notOnboardedFirstTime_onboardedShowcase[0]
      : haikuOnboardingSteps[0];

    // show first message normally then show as onboarding: 
    // first step is just a plain alert, rest of steps are onboarding
    plainAlert(firstStep.message, {
      onDismiss: saveUserOnboarded,
      style: firstStep.style,
      customActions: [
        {
          label: "Close",
          action: "close"
        },
        {
          label: "Tell me more!",
          action: () => {
            trackEvent("onboarding-started", {
              userId: user?.id,
              type: "haiku-fist-visit",
            });

            startOnboarding(
              haikuOnboardingSteps.slice(1),
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-dismissed", {
                  userId: user?.id,
                  type: "haiku-fist-visit",
                });
              },
              () => {
                saveUserOnboarded();
                trackEvent("onboarding-completed", {
                  userId: user?.id,
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
      () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedGenerated: true } })
    );
  }

  const showMultiLanguage = () => {
    startOnboarding(
      haikuMultiLanguageSteps(haiku),
      () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedMultiLanguage: true } })
    );
  }

  const showGotoHaikuGenius = () => {
    startOnboarding(
      haikudleGotoHaikuGenius(haiku),
      () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedGotoHaikuGenius: true } })
    );
  }

  const showHaikuError = () => {
    //@ts-ignore
    ["404notfound", "429error"].includes(haiku.id)
      ? warningAlert(haiku.error)
      : errorAlert(haiku.error);
  }

  const showHaikuDetails = () => {
    startOnboarding(
      haikuPromptSteps(haiku),
      // () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedGenerated: true } })
    );
  }

  const showLimerickDetails = () => {
    startOnboarding(
      limerickPromptSteps(haiku),
      // () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedGenerated: true } })
    );
  }

  const startGenerateHaiku = async (theme?: string) => {
    // console.log('>> app.page.startGenerateHaiku()', { theme });
    trackEvent("clicked-generate-haiku", {
      userId: user?.id,
      theme,
    });

    const subject = typeof (theme) == "undefined"
      ? prompt(`Limerick starting with? ${process.env.OPENAI_API_KEY == "DEBUG" ? "(Use 'DEBUG' for simple test)" : ""}`, "There once was a man")
      : theme;

    if (typeof (subject) == "string") {
      const artStyle = ""; //prompt(`Art style? (For example 'watercolor', 'Japanese woodblock print', 'abstract oil painting with large strokes', or leave blank for a style picked at random)"`);

      resetAlert();
      setGenerating(true);
      const ret = await generateHaiku(user, { lang, subject, artStyle });
      // console.log('>> app.page.startGenerateHaiku()', { ret });

      if (ret?.id) {
        incUserUsage(user, "haikusCreated");
        if (haikudleMode) {
          loadHaiku(ret.id);
        } else {
          setHaikuId(ret.id);
          setHaiku({
            ...ret,
            generatedJustNow: true,
          });
          window.history.replaceState(null, '', `/${ret.id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
        }
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
      id: haiku?.id,
    });

    if (user?.isAdmin || haiku?.createdBy == user?.id) {
      resetAlert();
      setLoadingUI(true);
      setRegenerating(true);
      const ret = await regenerateHaiku(user, haiku, "poem");
      console.log('>> app.page.startRegenerateHaiku()', { ret });
      incUserUsage(user, "haikusRegenerated");
      setHaiku({ ...ret, generatedJustNow: false });
      setLoadingUI(false);
      setRegenerating(false);
    }
  }

  const startRegenerateHaikuImage = async () => {
    // console.log('>> app.page.startRegenerateHaiku()');

    trackEvent("clicked-regenerate-image", {
      userId: user?.id,
      id: haiku?.id,
    });

    if (user?.isAdmin || haiku?.createdBy == user?.id) {
      const artStyle = user?.isAdmin
        ? prompt(`Art style? (For example 'watercolor', 'Japanese woodblock print', 'abstract oil painting with large strokes', or leave blank for a style picked at random)"`, haiku.artStyle)
        : "";

      if (typeof (artStyle) == "string") {
        resetAlert();
        setLoadingUI(true);
        const ret = await regenerateHaiku(user, haiku, "image", { artStyle });
        // console.log('>> app.page.startRegenerateHaiku()', { ret });
        incUserUsage(user, "haikusRegenerated"); // TODO haikuImageRegenerated?
        setHaiku({ ...ret, generatedJustNow: false });
        setLoadingUI(false);
      } else {
        trackEvent("cancelled-regenerate-image", {
          userId: user?.id,
        });
      }
    }
  }

  const loadRandom = () => {
    // return;
    // console.log('>> app.page.loadRandom()', {});

    if (/* haikudleMode && */ !user?.isAdmin) {
      return loadHaiku();
    }

    if (haikuId) {
      window.history.replaceState(null, '', `/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
    }

    // resetAlert();
    setLoading(true);
    setLoadingUI(true);
    setHaikuId(undefined);
    setHaiku({ ...haiku, poem: undefined }); // keep parts of the old one around to smooth out style transition
    setHaikudle(undefined);

    haikudleMode
      ? loadHaikudle(haikuId || { random: true, lang })
        .then((haikudles: Haikudle | Haikudle[]) => {
          // console.log('>> app.MainPage.loadPage loadRandom.then', { haikudles });
          const loadedHaikudle = haikudles[0] || haikudles;
          setHaiku({ ...loadedHaikudle?.haiku, generatedJustNow: false });
          setHaikuId(loadedHaikudle?.haiku?.id);
          setHaikudle(loadedHaikudle);
          setLoadingUI(false);
        })
      : loadHaikus({ random: true, lang }, mode)
        .then((haikus: Haiku | Haiku[]) => {
          // console.log('>> app.MainPage.loadPage loadRandom.then', { haikus });
          const loadedHaiku = haikus[0] || haikus;
          window.history.replaceState(null, '', `/${loadedHaiku?.id}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
          setHaiku({ ...loadedHaiku, generatedJustNow: false });
          setHaikuId(loadedHaiku?.id);
          setLoadingUI(false);
        });
  }

  const loadHaiku = (haikuId?: string) => {
    // console.log('>> app.page.loadHaiku()', { mode, haikuId });
    resetAlert();
    setLoadingUI(true);
    setHaikuId(undefined);
    setHaiku({ ...haiku, poem: undefined }); // keep parts of the old one around to smooth out style transition
    setHaikudle(undefined);

    haikudleMode
      ? loadHaikudle(haikuId || { lang }).then((haikudles: any) => {
        // console.log('>> app.MainPage.loadHaiku loadHaikudle.then', { haikudles });
        const loadedHaikudle = haikudles[0] || haikudles;
        setHaiku(loadedHaikudle?.haiku);
        setHaikuId(loadedHaikudle?.haiku?.id);
        setHaikudle(loadedHaikudle);
        setLoadingUI(false);
        window.history.replaceState(null, '', `/${haikuId || ""}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
      })
      : loadHaikus(haikuId || { lang }, mode)
        .then((haikus: Haiku | Haiku[]) => {
          // console.log('>> app.MainPage.loadHaiku loadHaikus.then', { haikus });
          const loadedHaiku = haikus[0] || haikus;
          setHaiku({ ...loadedHaiku, generatedJustNow: false });
          setHaikuId(loadedHaiku?.id);
          setLoadingUI(false);
          window.history.replaceState(null, '', `/${haikuId || ""}${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
        });
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
        loadHaiku();
      }
    } else {
      if (haiku?.id && confirm("Delete this Haiku (and any associated Haikudle)?")) {
        window.history.replaceState(null, '', `/`);
        deleteHaiku(haiku.id); // don't wait
        loadHaiku();
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
    // const filename = prompt("File url to restore?");
    // if (!filename) return;
    // const res = await fetch(`/api/admin/restore?filename=${filename}`, {
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
      plainAlert(`Limerick copied to clipboard`, { closeDelay: 750 });
      haikuAction(haikuId, "share");
      trackEvent("haiku-poem-copied", {
        userId: user?.id,
        id: haiku.id,
      });
    }
  }

  const doSaveHaiku = async (haiku: Haiku) => {
    // console.log(">> app.MainPage.doSaveHaiku", { haiku });
    const savedHaiku = await saveHaiku(user, haiku);
    // console.log(">> app.MainPage.doSaveHaiku", { savedHaiku });
    setHaiku({ ...savedHaiku, generatedJustNow: false });
    setHaikuId(savedHaiku?.id);

    return savedHaiku;
  }

  const copyLink = () => {
    if (haikudleMode && haikudleSolved || !haikudleMode) {
      const version = (haiku.deprecated || haiku.deprecatedAt) && haiku.version;
      navigator.clipboard.writeText(`https://limericks.ai/${haiku.id}${version ? `:${version}` : ""}`);
      plainAlert(`Link to this limerick copied to clipboard`, { closeDelay: 750 });
      haikuAction(haikuId, "share");
      trackEvent("haiku-shared", {
        userId: user?.id,
        id: haiku.id,
      });
    }
  }

  const likeHaiku = () => {
    // console.log('>> app._components.MainPage.likeHaiku()', { haikuId });

    const userHaiku = userHaikus[haiku.id];
    const value = userHaiku?.likedAt ? undefined : moment().valueOf();

    haikuAction(haikuId, "like", value).then((haiku: Haiku) => {
      setHaiku({ ...haiku, generatedJustNow: false });
    })
  }

  const uploadImage = (file: File) => {
    // console.log('>> app._components.MainPage.uploadImage()', { haikuId, file });
    setLoadingUI(true);
    uploadHaikuImage(haikuId, file).then((haiku: Haiku) => {
      setHaiku({ ...haiku, generatedJustNow: false });
      setLoadingUI(false);
    }).catch((error: any) => {
      console.error('>> app._components.MainPage.uploadImage()', { error });
      setLoadingUI(false);
    });
  }

  const updateHaikuImage = () => {
    // console.log('>> app._components.MainPage.updateHaikuImage()', { haikuId });

    const url = prompt("Image URL?");

    if (typeof (url) == "string") {
      // console.log('>> app._components.MainPage.updateHaikuImage()', { url });    
      setLoadingUI(true);
      haikuAction(haikuId, "updateImage", url).then((haiku: Haiku) => {
        setHaiku({ ...haiku, generatedJustNow: false });
        setLoadingUI(false);
      }).catch((error: any) => {
        console.error('>> app._components.MainPage.updateHaikuImage()', { error });
        setLoadingUI(false);
      });
    }
  }

  const debounceSaveHaiku = useDebouncedCallback(async (haiku: Haiku, then?: any) => {
    // console.log('>> app.page.debounceSaveLayout()', { haiku });
    const ret = await saveHaiku(user, haiku);
    // console.log('>> app.page.debounceSaveLayout() Layout adjustment saved', { ret });
    then && then(ret);
  }, 500);

  const cycleLayout = async (previous?: boolean) => {
    // console.log('>> app.page.cycleLayout()', { previous });

    let preset = (typeof (haiku?.layout?.preset) == "number"
      ? haiku?.layout?.preset
      : defaultPresetLayout)
      + (previous ? -1 : 1);
    // console.log('>> app.page.cycleLayout()', { preset });

    if (preset >= presetLayouts.length) preset = 0;
    if (preset < 0) preset = presetLayouts.length - 1;
    // console.log('>> app.page.cycleLayout()', { preset });

    const updatedHaiku = {
      ...haiku,
      layout: {
        ...haiku.layout,
        ...{
          preset,
          custom: presetLayouts[preset]
        },
      }
    };

    setHaiku(updatedHaiku);
    debounceSaveHaiku(updatedHaiku, (haiku: Haiku) => {
      // console.log('>> app.page.cycleLayout()', { savedHaiku: haiku });
      // plainAlert("Layout adjustments saved", { closeDelay: 750 });
      trackEvent("layout-updated", {
        userId: user?.id,
        id: haiku?.id,
      });
    });
  }

  // useEffect(() => {
  //   // console.log('>> app.page useEffect []', { user, haikudleReady, previousDailyHaikudleId, userGeneratedHaiku, preferences: user?.preferences, test: !user?.preferences?.onboarded });
  //   // @ts-ignore
  //   let timeoutId;
  //   if (!noOnboarding && user && (haikudleMode && (previousDailyHaikudleId || haikudleReady) || !haikudleMode)) {
  //     if (previousDailyHaikudleId && !user?.preferences?.onboardedPreviousDaily) {
  //       timeoutId = setTimeout(showAboutPreviousDaily, 2000);
  //     } else if (userGeneratedHaiku && !haikudleMode && !user?.preferences?.onboardedGenerated) {
  //       timeoutId = setTimeout(showAboutGenerated, 2000);
  //     } else if ((haikuMode || haikudleMode) && !previousDailyHaikudleId && !user?.preferences?.onboarded) {
  //       timeoutId = setTimeout(haikudleMode ? startFirstVisitHaikudleOnboarding : startFirstVisitOnboarding, 2000);
  //     } else if (haikuMode && user?.preferences?.onboarded && !user?.preferences?.onboardedMultiLanguage && !user?.isAdmin) {
  //       timeoutId = setTimeout(showMultiLanguage, 2000);
  //     } else if (haikudleMode && user?.preferences?.onboarded && !user?.preferences?.onboardedGotoHaikuGenius && !user?.isAdmin) {
  //       timeoutId = setTimeout(showGotoHaikuGenius, 2000);
  //     } else if (showcaseMode && user?.preferences?.onboarded && !user?.preferences?.onboardedShowcase && !user?.isAdmin) {
  //       timeoutId = setTimeout(
  //         () => startOnboarding(
  //           showcase_onboardedFirstTime,
  //           () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedShowcase: true } })
  //         ),
  //         2000);
  //     } else if (showcaseMode && user?.preferences?.onboarded && !user?.preferences?.onboardedShowcase && user?.isAdmin) {
  //       timeoutId = setTimeout(
  //         () => startOnboarding(
  //           showcase_onboardedFirstTime_admin,
  //           () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedShowcase: true } })
  //         ),
  //         2000);
  //     } else if (showcaseMode && !user?.preferences?.onboarded && !user?.preferences?.onboardedShowcase) {
  //       timeoutId = setTimeout(
  //         () => startOnboarding(
  //           showcase_notOnboardedFirstTime(haiku),
  //           () => saveUser({ ...user, preferences: { ...user?.preferences, onboardedShowcase: true } })
  //         ),
  //         2000);
  //     }
  //   }

  //   return () => {
  //     // @ts-ignore
  //     timeoutId && clearTimeout(timeoutId);
  //   }
  // }, [user, haikudleReady, previousDailyHaikudleId, userGeneratedHaiku]);

  useEffect(() => {
    // console.log('>> app.page useEffect [haiku?.id, loadingUI, isShowcaseMode, _refreshDelay]', { haiku_id: haiku?.id, loadingUI, isShowcaseMode, _refreshDelay });

    if (showcaseMode && !loadingUI && _refreshDelay) {
      window.history.replaceState(null, '', `/${haiku?.id || ""}?mode=showcase${_refreshDelay ? `&refreshDelay=${_refreshDelay}` : ""}${fontSize ? `&fontSize=${encodeURIComponent(fontSize)}` : ""}`);
      setRefreshTimeout(setTimeout(loadHaiku, _refreshDelay));
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

  if (!userLoaded && !userLoading) {
    // console.log('>> app.MainPage init', { haiku });
    loadUser().then((user: User) => {
      // console.log('>> app.MainPage init loadUser.then', { user });
      if (haikudleMode && !previousDailyHaikudleId) {
        loadHaikudle(haikuId || { lang }).then((haikudles: any) => {
          // console.log('>> app.MainPage init loadHaikudle.then', { haikudles });
          const loadedHaikudle = haikudles[0] || haikudles;
          setHaiku(loadedHaikudle?.haiku);
          setHaikuId(loadedHaikudle?.haiku?.id);
          setHaikudle(loadedHaikudle);
        });
      } else {
        // TODO: clean this up
        haiku
          ? initHaiku(haiku, haiku.id, mode).then((haikus: Haiku | Haiku[]) => {
            // console.log('>> app.MainPage init initHaiku.then', { haikus });
            const initializedHaiku = haikus[0] || haikus;
            setHaiku({ ...initializedHaiku, generatedJustNow: false });
            setHaikuId(initializedHaiku?.id);
          })
          : loadHaikus(haikuId || { lang }).then((haikus: Haiku | Haiku[]) => {
            // console.log('>> app.MainPage init loadHaikus.then', { haikus });
            const loadedHaiku = haikus[0] || haikus;
            setHaiku({ ...loadedHaiku, generatedJustNow: false });
            setHaikuId(loadedHaiku?.id);
          });

        // make sure the current haiku at least shows up in side bar as viewed
        !isPuzzleMode && user && !user.isAdmin && addUserHaiku(_haiku, "viewed");
      }
    });
  }

  // console.log('>> app.MainPage.render() loading page?', { loadingUI, generating, haikudleMode, haikudleLoaded, haikudleReady, thing: haikudleMode && !haikudleLoaded && !haikudleReady });

  if (loadingUI || generating || haikudleMode && !previousDailyHaikudleId && !haikudleReady) {
    // console.log('>> app.MainPage.render() loading page? YUP!', { loadingUI, generating, haikudleMode, haikudleLoaded, haikudleReady, thing: haikudleMode && !haikudleLoaded && !haikudleReady });
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
        <NavOverlay loading={true} mode={mode} styles={textStyles.slice(0, textStyles.length - 3)} altStyles={altTextStyles} />
        {/* <Loading styles={textStyles} /> */}
        <HaikuPage mode={mode} loading={true} haiku={haiku} styles={textStyles} altStyles={altTextStyles} />
      </div>
    )
  }

  if (loaded && !loading && !haiku) {
    return <NotFound mode={mode} lang={lang} onClickGenerate={startGenerateHaiku} />
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
        onClickGenerate={startGenerateHaiku}
        onClickRandom={loadRandom}
        onClickLogo={() => {
          trackEvent("clicked-logo", {
            userId: user?.id,
          });
          loadHaiku();
        }}
        onSwitchMode={switchMode}
        onDelete={!haiku?.error && doDelete}
        onSaveDailyHaiku={!haiku?.error && saveDailyHaiku}
        onShowAbout={
          showLimerickDetails
          // user?.isAdmin
          //   ? showHaikuDetails
          //   : userGeneratedHaiku
          //     ? showAboutGenerated
          //     : haikudleMode
          //       ? previousDailyHaikudleId
          //         ? showAboutPreviousDaily // with onboarding?
          //         : startFirstVisitHaikudleOnboarding
          //       : startFirstVisitOnboarding
        }
        onSelectHaiku={(id: string) => {
          trackEvent("haiku-selected", {
            userId: user?.id,
            haikuId: id,
          });
          loadHaiku(id);
        }}
        onChangeRefreshDelay={!haiku?.error && changeRefreshDelay}
        onBackup={!haiku?.error && startBackup}
        onCopyHaiku={!haiku?.error && (haikudleMode && haikudleSolved || !haikudleMode) && copyHaiku}
        onCopyLink={!haiku?.error && (haikudleMode && haikudleSolved || !haikudleMode) && copyLink}
        onLikeHaiku={!haiku?.error && (haikudleMode && haikudleSolved || !haikudleMode) && likeHaiku}
        onUploadImage={!haiku?.error && uploadImage}
        onUpdateImage={!haiku?.error && updateHaikuImage}
        onCycleLayout={!haiku?.error && (haiku?.createdBy && haiku?.createdBy == user?.id || user?.isAdmin) && cycleLayout}
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
          user={user}
          mode={mode}
          haiku={haikudleSolved ? solvedHaikudleHaiku : haiku}
          // version={haiku?.version}
          styles={textStyles}
          altStyles={altTextStyles}
          fontSize={fontSize}
          popPoem={haikudleMode && haikudleSolvedJustNow}
          regenerating={regenerating}
          onboardingElement={onboardingElement}
          refresh={!haiku?.error && user?.isAdmin && loadRandom}
          saveHaiku={!haiku?.error && !haikudleMode && doSaveHaiku}
          regeneratePoem={!haiku?.error && !haikudleMode && (() => ["haiku", "haikudle"].includes(mode) && (user?.isAdmin || haiku?.createdBy == user?.id) && startRegenerateHaiku && startRegenerateHaiku())}
          regenerateImage={!haiku?.error && !haikudleMode && (() => ["haiku", "haikudle"].includes(mode) && (user?.isAdmin || haiku?.createdBy == user?.id) && startRegenerateHaikuImage && startRegenerateHaikuImage())}
          copyHaiku={!haiku?.error && copyHaiku}
          switchMode={switchMode}
          // updateLayout={adjustLayout}
        />
      }
    </div>
  )
}
