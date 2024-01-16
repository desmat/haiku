import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'hAIku: AI-powered haiku game',
    short_name: 'hAIku',
    description: 'AI-powered haiku game',
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
