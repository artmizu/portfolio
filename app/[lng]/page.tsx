import st from './page.module.scss'
import cls from 'classnames'
import H1 from 'ui/h1'
import H3 from 'ui/h3'
import OpenSourceCard from 'ui/OpenSourceCard'
import { useTranslation } from 'i18n'
import ProjectGrid from 'ui/ProjectGrid'
import { Language } from 'shared/type/Language'
import LanguageSwitcher from 'ui/LanguageSwitcher'
import { Project, ProjectType } from 'shared/type/Project'

export default async function Home({ params: { lng } }: { params: { lng: Language }}) {
  const { t } = await useTranslation(lng, ['about', 'project'])
  const list: { title: string, text: string }[] = t('about:tool.list', { returnObjects: true })
  const projectList: Array<Project & { type?: ProjectType }> = t('project:list', { returnObjects: true })

  const openSource = [
    {
      img: 'analytics' as const,
      title: t('about:opensource.analytics.title'),
      description: t('about:opensource.analytics.description'),
      github: 'https://github.com/artmizu/analytics-nuxt'
    },
    {
      img: 'sitemap' as const,
      title: t('about:opensource.sitemap.title'),
      description: t('about:opensource.sitemap.description'),
      github: 'https://github.com/artmizu/sitemap-nuxt-2'
    },
    {
      img: 'metrika' as const, 
      title: t('about:opensource.metrika.title'),
      description: t('about:opensource.metrika.description'),
      github: 'https://github.com/artmizu/yandex-metrika-nuxt-2'
    },
  ]

  return (
    <div className={st['main-page']}>
      <div className={st['main-intro']}>
        <div className={st['main-intro__about']}>
          <div className={st['main-intro__switcher']}>
            {/* @ts-expect-error Server Component */}
            <LanguageSwitcher current={lng}/>
          </div>
          <div className={st['main-intro__title']}>
            <H1>{ t('about:title') }</H1>
            <div className={cls('ui-p', st['main-intro__title-links'])}>
              <a href="https://t.me/artmizu" className={cls('ui-link', st['main-intro__title-link'])}>Telegram</a>
              <a href="https://github.com/artmizu" className={cls('ui-link', st['main-intro__title-link'])}>GitHub</a>
              <a href="mailto:hello@artmizu.ru" className={cls('ui-link', st['main-intro__title-link'])}>hello@artmizu.ru</a>
            </div>
          </div>
          <div className={st['main-intro__description']}>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my" dangerouslySetInnerHTML={{ __html: t('about:description.first') }} />
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my" dangerouslySetInnerHTML={{ __html: t('about:description.second') }} />
            <H3 mt>{ t('about:description.title') }</H3>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">
              { t('about:description.third') }
            </div>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">
              { t('about:description.fourth') }
            </div>
          </div>
        </div>
        <div className={st['main-intro__art']}></div>
      </div>
      <H1 mt mb>{ t('about:tool.title') }</H1>
      <div className={st['main-used-grid']}>
        { list.map((el) => {
          return <div key={el.title} className={st['main-used-grid__el']}>
            <div className={st['main-used-grid__el-title']}>
              <H3>{ el.title }</H3>
            </div>
            <div className={cls('ui-p', 'ui-grey-text', st['main-used-grid__el-text'])}>{ el.text }</div>
          </div>
        }) }
      </div>
      <H1 mt mb>Open Source</H1>
      <div className={st['main-open-source-grid']}>
        { openSource.map((el, index) => (
          <div key={index} className={st['main-open-source-grid__el']}>
            <OpenSourceCard {...el} />
          </div>
        )) }
      </div>
      <H1 mt mb>{ t('project:title') }</H1>
      <ProjectGrid list={projectList} />
    </div>
  )
}
