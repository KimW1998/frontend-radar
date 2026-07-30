import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useActiveProject } from '@/hooks/useActiveProject'

const EMPTY_TRACKED_IDS: string[] = []
const EMPTY_CUSTOM_PACKAGES: never[] = []

export function useDashboardRefreshOnSettingsChange() {
  const queryClient = useQueryClient()
  const activeProject = useActiveProject()
  const activeProjectId = activeProject?.id ?? null
  const configuredVersions = activeProject?.configuredVersions
  const nodeVersion = activeProject?.nodeVersion ?? ''
  const trackedPackageIds = activeProject?.trackedPackageIds ?? EMPTY_TRACKED_IDS
  const customPackages = activeProject?.customPackages ?? EMPTY_CUSTOM_PACKAGES
  const skipInitial = useRef(true)

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false
      return
    }

    const timer = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [activeProjectId, configuredVersions, nodeVersion, trackedPackageIds, customPackages, queryClient])
}
