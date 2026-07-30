import { useMemo } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import {
  buildExecutiveActions,
  fetchDashboardNodeSection,
  fetchDashboardStackSection,
} from '@/services/dashboard'
import { calculateHealthScore } from '@/services/health'
import { getConfiguredPackageCount } from '@/lib/section-empty'
import { useSettingsStore } from '@/stores'
import type { CustomPackageEntry } from '@/types/custom-package'

const STALE_TIME = 5 * 60 * 1000
const REFETCH_INTERVAL = 15 * 60 * 1000
const EMPTY_VERSIONS: Record<string, string> = {}
const EMPTY_CUSTOM_PACKAGES: CustomPackageEntry[] = []
const EMPTY_TRACKED_IDS: string[] = []

export function useDashboardData(enabled = true) {
  const queryClient = useQueryClient()
  const activeProjectId = useSettingsStore((s) => s.activeProjectId)
  const activeProject = useSettingsStore((s) =>
    s.activeProjectId ? s.projects.find((p) => p.id === s.activeProjectId) : undefined,
  )
  const nodeVersion = activeProject?.nodeVersion ?? ''
  const trackedPackageIds = activeProject?.trackedPackageIds ?? EMPTY_TRACKED_IDS
  const customPackages = activeProject?.customPackages ?? EMPTY_CUSTOM_PACKAGES
  const lockfileGraph = activeProject?.lockfileGraph
  const stableConfiguredVersions = activeProject?.configuredVersions ?? EMPTY_VERSIONS
  const input = useMemo(
    () => ({
      configuredVersions: stableConfiguredVersions,
      nodeVersion,
      trackedPackageIds,
      customPackages,
      lockfileGraph,
    }),
    [stableConfiguredVersions, nodeVersion, trackedPackageIds, customPackages, lockfileGraph],
  )
  const queryKeyBase = useMemo(
    () =>
      [
        'dashboard',
        activeProjectId,
        lockfileGraph?.capturedAt ?? null,
      ] as const,
    [activeProjectId, lockfileGraph?.capturedAt],
  )
  const isQueryEnabled = enabled && Boolean(activeProjectId)

  const [nodeQuery, stackQuery] = useQueries({
    queries: [
      {
        queryKey: [...queryKeyBase, 'node'],
        queryFn: () => fetchDashboardNodeSection(input),
        staleTime: STALE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        enabled: isQueryEnabled,
      },
      {
        queryKey: [...queryKeyBase, 'stack'],
        queryFn: () => fetchDashboardStackSection(input),
        staleTime: STALE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        enabled: isQueryEnabled,
      },
    ],
  })

  const isConfigured = getConfiguredPackageCount(stableConfiguredVersions, trackedPackageIds, customPackages) > 0

  const healthScore = useMemo(() => {
    if (!isConfigured || !stackQuery.data || !nodeQuery.data) {
      return {
        score: 0,
        securityWeight: 0,
        outdatedWeight: 0,
        nodeSupportWeight: 0,
        breakingChangesWeight: 0,
        recommendedActions: [],
      }
    }
    return calculateHealthScore(
      stackQuery.data.dependencies,
      nodeQuery.data.nodeStatus,
      stackQuery.data.breakingChanges,
      stackQuery.data.securityAlerts,
    )
  }, [isConfigured, stackQuery.data, nodeQuery.data])

  const executiveActions = useMemo(() => {
    if (!isConfigured || !stackQuery.data || !nodeQuery.data) return []
    return buildExecutiveActions(
      stackQuery.data.dependencies,
      stackQuery.data.securityAlerts,
      nodeQuery.data.nodeStatus,
    )
  }, [isConfigured, stackQuery.data, nodeQuery.data])

  const dataSources = useMemo(
    () => [...(stackQuery.data?.dataSources ?? []), ...(nodeQuery.data?.dataSources ?? [])],
    [stackQuery.data, nodeQuery.data],
  )

  const lastUpdated = useMemo(() => {
    const stamp = Math.max(nodeQuery.dataUpdatedAt, stackQuery.dataUpdatedAt)
    return stamp ? new Date(stamp).toISOString() : undefined
  }, [nodeQuery.dataUpdatedAt, stackQuery.dataUpdatedAt])

  const isLoading = nodeQuery.isLoading || stackQuery.isLoading
  const isFetching = nodeQuery.isFetching || stackQuery.isFetching
  const isError = nodeQuery.isError || stackQuery.isError
  const isRefetching = nodeQuery.isRefetching || stackQuery.isRefetching

  const data =
    nodeQuery.data && stackQuery.data
      ? {
          dependencies: stackQuery.data.dependencies,
          securityAlerts: stackQuery.data.securityAlerts,
          breakingChanges: stackQuery.data.breakingChanges,
          upgradePlan: stackQuery.data.upgradePlan,
          nodeStatus: nodeQuery.data.nodeStatus,
          executiveActions,
          healthScore,
          dataSources,
          lastUpdated: lastUpdated ?? new Date().toISOString(),
        }
      : undefined

  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [...queryKeyBase, 'node'] }),
      queryClient.invalidateQueries({ queryKey: [...queryKeyBase, 'stack'] }),
    ])
    return Promise.all([nodeQuery.refetch(), stackQuery.refetch()])
  }

  return {
    data,
    nodeQuery,
    stackQuery,
    isLoading,
    isFetching,
    isError,
    isRefetching,
    refetch,
    lastUpdated,
    dataSources,
    healthScore,
    executiveActions,
  }
}
