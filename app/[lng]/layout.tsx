import './globals.css';
import 'normalize.css/normalize.css';
import { inter } from 'shared/font';
import styles from './layout.module.css';
import 'ui/style.scss';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { languages } from 'i18n/settings';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.artmizu.ru'),
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }],
    apple: [{ url: '/favicon.png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;

  return (
    <html lang={lng}>
      <body>
        <div className={`${styles.layout} ${inter.className}`}>
          <div className={styles.wrapper}>{children}</div>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
