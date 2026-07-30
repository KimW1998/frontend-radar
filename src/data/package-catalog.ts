import type { FilterCategory } from '@/types'

export interface PackageCatalogEntry {
  id: string
  name: string
  npmPackage: string
  githubRepo?: string
  categories: FilterCategory[]
  isCustom?: boolean
}

export const WATCHLIST_PACKAGES: PackageCatalogEntry[] = [
  { id: 'react', name: 'React', npmPackage: 'react', githubRepo: 'facebook/react', categories: ['react'] },
  { id: 'react-dom', name: 'React DOM', npmPackage: 'react-dom', githubRepo: 'facebook/react', categories: ['react'] },
  { id: 'typescript', name: 'TypeScript', npmPackage: 'typescript', githubRepo: 'microsoft/TypeScript', categories: ['typescript'] },
  { id: 'vite', name: 'Vite', npmPackage: 'vite', githubRepo: 'vitejs/vite', categories: ['infrastructure'] },
  { id: 'react-query', name: 'TanStack Query', npmPackage: '@tanstack/react-query', githubRepo: 'TanStack/query', categories: ['react', 'infrastructure'] },
  { id: 'tanstack-router', name: 'TanStack Router', npmPackage: '@tanstack/react-router', githubRepo: 'TanStack/router', categories: ['react', 'infrastructure'] },
  { id: 'zustand', name: 'Zustand', npmPackage: 'zustand', githubRepo: 'pmndrs/zustand', categories: ['react'] },
  { id: 'axios', name: 'Axios', npmPackage: 'axios', githubRepo: 'axios/axios', categories: ['security', 'infrastructure'] },
  { id: 'mui', name: 'MUI', npmPackage: '@mui/material', githubRepo: 'mui/material-ui', categories: ['ui-libraries'] },
  { id: 'sentry', name: 'Sentry', npmPackage: '@sentry/react', githubRepo: 'getsentry/sentry-javascript', categories: ['infrastructure'] },
  { id: 'okta', name: 'Okta Auth JS', npmPackage: '@okta/okta-auth-js', githubRepo: 'okta/okta-auth-js', categories: ['security', 'infrastructure'] },
  { id: 'i18next', name: 'i18next', npmPackage: 'i18next', githubRepo: 'i18next/i18next', categories: ['infrastructure'] },
  { id: 'zod', name: 'Zod', npmPackage: 'zod', githubRepo: 'colinhacks/zod', categories: ['typescript'] },
  { id: 'recharts', name: 'Recharts', npmPackage: 'recharts', githubRepo: 'recharts/recharts', categories: ['ui-libraries'] },
  { id: 'playwright', name: 'Playwright', npmPackage: 'playwright', githubRepo: 'microsoft/playwright', categories: ['testing'] },
  { id: 'vitest', name: 'Vitest', npmPackage: 'vitest', githubRepo: 'vitest-dev/vitest', categories: ['testing'] },
]

export const DEFAULT_CONFIGURED_VERSIONS: Record<string, string> = Object.fromEntries(
  WATCHLIST_PACKAGES.map((p) => [p.npmPackage, '']),
)
