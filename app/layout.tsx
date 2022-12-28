import './globals.css'
import 'normalize.css/normalize.css'
import styles from './layout.module.css'
import { inter } from 'shared/font'
import 'ui/style.scss'
import { Language } from 'shared/type/Language'
import { languages } from 'i18n/settings'

export function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

export default function RootLayout({
  children,
  params: {
    lng
  }
}: {
  children: React.ReactNode,
  params: { lng: Language }
}) {
  return (
    <html lang={lng}>
      <head />
      <body>
        <div className={`${styles.layout} ${inter.className}`}>
          <div className={styles.wrapper}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
