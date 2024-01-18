import Component from '@/app/page';
import { LanguageType, isSupportedLanguage } from '@/types/Languages';
import NotFound from '@/app/not-found';

export default function Page({ params }: { params: { lang: LanguageType } }) {
  if (!isSupportedLanguage(params.lang)) {
    return <NotFound />
  }

  return <Component lang={params.lang} />
}
