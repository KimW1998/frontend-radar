import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useActiveProjectVersions } from '@/hooks/useActiveProject'
import { useSettingsStore } from '@/stores'

export function useDashboardRefreshOnSettingsChange() {
  const queryClient = useQueryClient()
  const activeProjectId = useSettingsStore((s) => s.activeProjectId)
  const { configuredVersions, nodeVersion } = useActiveProjectVersions()
  const trackedPackageIds = useSettingsStore(
    (s) => s.projects.find((p) => p.id === s.activeProjectId)?.trackedPackageIds ?? [],
  )
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
  }, [activeProjectId, configuredVersions, nodeVersion, trackedPackageIds, queryClient])
}
