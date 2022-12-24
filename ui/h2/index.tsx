import styles from './index.module.scss'

export default function H2({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.h2}>{children}</h2>
}
