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
    ? "AI-generated daily art and haiku puzzles"
    : "AI-generated art and haiku poems";

const metaUrl = isLyricleMode
  ? "https://lyricle.desmat.ca/"
  : isHaikudleMode
    ? "https://haikudle.art/"
    : "https://haiku.desmat.ca/";

const metaImages = isLyricleMode
  ? [
    `https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/${moment().format("YYYYMMDD")}.png`,
    "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/default.png",
  ]
  : isHaikudleMode
    ? [
      // `https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img/${moment().format("YYYYMMDD")}.png`,
      // `https://haikudle.art/social_img/${moment().format("YYYYMMDD")}.png`,
      // "https://haikudle.art/social_img_haikudle.png",
      "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img/20240324b.png",
    ]
    : [
      "https://haiku.desmat.ca/social_img_haiku.png"
    ];

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
      </body>
      <Analytics />
      <Alert />
    </html>
  )
}
