import { Language } from "shared/type/Language"

export const fallbackLng: Language = 'ru'
export const languages: Language[] = [fallbackLng, 'en']
export const defaultNS = 'common'

export function getOptions (lng = fallbackLng, ns = defaultNS) {
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