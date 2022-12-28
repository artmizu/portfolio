import Link from 'next/link'
import { Trans } from 'react-i18next/TransWithoutContext'
import { languages } from 'i18n/settings'
import { useTranslation } from 'i18n'
import { Language } from 'shared/type/Language'

export default async function LanguageSwitcher({ current }: { current: Language }) {
  const { t } = await useTranslation(current, 'footer')
  return (
    <>
      <Trans i18nKey="languageSwitcher" t={t}>
        Switch from <strong>{current}</strong> to:{' '}
      </Trans>
      {languages.filter((l) => current !== l).map((l, index) => {
        return (
          <span key={l}>
            {index > 0 && (' or ')}
            <Link href={`/${l}`}>
              {l}
            </Link>
          </span>
        )
      })}
    </>
  )
}