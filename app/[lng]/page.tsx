import st from './page.module.scss'
import cls from 'classnames'
import H1 from 'ui/h1'
import H3 from 'ui/h3'
import OpenSourceCard from 'ui/OpenSourceCard'
import { useTranslation } from 'i18n'
import ProjectGrid from 'ui/ProjectGrid'
import projectList from './projects'
import { Language } from 'shared/type/Language'
import LanguageSwitcher from 'ui/LanguageSwitcher'


export default async function Home({ params: { lng } }: { params: { lng: Language }}) {
  console.log("GENERATE", lng)
  const { t } = await useTranslation(lng)

  const used = [
    { 
      title: 'Vite, ESBuild, Rollup, Webpack',
      text: 'Для сборки проектов'
    },
    { 
      title: 'Vitest, Jest, Cypress, Puppeteer',
      text: 'Для тестирования'
    },
    { 
      title: 'NodeJS, GraphQL, Apollo,  MongoDB, PostgreSQL',
      text: 'Для разработки на бэке'
    },
    { 
      title: 'Vue 2/3, React, Solid, SvelteJS',
      text: 'И экосистемы вокруг них'
    },
    { 
      title: 'Gitlab CI, Docker, Github Actions',
      text: 'Для автоматизации'
    },
    { 
      title: 'Typescript',
      text: 'Люблю и использую'
    }
  ]

  const openSource = [
    {
      img: 'analytics' as const,
      title: 'Модуль аналитики для Nuxt 2/3',
      description: 'Позволяет увидеть, что происходит с приложением. Поддерживает NodeJS метрики и метрики специфичные для SSR приложений',
      github: 'https://github.com/artmizu/analytics-nuxt'
    },
    {
      img: 'sitemap' as const,
      title: 'Модуль сайтмэпа для Nuxt 2/3',
      description: 'Поддерживает Typescript, динамические роуты, кэширование и разделение карт на куски',
      github: 'https://github.com/artmizu/sitemap-nuxt-2'
    },
    {
      img: 'metrika' as const,
      title: 'Модуль я.метрики для Nuxt 2/3',
      description: 'Поддерживает Typescript, добавляет удобные логи при разработке и полезные методы в контекст приложения',
      github: 'https://github.com/artmizu/yandex-metrika-nuxt-2'
    },
  ]

  return (
    <div className={st['main-page']}>
      { t('h1') }
      {/* @ts-expect-error Server Component */}
      <LanguageSwitcher current={lng}/>
      <div className={st['main-intro']}>
        <div className={st['main-intro__about']}>
          <div className={st['main-intro__title']}>
            <H1>Александр Сабуров, разработка и дизайн</H1>
            <div className={cls('ui-p', st['main-intro__title-links'])}>
              <a href="https://t.me/artmizu" className={cls('ui-link', st['main-intro__title-link'])}>Telegram</a>
              <a href="https://github.com/artmizu" className={cls('ui-link', st['main-intro__title-link'])}>Гитхаб</a>
              <a href="mailto:hello@artmizu.ru" className={cls('ui-link', st['main-intro__title-link'])}>hello@artmizu.ru</a>
            </div>
          </div>
          <div className={st['main-intro__description']}>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">
              <b>10+ лет занимаюсь разработкой и дизайном</b>, умею создавать проекты с нуля, продумывать архитектуру 
              приложений и проектировать дизайн сложных интерфейсов. Интересуюсь бизнес-составляющими, чтобы 
              лучше понимать итоговую ценность, которую нужно пронести от идеи до конечного клиента через дизайн и разработку.
            </div>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">
              <b>Люблю не сносить и строить всё с нуля, а формировать подход по эволюционному развитию проектов</b>, не останавливая 
              поставку новых фич на момент этого перехода.
            </div>
            <H3 mt>3 года руковожу командой разработки</H3>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">
              При работе с командой занимаюсь её обучением и развитием, формирую базу знаний проекта и оптимизирую процессы. 
              Выстраиваю асинхронное взаимодействие участников команды, в котором все понимают что нужно делать и зачем. 
            </div>
            <div className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">
              При этом не забываю про результат и отслеживание общей производительности команды и настроения её участников. 
              Руководил командами разработки до 8 человек.
            </div>
          </div>
        </div>
        <div className={st['main-intro__art']}></div>
      </div>
      <H1 mt mb>С чем работал</H1>
      <div className={st['main-used-grid']}>
        { used.map((el) => {
          return <div key={el.title} className={st['main-used__el']}>
            <div className={st['main-used__el-title']}>
              <H3 mb>{ el.title }</H3>
            </div>
            <div className={cls('ui-p', 'ui-grey-text', st['main-used__el-text'])}>{ el.text }</div>
          </div>
        }) }
      </div>
      <H1 mt mb>Open Source</H1>
      <div className={st['main-open-source-grid']}>
        { openSource.map((el, index) => <OpenSourceCard  key={index} {...el} />) }
      </div>
      <H1 mt mb>Чем занимался</H1>
      <ProjectGrid list={projectList} />
    </div>
  )
}
