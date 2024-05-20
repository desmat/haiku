'use client'

import MainPage from '@/app/_components/MainPage';
import NotFound from '@/app/not-found';
import { ExperienceMode } from '@/types/ExperienceMode';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import { Suspense, use, useState } from 'react';
import MainClientSidePage from '@/app/_components/MainClientSidePage';
import { NoSsr } from '../_components/NoSsr';
import moment from 'moment';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
// import HaikuPage from '../_components/HaikuStaticPage';
import { NavOverlay } from '../_components/Nav';
import { Haiku, haikuStyles } from '@/types/Haiku';
import { User } from '@/types/User';
import delay from '@/utils/delay';
import useUser from '../_hooks/user';

const ClientSidePageContent = ({
  thing,
  user,
  haiku,
  mode,
  id,
  lang,
  refreshDelay,
  fontSize,
}: {
  thing?: any,
  user: User,
  haiku: Haiku,
  mode: ExperienceMode,
  id?: string,
  lang?: undefined | LanguageType,
  refreshDelay?: number,
  fontSize?: string | undefined,
}) => {
  console.log('>> app._components.ClientSidePageContent.render()', { thing, mode, id, lang });

  // use(thing);

  // await delay(3000);

  // return (
  //   <div className="main-page _bg-yellow-400">
  //     <style
  //       dangerouslySetInnerHTML={{
  //         __html: `
  //           body {
  //             background-color: pink;
  //           }
  //         `
  //       }}
  //     />
  //     DYNAMIC
  //   </div>
  // )

  return (
    // <NoSsr>
      <MainClientSidePage
        // id={id}
        haiku={haiku}
        mode={mode}
        lang={lang}
        refreshDelay={refreshDelay}
        fontSize={fontSize}
      />
    // </NoSsr>
  )
}

export const ClientSidePage = async ({
  haiku,
  mode,
  id,
  lang,
  refreshDelay,
  fontSize,
}: {
  haiku: Haiku,
  mode: ExperienceMode,
  id?: string,
  lang?: undefined | LanguageType,
  refreshDelay?: number,
  fontSize?: string | undefined,
}) => {
  // let [thing, setThing] = useState("");
  let thing;
  console.log('>> app._components.ClientSidePage.render()', { thing, mode, id, lang });
  // await delay(1000);

  // const thingPromise = new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     console.log('>> app._components.ClientSidePage.render() timeout', { mode, id, lang });
  //     // thing = "thing";
  //     // setThing(thing);
  //     resolve("thing");
  //   }, 1000);
  // });


  // if (!thing) {
  // throw new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     console.log('>> app._components.ClientSidePage.render() timeout', { mode, id, lang });
  //     thing = "thing";
  //     setThing(thing);
  //     resolve(thing);
  //   }, 3000);
  // });
  // }

  // return (
  //   <div className="main-page _bg-yellow-400">
  //     <style
  //       dangerouslySetInnerHTML={{
  //         __html: `
  //           body {
  //             background-color: pink;
  //           }
  //         `
  //       }}
  //     />
  //     DYNAMIC
  //   </div>
  // )

  // return new Promise((resolve: any) => {
  //   resolve(<ClientSidePageContent
  //     user={user}
  //     haiku={haiku}
  //     mode={mode}
  //     fontSize={fontSize}
  //     />
  //   )
  // })

  // const [user] = useUser()
  // const user = await useUser.getState().getUser();
  const user = {} as User;

  // return (
  //   <ClientSidePageContent
  //     thing={
  //       undefined
  //       // new Promise((resolve, reject) => {
  //       //   setTimeout(() => {
  //       //     console.log('>> app._components.ClientSidePage.render() timeout', { mode, id, lang });
  //       //     // thing = "thing";
  //       //     // setThing(thing);
  //       //     resolve("thing");
  //       //   }, 1000)
  //       // })
  //     }
  //     user={user}
  //     haiku={haiku}
  //     mode={mode}
  //     fontSize={fontSize}
  //   />
  // )

  return (
    // <NoSsr>
      <MainClientSidePage
        // id={id}
        haiku={haiku}
        mode={mode}
        lang={lang}
        refreshDelay={refreshDelay}
        fontSize={fontSize}
      />
    // </NoSsr>
  )  
}

export default ClientSidePage;