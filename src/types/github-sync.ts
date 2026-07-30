export interface GitHubSyncConfig {
  owner: string
  repo: string
  branch: string
  packageJsonPath: string
  lockfilePath: string
  lastSyncedAt?: string
}
