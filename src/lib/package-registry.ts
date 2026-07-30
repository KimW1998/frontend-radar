import { WATCHLIST_PACKAGES, type PackageCatalogEntry } from '@/data/package-catalog'
import type { CustomPackageEntry } from '@/types/custom-package'

export function toCatalogEntry(custom: CustomPackageEntry): PackageCatalogEntry {
  const known = WATCHLIST_PACKAGES.find((pkg) => pkg.npmPackage === custom.npmPackage)
  if (known) {
    return {
      ...known,
      id: custom.id,
      isCustom: true,
    }
  }
  return {
    id: custom.id,
    name: custom.name,
    npmPackage: custom.npmPackage,
    categories: custom.categories,
    isCustom: true,
  }
}

export function getProjectPackageCatalog(customPackages: CustomPackageEntry[] = []): PackageCatalogEntry[] {
  return customPackages.map(toCatalogEntry)
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
