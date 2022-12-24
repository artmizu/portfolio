import styles from './index.module.scss'
import cls from 'classnames'

export default function H3({ children, mt, mb }: { children: React.ReactNode, mt?: boolean, mb?: boolean }) {
  return <h2 className={cls(styles.h3, { [styles.h3_mt]: mt, [styles.h3_mb]: mb })}>{children}</h2>
}
