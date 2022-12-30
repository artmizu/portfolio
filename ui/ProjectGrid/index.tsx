import { Project, ProjectType } from "shared/type/Project";
import { 
  ProjectCardLargeConstructor, 
  ProjectCardLargeStore, 
  ProjectCard, 
  ProjectCardLargeDarkstore, 
  ProjectCardLargeUae, 
  ProjectCardLargeSamo, 
  ProjectCardLargeKran,
  ProjectCardLargeBirden 
} from "ui/ProjectCard";
import cls from 'classnames'
import st from './index.module.scss'
import { 
  FactoidParserExtension, 
  FactoidParserRecruiter, 
  FactoidVerdi, 
  FactoidBehance 
} from "ui/Factoid";

export default function ProjectGrid({ list }: { list: Array<Project & { type?: ProjectType }>}) {
  return (
    <div className={st['project-grid']}>
      { 
        list.map((el, index) => {
          if (el.type === 'constructor') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeConstructor data={el} />
              </div>
            )
          } else if (el.type === 'store') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeStore data={el} />
              </div>
            )
          } else if (el.type === 'darkstore') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeDarkstore data={el} />
              </div>
            )
          } else if (el.type === 'uae') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeUae data={el} />
              </div>
            )
          } else if (el.type === 'samo') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeSamo data={el} />
              </div>
            )
          } else if (el.type === 'kran') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeKran data={el} />
              </div>
            )
          } else if (el.type === 'birden') {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_large'])}>
                <ProjectCardLargeBirden data={el} />
              </div>
            )
          } else if (el.type === 'parser-recruiter') {
            return (
              <FactoidParserRecruiter key={index} data={el} />
            )
          } else if (el.type === 'parser-extension') {
            return (
              <FactoidParserExtension key={index} data={el} />
            )
          } else if (el.type === 'verdi') {
            return (
              <FactoidVerdi key={index} data={el} />
            )
          } else if (el.type === 'behance') {
            return (
              <FactoidBehance key={index} data={el} />
            )
          } else {
            return (
              <div key={index} className={cls(st['project-grid__el'], st['project-grid__el_simple'])}>
                <ProjectCard data={el} />
              </div>
            )
          }
        })
      }
    </div>
  )
}