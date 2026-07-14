import type { AiSummary } from '@/types'

export interface DetailField {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}

export interface DetailBadge {
  label: string
  color: string
}

export interface DetailSection {
  title: string
  content: string
  mono?: boolean
  collapsible?: boolean
}

export interface DetailLink {
  label: string
  url: string
}

export interface DetailEnrich {
  type: 'npm-package'
  packageName: string
}

export interface DetailContent {
  title: string
  subtitle?: string
  badge?: DetailBadge
  tags?: string[]
  fields?: DetailField[]
  body?: string
  bullets?: string[]
  breakingApiChanges?: string[]
  sections?: DetailSection[]
  links?: DetailLink[]
  summary?: AiSummary
  codeBlock?: string
  sourceUrl?: string
  sourceLabel?: string
  enrich?: DetailEnrich
}
