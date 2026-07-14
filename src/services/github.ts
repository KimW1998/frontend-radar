import { ENDPOINTS, fetchJson, type FetchResult } from '@/services/http'

interface GitHubRelease {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
}

export interface GitHubReleaseInfo {
  version: string
  url: string
  body: string
  publishedAt: string
}

export async function fetchGitHubLatestRelease(repo: string): Promise<FetchResult<GitHubReleaseInfo>> {
  const endpoint = ENDPOINTS.githubRelease(repo)
  try {
    const data = await fetchJson<GitHubRelease>(endpoint)
    return {
      data: {
        version: data.tag_name.replace(/^v/, '').replace(/^release-/, ''),
        url: data.html_url,
        body: (data.body ?? '').trim(),
        publishedAt: data.published_at,
      },
      source: 'GitHub Releases',
      endpoint,
      status: 'ok',
      itemCount: 1,
    }
  } catch (error) {
    return {
      data: null,
      source: 'GitHub Releases',
      endpoint,
      status: 'error',
      error: error instanceof Error ? error.message : 'Fetch failed',
      itemCount: 0,
    }
  }
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
