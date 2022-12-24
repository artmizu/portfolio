import { philosopher } from 'shared/font'
import styles from './index.module.scss'
import cls from 'classnames'

export default function H1({ children, mt, mb }: { children: React.ReactNode, mt?: boolean, mb?: boolean }) {
  return <h1 className={cls(philosopher.className, styles.h1, {
    [styles.h1_mt]: mt,
    [styles.h1_mb]: mb
  })}>{children}</h1>
}
