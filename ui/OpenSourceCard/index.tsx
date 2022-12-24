import st from './index.module.scss'
import Image from 'next/image'
import cls from 'classnames'
import H3 from 'ui/h3'
import AnalyticsImage from './asset/analytics.png'
import MetrikaImage from './asset/metrika.png'
import SitemapImage from './asset/sitemap.png'

type ImageType = 'analytics' | 'metrika' | 'sitemap'

function getImage(img: ImageType) {
  if (img === 'analytics') {
    return AnalyticsImage
  } else if (img === 'metrika') {
    return MetrikaImage
  } else {
    return SitemapImage
  }
}

export default function OpenSourceCard({ img, title, description, github }: { img: ImageType, title: string, description: string, github?: string }) {
  return (
    <div className={st['card']}>
      <div className={st['card__img']}>
        <Image src={getImage(img)} height="60" alt={title}/>
      </div>
      <H3 mb>{ title }</H3>
      <div className={cls('ui-p', 'ui-grey-text', st['card__description'])}>
        { description }
      </div>
      <div className={st['card__github']}>
        <a href={github} className={st['github-link']}>
          GitHub
        </a>
      </div>
    </div>
  )
}