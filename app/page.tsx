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

export default function Component({ lang }: { lang?: undefined | LanguageType }) {
  // console.log('>> app.page.render()', { lang });
  const searchParams = useSearchParams();
  const [id, setId] = useState(searchParams.get("id"));
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const [user, saveUser] = useUser((state: any) => [state.user, state.save]);
  const plainAlert = useAlert((state: any) => state.plain);
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  const [
    haikusLoaded,
    loadHaikus,
    findHaikus,
    getHaiku,
    generateHaiku,
  ] = useHaikus((state: any) => [
    state.loaded,
    state.load,
    state.find,
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

  // const loaded = _haiku || id && haikusLoaded(JSON.stringify({ id })) || haikusLoaded(JSON.stringify({ lang: lang || "en" }));
  const haikus = findHaikus({ lang: lang || "en" });
  const haiku = isHaikudleMode ? _haiku : id && getHaiku(id) || haikus[Math.floor(Math.random() * haikus.length)] || notFoundHaiku;

  const loaded = isHaikudleMode ? haikudleLoaded(id) : haikusLoaded(id); //; // TODO check id?
  // const haiku = haikudles[0]?.haiku;
  const [colorOffsets, setColorOffsets] = useState({ front: -1, back: -1 });

  console.log('>> app.page.render()', { id, haiku, loaded, haikudleLoaded, user });

  useEffect(() => {
    if (user?.isAdmin) {
      loadHaikus({ lang: lang || "en" });
    }

    if (!loaded) {
      isHaikudleMode ? loadHaikudle(id) : loadHaikus(id);
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
  }, [id, lang, user]);

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
        setId(ret.id);
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

    if (searchParams.get("id")) {
      router.push("/");
    }

    if (!(haikus?.length > 1)) {
      return;
    }

    const notCurrentHaikus = haikus.map((h: Haiku) => h.id).filter((id: string) => id != haiku.id);
    setId(notCurrentHaikus[Math.floor(Math.random() * notCurrentHaikus.length)]);
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
      <NavOverlay styles={textStyles} lang={lang} haikuId={haiku.id} onClickLogo={handleRefresh} onClickGenerate={handleGenerate} />
      <HaikuPage haiku={haiku} styles={textStyles} />
    </div>
  )
}
