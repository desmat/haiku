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
  const version = searchParams && searchParams["version"];
  const lang = searchParams && searchParams["lang"] as LanguageType || "en";
  const mode = searchParams &&  searchParams["mode"] || process.env.EXPERIENCE_MODE || "haiku";
  const refreshDelay = searchParams && Number(searchParams["refreshDelay"]);
  const fontSize = searchParams && searchParams["fontSize"];  
  // console.log('>> app.[[...slugs]].page.render()', { slug: params.slug, searchParams, id, version, lang, mode });

  if (!isSupportedLanguage(lang)) {
    return <NotFound mode={mode} />
  }

  // not sure what's going on here
  if (id == "index") {
    id = undefined;
  }
  
  return <MainPage mode={mode} id={id} version={version} lang={lang} refreshDelay={refreshDelay} fontSize={fontSize} />
}
