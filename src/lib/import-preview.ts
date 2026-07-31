import type { CustomPackageEntry } from '@/types/custom-package'
import type { VersionDriftItem } from '@/types/import-snapshot'
import type { StackImportResult } from '@/services/stack-import'
import { detectVersionDrift } from '@/lib/version-drift'
import { getTrackedPackages } from '@/lib/watchlist'

export interface ImportPreview {
  added: Array<{ npmPackage: string; name: string; version: string }>
  removed: Array<{ npmPackage: string; name: string }>
  versionChanges: VersionDriftItem[]
  hasChanges: boolean
}

export function computeImportPreview(
  input: {
    customPackages: CustomPackageEntry[]
    configuredVersions: Record<string, string>
    trackedPackageIds: string[]
  },
  result: StackImportResult,
): ImportPreview {
  const currentNames = new Set(input.customPackages.map((pkg) => pkg.npmPackage))
  const incomingNames = new Set(result.packagesFromPackageJson.map((pkg) => pkg.npmPackage))

  const added = result.packagesFromPackageJson.filter((pkg) => !currentNames.has(pkg.npmPackage))
  const removed = input.customPackages
    .filter((pkg) => !incomingNames.has(pkg.npmPackage))
    .map((pkg) => ({ npmPackage: pkg.npmPackage, name: pkg.name }))

  const tracked = getTrackedPackages(input.trackedPackageIds, input.customPackages)
  const versionChanges = detectVersionDrift(
    input.configuredVersions,
    result.importedVersions,
    tracked,
  )

  return {
    added,
    removed,
    versionChanges,
    hasChanges: added.length > 0 || removed.length > 0 || versionChanges.length > 0,
  }
}

export function formatImportPreviewSummary(preview: ImportPreview): string {
  const parts: string[] = []
  if (preview.added.length > 0) {
    parts.push(`${preview.added.length} new package${preview.added.length === 1 ? '' : 's'}`)
  }
  if (preview.removed.length > 0) {
    parts.push(`${preview.removed.length} removed`)
  }
  if (preview.versionChanges.length > 0) {
    parts.push(`${preview.versionChanges.length} version change${preview.versionChanges.length === 1 ? '' : 's'}`)
  }
  if (parts.length === 0) return 'No changes detected.'
  return parts.join(' · ')
}

export function findUpgradePlanPackageIds(
  upgradePlan: Array<{ packages: Array<{ id: string; npmPackage: string }> }>,
): Set<string> {
  const ids = new Set<string>()
  for (const step of upgradePlan) {
    for (const pkg of step.packages) {
      ids.add(pkg.id)
      ids.add(pkg.npmPackage)
    }
  }
  return ids
}

export function findUpgradeStepForPackage(
  upgradePlan: Array<{ step: number; packages: Array<{ id: string; npmPackage: string }> }>,
  packageId: string,
  npmPackage: string,
): number | null {
  for (const step of upgradePlan) {
    if (step.packages.some((pkg) => pkg.id === packageId || pkg.npmPackage === npmPackage)) {
      return step.step
    }
  }
  return null
}
