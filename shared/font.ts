import { Inter, Philosopher } from 'next/font/google'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })
const philosopher = Philosopher({ subsets: ['latin', 'cyrillic'], weight: '400' })

export {
  inter,
  philosopher
}