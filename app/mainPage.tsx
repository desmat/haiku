'use client'

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
import { notFoundHaiku } from '@/services/stores/samples';

export default function MainPage({ id, lang }: { id?: string, lang?: undefined | LanguageType }) {
  // console.log('>> app.mainPage.render()', { id, lang });
  // const searchParams = useSearchParams();
  const [haikuId, setHaikuId] = useState(id);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const [user, saveUser] = useUser((state: any) => [state.user, state.save]);
  const plainAlert = useAlert((state: any) => state.plain);
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  const [
    haikusLoaded,
    loadHaikus,
    haikus,
    getHaiku,
    generateHaiku,
  ] = useHaikus((state: any) => [
    state.loaded,
    state.load,
    state.find({ lang: lang || "en" }),
    state.get,
    state.generate
  ]);

  const [
    haikudleLoaded,
    loadHaikudle,
    haikudles,
    _haiku,
  ] = useHaikudle((state: any) => [
    state.loaded,
    state.load,
    state._haikudles,
    state.haiku,
  ]);

  // const loaded = _haiku || haikuId && haikusLoaded(JSON.stringify({ haikuId })) || haikusLoaded(JSON.stringify({ lang: lang || "en" }));
  // const haikus = findHaikus({ lang: lang || "en" });
  const haiku = isHaikudleMode ? _haiku : haikuId && getHaiku(haikuId) || haikus[Math.floor(Math.random() * haikus.length)] || notFoundHaiku;

  const loaded = isHaikudleMode ? haikudleLoaded(haikuId) : haikusLoaded(haikuId); //; // TODO check id?
  // const haiku = haikudles[0]?.haiku;
  const [colorOffsets, setColorOffsets] = useState({ front: -1, back: -1 });

  // console.log('>> app.page.render()', { haikuId, haiku, loaded, haikudleLoaded, user });

  // console.log('>> app.page.render()', { haikuId, lang, user });

  useEffect(() => {
    // console.log('>> app.page.render() useEffect', { haikuId, lang, user });

    if (user?.isAdmin) {
      loadHaikus({ lang: lang || "en" });
    }

    if (!loaded) {
      isHaikudleMode ? loadHaikudle(haikuId) : loadHaikus(haikuId);
    }

    if (isHaikudleMode && user && !user?.preferences?.onboarded) {
      plainAlert(
        `<div style="display: flex; flex-direction: column; gap: 0.4rem">
          <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
          <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
          <div>Drag-and-drop the scrabbled words to solve today's AI-generated <b>Haikudle</b>!</div>
        </div>`,
        () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
        "Got it!");
    }
  }, [haikuId, lang, user]);

  const handleGenerate = async (e: any) => {
    // console.log('>> app.page.handleGenerate()');
    e.preventDefault();

    const subject = user?.isAdmin
      ? prompt("Subject? (For example 'nature', 'sunset', or leave blank)")
      : "";
      
    if (typeof (subject) == "string") {
      setGenerating(true);
      // TODO cleanup generateHaiku function params
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

    // console.log('>> app.page.handleRefresh()');
    e.preventDefault();

    if (haikuId) {
      router.push("/");
    }

    if (!(haikus?.length > 1)) {
      return;
    }

    const notCurrentHaikus = haikus.map((h: Haiku) => h.id).filter((id: string) => id != haiku.id);
    setHaikuId(notCurrentHaikus[Math.floor(Math.random() * notCurrentHaikus.length)]);
  }

  const fontColor = haiku?.colorPalette && colorOffsets.front >= 0 && haiku.colorPalette[colorOffsets.front] || haiku?.color || "#555555";

  const bgColor = haiku?.colorPalette && colorOffsets.back >= 0 && haiku?.colorPalette[colorOffsets.back] || haiku?.bgColor || "lightgrey";

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

  if (!loaded || generating) {
    // TODO kill the Page component and build good loading component
    return (
      <div>
        <NavOverlay styles={textStyles} />
        <Loading />
      </div>
    )
  }

  if (loaded && !haiku) {
    return <NotFound lang={lang} onClickGenerate={handleGenerate} />
  }

  return (
    <div>
      <NavOverlay styles={textStyles} lang={lang} onClickLogo={handleRefresh} onClickGenerate={handleGenerate} />
      <HaikuPage haiku={haiku} styles={textStyles} />
    </div>
  )
}
