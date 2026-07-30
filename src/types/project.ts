import { DEFAULT_TRACKED_PACKAGE_IDS } from '@/lib/watchlist'
import type { CustomPackageEntry } from '@/types/custom-package'
import type { DriftReport, ImportSnapshot } from '@/types/import-snapshot'

export interface Project {
  id: string
  name: string
  configuredVersions: Record<string, string>
  /** Package catalog ids to monitor for this project */
  trackedPackageIds: string[]
  /** User-added npm packages beyond the built-in catalog */
  customPackages: CustomPackageEntry[]
  /** Raw engines.node / volta.node from package.json (project requirement) */
  enginesNodeRequirement: string
  /** Node version the developer runs locally or in CI */
  nodeVersion: string
  /** Last successful import baseline */
  importSnapshot?: ImportSnapshot
  /** Latest drift comparison (paste updated lockfile/package.json) */
  lastDriftReport?: DriftReport
  createdAt: string
  updatedAt: string
}

export function createEmptyProject(name: string, configuredVersions: Record<string, string>): Project {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    configuredVersions: { ...configuredVersions },
    trackedPackageIds: [...DEFAULT_TRACKED_PACKAGE_IDS],
    customPackages: [],
    enginesNodeRequirement: '',
    nodeVersion: '',
    createdAt: now,
    updatedAt: now,
  }
}
