import { WATCHLIST_PACKAGES, type PackageCatalogEntry } from '@/data/package-catalog'
import type { CustomPackageEntry } from '@/types/custom-package'

export function getAllCatalogIds(customPackages: CustomPackageEntry[] = []): string[] {
  return [...WATCHLIST_PACKAGES.map((pkg) => pkg.id), ...customPackages.map((pkg) => pkg.id)]
}

export function toCatalogEntry(custom: CustomPackageEntry): PackageCatalogEntry {
  return {
    id: custom.id,
    name: custom.name,
    npmPackage: custom.npmPackage,
    categories: custom.categories,
    isCustom: true,
  }
}

export function getProjectPackageCatalog(customPackages: CustomPackageEntry[] = []): PackageCatalogEntry[] {
  return [...WATCHLIST_PACKAGES, ...customPackages.map(toCatalogEntry)]
}

export function findPackageByNpmName(
  npmPackage: string,
  customPackages: CustomPackageEntry[] = [],
): PackageCatalogEntry | undefined {
  return getProjectPackageCatalog(customPackages).find((pkg) => pkg.npmPackage === npmPackage)
}

export function findPackageById(
  id: string,
  customPackages: CustomPackageEntry[] = [],
): PackageCatalogEntry | undefined {
  return getProjectPackageCatalog(customPackages).find((pkg) => pkg.id === id)
}
