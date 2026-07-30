import type { CustomPackageEntry } from '@/types/custom-package'
import type { DriftReport, ImportSnapshot } from '@/types/import-snapshot'
import type { GitHubSyncConfig } from '@/types/github-sync'
import type { LockfileGraphSnapshot } from '@/types/lockfile-graph'

export interface Project {
  id: string
  name: string
  configuredVersions: Record<string, string>
  /** All packages discovered from package.json (and lockfile extras) */
  customPackages: CustomPackageEntry[]
  /** Checked packages to monitor on the dashboard */
  trackedPackageIds: string[]
  /** Raw engines.node / volta.node from package.json (project requirement) */
  enginesNodeRequirement: string
  /** Node version the developer runs locally or in CI */
  nodeVersion: string
  /** Last successful import baseline */
  importSnapshot?: ImportSnapshot
  /** Latest drift comparison (paste updated lockfile/package.json) */
  lastDriftReport?: DriftReport
  /** Parsed lockfile dependency graph from last import */
  lockfileGraph?: LockfileGraphSnapshot
  /** GitHub repository auto-sync configuration */
  githubSync?: GitHubSyncConfig
  createdAt: string
  updatedAt: string
}

export function createEmptyProject(name: string): Project {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    configuredVersions: {},
    customPackages: [],
    trackedPackageIds: [],
    enginesNodeRequirement: '',
    nodeVersion: '',
    createdAt: now,
    updatedAt: now,
  }
}
