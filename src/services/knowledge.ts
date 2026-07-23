import type { FilterCategory } from '@/types'
import type { ArticleTone, KnowledgeArticle, KnowledgeData } from '@/types/knowledge'
import { CURATED_READING_LIST, TANSTACK_READING_LIST } from '@/types/knowledge'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { apiUrl } from '@/services/api'
import { fetchJson } from '@/services/http'
import { summarizeReleaseBody } from '@/services/github'
import {
  casualizeReleaseNotes,
  estimateReadMinutes,
  fetchRssFeed,
  makeExcerpt,
  rssDateToIso,
  RSS_FEEDS,
} from '@/services/rss'

interface GitHubReleaseListItem {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
  prerelease: boolean
}

const RELEVANCE_KEYWORDS = [
  'react', 'typescript', 'vite', 'tanstack', 'zustand', 'mui', 'node',
  'frontend', 'javascript', 'css', 'browser', 'testing', 'playwright',
  'vitest', 'suspense', 'server component', 'hydration', 'webpack',
]

const TANSTACK_REPOS = new Set(['TanStack/query', 'TanStack/router', 'TanStack/table', 'TanStack/start'])

export function isTanStackKnowledgeArticle(article: KnowledgeArticle): boolean {
  return article.section === 'tanstack'
}

export function isReleaseKnowledgeArticle(article: KnowledgeArticle): boolean {
  return article.tone === 'release'
}

function isRelevantToStack(title: string, excerpt: string): boolean {
  const text = `${title} ${excerpt}`.toLowerCase()
  return RELEVANCE_KEYWORDS.some((k) => text.includes(k))
}

async function fetchRssArticlesForSection(section: 'read' | 'tanstack'): Promise<KnowledgeArticle[]> {
  const feeds = RSS_FEEDS.filter((feed) => feed.section === section)
  const articles: KnowledgeArticle[] = []

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const items = await fetchRssFeed(feed.url)
        for (const item of items.slice(0, 5)) {
          const excerpt = makeExcerpt(item.description || item.title)
          if (feed.tone === 'community' && !isRelevantToStack(item.title, excerpt)) continue

          articles.push({
            id: `rss-${feed.id}-${hashId(item.link)}`,
            title: item.title,
            excerpt,
            source: feed.name,
            sourceUrl: item.link,
            publishedAt: rssDateToIso(item.pubDate),
            readTimeMinutes: estimateReadMinutes(`${item.title} ${item.description}`),
            topics: feed.categories,
            tone: feed.tone,
            section: feed.section,
          })
        }
      } catch {
        // Feed unreachable — proxy may be unavailable in local dev
      }
    }),
  )

  return articles
}

async function fetchReleaseList(repo: string, perPage: number): Promise<GitHubReleaseListItem[]> {
  try {
    const response = await fetch(
      apiUrl('/github-release-history', { repo, per_page: String(perPage) }),
    )
    if (response.ok) {
      return (await response.json()) as GitHubReleaseListItem[]
    }
  } catch {
    // Proxy unavailable
  }

  return fetchJson<GitHubReleaseListItem[]>(
    `https://api.github.com/repos/${repo}/releases?per_page=${perPage}`,
  )
}

async function fetchReleaseArticles(): Promise<KnowledgeArticle[]> {
  const uniqueRepos = new Map<string, { repo: string; name: string; categories: FilterCategory[] }>()

  for (const pkg of WATCHLIST_PACKAGES) {
    if (pkg.githubRepo && !uniqueRepos.has(pkg.githubRepo)) {
      uniqueRepos.set(pkg.githubRepo, {
        repo: pkg.githubRepo,
        name: pkg.name,
        categories: pkg.categories,
      })
    }
  }

  const batches = await Promise.all(
    Array.from(uniqueRepos.values()).map(async ({ repo, name, categories }) => {
      try {
        const perPage = TANSTACK_REPOS.has(repo) ? 3 : 2
        const releases = await fetchReleaseList(repo, perPage)
        return releases
          .filter((r) => !r.prerelease)
          .map((release) => {
            const body = release.body ?? ''
            const excerpt = casualizeReleaseNotes(body) || summarizeReleaseBody(body, 120)

            return {
              id: `release-${repo}-${release.tag_name}`,
              title: `What's new in ${name} ${release.tag_name}`,
              excerpt,
              source: `${name} Releases`,
              sourceUrl: release.html_url,
              publishedAt: release.published_at,
              readTimeMinutes: estimateReadMinutes(body || release.tag_name),
              topics: categories,
              tone: 'release' as ArticleTone,
              section: TANSTACK_REPOS.has(repo) ? ('tanstack' as const) : ('read' as const),
            }
          })
      } catch {
        return []
      }
    }),
  )

  return batches.flat()
}

function hashId(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function dedupeArticles(articles: KnowledgeArticle[]): KnowledgeArticle[] {
  const seen = new Set<string>()
  return articles.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sortByDate(articles: KnowledgeArticle[]): KnowledgeArticle[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export async function fetchKnowledgeData(): Promise<KnowledgeData> {
  const [readRss, tanStackRss, releaseArticles] = await Promise.all([
    fetchRssArticlesForSection('read'),
    fetchRssArticlesForSection('tanstack'),
    fetchReleaseArticles(),
  ])

  const readArticles = sortByDate(dedupeArticles(readRss))
  const tanStackRssArticles = sortByDate(dedupeArticles(tanStackRss))
  const sortedReleases = sortByDate(dedupeArticles(releaseArticles))
  const releaseNotes = sortedReleases
  const tanStackReleases = sortedReleases.filter((a) => a.section === 'tanstack')
  const tanStackArticles = sortByDate(dedupeArticles([...tanStackRssArticles, ...tanStackReleases]))

  return {
    articles: readArticles,
    readArticles,
    tanStackArticles,
    releaseArticles: releaseNotes,
    curatedSources: CURATED_READING_LIST,
    tanStackSources: TANSTACK_READING_LIST,
    lastUpdated: new Date().toISOString(),
  }
}
