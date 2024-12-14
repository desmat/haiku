import moment from 'moment';
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import '@/app/globals.css';
import { metadata as rootMetadata, metaUrl, appName, appDescription } from '@/app/layout';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
import { getDailyHaikudle } from '@/services/haikudles';
import { Haiku } from '@/types/Haiku';
import { User } from '@/types/User';
import { inter } from '../font';

const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

async function getTodaysHaikuId() {
  const todaysDateCode = moment().format("YYYYMMDD");

  if (isHaikudleMode) {
    const todaysDailyHaikudle = await getDailyHaikudle(todaysDateCode, true);
    // console.log('app.[[..slug]].layout.render()', { todaysDailyHaikudle });
    if (!todaysDailyHaikudle) console.warn('>> app.[[..slug]].layout.render() WARNING: todays daily haikudle not created', {});
    return todaysDailyHaikudle?.haikuId;
  }

  const todaysDailyHaiku = await getDailyHaiku(todaysDateCode, true);
  // console.log('app.[[..slug]].layout.render()', { todaysDailyHaiku });
  if (!todaysDailyHaiku) console.warn('>> app.[[..slug]].layout.render() WARNING: todays daily haiku not created', {});
  return todaysDailyHaiku?.haikuId;
}

async function getHaikuSocialImg(haiku: Haiku) {
  // console.log('app.[[..slug]].layout.getSocialImg()', { haiku });

  if (haiku && haiku.sharedVersioned) {
    return `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/${haiku?.id}_${haiku?.version || 0}.png`
  }

  // didn't load the haiku for some reason, return backup image
  const haikuGeniusMetaImages = [
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_98b222c0_mountains.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_39044b38_loading_2.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_b124ba3a_blue_sky2.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_bf50dd69_nature.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_c16c1871_spring_morning_scropped.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_f8de7f46_nature.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_39044b38_loading_3.png",
    "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_f8de7f46_nature_2.png",
  ];

  return haikuGeniusMetaImages[Math.floor(Math.random() * haikuGeniusMetaImages.length)];
}

async function getHaikudleSocialImg(haiku: Haiku) {
  // support for this not in place for now
  // return `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikudle/${haiku?.id}_${haiku?.version || 0}.png`

  // for now, for haikudles pick up a previously published image at random (too much work to publish for every daily haikudle)
  const dateCodeFrom = "20240222";
  const dateCodeTo = "20240327";
  const numDateCodes = moment(dateCodeTo).diff(moment(dateCodeFrom), "days");
  const dateCodes = Array.from(Array(numDateCodes))
    .map((_, i: number) => moment(dateCodeFrom).add(i, "days").format("YYYYMMDD"))
  const dateCode = dateCodes[Math.floor(Math.random() * dateCodes.length)];
  // console.log("==> layout: metaImages", { dateCode, dateCodes });

  return `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img/${dateCode}.png`
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode,
  params?: any,
}) {
  let haikuId = params?.slug && params.slug[0];
  const url = `${metaUrl}${params?.slug && params.slug[0] || ""}`

  // not sure what's going on here (only when deployed to vercel)
  if (haikuId == "index") {
    haikuId = undefined;
  }

  // console.log('app.[[..slug]].layout.render()', { haikuId, slug: params?.slug, params });

  const haiku = await getHaiku({ id: "(system)" } as User, haikuId || await getTodaysHaikuId());
  console.log('app.[[..slug]].layout.render()', { haiku });

  const images = [
    isHaikudleMode
      ? await getHaikudleSocialImg(haiku)
      : await getHaikuSocialImg(haiku),
  ];
  console.log('app.[[..slug]].layout.render()', { images });

  const metadata = {
    metadataBase: new URL(url),
    openGraph: {
      title: `${rootMetadata.title}`,
      description: rootMetadata.description || "",
      type: "website",
      url,
      images,
    }
  }
  console.log('app.[[..slug]].layout.render()', { metadata });

  return (
    <>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href={url} key="canonical" />
        <meta property="fb:app_id" content={process.env.FB_APP_ID}></meta>
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:image" content={metadata.openGraph.images[0]} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.openGraph.title} />
        <meta name="twitter:description" content={metadata.openGraph.description} />
        <meta name="twitter:image" content={metadata.openGraph.images[0]} />
      </head>
      <body
        className={inter.className}
        style={{
          backgroundColor: "#aaaaaa"
        }}
      >
        <section>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                body {
                  background-color: ${haiku?.bgColor || "#aaaaaa"};
                }
              `
            }}
          />
          <div className="flex flex-col lg:flex-row">
            <div className="_bg-blue-500 ml-0 _mt-10 _lg: _ml-32 _lg: mt-0 w-screen min-h-[calc(100dvh-2rem)] lg:min-h-screen">
              {children}
            </div>
          </div>
          <Analytics />
          <Alert />
        </section >
      </body>
    </>
  )
}
