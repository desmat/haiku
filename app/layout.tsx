import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
import moment from 'moment';
 
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: 'hAIku - AI-generated art and haiku poems',
    default:
      'hAIku - AI-generated art and haiku poems',
  },
  description: "AI-generated art and haiku poems",
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
        <meta property="og:title" content={isHaikudleMode ? "hAIkudle" : "hAIku"} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={isHaikudleMode ? "AI-powered haiku puzzles" : "AI-generated art and haiku poems"} />
        <meta property="og:url" content={isHaikudleMode ? "https://haikudle.art/" : "https://haiku.desmat.ca/"} />
        <meta property="og:image" content={isHaikudleMode ? "https://haikudle.art/social_img_haikudle.png" : "https://haiku.desmat.ca/social_img_haiku.png" } />        
        <meta property="og:image" content={isHaikudleMode ? "https://haikudle.art/social_img/" + moment().format("YYYYMMDD") : "https://haiku.desmat.ca/social_img_haiku.png" } />        
        <meta property="fb:app_id" content="3752891174930405" />
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
