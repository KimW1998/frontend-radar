import { fetchApiJson } from '@/services/api'
import { DEFAULT_LOCKFILE_CANDIDATES } from '@/lib/parse-github-repo'
import type { GitHubSyncConfig } from '@/types/github-sync'

export interface GitHubRepoFilesResponse {
  files: Record<string, string | null>
  errors: Record<string, string>
  authenticated: boolean
  owner: string
  repo: string
  branch: string
}

export async function fetchGitHubRepoFiles(
  config: Pick<GitHubSyncConfig, 'owner' | 'repo' | 'branch' | 'packageJsonPath' | 'lockfilePath'>,
  accessToken?: string | null,
): Promise<GitHubRepoFilesResponse> {
  const paths = [
    config.packageJsonPath,
    config.lockfilePath,
    ...DEFAULT_LOCKFILE_CANDIDATES.filter(
      (candidate) => candidate !== config.lockfilePath && candidate !== config.packageJsonPath,
    ),
  ]

  return fetchApiJson<GitHubRepoFilesResponse>(
    '/github-repo-files',
    {
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      paths: [...new Set(paths)].join(','),
    },
    { accessToken },
  )
}

export interface GitHubUserRepoOption {
  fullName: string
  private: boolean
  defaultBranch: string
}

export async function fetchGitHubUserRepos(accessToken: string): Promise<GitHubUserRepoOption[]> {
  const response = await fetchApiJson<{ repos: GitHubUserRepoOption[] }>(
    '/github-user-repos',
    undefined,
    { accessToken },
  )
  return response.repos
}

export function resolveGitHubStackFiles(
  response: GitHubRepoFilesResponse,
  config: Pick<GitHubSyncConfig, 'packageJsonPath' | 'lockfilePath'>,
): { packageJson: string | null; lockfile: string | null; lockfilePath: string | null; errors: string[] } {
  const errors: string[] = []
  const packageJson = response.files[config.packageJsonPath]
  if (!packageJson) {
    errors.push(
      response.errors[config.packageJsonPath]
        ? `${config.packageJsonPath}: ${response.errors[config.packageJsonPath]}`
        : `${config.packageJsonPath} not found in repository`,
    )
  }

  let lockfile = response.files[config.lockfilePath] ?? null
  let lockfilePath = lockfile ? config.lockfilePath : null

  if (!lockfile) {
    for (const candidate of DEFAULT_LOCKFILE_CANDIDATES) {
      const content = response.files[candidate]
      if (content) {
        lockfile = content
        lockfilePath = candidate
        break
      }
    }
  }

  return { packageJson, lockfile, lockfilePath, errors }
}
