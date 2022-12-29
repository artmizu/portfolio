import Link from 'next/link'
import { languages } from 'i18n/settings'
import { Language } from 'shared/type/Language'
import st from './index.module.scss'

export default async function LanguageSwitcher({ current }: { current: Language }) {
  return (
    <div className={st['switcher']}>
      {
        languages.map((el) => {
          if (el === current) {
            return (
              <div key={el} className={st['switcher__el']}>
                { el }
              </div>
            )
          } else {
            return (
              <div key={el} className={st['switcher__el']}>
                <Link className='ui-link' href={`/${el}`}>
                  { el }
                </Link>
              </div>
            )
          }
        })
      }
    </div>
  )
}