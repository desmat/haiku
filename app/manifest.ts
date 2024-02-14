import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  const isHaikudleMode = process.env.EXPERIENCE_MODE == "haikudle";

  return {
    name: isHaikudleMode ? 'hAIkudle - AI-powered daily Haiku puzzles' : 'hAIku - AI-generated art and Haiku poems',
    short_name: isHaikudleMode ? 'hAIkudle' : 'hAIku',
    description: isHaikudleMode ? 'AI-powered daily Haiku puzzles' : 'AI-generated art and Haiku poems',
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
