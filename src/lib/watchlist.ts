import { WATCHLIST_PACKAGES, type PackageCatalogEntry } from '@/data/package-catalog'
import { getProjectPackageCatalog } from '@/lib/package-registry'
import type { CustomPackageEntry } from '@/types/custom-package'

export const DEFAULT_TRACKED_PACKAGE_IDS = WATCHLIST_PACKAGES.map((pkg) => pkg.id)

export function resolveTrackedPackageIds(
  trackedPackageIds?: string[],
  customPackages: CustomPackageEntry[] = [],
): string[] {
  if (!trackedPackageIds?.length) return [...DEFAULT_TRACKED_PACKAGE_IDS]
  const valid = new Set(getProjectPackageCatalog(customPackages).map((pkg) => pkg.id))
  const resolved = trackedPackageIds.filter((id) => valid.has(id))
  return resolved.length > 0 ? resolved : [...DEFAULT_TRACKED_PACKAGE_IDS]
}

export function getTrackedPackages(
  trackedPackageIds?: string[],
  customPackages: CustomPackageEntry[] = [],
): PackageCatalogEntry[] {
  const ids = new Set(resolveTrackedPackageIds(trackedPackageIds, customPackages))
  return getProjectPackageCatalog(customPackages).filter((pkg) => ids.has(pkg.id))
}

export function getConfiguredPackageCountForProject(
  configuredVersions: Record<string, string>,
  trackedPackageIds?: string[],
  customPackages: CustomPackageEntry[] = [],
): number {
  return getTrackedPackages(trackedPackageIds, customPackages).filter((pkg) =>
    configuredVersions[pkg.npmPackage]?.trim(),
  ).length
}

export function isProjectStackConfigured(
  configuredVersions: Record<string, string>,
  trackedPackageIds?: string[],
  customPackages: CustomPackageEntry[] = [],
): boolean {
  return getConfiguredPackageCountForProject(configuredVersions, trackedPackageIds, customPackages) > 0
}
