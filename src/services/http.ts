import type { DataSourceStatus } from '@/types'

export const API_TIMEOUT = 10_000

export const ENDPOINTS = {
  npm: (pkg: string) => `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`,
  npmPackage: (pkg: string) => `https://registry.npmjs.org/${encodeURIComponent(pkg)}`,
  githubRelease: (repo: string) => `https://api.github.com/repos/${repo}/releases/latest`,
  osv: 'https://api.osv.dev/v1/query',
  nodeDist: 'https://nodejs.org/dist/index.json',
  nodeEol: 'https://endoflife.date/api/v1/products/nodejs',
  githubAdvisories: 'https://api.github.com/advisories',
} as const

export interface FetchResult<T> {
  data: T | null
  source: string
  endpoint: string
  status: DataSourceStatus['status']
  error?: string
  itemCount?: number
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

export function toSourceStatus<T>(result: FetchResult<T>): DataSourceStatus {
  return {
    id: result.source.toLowerCase().replace(/\s+/g, '-'),
    name: result.source,
    endpoint: result.endpoint,
    status: result.status,
    message: result.error ?? (result.itemCount != null ? `${result.itemCount} items fetched` : 'OK'),
    itemCount: result.itemCount ?? 0,
  }
}
