import MainPage from '@/app/mainPage';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import NotFound from '@/app/not-found';

export default function Page({ 
  params,
  searchParams,
}: { 
  params: { slug: any } 
  searchParams?: { [key: string]: string | undefined },
 }) {
  // console.log('>> app.[[...slugs]].page.render()', { slug: params.slug, searchParams });
  const id = searchParams && searchParams["id"] || params.slug && params.slug[0];
  const lang = searchParams && searchParams["lang"] as LanguageType || "en";

  if (!isSupportedLanguage(lang)) {
    return <NotFound />
  }

  return <MainPage id={id} lang={lang} />
}
