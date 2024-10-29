import './globals.css'
import 'normalize.css/normalize.css'
import styles from './layout.module.css'
import { inter } from 'shared/font'
import 'ui/style.scss'
import { Language } from 'shared/type/Language'
import { languages } from 'i18n/settings'
import { useTranslation } from "i18n/index";

export function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{ lng: Language }>
}) {
  const { lng, } = await params
  const { t } = await useTranslation(lng, ['about'])

  return (
    <html lang={lng}>
      <head>
        <title>{t('about:title')}</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="description" content={ t('about:meta') as string } />
        <link rel="icon" href="/favicon.ico" sizes="any"/>
        <link rel="apple-touch-icon" href="/favicon.png"/>
        <meta property="og:image" content="/og.jpg"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="600"/>
        <meta property="og:title" content={ t('about:title') as string }/>
        <meta property="og:description" content={t('about:meta') as string}/>
      </head>
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
