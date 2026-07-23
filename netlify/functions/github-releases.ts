import type { Config } from '@netlify/functions'

interface GitHubReleaseResponse {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
}

interface ReleaseError {
  error: string
  status: number
}

export default async (req: Request) => {
  const repos = [
    ...new Set(
      (new URL(req.url).searchParams.get('repos') ?? '')
        .split(',')
        .map((repo) => repo.trim())
        .filter(Boolean),
    ),
  ]

  if (repos.length === 0) {
    return Response.json({ error: 'Missing repos query parameter' }, { status: 400 })
  }

  const token = Netlify.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'frontend-radar',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const releases: Record<string, GitHubReleaseResponse | ReleaseError> = {}

  for (const repo of repos) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers })
      const body = await response.text()

      if (response.ok) {
        releases[repo] = JSON.parse(body) as GitHubReleaseResponse
      } else {
        releases[repo] = { error: body.slice(0, 200) || `HTTP ${response.status}`, status: response.status }
      }
    } catch (error) {
      releases[repo] = {
        error: error instanceof Error ? error.message : 'Fetch failed',
        status: 0,
      }
    }

    if (!token) {
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }

  return Response.json(
    { releases, authenticated: Boolean(token) },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Github-Auth': token ? 'token' : 'none',
      },
    },
  )
}

export const config: Config = {
  path: '/api/github-releases',
}
