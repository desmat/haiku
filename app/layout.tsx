import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'hAIku',
  description: 'AI-Powered haiku game',
  viewport: 'content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=3'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=3"/>
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
