import type { FilterCategory } from '@/types'
import type { ArticleTone } from '@/types/knowledge'

export interface RssFeedConfig {
  id: string
  name: string
  url: string
  technology: string
  tone: ArticleTone
  categories: FilterCategory[]
}

export const RSS_FEEDS: RssFeedConfig[] = [
  {
    id: 'react-blog',
    name: 'React Blog',
    url: 'https://react.dev/rss.xml',
    technology: 'React',
    tone: 'official',
    categories: ['react'],
  },
  {
    id: 'overreacted',
    name: 'Overreacted',
    url: 'https://overreacted.io/rss.xml',
    technology: 'React',
    tone: 'deep-dive',
    categories: ['react'],
  },
  {
    id: 'joshwcomeau',
    name: 'Josh W. Comeau',
    url: 'https://www.joshwcomeau.com/rss.xml',
    technology: 'Frontend',
    tone: 'deep-dive',
    categories: ['react', 'ui-libraries', 'browser-apis'],
  },
  {
    id: 'devto-react',
    name: 'DEV — React',
    url: 'https://dev.to/feed/tag/react',
    technology: 'Community',
    tone: 'community',
    categories: ['react'],
  },
  {
    id: 'devto-typescript',
    name: 'DEV — TypeScript',
    url: 'https://dev.to/feed/tag/typescript',
    technology: 'TypeScript',
    tone: 'community',
    categories: ['typescript'],
  },
  {
    id: 'devto-frontend',
    name: 'DEV — Frontend',
    url: 'https://dev.to/feed/tag/frontend',
    technology: 'Frontend',
    tone: 'community',
    categories: ['react', 'ui-libraries', 'infrastructure'],
  },
  {
    id: 'devto-javascript',
    name: 'DEV — JavaScript',
    url: 'https://dev.to/feed/tag/javascript',
    technology: 'JavaScript',
    tone: 'community',
    categories: ['react', 'typescript', 'infrastructure'],
  },
  {
    id: 'tkdodo',
    name: 'TkDodo',
    url: 'https://tkdodo.eu/blog/rss.xml',
    technology: 'TanStack Query',
    tone: 'deep-dive',
    categories: ['react', 'infrastructure'],
  },
  {
    id: 'devto-tanstack',
    name: 'DEV — TanStack',
    url: 'https://dev.to/feed/tag/tanstack',
    technology: 'TanStack',
    tone: 'community',
    categories: ['react', 'infrastructure'],
  },
]

export interface RssItem {
  title: string
  link: string
  pubDate: string
  description: string
  author?: string
}

export async function fetchRssFeed(url: string): Promise<RssItem[]> {
  const response = await fetch(url, { headers: { Accept: 'application/xml, text/xml, */*' } })
  if (!response.ok) throw new Error(`RSS fetch failed: HTTP ${response.status}`)

  const xml = await response.text()
  return parseRss(xml)
}

function parseRss(xml: string): RssItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = Array.from(doc.querySelectorAll('item, entry'))

  return items.map((item) => {
    const title =
      textContent(item, 'title') ||
      'Untitled'
    const link =
      textContent(item, 'link') ||
      item.querySelector('link')?.getAttribute('href') ||
      ''
    const pubDate =
      textContent(item, 'pubDate') ||
      textContent(item, 'published') ||
      textContent(item, 'updated') ||
      new Date().toISOString()
    const description =
      textContent(item, 'description') ||
      textContent(item, 'summary') ||
      textContent(item, 'content') ||
      ''
    const author =
      textContent(item, 'author') ||
      textContent(item, 'dc\\:creator') ||
      item.querySelector('author name')?.textContent ||
      undefined

    return {
      title: decodeEntities(title.trim()),
      link: link.trim(),
      pubDate,
      description: stripHtml(decodeEntities(description.trim())),
      author: author?.trim(),
    }
  })
}

function textContent(parent: Element, selector: string): string {
  return parent.querySelector(selector)?.textContent ?? ''
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? html
}

function decodeEntities(text: string): string {
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

export function rssDateToIso(pubDate: string): string {
  const parsed = new Date(pubDate)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

export function estimateReadMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.min(15, Math.ceil(words / 200)))
}

export function makeExcerpt(text: string, maxLength = 160): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Worth a quick read — open to see what changed.'
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}…`
}

export function casualizeReleaseNotes(body: string): string {
  const cleaned = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[#*`[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()

  if (!cleaned) return 'Fresh release — peek at the changelog for the good stuff.'
  return makeExcerpt(cleaned, 140)
}
