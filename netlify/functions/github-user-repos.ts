import type { Config } from '@netlify/functions'

export interface GitHubUserRepo {
  fullName: string
  private: boolean
  defaultBranch: string
}

export default async (req: Request) => {
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return Response.json({ error: 'Connect your GitHub account first' }, { status: 401 })
  }

  const repos: GitHubUserRepo[] = []

  try {
    for (let page = 1; page <= 3; page += 1) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
        {
          headers: {
            Authorization: authorization,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'frontend-radar',
          },
        },
      )

      if (!response.ok) {
        const body = await response.text()
        return Response.json(
          { error: body.slice(0, 200) || `GitHub API HTTP ${response.status}` },
          { status: response.status },
        )
      }

      const batch = (await response.json()) as Array<{
        full_name: string
        private: boolean
        default_branch: string
      }>

      for (const repo of batch) {
        repos.push({
          fullName: repo.full_name,
          private: repo.private,
          defaultBranch: repo.default_branch,
        })
      }

      if (batch.length < 100) break
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to list repositories' },
      { status: 502 },
    )
  }

  return Response.json(
    { repos, login: null },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
      },
    },
  )
}

export const config: Config = {
  path: '/api/github-user-repos',
}
