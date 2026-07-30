import { useQuery } from '@tanstack/react-query'
import { useActiveProjectVersions } from '@/hooks/useActiveProject'
import { fetchDashboardData } from '@/services/dashboard'
import { useSettingsStore } from '@/stores'

export function useDashboardData(enabled = true) {
  const activeProjectId = useSettingsStore((s) => s.activeProjectId)
  const { configuredVersions, nodeVersion } = useActiveProjectVersions()

  return useQuery({
    queryKey: ['dashboard', activeProjectId, configuredVersions, nodeVersion],
    queryFn: () => fetchDashboardData({ configuredVersions, nodeVersion }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    enabled: enabled && Boolean(activeProjectId),
  })
}
