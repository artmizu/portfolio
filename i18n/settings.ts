import { Namespace } from "i18next"
import { Language, LanguageNS } from "shared/type/Language"

export const fallbackLng: Language = 'ru'
export const languages: Language[] = [fallbackLng, 'en']
export const defaultNS: LanguageNS = 'common'

export function getOptions (lng:string = fallbackLng, ns:Namespace<LanguageNS> = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  }
}