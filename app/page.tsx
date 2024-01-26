'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { Haiku } from "@/types/Haiku";
import { Loading, NavOverlay } from '@/app/_components/Nav';
import HaikuPage from '@/app/_components/HaikuPage';
import useHaikus from "@/app/_hooks/haikus";
import NotFound from '@/app/not-found';
import { LanguageType } from '@/types/Languages';
import * as samples from "@/services/stores/samples";

export default function Component({ lang, _haiku }: { lang?: undefined | LanguageType, _haiku?: Haiku }) {
  // console.log('>> app.page.render()', { lang });
  const searchParams = useSearchParams();
  const [id, setId] = useState(searchParams.get("id"));
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

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

  const loaded = _haiku || id && haikusLoaded(JSON.stringify({ id })) || haikusLoaded(JSON.stringify({ lang: lang || "en" }));
  const haikus = findHaikus({ lang: lang || "en" });
  const haiku = _haiku || id && getHaiku(id) || haikus[Math.floor(Math.random() * haikus.length)] || samples.notFoundHaiku;
  const [colorOffsets, setColorOffsets] = useState({ front: -1, back: -1 });

  console.log('>> app.page.render()', { id });

  useEffect(() => {
    // if (!loaded) {
      // if (id) {
      //    loadHaikus({ id });
      // }

      loadHaikus({ lang: lang || "en" });
    // }
  }, [lang]);

  const handleGenerate = async (e: any) => {
    // console.log('>> app.page.handleGenerate()');
    e.preventDefault();

    const subject = prompt("Subject? (For example 'nature', 'sunset', or leave blank)");
    if (typeof (subject) == "string") {
      setGenerating(true);
      // TODO cleanup generateHaiku function params
      const ret = await generateHaiku({ uuid: "ASDF" }, { ...haiku, id: "ASDF", lang, subject });
      // console.log('>> app.page.handleGenerate()', { ret });

      if (ret?.id) {
        // router.push(`/?id=${ret.id}`);
        setId(ret.id);
        setGenerating(false);
      }
    }
  }

  const handleRefresh = (e: any) => {
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
        <NavOverlay styles={textStyles}/>
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
