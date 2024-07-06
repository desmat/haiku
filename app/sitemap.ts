import moment from 'moment';
import { MetadataRoute } from 'next'
import { getDailyHaiku } from '@/services/haikus';
import { metaUrl } from './layout';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestDailyHaiku = await getDailyHaiku();
  const lastModified = moment(latestDailyHaiku?.id).toDate();

  return [
    {
      url: metaUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
