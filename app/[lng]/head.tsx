import { useTranslation } from "i18n/index";
import { Language } from "shared/type/Language";

export default async function Head({ params: { lng } }: { params: { lng: Language }}) {
  const { t } = await useTranslation(lng, ['about'])

  return (
    <>
      <title>{ t('about:title') }</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content={ t('about:meta') as string } />
      <link rel="icon" href="/favicon.ico" sizes="any"/>
      <link rel="apple-touch-icon" href="/favicon.png"/>
    </>
  )
}
