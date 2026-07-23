import type { Config } from '@netlify/functions'

interface GitHubReleaseResponse {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
  prerelease: boolean
}

export default async (req: Request) => {
  const params = new URL(req.url).searchParams
  const repo = params.get('repo')
  const perPage = Math.min(Number(params.get('per_page') ?? 2), 10)

  if (!repo) {
    return Response.json({ error: 'Missing repo query parameter' }, { status: 400 })
  }

  const token = Netlify.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'frontend-radar',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(
    `https://api.github.com/repos/${repo}/releases?per_page=${perPage}`,
    { headers },
  )
  const body = await response.text()

  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'X-Github-Auth': token ? 'token' : 'none',
    },
  })
}

export const config: Config = {
  path: '/api/github-release-history',
}
