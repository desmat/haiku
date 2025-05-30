import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
import moment from 'moment';

const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
const isShowcaseMode = process.env.EXPERIENCE_MODE == "showcase";
const inter = Inter({ subsets: ['latin'] });

export const appName = isHaikudleMode
  ? "AI-powered Daily Haiku Puzzles and Generative Art - Solve the puzzle to reveal today's haiku, generate haiku poems paired and beautiful generative art, always free, no signup required."
  // TODO isShowcaseMode for dailyhaiku
  : "AI-Powered Haiku Poetry and Generative Art - Daily featured haikus, haiku generator, smart poem editor, visual art generator, always free, no signup required.";

export const appDescription = isHaikudleMode
  ? "Solve the daily puzzles, generate new haikus, enjoy beautiful generative art and share with the world - no signup required. " +
  "Haikudle integrates cutting-edge AI technology to elevate your poetic experience to new heights. " +
  "Generate haiku poems and share AI-generated creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
  "Explore daily haiku puzzles and discover the limitless poetic and artistic possibilities with Haikudle."
  // TODO isShowcaseMode for dailyhaiku
  : "Create and share your haiku masterpieces with beautiful generated art — no signup required. " +
  `${isShowcaseMode ? "Daily Haiku" : "Haiku Genius"} integrates cutting-edge AI technology to elevate your poetic experience to new heights. ` +
  "Craft haiku poems seamlessly with our AI assistant and share your creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
  `Explore daily featured haikus and experience AI-assisted creativity and discover the limitless possibilities of poetic exploration with ${isShowcaseMode ? "Daily Haiku" : "Haiku Genius"}.`;

export const metaUrl = isHaikudleMode
  ? "https://haikudle.ai/"
  : isShowcaseMode
    ? "https://dailyhaiku.ai/"
    : "https://haikugenius.ai/";

export const metadata: Metadata = {
  metadataBase: new URL(metaUrl),
  title: appName,
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
  // console.log('app.layout.render()', {});

  return (
    <html lang="en">
      {children}
    </html>
  )
}
