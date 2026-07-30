import { getProjectPackageCatalog } from '@/lib/package-registry'
import type { PackageCatalogEntry } from '@/data/package-catalog'
import type { CustomPackageEntry } from '@/types/custom-package'

export function resolveTrackedPackageIds(
  trackedPackageIds: string[] | undefined,
  customPackages: CustomPackageEntry[] = [],
): string[] {
  const valid = new Set(customPackages.map((pkg) => pkg.id))
  const resolved = (trackedPackageIds ?? []).filter((id) => valid.has(id))
  if (resolved.length > 0) return resolved
  return customPackages.map((pkg) => pkg.id)
}

export function getTrackedPackages(
  trackedPackageIds: string[] | undefined,
  customPackages: CustomPackageEntry[] = [],
): PackageCatalogEntry[] {
  const ids = new Set(resolveTrackedPackageIds(trackedPackageIds, customPackages))
  return getProjectPackageCatalog(customPackages).filter((pkg) => ids.has(pkg.id))
}

export function getConfiguredPackageCountForProject(
  configuredVersions: Record<string, string>,
  trackedPackageIds: string[] | undefined,
  customPackages: CustomPackageEntry[] = [],
): number {
  return getTrackedPackages(trackedPackageIds, customPackages).filter((pkg) =>
    configuredVersions[pkg.npmPackage]?.trim(),
  ).length
}

export function isProjectStackConfigured(
  configuredVersions: Record<string, string>,
  trackedPackageIds: string[] | undefined,
  customPackages: CustomPackageEntry[] = [],
): boolean {
  return getConfiguredPackageCountForProject(configuredVersions, trackedPackageIds, customPackages) > 0
}
