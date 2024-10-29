import { useTranslation } from "i18n/index";
import { Language } from "shared/type/Language";

export default async function Head({ params }: { params: Promise<{ lng: Language }>}) {
  const { lng } = await params
  const { t } = await useTranslation(lng, ['about'])

  return (
    <>
      <title>{ t('about:title') }</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content={ t('about:meta') as string } />
      <link rel="icon" href="/favicon.ico" sizes="any"/>
      <link rel="apple-touch-icon" href="/favicon.png"/>
      <meta property="og:image" content="/og.jpg"/>
      <meta property="og:image:width" content="1200"/>
      <meta property="og:image:height" content="600"/>
      <meta property="og:title" content={ t('about:title') as string }/>
      <meta property="og:description" content={t('about:meta') as string}/>
    </>
  )
}
