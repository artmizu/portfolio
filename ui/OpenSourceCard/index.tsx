import st from './index.module.scss'
import Image from 'next/image'
import cls from 'classnames'
import H3 from 'ui/h3'
import AnalyticsImage from './asset/analytics.png'
import MetrikaImage from './asset/metrika.png'
import SitemapImage from './asset/sitemap.png'

type OpenSourceType = 'analytics' | 'metrika' | 'sitemap'

function getImage(img: OpenSourceType) {
  if (img === 'analytics') {
    return AnalyticsImage
  } else if (img === 'metrika') {
    return MetrikaImage
  } else {
    return SitemapImage
  }
}

export default function OpenSourceCard({ img, title, description, github }: { img: OpenSourceType, title: string, description: string, github?: string }) {
  return (
    <article className={st['card']}>
      <div className={st['card__img']}>
        <Image src={getImage(img)} height="60" alt={title}/>
      </div>
      <div className={st['card__title']}>
        <H3>{ title }</H3>
      </div>
      <div className={cls('ui-p', 'ui-grey-text', st['card__description'])}>
        { description }
      </div>
      <div className={st['card__github']}>
        <a href={github} className={st['github-link']}>
          GitHub
        </a>
      </div>
    </article>
  )
}