import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { useActiveProject } from '@/hooks/useActiveProject'

export function getConfiguredPackageCount(configuredVersions: Record<string, string>): number {
  return WATCHLIST_PACKAGES.filter((pkg) => configuredVersions[pkg.npmPackage]?.trim()).length
}

export function useConfiguredPackageCount(): number {
  const activeProject = useActiveProject()
  if (!activeProject) return 0
  return getConfiguredPackageCount(activeProject.configuredVersions)
}

export function useIsStackConfigured(): boolean {
  return useConfiguredPackageCount() > 0
}

export type SectionEmptyVariant = 'filtered' | 'all-clear' | 'not-configured'

export function resolveSectionEmpty(
  totalCount: number,
  filteredCount: number,
  options?: { requiresConfig?: boolean; isConfigured?: boolean },
): SectionEmptyVariant | null {
  if (filteredCount > 0) return null
  if (totalCount > 0) return 'filtered'
  if (options?.requiresConfig && !options?.isConfigured) return 'not-configured'
  return 'all-clear'
}
