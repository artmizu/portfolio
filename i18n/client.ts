'use client'

import i18next, { Namespace } from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getOptions } from './settings'
import { Language, LanguageNS } from 'shared/type/Language'

i18next
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
  .init(getOptions())

export function useTranslation(lng: Language, ns?: Namespace<LanguageNS>, options: { keyPrefix?: string} = {}) {
  if (i18next.resolvedLanguage !== lng) i18next.changeLanguage(lng)
  return useTranslationOrg(ns, options)
}