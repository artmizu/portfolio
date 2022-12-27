"use client"

import { useEffect, useRef, useState } from "react";
import { useIntersection } from "react-use";
import { Project } from "shared/type/Project";
import st from './index.module.scss'
import cls from 'classnames'

function FactoidBase({ 
  titleColor, 
  textColor, 
  linkColor,
  background, 
  data, 
  onVisible,
  children 
}: { 
    titleColor: string,
    textColor: string, 
    linkColor?: string, 
    background: { from: string, to: string }, // TODO color?
    data: Project, 
    onVisible?: () => void,
    children: React.ReactNode 
  }) {
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
    <div className={st['factoid']} style={{ background: `linear-gradient(${background.from}, ${background.to})`}} ref={intersectionRef}>
      <div className={st['factoid__about']}>
        <div className={st['factoid__date']} style={{ color: textColor }}>
          { data.date.from }
        </div>
        <div className={st['factoid__title']} style={{ color: titleColor }}>{ data.title }</div>
        { data.description && (
          <div className={st['factoid__description']} style={{ color: textColor }}>{ data.description }</div>
        )}
        { data.link && (
          <div className={st['factoid__link-wrapper']}>
            <a href={data.link.href} className={st['factoid__link']} style={{ color: linkColor }}>{ data.link.text }</a>
          </div>
        )}
      </div>
      <div className={st['factoid__art']}>
        { children }
      </div>
    </div>
  )
}

export function FactoidParserRecruiter({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <FactoidBase onVisible={() => setIsVisible(true)} background={{ from: '#FFEDF6', to: '#FBE8F2' }} data={data} textColor='#76646D' titleColor='#2E2329'>
      <div className={cls(st['parser-recruiter'], {
        [st['parser-recruiter_visible']]: isVisible
      })}>
        <div className={st['parser-recruiter__left']}></div>
        <div className={st['parser-recruiter__center']}></div>
        <div className={st['parser-recruiter__right']}></div>
      </div>
    </FactoidBase>
  )
}

export function FactoidParserExtension({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <FactoidBase onVisible={() => setIsVisible(true)} background={{ from: '#F5FAFF', to: '#E6EEF5' }} data={data} textColor='#6E767E' titleColor='#23252E'>
      <div className={cls(st['parser-extension'], {
        [st['parser-extension_visible']]: isVisible
      })}>
        <div className={st['parser-extension__video-wrapper']}>
          <video autoPlay muted loop src={require('./asset/parser-extension/preview.mp4')} className={st['parser-extension__video']}/>
        </div>
      </div>
    </FactoidBase>
  )
}

export function FactoidVerdi({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <FactoidBase onVisible={() => setIsVisible(true)} background={{ from: '#FFF8ED', to: '#F9F3DE' }} data={data} textColor='#878274' titleColor='#2E2823'>
      <div className={cls(st['verdi'], {
        [st['verdi_visible']]: isVisible
      })}>
        <div className={st['verdi__left']}></div>
        <div className={st['verdi__center']}></div>
        <div className={st['verdi__right']}></div>
      </div>
    </FactoidBase>
  )
}

export function FactoidBehance({ data }: { data: Project }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <FactoidBase onVisible={() => setIsVisible(true)} background={{ from: '#2165F5', to: '#1A5AE0' }} data={data} textColor='#B4CCFF' titleColor='#fff' linkColor="#C7F64C">
      <div className={cls(st['behance'], {
        [st['behance_visible']]: isVisible
      })}>
        <div className={st['behance__left']}></div>
        <div className={st['behance__center']}></div>
        <div className={st['behance__right']}></div>
      </div>
    </FactoidBase>
  )
}