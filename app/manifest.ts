import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Limericks - AI-Powered Limerick Poetry and Generative Art',
    short_name: 'Limericks',
    description: 'AI-Powered Limerick Poetry and Generative Art',
    start_url: '/',
    display: 'standalone',
    background_color: '#e5e0c4',
    theme_color: '#e5e0c4',
    icons: [
      {
        src: 'favicon.ico',
        sizes: '110x110',
        type: 'image/x-icon',
      },
    ],
  }
}
