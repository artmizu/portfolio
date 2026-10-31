import cls from 'classnames';
import type { Project, ProjectType } from 'shared/type/Project';
import {
  FactoidBehance,
  FactoidParserExtension,
  FactoidParserRecruiter,
  FactoidProfessionalDevelopment,
  FactoidVerdi,
} from 'ui/Factoid';
import {
  ProjectCard,
  ProjectCardLargeBirden,
  ProjectCardLargeConstructor,
  ProjectCardLargeDarkstore,
  ProjectCardLargeKran,
  ProjectCardLargeMarketplace,
  ProjectCardLargeRakuten,
  ProjectCardLargeSamo,
  ProjectCardLargeStore,
  ProjectCardLargeUae,
} from 'ui/ProjectCard';
import st from './index.module.scss';

export default function ProjectGrid({ list }: { list: Array<Project & { type?: ProjectType }> }) {
  return (
    <div className={st['project-grid']}>
      {list.map((el, index) => {
        if (el.type === 'professional-development') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <FactoidProfessionalDevelopment data={el} />
            </article>
          );
        } else if (el.type === 'rakuten') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeRakuten data={el} />
            </article>
          );
        } else if (el.type === 'marketplace') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeMarketplace data={el} />
            </article>
          );
        } else if (el.type === 'constructor') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeConstructor data={el} />
            </article>
          );
        } else if (el.type === 'store') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeStore data={el} />
            </article>
          );
        } else if (el.type === 'darkstore') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeDarkstore data={el} />
            </article>
          );
        } else if (el.type === 'uae') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeUae data={el} />
            </article>
          );
        } else if (el.type === 'samo') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeSamo data={el} />
            </article>
          );
        } else if (el.type === 'kran') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeKran data={el} />
            </article>
          );
        } else if (el.type === 'birden') {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
              <ProjectCardLargeBirden data={el} />
            </article>
          );
        } else if (el.type === 'parser-recruiter') {
          return <FactoidParserRecruiter key={index} data={el} />;
        } else if (el.type === 'parser-extension') {
          return <FactoidParserExtension key={index} data={el} />;
        } else if (el.type === 'verdi') {
          return <FactoidVerdi key={index} data={el} />;
        } else if (el.type === 'behance') {
          return <FactoidBehance key={index} data={el} />;
        } else {
          return (
            <article key={index} className={cls(st['project-grid__el'], st['project-grid__el_simple'])}>
              <ProjectCard data={el} />
            </article>
          );
        }
      })}
    </div>
  );
}
