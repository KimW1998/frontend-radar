import { ENDPOINTS, fetchJson, type FetchResult } from '@/services/http'
import { apiUrl } from '@/services/api'

interface GitHubRelease {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
}

interface ReleaseError {
  error: string
  status: number
}

export interface GitHubReleaseInfo {
  version: string
  url: string
  body: string
  publishedAt: string
}

export interface GitHubReleaseBatch {
  releases: Map<string, GitHubReleaseInfo>
  errors: Map<string, string>
  authenticated: boolean
  viaProxy: boolean
}

function mapRelease(data: GitHubRelease): GitHubReleaseInfo {
  return {
    version: data.tag_name.replace(/^v/, '').replace(/^release-/, ''),
    url: data.html_url,
    body: (data.body ?? '').trim(),
    publishedAt: data.published_at,
  }
}

function isReleaseError(value: GitHubRelease | ReleaseError): value is ReleaseError {
  return 'error' in value
}

async function fetchBatchViaProxy(repos: string[]): Promise<GitHubReleaseBatch | null> {
  if (repos.length === 0) {
    return { releases: new Map(), errors: new Map(), authenticated: false, viaProxy: true }
  }

  try {
    const response = await fetch(apiUrl('/github-releases', { repos: repos.join(',') }))
    if (!response.ok) return null

    const payload = (await response.json()) as {
      releases: Record<string, GitHubRelease | ReleaseError>
      authenticated?: boolean
    }

    const releases = new Map<string, GitHubReleaseInfo>()
    const errors = new Map<string, string>()

    for (const repo of repos) {
      const entry = payload.releases[repo]
      if (!entry) {
        errors.set(repo, 'No response for repo')
        continue
      }
      if (isReleaseError(entry)) {
        errors.set(repo, entry.status === 404 ? 'No GitHub releases published' : entry.error)
        continue
      }
      releases.set(repo, mapRelease(entry))
    }

    return {
      releases,
      errors,
      authenticated: response.headers.get('X-Github-Auth') === 'token' || Boolean(payload.authenticated),
      viaProxy: true,
    }
  } catch {
    return null
  }
}

async function fetchBatchDirect(repos: string[]): Promise<GitHubReleaseBatch> {
  const releases = new Map<string, GitHubReleaseInfo>()
  const errors = new Map<string, string>()

  for (const repo of repos) {
    try {
      const data = await fetchJson<GitHubRelease>(ENDPOINTS.githubRelease(repo))
      releases.set(repo, mapRelease(data))
    } catch (error) {
      errors.set(repo, error instanceof Error ? error.message : 'Fetch failed')
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return { releases, errors, authenticated: false, viaProxy: false }
}

export async function fetchGitHubReleasesBatch(repos: string[]): Promise<GitHubReleaseBatch> {
  const uniqueRepos = [...new Set(repos)]
  const proxied = await fetchBatchViaProxy(uniqueRepos)
  if (proxied) return proxied
  return fetchBatchDirect(uniqueRepos)
}

export function toGitHubFetchResult(
  repo: string,
  batch: GitHubReleaseBatch,
): FetchResult<GitHubReleaseInfo> {
  const data = batch.releases.get(repo)
  if (data) {
    return {
      data,
      source: 'GitHub Releases',
      endpoint: batch.viaProxy ? '/api/github-releases' : ENDPOINTS.githubRelease(repo),
      status: 'ok',
      itemCount: 1,
      error: batch.authenticated ? undefined : 'Add GITHUB_TOKEN in Netlify for higher rate limits',
    }
  }

  return {
    data: null,
    source: 'GitHub Releases',
    endpoint: batch.viaProxy ? '/api/github-releases' : ENDPOINTS.githubRelease(repo),
    status: 'error',
    error: batch.errors.get(repo) ?? 'GitHub release fetch failed',
    itemCount: 0,
  }
}

export async function fetchGitHubLatestRelease(repo: string): Promise<FetchResult<GitHubReleaseInfo>> {
  const batch = await fetchGitHubReleasesBatch([repo])
  return toGitHubFetchResult(repo, batch)
}

export function summarizeReleaseBody(body: string, maxLength = 200): string {
  const cleaned = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[#*`>[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()

  if (!cleaned) return 'No release notes in GitHub response.'
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}…`
}
