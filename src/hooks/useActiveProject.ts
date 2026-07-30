import { useMemo } from 'react'
import { getConfiguredPackageCount } from '@/lib/section-empty'
import { selectActiveProject, useSettingsStore } from '@/stores/settings-store'
import type { Project } from '@/types/project'

const EMPTY_VERSIONS: Record<string, string> = {}

export function useActiveProject(): Project | null {
  return useSettingsStore(selectActiveProject)
}

export function useActiveProjectVersions() {
  const activeProject = useActiveProject()
  return useMemo(
    () => ({
      configuredVersions: activeProject?.configuredVersions ?? EMPTY_VERSIONS,
      nodeVersion: activeProject?.nodeVersion ?? '',
    }),
    [activeProject],
  )
}

export function useIsProjectReady(): boolean {
  const activeProject = useActiveProject()
  if (!activeProject) return false
  return getConfiguredPackageCount(
    activeProject.configuredVersions,
    activeProject.trackedPackageIds,
    activeProject.customPackages,
  ) > 0
}

export function useIsNodeConfigured(): boolean {
  const activeProject = useActiveProject()
  return Boolean(activeProject?.nodeVersion?.trim())
}
