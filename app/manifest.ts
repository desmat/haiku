import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";
  const isShowcaseMode = process.env.EXPERIENCE_MODE == "showcase";

  return {
    name: isHaikudleMode
      ? 'Haikudle - AI-powered daily haiku puzzles'
      : isShowcaseMode
        ? "Daily Haiku - AI-powered daily haiku poetry and generative art"
        : 'Haiku Genius - AI-powered haiku poetry and generative art',
    short_name: isHaikudleMode
      ? 'Haikudle'
      : isShowcaseMode
        ? 'Daily Haiku'
        : 'Haiku Genius',
    description: isHaikudleMode
      ? 'AI-powered daily haiku puzzles'
      : isShowcaseMode
        ? 'AI-powered daily haiku poetry and generative art'
        : 'AI-powered haiku poetry and generative art',
    start_url: '/',
    display: 'standalone',
    background_color: 'rgb(32, 31, 27)',
    theme_color: 'rgb(32, 31, 27)',
    icons: [
      {
        src: 'favicon.ico',
        sizes: '110x110',
        type: 'image/x-icon',
      },
    ],
  }
}
