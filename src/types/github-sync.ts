export interface GitHubSyncConfig {
  owner: string
  repo: string
  branch: string
  packageJsonPath: string
  lockfilePath: string
  lastSyncedAt?: string
  /** When true, periodically re-fetch package.json from GitHub (default: true) */
  autoSyncEnabled?: boolean
}

export interface GitHubSyncChangeNotice {
  detectedAt: string
  source: 'auto' | 'manual'
  preview: import('@/lib/import-preview').ImportPreview
  dismissed?: boolean
}
