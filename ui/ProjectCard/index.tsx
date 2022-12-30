"use client"

import H2 from "ui/h2";
import { useRef, useState, useEffect } from "react";
import { useIntersection } from 'react-use';
import { Project } from "shared/type/Project";
import Image from "next/image";
import DateMarker from "ui/DateMarker";
import st from './index.module.scss'
import cls from 'classnames'

import UaeLeft from './asset/uae/left.jpg'
import UaeRight from './asset/uae/right.jpg'
import SamoImage from './asset/samo/image.jpg'

export function ProjectCard({ data }: { data: Project }) {
  return (
    <div className={st['project-card']}>
      <div className={st['project-card__title']}>
        <div className={st['project-card__date']}>
          <DateMarker data={data.date} />
        </div>
        <H2>{ data.title }</H2>
        <div className={cls('ui-p', 'ui-p_small', 'ui-grey-text', st['project-card__technology'])}>
          { data.technology }
        </div>
      </div>
      {
        data.description && (
          <div className={cls('ui-p', 'ui-grey-text', st['project-card__description'])} dangerouslySetInnerHTML={{ __html: data.description }}/>
        )
      }
        
      { data.link && (
        <div className={st['project-card__link']}>
          <a href={data.link.href} className="ui-link">{ data.link.text }</a>
        </div>
      )}
    </div>
  )
}

export function ProjectCardLargeBase({ data, children, onVisible }: { data: Project, children: React.ReactNode, onVisible?: () => void }) {
  const intersectionRef = useRef(null);
  const intersection = useIntersection(intersectionRef, {
    rootMargin: '0px',
    threshold: 0.8
  });

  useEffect(() => {
    if (intersection && intersection.intersectionRatio > 0.8) {
      onVisible?.()
    }
  }, [intersection])

  return (
    <div className={st['project-card-large']} ref={intersectionRef}>
      <div className={st['project-card-large__about']}>
        <ProjectCard data={data} />
      </div>
      <div className={st['project-card-large__art']}>
        { children }
      </div>
    </div>
  )
}

export function ProjectCardLargeConstructor({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['constructor'], {
        [st['constructor_visible']]: isVisible
      })}>
        <div className={st['constructor__video-wrapper']}>
          <video playsInline autoPlay muted loop src={require('./asset/constructor/preview.mp4')} className={st['constructor__video']}/>
        </div>
        <div className={st['constructor__spot']}></div>
      </div>
    </ProjectCardLargeBase>
  )
}

export function ProjectCardLargeStore({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['store'], {
        [st['store_visible']]: isVisible
      })}>
        <div className={st['store__wrapper']}>
          <div className={st['store__left']}/>
          <div className={st['store__center']}/>
          <div className={st['store__right']}/>
        </div>
      </div>
    </ProjectCardLargeBase>
  )
}

export function ProjectCardLargeDarkstore({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['darkstore'], {
        [st['darkstore_visible']]: isVisible
      })}>
        <div className={st['darkstore__wrapper']}>
          <div className={st['darkstore__left']}/>
          <div className={st['darkstore__right']}/>
        </div>
      </div>
    </ProjectCardLargeBase>
  )
}

export function ProjectCardLargeUae({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['uae'], {
        [st['uae_visible']]: isVisible
      })}>
        <div className={st['uae__wrapper']}>
          <div className={st['uae__left']}>
            <Image src={UaeLeft} width="300" className={st['uae__preview']} alt={data.title} />
          </div>
          <div className={st['uae__right']}>
            <Image src={UaeRight} width="400" className={st['uae__preview']} alt={data.title} />
          </div>
        </div>
      </div>
    </ProjectCardLargeBase>
  )
}

export function ProjectCardLargeSamo({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['samo'], {
        [st['samo_visible']]: isVisible
      })}>
        <div className={st['samo__bottom']}>
          <Image src={SamoImage} width="450" className={st['samo__preview']} alt={data.title} />
        </div>
        <div className={st['samo__video-wrapper']}>
          <video playsInline autoPlay muted loop src={require('./asset/samo/preview.mp4')} className={st['samo__video']}/>
        </div>
      </div>
    </ProjectCardLargeBase>
  )
}

export function ProjectCardLargeKran({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['kran'], {
        [st['kran_visible']]: isVisible
      })}>
        <div className={st['kran__video-wrapper']}>
          <video playsInline autoPlay muted src={require('./asset/kran/preview.mp4')} className={st['kran__video']}/>
        </div>
      </div>
    </ProjectCardLargeBase>
  )
}

export function ProjectCardLargeBirden({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <ProjectCardLargeBase data={data} onVisible={() => setIsVisible(true)}>
      <div className={cls(st['birden'], {
        [st['birden_visible']]: isVisible
      })}>
        <div className={st['birden__wrapper']}>
          <div className={st['birden__left']}/>
          <div className={st['birden__center']}/>
          <div className={st['birden__right']}/>
        </div>
      </div>
    </ProjectCardLargeBase>
  )
}

