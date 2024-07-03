import moment from 'moment';
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import '@/app/globals.css';
import { metadata as rootMetadata, metaUrl } from '@/app/layout';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
import { getDailyHaikudle } from '@/services/haikudles';
import { User } from '@/types/User';

const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

const haikuGeniusMetaImages = [
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_98b222c0_mountains.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_39044b38_loading_2.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_b124ba3a_blue_sky2.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_bf50dd69_nature.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_c16c1871_spring_morning_scropped.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_f8de7f46_nature.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_39044b38_loading_3.png",
  // "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_f8de7f46_nature_2.png",
  // "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limericks/5069ddc0.png",
  // "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limericks/52b6369b.png",
  "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limericks/5069ddc0.png"
];

let metaImages: string[];

if (isHaikudleMode) {
  // for haikudles pick up a previously published image at random (too much work to publish for every daily haikudle)
  const dateCodeFrom = "20240222";
  const dateCodeTo = "20240327";
  const numDateCodes = moment(dateCodeTo).diff(moment(dateCodeFrom), "days");
  const dateCodes = Array.from(Array(numDateCodes))
    .map((_, i: number) => moment(dateCodeFrom).add(i, "days").format("YYYYMMDD"))
  const dateCode = dateCodes[Math.floor(Math.random() * dateCodes.length)];
  // console.log("==> layout: metaImages", { dateCode, dateCodes });

  metaImages = [
    `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img/${moment().format("YYYYMMDD")}.png`,
    `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img/${dateCode}.png`,
    "https://haikudle.art/social_img_haikudle.png",
  ];
} else {
  metaImages = [
    haikuGeniusMetaImages[Math.floor(Math.random() * haikuGeniusMetaImages.length)]
  ];
}

export let metadata: Metadata = {
  ...rootMetadata,
  title: `${isHaikudleMode ? "Haikudle" : "LimericksAI"} - ${rootMetadata.title}`,
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode,
  params?: any,
}) {
  const versionSeparator = "%3A"; // url-encoded ':'
  const idAndVersion = params.slug && params.slug[0] && params.slug[0].split(versionSeparator);
  let haikuId = idAndVersion && idAndVersion[0];
  let version = idAndVersion && idAndVersion[1];
  
  // not sure what's going on here (only when deployed to vercel)
  if (haikuId == "index") {
    haikuId = undefined;
  }

  console.log('>> app.[[..slug]].layout.render()', { haikuId, version, slug: params?.slug, params });

  if (!haikuId) {
    if (process.env.EXPERIENCE_MODE == "haikudle") {
      const todaysDateCode = moment().format("YYYYMMDD");
      const todaysDailyHaikudle = await getDailyHaikudle(todaysDateCode);
      // console.log('>> app.[[..slug]].layout.render()', { todaysDailyHaikudle });
      haikuId = todaysDailyHaikudle?.haikuId;
    } else {
      const todaysDateCode = moment().format("YYYYMMDD");
      const todaysDailyHaiku = await getDailyHaiku(todaysDateCode);
      // console.log('>> app.[[..slug]].layout.render()', { todaysDailyHaiku });
      haikuId = todaysDailyHaiku?.haikuId;
    }
  }

  const haiku = await getHaiku({ id: "(system)"}, haikuId, undefined, version);
  version = haiku?.version || version || 0;
  // console.log('>> app.[[..slug]].layout.render()', { version });

  metadata = {
    ...metadata,
    openGraph: {
      title: rootMetadata.title || "",
      description: rootMetadata.description || "",
      type: "website",
      url: metaUrl,
      images: [
        // isHaikudleMode
          // ? `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikudle/${haikuId}.png`
          // : 
          `https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limericks/${haikuId}_${version}.png`,
          `https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limericks/${haikuId}.png`,
          ...metaImages,
      ]
    }
  }

  console.log('>> app.[[..slug]].layout.render()', { metadata, images: JSON.stringify(metadata.openGraph?.images) });

  return (
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
  )
}
