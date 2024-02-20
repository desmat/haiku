'use client'

import moment from 'moment';
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { Haiku } from "@/types/Haiku";
import { Loading, NavOverlay } from '@/app/_components/Nav';
import HaikuPage from '@/app/_components/HaikuPage';
import useAlert from '@/app/_hooks/alert';
import useHaikus from "@/app/_hooks/haikus";
import useHaikudle from '@/app/_hooks/haikudle';
import useUser from '@/app/_hooks/user';
import NotFound from '@/app/not-found';
import { LanguageType } from '@/types/Languages';
import { Haikudle } from '@/types/Haikudle';

export default function MainPage({ mode, id, lang }: { mode: string, id?: string, lang?: undefined | LanguageType }) {
  // console.log('>> app.mainPage.render()', { mode, id, lang });
  const [haikuId, setHaikuId] = useState(id);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const [user, saveUser] = useUser((state: any) => [state.user, state.save]);
  const plainAlert = useAlert((state: any) => state.plain);
  const isHaikudleMode = mode == "haikudle";

  const [
    haikusLoaded,
    loadHaikus,
    haikus,
    getHaiku,
    generateHaiku,
    resetHaikus,
    deleteHaiku,
  ] = useHaikus((state: any) => [
    state.loaded(haikuId || { random: true }),
    state.load,
    state.find({ lang: lang || "en" }),
    state.get,
    state.generate,
    state.reset,
    state.delete,
  ]);

  const [
    haikudleLoaded,
    loadHaikudle,
    haikudleHaiku,
    haikudles,
    resetHaikudles,
    createHaikudle,
    haikudleInProgress,
  ] = useHaikudle((state: any) => [
    state.loaded(haikuId),
    state.load,
    state.haiku,
    state._haikudles,
    state.reset,
    state.create,
    state.inProgress,
  ]);

  let [loading, setLoading] = useState(false);
  const loaded = isHaikudleMode ? haikudleLoaded : haikusLoaded;
  const haiku = !loading && (isHaikudleMode ? haikudleHaiku : haikuId && getHaiku(haikuId) || haikus[0]);

  const fontColor = haiku?.color || "#555555";
  const bgColor = haiku?.bgColor || "lightgrey";
  const textStyles = [
    {
      color: fontColor,
      filter: `drop-shadow(0px 0px 8px ${bgColor})`,
      WebkitTextStroke: `1.5px ${fontColor}`,
      fontWeight: 300,
    },
    {
      color: fontColor,
      filter: `drop-shadow(0px 0px 2px ${bgColor})`,
    }
  ];

  // console.log('>> app.page.render()', { haikuId, mode, loaded, loading, user, haiku });

  // useEffect(() => {
  //   console.log('>> app.page useEffect (initial)', { haikuId, mode, loaded, loading, user, haiku });
  // }, []);

  // useEffect(() => {
  //   console.log('>> app.page useEffect (mode)', { haikuId, mode, loaded, loading, user, haiku });
  // }, [mode]);

  useEffect(() => {
    console.log('>> app.page useEffect [haikuId, lang, mode]', { haikuId, mode, loaded, loading, user, haiku });
    if (/* !loaded && */ !loading) {
      setLoading(true);
      loading = true;
      isHaikudleMode
        ? loadHaikudle(haikuId)
          .then((haikudle: Haikudle) => setLoading(false))
        : loadHaikus(haikuId || { random: true }, mode)
          .then((haikus: Haiku | Haiku[]) => {
            setHaikuId(haikus.id || haikus[0]?.id);
            setLoading(false);
          })
    }
  }, [haikuId, lang, mode]);

  useEffect(() => {
    if (isHaikudleMode && user && !user?.preferences?.onboarded) {
      setTimeout(handleShowAbout, 2000);
    }
  }, [user]);

  const handleShowAbout = () => {
    plainAlert(
      `<div style="display: flex; flex-direction: column; gap: 0.4rem">
          <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
          <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
          <div>Drag-and-drop the scrabbled words to solve today's AI-generated <b>Haikudle</b>!</div>
        </div>`,
      () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
      "Got it!");
  }

  const handleGenerate = async (e: any) => {
    // console.log('>> app.page.handleGenerate()');
    e.preventDefault();

    const subject = user?.isAdmin
      ? prompt("Subject? (For example 'nature', 'sunset', or leave blank)")
      : "";

    if (typeof (subject) == "string") {
      setGenerating(true);
      const ret = await generateHaiku(user, { lang, subject });
      // console.log('>> app.page.handleGenerate()', { ret });

      if (ret?.id) {
        // router.push(`/?id=${ret.id}`);
        setHaikuId(ret.id);
        setGenerating(false);
      }
    }
  }

  const handleRefresh = (e: any) => {
    if (isHaikudleMode && !user.isAdmin) {
      return;
    }

    e.preventDefault();

    if (haikuId) {
      router.push(`/${mode != process.env.EXPERIENCE_MODE ? `?mode=${mode}` : ""}`);
    }

    setLoading(true);
    loadHaikus({ random: true }, mode)
      .then((haikus: Haiku[]) => {
        setLoading(false);
        if (isHaikudleMode && haikus?.length > 0) {
          loadHaikudle(haikus[0]?.id);
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
    const ret = prompt("YYYYMMDD?", moment().format("YYYYMMDD"));
    if (ret) {
      createHaikudle(user, {
        id: haiku?.id,
        dateCode: ret,
        haikuId: haiku?.id,
        inProgress: haikudleInProgress,
      });
    }
  }

  if (!loaded || loading || generating) {
    return (
      <div>
        <NavOverlay mode={mode} styles={textStyles} />
        <Loading />
      </div>
    )
  }

  if (loaded && !haiku) {
    return <NotFound mode={mode} lang={lang} onClickGenerate={handleGenerate} />
  }

  return (
    <div>
      <NavOverlay
        mode={mode}
        lang={lang}
        haiku={haiku}
        styles={textStyles}
        onClickLogo={handleRefresh}
        onClickGenerate={handleGenerate}
        onSwitchMode={handleSwitchMode}
        onDelete={handleDelete}
        onSaveHaikudle={handleSaveHaikudle}
        onShowAbout={handleShowAbout}
      />
      <HaikuPage
        mode={mode}
        haiku={haiku}
        styles={textStyles}
      />
    </div>
  )
}
