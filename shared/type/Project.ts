export type ProjectType = 
  'constructor' | 
  'store' | 
  'darkstore' | 
  'parser-extension' | 
  'parser-recruiter' | 
  'uae' | 
  'verdi' | 
  'samo' | 
  'kran' | 
  'behance' | 
  'birden'

export interface ProjectDate {
  from: number,
  to?: number
}

export interface Project {
  date: ProjectDate,
  title: string,
  technology?: string,
  description?: string
  link?: {
    text: string,
    href: string
  }
}