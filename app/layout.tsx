import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import Auth from '@/app/_components/Auth'
import Nav from '@/app/_components/nav/Nav'
import User from '@/app/_components/User'
import Prefetch from './_components/Prefetch';
import { NavProfileLink } from './_components/nav/clientComponents';
import Link from './_components/Link';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Workout',
  description: 'AI-Powered Personal Trainer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col lg:flex-row">
          {/* <Nav /> */}
          <div className=" text-overlay text-overlay absolute top-4 right-3 z-10">
            <NavProfileLink href="/profile" className="_bg-orange-600 title-overlay text-overlay _hover: _text-purple-100" />
          </div>
          <Link useClient={true} href="/" className="title-overlay text-overlay absolute top-4 left-4 z-10">
            hAIku
          </Link>
          <div className="_bg-blue-500 ml-0 _mt-10 _lg: _ml-32 _lg: mt-0 w-screen min-h-[calc(100dvh-2rem)] lg:min-h-screen">
            {children}
          </div>
        </div>
      </body>
      <Auth />
      <User />
      <Analytics />
      <Alert />
      <Prefetch />
    </html>
  )
}
