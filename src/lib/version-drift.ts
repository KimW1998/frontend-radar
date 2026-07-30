import { findPackageByNpmName } from '@/lib/package-registry'
import type { CustomPackageEntry } from '@/types/custom-package'
import type { DriftReport, ImportSnapshot, VersionDriftItem } from '@/types/import-snapshot'
import type { PackageCatalogEntry } from '@/data/package-catalog'

export function detectVersionDrift(
  currentVersions: Record<string, string>,
  importedVersions: Record<string, string>,
  trackedPackages: PackageCatalogEntry[],
): VersionDriftItem[] {
  const items: VersionDriftItem[] = []

  for (const pkg of trackedPackages) {
    const importedVersion = importedVersions[pkg.npmPackage]?.trim()
    if (!importedVersion) continue

    const storedVersion = currentVersions[pkg.npmPackage]?.trim() || ''
    if (!storedVersion || storedVersion === importedVersion) continue

    items.push({
      npmPackage: pkg.npmPackage,
      name: pkg.name,
      storedVersion,
      importedVersion,
    })
  }

  return items
}

export function createDriftReport(items: VersionDriftItem[]): DriftReport {
  return {
    items,
    checkedAt: new Date().toISOString(),
  }
}

export function createImportSnapshot(
  configuredVersions: Record<string, string>,
  nodeVersion: string,
  source: ImportSnapshot['source'],
): ImportSnapshot {
  return {
    configuredVersions: { ...configuredVersions },
    nodeVersion,
    importedAt: new Date().toISOString(),
    source,
  }
}

export function hasActiveDrift(report?: DriftReport): boolean {
  return (report?.items.length ?? 0) > 0
}

export function formatDriftSummary(report: DriftReport): string {
  if (report.items.length === 0) return 'Versions match your last import.'
  const names = report.items.slice(0, 3).map((item) => item.name)
  const suffix = report.items.length > 3 ? ` and ${report.items.length - 3} more` : ''
  return `${report.items.length} package${report.items.length === 1 ? '' : 's'} differ from stored versions: ${names.join(', ')}${suffix}.`
}

export function discoverUntrackedDependencies(
  allDependencyNames: string[],
  trackedPackages: PackageCatalogEntry[],
  customPackages: CustomPackageEntry[],
): Array<{ npmPackage: string; version: string; name: string }> {
  const tracked = new Set(trackedPackages.map((pkg) => pkg.npmPackage))
  const discovered: Array<{ npmPackage: string; version: string; name: string }> = []

  for (const npmPackage of allDependencyNames) {
    if (tracked.has(npmPackage) || findPackageByNpmName(npmPackage, customPackages)) continue
    discovered.push({
      npmPackage,
      version: '',
      name: npmPackage.replace(/^@/, '').split('/').pop() ?? npmPackage,
    })
  }

  return discovered
}
