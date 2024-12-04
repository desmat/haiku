import moment from 'moment';
import { MetadataRoute } from 'next'
import { getDailyHaiku } from '@/services/haikus';
import { metaUrl } from './layout';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestDailyHaiku = await getDailyHaiku();
  const lastModified = latestDailyHaiku
    ? moment(latestDailyHaiku?.id).toDate()
    : moment().add(-1, "days").toDate() // no daily haiku created yet: fake it

  return [
    {
      url: metaUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
