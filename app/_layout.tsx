import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react';
import Alert from '@/app/_components/Alert';
import type { Viewport } from 'next'
import moment from 'moment';

const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
const inter = Inter({ subsets: ['latin'] });

const appName = isHaikudleMode
  ? "Solve the puzzle to reveal today's haiku, generate and share haiku poems paired and beautiful generative art with Haikudle - AI-powered haiku poetry, puzzles and visual art"
  : "Compose and share your haiku creations with Haiku Genius - AI-powered haiku poetry and generative art";

const appDescription = isHaikudleMode
  ? "Solve the daily puzzles, generate new haikus, enjoy beautiful generative art and share with the world - no signup required. " +
    "Haikudle integrates cutting-edge AI technology to elevate your poetic experience to new heights. " +
    "Generate haiku poems and share AI-generated creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
    "Explore daily haiku puzzles and discover the limitless poetic and artistic possibilities with Haikudle."
  : "Create and share your haiku masterpieces with beautiful generated art — no signup required. " +
    "Haiku Genius integrates cutting-edge AI technology to elevate your poetic experience to new heights. " +
    "Craft haiku poems seamlessly with our AI assistant and share your creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
    "Explore daily featured haikus and experience AI-assisted creativity and discover the limitless possibilities of poetic exploration with Haiku Genius.";

const metaUrl = isHaikudleMode
  ? "https://haikudle.art/"
  : "https://haikugenius.io/";

const haikuGeniusMetaImages = [
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_98b222c0_mountains.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_39044b38_loading_2.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_b124ba3a_blue_sky2.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_bf50dd69_nature.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_c16c1871_spring_morning_scropped.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_f8de7f46_nature.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_39044b38_loading_3.png",
  "https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haikugenius/haikugenius_f8de7f46_nature_2.png",
];

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
} else {
  metaImages = [
    haikuGeniusMetaImages[Math.floor(Math.random() * haikuGeniusMetaImages.length)]
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
  params,
  searchParams,
}: {
  children: React.ReactNode,
  params?: any,
  searchParams?: any,
}) {
  // console.log('>> app.layout.render()', { slug: params.slug, params, searchParams });

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="canonical"
          href={metaUrl}
          key="canonical"
        />
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
