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
    state.loaded(haikuId || { random: true }),
    state.load,
    state.find({ lang: lang || "en" }),
    state.get,
    state.generate
  ]);

  const [
    haikudleLoaded,
    loadHaikudle,
    haikudleHaiku,
  ] = useHaikudle((state: any) => [
    state.loaded(haikuId),
    state.load,
    state.haiku,
  ]);

  const [loading, setLoading] = useState(false);
  const loaded = isHaikudleMode ? haikudleLoaded : haikusLoaded;
  const haiku = isHaikudleMode ? haikudleHaiku : haikuId && getHaiku(haikuId) || haikus[0];

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

  // console.log('>> app.page.render()', { haikuId, haiku, loaded, loading, user });

  useEffect(() => {
    // console.log('>> app.page useEffect', { haikuId, haiku, loaded, loading, user });

    if (!loaded) {
      isHaikudleMode
        ? loadHaikudle(haikuId)
        : loadHaikus(haikuId || { random: true })
          .then((haikus: Haiku[]) => {
            setHaikuId(haikus[0].id);
          })
    }
  }, [haikuId, lang]);

  useEffect(() => {
    if (isHaikudleMode && user && !user?.preferences?.onboarded) {
      setTimeout(() => plainAlert(
        `<div style="display: flex; flex-direction: column; gap: 0.4rem">
          <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with five syllables in the first line, seven in the second, and five in the third.</div>
          <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word.</div>
          <div>Drag-and-drop the scrabbled words to solve today's AI-generated <b>Haikudle</b>!</div>
        </div>`,
        () => saveUser({ ...user, preferences: { ...user.preferences, onboarded: true } }),
        "Got it!"),
        2000);
    }
  }, [user]);

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
      router.push("/");
    }

    setLoading(true);
    loadHaikus({ random: true })
      .then((haikus: Haiku[]) => {
        if (isHaikudleMode && haikus?.length > 0) {
          loadHaikudle(haikus[0]?.id);
          setHaikuId(haikus[0].id);
          setLoading(false);
        }
      });
  }

  if (!loaded || loading || generating) {
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
