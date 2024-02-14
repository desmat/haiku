import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
 
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: 'hAIku',
    default:
      '(1)AI-powered Haiku poems',
  },
  description: "(2)AI-powered Haiku poems",
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
        <meta property="og:title" content="The Rock" />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content="https://www.imdb.com/title/tt0117500/" />
        <meta property="og:image" content="https://ia.media-imdb.com/images/rock.jpg" />        
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
