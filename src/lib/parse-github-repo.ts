import type { GitHubSyncConfig } from '@/types/github-sync'

export interface ParsedGitHubRepo {
  owner: string
  repo: string
}

export function parseGitHubRepoInput(input: string): ParsedGitHubRepo | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/)
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] }
  }

  try {
    const url = new URL(trimmed)
    if (!url.hostname.includes('github.com')) return null
    const parts = url.pathname.replace(/^\/+/, '').split('/').filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}

export function formatGitHubRepo(config: Pick<GitHubSyncConfig, 'owner' | 'repo'>): string {
  return `${config.owner}/${config.repo}`
}

export const DEFAULT_LOCKFILE_CANDIDATES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
] as const

export function detectLockfilePath(files: string[]): string {
  for (const candidate of DEFAULT_LOCKFILE_CANDIDATES) {
    if (files.includes(candidate)) return candidate
  }
  return DEFAULT_LOCKFILE_CANDIDATES[0]
}
