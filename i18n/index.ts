import { createInstance, KeyPrefix, Namespace } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next/initReactI18next'
import { Language, LanguageNS } from 'shared/type/Language'
import { getOptions } from './settings'

const initI18next = async (lng: Language, ns?: Namespace<LanguageNS>) => {
  const i18nInstance = createInstance()
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
    .init(getOptions(lng, ns))
  return i18nInstance
}

export async function useTranslation(lng: Language, ns?: Namespace<LanguageNS>, options: { keyPrefix?: KeyPrefix<LanguageNS>} = {}) {
  const i18nextInstance = await initI18next(lng, ns)
  return {
    t: i18nextInstance.getFixedT(lng, ns, options.keyPrefix),
    i18n: i18nextInstance
  }
}