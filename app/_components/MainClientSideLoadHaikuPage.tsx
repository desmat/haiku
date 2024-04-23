'use client'

import moment from 'moment';
import { LanguageType } from '@/types/Languages';
// import { getDailyHaiku, getHaiku } from '@/services/clientSide/haikus';
// import MainClientSidePage from './MainClientSidePage';
import useUser from '../_hooks/user';
import { mapToSearchParams } from '@/utils/misc';
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import MainClientSidePage from './MainClientSidePage';
import { SafeHydrate } from './SafeHydrate';
import MainClientSideSafeHydratePage from './MainClientSideSafeHydratePage';
import MainServerSidePage from './MainServerSidePage';
import { del } from '@vercel/blob';
import delay from '@/utils/delay';
import useHaikus from '../_hooks/haikus';


export default async function MainClientSideLoadHaikuPage({ mode, id, lang, refreshDelay }: { mode: string, id?: string, lang?: undefined | LanguageType, refreshDelay?: number }) {
  console.log('>> app.MainClientSideLoadHaikuPage.render()', { mode, id, lang });

  // TODO load user



  // const getTodaysHaiku = async () => {
  //   const todaysDateCode = moment().format("YYYYMMDD");
  //   const todaysHaiku = await getDailyHaiku(todaysDateCode);
  //   if (todaysHaiku?.haikuId) {
  //     return getHaiku(todaysHaiku?.haikuId);
  //   }
  // }

  // const haiku = id 
  // ? await getHaiku(id)
  // : await getTodaysHaiku();

  // const mounted = useMounted();
  // let [loading, setLoading] = useState(false);
  // let [haiku, setHaiku] = useState<any>();
  let haiku;

  // if (!mounted) return <div>nope</div> //<MainServerSidePage mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
  // if (!mounted) await delay(5000);
  // await new Promise((resolve: any) => {
  //   if (mounted) resolve(true);
  // })
  // if (!mounted) return <Suspense />
  // if (!mounted) return <div>loading</div>

  // let haiku;
  // const [haiku, setHaiku] = useState<any>();




  
  const fetchOpts = async () => {
    const token = await useUser.getState().getToken();

    // console.log(">> hooks.haiku.fetchOpts", { token });
    return token && { headers: { Authorization: `Bearer ${token || "ASDF"}` } } || {};
  }







  const queryOrId = id;
  const query = {} // typeof (queryOrId) == "object" && queryOrId;
  // const id = typeof (queryOrId) == "string" && queryOrId;

  const modeParams = mode && `mode=${mode}`;
  const queryParams = query && mapToSearchParams(query);
  const params = `${queryParams || modeParams ? "?" : ""}${queryParams}${queryParams && modeParams ? "&" : ""}${modeParams}`;

  const opts = await fetchOpts();
  if (opts) {
    const res = await fetch(`/api/haikus${params}`, opts) //.then(async (res: any) => {

    if (res.status != 200) {
      // const errorHaiku = await handleErrorResponse(res, "fetch-haikus", undefined, `Error fetching haikus`);
      // useHaikus.setState({ _haikus: { [errorHaiku.id]: errorHaiku } });
      // setLoaded(errorHaiku.id);
      // return resolve(errorHaiku);
      console.error(`Error fetching haikus`, { res });
      // return <div>Error fetching haikus</div>
    }

    const data = await res.json();
    const haikus = data.haiku || data.haikus;
    haiku = haikus[0] || haikus;
    // setHaiku(haiku);
  }
  // }




  // const haikus = await useHaikus.getState().load(id || "");
  // haiku = haikus[0] || haikus;





  return (haiku
    ? <MainClientSidePage haiku={haiku} mode={mode} id={id} lang={lang} refreshDelay={refreshDelay} />
    : <div>no haiku</div>
  )
}