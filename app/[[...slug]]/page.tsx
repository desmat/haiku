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
  let id = searchParams && searchParams["id"] || params.slug && params.slug[0];
  const lang = searchParams && searchParams["lang"] as LanguageType || "en";
  const mode = searchParams &&  searchParams["mode"] || process.env.EXPERIENCE_MODE || "haiku";
  // console.log('>> app.[[...slugs]].page.render()', { slug: params.slug, searchParams, id, lang, mode });

  if (!isSupportedLanguage(lang)) {
    return <NotFound mode={mode} />
  }

  // not sure what's going on here
  if (id == "index") {
    id = undefined;
  }
  
  return <MainPage mode={mode} id={id} lang={lang} />
}
