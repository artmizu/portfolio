import './globals.css'
import 'normalize.css/normalize.css'
import styles from './layout.module.css'
import { inter } from 'shared/font'
import 'ui/style.scss'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
