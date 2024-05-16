import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
import moment from 'moment';

const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
const inter = Inter({ subsets: ['latin'] });

export const appName = isHaikudleMode
  ? "Solve the puzzle to reveal today's haiku, generate and share haiku poems paired and beautiful generative art with Haikudle - AI-powered haiku poetry, puzzles and visual art"
  : "Compose and share your haiku creations with Haiku Genius - AI-powered haiku poetry and generative art";

export const appDescription = isHaikudleMode
  ? "Solve the daily puzzles, generate new haikus, enjoy beautiful generative art and share with the world - no signup required. " +
  "Haikudle integrates cutting-edge AI technology to elevate your poetic experience to new heights. " +
  "Generate haiku poems and share AI-generated creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
  "Explore daily haiku puzzles and discover the limitless poetic and artistic possibilities with Haikudle."
  : "Create and share your haiku masterpieces with beautiful generated art — no signup required. " +
  "Haiku Genius integrates cutting-edge AI technology to elevate your poetic experience to new heights. " +
  "Craft haiku poems seamlessly with our AI assistant and share your creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
  "Explore daily featured haikus and experience AI-assisted creativity and discover the limitless possibilities of poetic exploration with Haiku Genius.";

export const metaUrl = isHaikudleMode
  ? "https://haikudle.art/"
  : "https://haikugenius.io/";

export const metadata: Metadata = {
  title: `${appName} - ${appDescription}`,
  description: appDescription,
  other: {
    "fb:app_id": process.env.FB_APP_ID || "",
  }
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
        <link rel="canonical" href={metaUrl} key="canonical" />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <Alert />
      </body>
    </html>
  )
}
