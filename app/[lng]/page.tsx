import cls from 'classnames';
import { getTranslation } from 'i18n';
import { languages } from 'i18n/settings';
import type { Metadata } from 'next';
import type { Language } from 'shared/type/Language';
import type { Project, ProjectType } from 'shared/type/Project';
import Art from 'ui/Art';
import H1 from 'ui/h1';
import H3 from 'ui/h3';
import LanguageSwitcher from 'ui/LanguageSwitcher';
import OpenSourceCard from 'ui/OpenSourceCard';
import ProjectGrid from 'ui/ProjectGrid';
import RichText from 'ui/RichText';
import st from './page.module.scss';

export function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export async function generateMetadata({ params }: { params: Promise<{ lng: string }> }): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getTranslation(lng as Language, ['about']);

  return {
    title: t('about:title') as string,
    description: t('about:meta') as string,
    alternates: {
      canonical: `/${lng}`,
      languages: { en: '/en', ru: '/ru', 'x-default': '/ru' },
    },
    openGraph: {
      type: 'website',
      siteName: t('about:title') as string,
      title: t('about:title') as string,
      description: t('about:meta') as string,
      locale: lng,
      images: [{ url: '/og.jpg', width: 1200, height: 600, alt: t('about:title') as string }],
    },
  };
}

export default async function Home({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params;
  const { t } = await getTranslation(lng as Language, ['about', 'project']);
  const list = t('about:tool.list', { returnObjects: true }) as { title: string; text: string }[];
  const projectList = t('project:list', { returnObjects: true }) as Array<Project & { type?: ProjectType }>;

  const openSource = [
    {
      img: 'analytics' as const,
      title: t('about:opensource.analytics.title'),
      description: t('about:opensource.analytics.description'),
      github: 'https://github.com/artmizu/nuxt-prometheus',
    },
    {
      img: 'sitemap' as const,
      title: t('about:opensource.sitemap.title'),
      description: t('about:opensource.sitemap.description'),
      github: 'https://github.com/artmizu/sitemap-nuxt-2',
    },
    {
      img: 'metrika' as const,
      title: t('about:opensource.metrika.title'),
      description: t('about:opensource.metrika.description'),
      github: 'https://github.com/artmizu/yandex-metrika-nuxt-2',
    },
  ];

  return (
    <div className={st['main-page']}>
      <div className={st['main-intro']}>
        <div className={st['main-intro__about']}>
          <div className={st['main-intro__switcher']}>
            {/* @ts-expect-error Server Component */}
            <LanguageSwitcher current={lng} />
          </div>
          <div className={st['main-intro__title']}>
            <H1>{t('about:title')}</H1>
            <nav className={cls('ui-p', st['main-intro__title-links'])}>
              <a href="https://t.me/artmizu" className={cls('ui-link', st['main-intro__title-link'])}>
                Telegram
              </a>
              <a href="https://github.com/artmizu" className={cls('ui-link', st['main-intro__title-link'])}>
                GitHub
              </a>
              <a href="mailto:hello@artmizu.ru" className={cls('ui-link', st['main-intro__title-link'])}>
                hello@artmizu.ru
              </a>
            </nav>
          </div>
          <section className={st['main-intro__description']}>
            <RichText className="ui-p ui-p_mxw-540 ui-p_large ui-p_my" html={t('about:description.first')} />
            <RichText className="ui-p ui-p_mxw-540 ui-p_large ui-p_my" html={t('about:description.second')} />
            <H3 mt>{t('about:description.title')}</H3>
            <p className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">{t('about:description.third')}</p>
            <p className="ui-p ui-p_mxw-540 ui-p_large ui-p_my">{t('about:description.fourth')}</p>
          </section>
        </div>
        <div className={st['main-intro__art']}>
          <Art />
        </div>
      </div>
      <H1 mt mb>
        {t('about:tool.title')}
      </H1>
      <section className={st['main-used-grid']}>
        {list.map((el) => {
          return (
            <div key={el.title} className={st['main-used-grid__el']}>
              <div className={st['main-used-grid__el-title']}>
                <H3>{el.title}</H3>
              </div>
              <div className={cls('ui-p', 'ui-grey-text', st['main-used-grid__el-text'])}>{el.text}</div>
            </div>
          );
        })}
      </section>
      <H1 mt mb>
        Open Source
      </H1>
      <section className={st['main-open-source-grid']}>
        {openSource.map((el) => (
          <div key={el.github} className={st['main-open-source-grid__el']}>
            <OpenSourceCard {...el} />
          </div>
        ))}
      </section>
      <H1 mt mb>
        {t('project:title')}
      </H1>
      <ProjectGrid list={projectList} />
    </div>
  );
}
