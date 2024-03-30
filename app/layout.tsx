import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
import moment from 'moment';

const isLyricleMode = process.env.EXPERIENCE_MODE == "lyricle";
const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
const inter = Inter({ subsets: ['latin'] });

const appName = isLyricleMode
  ? "Lyricle"
  : isHaikudleMode
    ? "hAIkudle"
    : "hAIku";

const appDescription = isLyricleMode
  ? "Daily lyric puzzles"
  : isHaikudleMode
    ? "AI-generated art and daily haiku puzzles"
    : "AI-generated art and haiku poems";

const metaUrl = isLyricleMode
  ? "https://lyricle.desmat.ca/"
  : isHaikudleMode
    ? "https://haikudle.art/"
    : "https://haiku.desmat.ca/";

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
} else if (isLyricleMode) {
  metaImages = [
    `https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/${moment().format("YYYYMMDD")}.png`,
    "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/default.png",
  ];
} else {
  metaImages = [
    "https://haiku.desmat.ca/social_img_haiku.png"
  ];
}

export const metadata: Metadata = {
  title: `${appName} - ${appDescription}`,
  description: appDescription,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // console.log('>> app.layout.render()', {});

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta property="og:title" content={appName} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={appDescription} />
        <meta property="og:url" content={metaUrl} />
        {metaImages.map((image: string, i: number) => (
          <meta key={i} property="og:image" content={image} />
        ))}
        <meta property="fb:app_id" content={process.env.FB_APP_ID} />
      </head>
      <body className={inter.className}>
        <div className="flex flex-col lg:flex-row">
          <div className="_bg-blue-500 ml-0 _mt-10 _lg: _ml-32 _lg: mt-0 w-screen min-h-[calc(100dvh-2rem)] lg:min-h-screen">
            {children}
          </div>
        </div>
        <Analytics />
        <Alert />
      </body>
    </html>
  )
}
