import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'hAIku - AI-powered Haiku poems',
    short_name: 'hAIku',
    description: 'AI-powered Haiku poems',
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
