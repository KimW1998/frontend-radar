import type { GitHubUserRepoOption } from '@/services/github-repo'

export function repoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`
}

export function findUserRepo(
  repos: GitHubUserRepoOption[],
  owner: string,
  repo: string,
): GitHubUserRepoOption | undefined {
  const target = repoFullName(owner, repo).toLowerCase()
  return repos.find((entry) => entry.fullName.toLowerCase() === target)
}

export function assertRepoInUserList(
  repos: GitHubUserRepoOption[],
  owner: string,
  repo: string,
): GitHubUserRepoOption | null {
  return findUserRepo(repos, owner, repo) ?? null
}
