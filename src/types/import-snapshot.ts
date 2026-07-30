export type ImportSource = 'package-json' | 'lockfile' | 'combined'

export interface ImportSnapshot {
  configuredVersions: Record<string, string>
  nodeVersion: string
  importedAt: string
  source: ImportSource
}

export interface VersionDriftItem {
  npmPackage: string
  name: string
  storedVersion: string
  importedVersion: string
}

export interface DriftReport {
  items: VersionDriftItem[]
  checkedAt: string
}
