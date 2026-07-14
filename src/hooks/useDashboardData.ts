import { useQuery } from '@tanstack/react-query'
import { fetchDashboardData } from '@/services/dashboard'
import { useSettingsStore } from '@/stores'

export function useDashboardData(enabled = true) {
  const configuredVersions = useSettingsStore((s) => s.configuredVersions)
  const nodeVersion = useSettingsStore((s) => s.nodeVersion)

  return useQuery({
    queryKey: ['dashboard', configuredVersions, nodeVersion],
    queryFn: () => fetchDashboardData({ configuredVersions, nodeVersion }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    enabled,
  })
}
