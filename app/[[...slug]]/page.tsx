import MainPage from '@/app/_components/MainPage';
import NotFound from '@/app/not-found';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';

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
  const mode = searchParams &&  searchParams["mode"] || process.env.EXPERIENCE_MODE || "haiku";

  if (!isSupportedLanguage(lang)) {
    return <NotFound mode={mode} />
  }

  return <MainPage id={id} lang={lang} mode={mode} />
}
