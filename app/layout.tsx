import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
import moment from 'moment';
 
const inter = Inter({ subsets: ['latin'] })
const appName = "Lyricle" //process.env.EXPERIENCE_MODE == "haiku" ? "hAIku" : "hAIkudle";
const appDescription = "Daily lyric puzzles" //process.env.EXPERIENCE_MODE == "haiku" ? "AI-generated art and haiku poems" : "AI-generated daily art and haiku puzzles";

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
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta property="og:title" content={appName} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={appDescription} />
        <meta property="og:url" content="https://lyricle.desmat.ca/" />
        <meta property="og:image" content={`https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/default.pnghttps://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/${moment().format("YYYYMMDD")}.png`} />
        <meta property="og:image" content="https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/default.pnghttps://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_lyrics/default.png" />
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
