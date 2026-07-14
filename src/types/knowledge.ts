import { z } from 'zod'
import { FilterCategorySchema } from '@/types'

export const ArticleToneSchema = z.enum([
  'official',
  'community',
  'deep-dive',
  'release',
  'newsletter',
])
export type ArticleTone = z.infer<typeof ArticleToneSchema>

export const KnowledgeArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  source: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string(),
  readTimeMinutes: z.number(),
  topics: z.array(FilterCategorySchema),
  tone: ArticleToneSchema,
})
export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>

export const CuratedSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  url: z.string(),
  emoji: z.string(),
  topics: z.array(FilterCategorySchema),
})
export type CuratedSource = z.infer<typeof CuratedSourceSchema>

export const KnowledgeDataSchema = z.object({
  articles: z.array(KnowledgeArticleSchema),
  curatedSources: z.array(CuratedSourceSchema),
  tanStackSources: z.array(CuratedSourceSchema),
  tanStackArticles: z.array(KnowledgeArticleSchema),
  lastUpdated: z.string(),
})
export type KnowledgeData = z.infer<typeof KnowledgeDataSchema>

export const TONE_LABELS: Record<ArticleTone, string> = {
  official: 'Official',
  community: 'Community',
  'deep-dive': 'Deep dive',
  release: 'Release notes',
  newsletter: 'Newsletter',
}

export const TONE_COLORS: Record<ArticleTone, string> = {
  official: '#3B82F6',
  community: '#8B5CF6',
  'deep-dive': '#06B6D4',
  release: '#22C55E',
  newsletter: '#F97316',
}

// Inspired by https://medium.com/@gfox1984/how-i-stay-up-to-date-with-react-and-front-end-development-d72efb6d6f59
export const CURATED_READING_LIST: CuratedSource[] = [
  {
    id: 'react-blog',
    name: 'React Blog',
    description: 'Official React team news — releases, RFCs, and deprecations land here first.',
    url: 'https://react.dev/blog',
    emoji: '⚛️',
    topics: ['react'],
  },
  {
    id: 'overreacted',
    name: 'Overreacted (Dan Abramov)',
    description: 'Deep, honest takes on React patterns and mental models.',
    url: 'https://overreacted.io/',
    emoji: '🧠',
    topics: ['react'],
  },
  {
    id: 'bytes',
    name: 'Bytes Newsletter',
    description: 'Weekly JS news in a fun, sarcastic tone. Big trends always show up here.',
    url: 'https://bytes.dev/',
    emoji: '📬',
    topics: ['react', 'typescript', 'infrastructure'],
  },
  {
    id: 'tkdodo',
    name: 'TkDodo\'s Blog',
    description: 'TanStack Query maintainer — essential reading for data-fetching in React.',
    url: 'https://tkdodo.eu/blog/',
    emoji: '🔄',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'kentcdodds',
    name: 'Kent C. Dodds',
    description: 'Testing Library & Remix creator. Top-tier React teaching.',
    url: 'https://kentcdodds.com/blog',
    emoji: '🎓',
    topics: ['react', 'testing'],
  },
  {
    id: 'joshwcomeau',
    name: 'Josh W. Comeau',
    description: 'Beautiful explainers on CSS, React, and how the web actually works.',
    url: 'https://www.joshwcomeau.com/',
    emoji: '✨',
    topics: ['react', 'ui-libraries', 'browser-apis'],
  },
  {
    id: 'devto',
    name: 'DEV Community',
    description: 'Community articles on React, TypeScript, and frontend craft.',
    url: 'https://dev.to/t/react',
    emoji: '💬',
    topics: ['react', 'typescript'],
  },
  {
    id: 'frontend-mastery',
    name: 'Frontend Mastery',
    description: 'Long-form, factual coverage of frameworks and where frontend is heading.',
    url: 'https://frontendmastery.com/',
    emoji: '🗺️',
    topics: ['react', 'infrastructure'],
  },
]

export const TANSTACK_READING_LIST: CuratedSource[] = [
  {
    id: 'tanstack-blog',
    name: 'TanStack Blog',
    description: 'Official announcements — new libraries, major features, and where the ecosystem is heading.',
    url: 'https://tanstack.com/blog',
    emoji: '📰',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tanstack-router-docs',
    name: 'Router Docs',
    description: 'Type-safe routing, loaders, search params, route context, and preloading APIs.',
    url: 'https://tanstack.com/router/latest/docs/framework/react/overview',
    emoji: '🧭',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tanstack-router-releases',
    name: 'Router Releases',
    description: 'Changelog for new route hooks, file-based routing updates, and breaking Router changes.',
    url: 'https://github.com/TanStack/router/releases',
    emoji: '🚦',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tanstack-query-docs',
    name: 'Query Docs',
    description: 'Caching, mutations, infinite queries, suspense, and the query function APIs.',
    url: 'https://tanstack.com/query/latest/docs/framework/react/overview',
    emoji: '🔄',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tanstack-query-releases',
    name: 'Query Releases',
    description: 'What landed in Query v5 — new defaults, hooks, and deprecations worth knowing.',
    url: 'https://github.com/TanStack/query/releases',
    emoji: '📋',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tanstack-table-docs',
    name: 'Table Docs',
    description: 'Headless table primitives — sorting, filtering, grouping, and virtualization patterns.',
    url: 'https://tanstack.com/table/latest/docs/introduction',
    emoji: '📊',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tanstack-start-docs',
    name: 'Start Docs',
    description: 'Full-stack React framework built on Router — SSR, server functions, and deployment.',
    url: 'https://tanstack.com/start/latest/docs/framework/react/overview',
    emoji: '🚀',
    topics: ['react', 'infrastructure'],
  },
  {
    id: 'tkdodo-tanstack',
    name: 'TkDodo\'s Blog',
    description: 'TanStack Query maintainer — deep dives on data fetching, caching, and React Query patterns.',
    url: 'https://tkdodo.eu/blog/',
    emoji: '✍️',
    topics: ['react', 'infrastructure'],
  },
]
