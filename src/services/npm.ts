import { ENDPOINTS, fetchJson, type FetchResult } from '@/services/http'

interface NpmLatestResponse {
  version: string
  name: string
  homepage?: string
  peerDependencies?: Record<string, string>
  dependencies?: Record<string, string>
}

interface NpmPackageResponse {
  name: string
  description?: string
  homepage?: string
  license?: string
  repository?: string | { url?: string }
  bugs?: { url?: string }
  maintainers?: Array<{ name?: string }>
  time?: { modified?: string }
}

export interface NpmLatestDoc {
  version: string
  peerDependencies?: Record<string, string>
  dependencies?: Record<string, string>
}

export interface NpmPackageMeta {
  description: string
  homepage?: string
  repository?: string
  license?: string
  maintainers: string
  lastPublished?: string
}

export async function fetchNpmLatestDoc(packageName: string): Promise<FetchResult<NpmLatestDoc>> {
  const endpoint = ENDPOINTS.npm(packageName)
  try {
    const data = await fetchJson<NpmLatestResponse>(endpoint)
    return {
      data: {
        version: data.version,
        peerDependencies: data.peerDependencies,
        dependencies: data.dependencies,
      },
      source: 'NPM Registry',
      endpoint,
      status: 'ok',
      itemCount: 1,
    }
  } catch (error) {
    return {
      data: null,
      source: 'NPM Registry',
      endpoint,
      status: 'error',
      error: error instanceof Error ? error.message : 'Fetch failed',
      itemCount: 0,
    }
  }
}

export async function fetchNpmLatest(packageName: string): Promise<FetchResult<string>> {
  const result = await fetchNpmLatestDoc(packageName)
  return {
    ...result,
    data: result.data?.version ?? null,
  }
}

function normalizeRepoUrl(repo?: string | { url?: string }): string | undefined {
  if (!repo) return undefined
  const raw = typeof repo === 'string' ? repo : repo.url
  if (!raw) return undefined
  return raw.replace(/^git\+/, '').replace(/\.git$/, '')
}

export async function fetchNpmPackageMeta(packageName: string): Promise<NpmPackageMeta | null> {
  try {
    const data = await fetchJson<NpmPackageResponse>(ENDPOINTS.npmPackage(packageName))
    return {
      description: data.description?.trim() || 'No description in npm registry.',
      homepage: data.homepage,
      repository: normalizeRepoUrl(data.repository),
      license: typeof data.license === 'string' ? data.license : undefined,
      maintainers: (data.maintainers ?? []).map((m) => m.name).filter(Boolean).join(', ') || 'Unknown',
      lastPublished: data.time?.modified?.slice(0, 10),
    }
  } catch {
    return null
  }
}
