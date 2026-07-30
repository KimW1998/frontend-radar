import { useMemo } from 'react'
import { getConfiguredPackageCount } from '@/lib/section-empty'
import { selectActiveProject, useSettingsStore } from '@/stores/settings-store'
import type { Project } from '@/types/project'

export function useActiveProject(): Project | null {
  return useSettingsStore(selectActiveProject)
}

export function useActiveProjectVersions() {
  const activeProject = useActiveProject()
  return useMemo(
    () => ({
      configuredVersions: activeProject?.configuredVersions ?? {},
      nodeVersion: activeProject?.nodeVersion ?? '',
    }),
    [activeProject],
  )
}

export function useIsProjectReady(): boolean {
  const activeProject = useActiveProject()
  if (!activeProject) return false
  return getConfiguredPackageCount(activeProject.configuredVersions) > 0
}

export function useIsNodeConfigured(): boolean {
  const activeProject = useActiveProject()
  return Boolean(activeProject?.nodeVersion?.trim())
}
