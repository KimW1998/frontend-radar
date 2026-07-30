import { WATCHLIST_PACKAGES, type PackageCatalogEntry } from '@/data/package-catalog'

export const DEFAULT_TRACKED_PACKAGE_IDS = WATCHLIST_PACKAGES.map((pkg) => pkg.id)

export function resolveTrackedPackageIds(trackedPackageIds?: string[]): string[] {
  if (!trackedPackageIds?.length) return [...DEFAULT_TRACKED_PACKAGE_IDS]
  const valid = new Set(DEFAULT_TRACKED_PACKAGE_IDS)
  return trackedPackageIds.filter((id) => valid.has(id))
}

export function getTrackedPackages(trackedPackageIds?: string[]): PackageCatalogEntry[] {
  const ids = new Set(resolveTrackedPackageIds(trackedPackageIds))
  return WATCHLIST_PACKAGES.filter((pkg) => ids.has(pkg.id))
}

export function getConfiguredPackageCountForProject(
  configuredVersions: Record<string, string>,
  trackedPackageIds?: string[],
): number {
  return getTrackedPackages(trackedPackageIds).filter((pkg) =>
    configuredVersions[pkg.npmPackage]?.trim(),
  ).length
}

export function isProjectStackConfigured(
  configuredVersions: Record<string, string>,
  trackedPackageIds?: string[],
): boolean {
  return getConfiguredPackageCountForProject(configuredVersions, trackedPackageIds) > 0
}
