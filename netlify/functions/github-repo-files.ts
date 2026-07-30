import type { Config } from '@netlify/functions'
import { parseBearerToken, userCanImportRepository } from './shared/github-access'

const LOCKFILE_CANDIDATES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']

async function fetchRepoFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  headers: Record<string, string>,
): Promise<{ content: string | null; error?: string }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`

  try {
    const response = await fetch(url, {
      headers: { ...headers, Accept: 'application/vnd.github.raw' },
    })

    if (response.status === 404) {
      return { content: null, error: 'not found' }
    }

    if (!response.ok) {
      const body = await response.text()
      return { content: null, error: body.slice(0, 200) || `HTTP ${response.status}` }
    }

    return { content: await response.text() }
  } catch (error) {
    return {
      content: null,
      error: error instanceof Error ? error.message : 'Fetch failed',
    }
  }
}

export default async (req: Request) => {
  const params = new URL(req.url).searchParams
  const owner = params.get('owner')?.trim()
  const repo = params.get('repo')?.trim()
  const branch = params.get('branch')?.trim() || 'main'
  const pathsParam = params.get('paths')?.trim()

  if (!owner || !repo) {
    return Response.json({ error: 'Missing owner and repo query parameters' }, { status: 400 })
  }

  const userToken = parseBearerToken(req.headers.get('Authorization'))
  if (!userToken) {
    return Response.json(
      { error: 'Connect your GitHub account before importing a repository.' },
      { status: 401 },
    )
  }

  const access = await userCanImportRepository(userToken, owner, repo)
  if (!access.allowed) {
    return Response.json({ error: access.reason }, { status: 403 })
  }

  const headers: Record<string, string> = {
    'User-Agent': 'frontend-radar',
    Authorization: `Bearer ${userToken}`,
  }

  const requestedPaths = pathsParam
    ? [...new Set(pathsParam.split(',').map((p) => p.trim()).filter(Boolean))]
    : ['package.json', ...LOCKFILE_CANDIDATES]

  const files: Record<string, string | null> = {}
  const errors: Record<string, string> = {}

  for (const path of requestedPaths) {
    const result = await fetchRepoFile(owner, repo, branch, path, headers)
    files[path] = result.content
    if (result.error) errors[path] = result.error
  }

  return Response.json(
    { files, errors, authenticated: true, owner, repo, branch, githubLogin: access.login },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Github-Auth': 'user',
      },
    },
  )
}

export const config: Config = {
  path: '/api/github-repo-files',
}
