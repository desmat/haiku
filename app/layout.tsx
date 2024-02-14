import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
 
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: 'hAIku - AI-generated art and Haiku poems',
    default:
      'hAIku - AI-generated art and Haiku poems',
  },
  description: "AI-generated art and Haiku poems",
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
        <meta property="og:title" content={isHaikudleMode ? "AI-powered daily Haiku puzzles" : "AI-generated art and Haiku poems"} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={isHaikudleMode ? "https://haikudle.desmat.ca/" : "https://haiku.desmat.ca/"} />
        <meta property="og:image" content={isHaikudleMode ? "https://haiku.desmat.ca/social_img_haikudle.png" : "https://haiku.desmat.ca/social_img_haiku.png" } />        
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
