import { useActiveProject } from '@/hooks/useActiveProject'
import {
  DEFAULT_TRACKED_PACKAGE_IDS,
  getConfiguredPackageCountForProject,
  getTrackedPackages,
  isProjectStackConfigured,
} from '@/lib/watchlist'

export function getConfiguredPackageCount(
  configuredVersions: Record<string, string>,
  trackedPackageIds?: string[],
): number {
  return getConfiguredPackageCountForProject(configuredVersions, trackedPackageIds)
}

export function useConfiguredPackageCount(): number {
  const activeProject = useActiveProject()
  if (!activeProject) return 0
  return getConfiguredPackageCount(
    activeProject.configuredVersions,
    activeProject.trackedPackageIds,
  )
}

export function useTrackedPackageCount(): number {
  const activeProject = useActiveProject()
  if (!activeProject) return DEFAULT_TRACKED_PACKAGE_IDS.length
  return getTrackedPackages(activeProject.trackedPackageIds).length
}

export function useIsStackConfigured(): boolean {
  const activeProject = useActiveProject()
  if (!activeProject) return false
  return isProjectStackConfigured(
    activeProject.configuredVersions,
    activeProject.trackedPackageIds,
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
