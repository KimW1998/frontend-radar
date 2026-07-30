const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'frontend-radar',
} as const

export function parseBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token || null
}

export async function fetchGitHubUserLogin(token: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    const user = (await response.json()) as { login?: string }
    return user.login ?? null
  } catch {
    return null
  }
}

export function parseImportBlocklist(): Set<string> {
  const raw = Netlify.env.get('GITHUB_IMPORT_BLOCKLIST') ?? ''
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  )
}

export async function userCanImportRepository(
  token: string,
  owner: string,
  repo: string,
): Promise<{ allowed: true; login: string } | { allowed: false; reason: string }> {
  const login = await fetchGitHubUserLogin(token)
  if (!login) {
    return { allowed: false, reason: 'GitHub session expired — connect again.' }
  }

  const ownerKey = owner.toLowerCase()
  const blocklist = parseImportBlocklist()
  if (blocklist.has(ownerKey) && login.toLowerCase() !== ownerKey) {
    return {
      allowed: false,
      reason: `Imports from ${owner} are restricted. Connect the GitHub account that owns that organization or user.`,
    }
  }

  const target = `${owner}/${repo}`.toLowerCase()

  for (let page = 1; page <= 5; page += 1) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
      {
        headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` },
      },
    )

    if (!response.ok) {
      return { allowed: false, reason: 'Could not verify repository access with GitHub.' }
    }

    const batch = (await response.json()) as Array<{ full_name?: string }>
    if (batch.some((entry) => entry.full_name?.toLowerCase() === target)) {
      return { allowed: true, login }
    }

    if (batch.length < 100) break
  }

  return {
    allowed: false,
    reason: 'Pick a repository from your connected GitHub account — arbitrary URLs are not allowed.',
  }
}
