import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  return {
    name: isHaikudleMode ? 'hAIkudle - AI-powered daily haiku puzzles' : 'Haiku Genius - AI-powered haiku poetry and generative art',
    short_name: isHaikudleMode ? 'hAIkudle' : 'Haiku Genius',
    description: isHaikudleMode ? 'AI-powered daily haiku puzzles' : 'AI-powered haiku poetry and generative art',
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
