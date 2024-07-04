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
  ? "AI-powered Daily Haiku Puzzles and Generative Art - Solve the puzzle to reveal today's haiku, generate haiku poems paired and beautiful generative art, always free, no signup required."
  : "AI-Powered Limericks and Generative Art";

export const appDescription = isHaikudleMode
  ? "Solve the daily puzzles, generate new haikus, enjoy beautiful generative art and share with the world - no signup required. " +
  "Haikudle integrates cutting-edge AI technology to elevate your poetic experience to new heights. " +
  "Generate haiku poems and share AI-generated creations with stunning AI-generated imagery, powered by OpenAI's ChatGPT and DALL-E. " +
  "Explore daily haiku puzzles and discover the limitless poetic and artistic possibilities with Haikudle."
  : "Generate hilarious and whimsical limericks with our AI-powered Limerick Generator and matching generative art. Discover funny, naughty, and humorous poetry created by ChatGPT and DALL-E. Always free, no signup required. Experience the magic of GenAI and Large Language Models (LLM) today!";

export const metaUrl = isHaikudleMode
  ? "https://haikudle.art/"
  : "https://limericks.ai/";

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
    // "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limerick/limeick_5069ddc0.png",
    "https://v7atwtvflvdzlnnl.public.blob.vercel-storage.com/social_img_limericks/5069ddc0.png",
  ];
}

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
  // console.log('>> app.layout.render()', {});

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href={metaUrl} key="canonical" />
        <meta property="fb:app_id" content={process.env.FB_APP_ID}></meta>
        <meta name="facebook-domain-verification" content="r8ajq2e3ewk63juwwx7iop5fr1i2qj" />
      </head>
      <body
        className={inter.className}
        style={{
          backgroundColor: "#aaaaaa"
        }}
      >
        {children}
        <Analytics />
        <Alert />
      </body>
    </html>
  )
}
