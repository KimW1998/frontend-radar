import { useActiveProject } from '@/hooks/useActiveProject'
import type { CustomPackageEntry } from '@/types/custom-package'
import {
  getConfiguredPackageCountForProject,
  getTrackedPackages,
  isProjectStackConfigured,
} from '@/lib/watchlist'

export function getConfiguredPackageCount(
  configuredVersions: Record<string, string>,
  trackedPackageIds?: string[],
  customPackages: CustomPackageEntry[] = [],
): number {
  return getConfiguredPackageCountForProject(configuredVersions, trackedPackageIds, customPackages)
}

export function useConfiguredPackageCount(): number {
  const activeProject = useActiveProject()
  if (!activeProject) return 0
  return getConfiguredPackageCountForProject(
    activeProject.configuredVersions,
    activeProject.trackedPackageIds,
    activeProject.customPackages,
  )
}

export function useTrackedPackageCount(): number {
  const activeProject = useActiveProject()
  if (!activeProject) return 0
  return getTrackedPackages(activeProject.trackedPackageIds, activeProject.customPackages).length
}

export function useIsStackConfigured(): boolean {
  const activeProject = useActiveProject()
  if (!activeProject) return false
  return isProjectStackConfigured(
    activeProject.configuredVersions,
    activeProject.trackedPackageIds,
    activeProject.customPackages,
  )
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
