import { Box, CircularProgress, Typography } from '@mui/material'
import { Navigate } from '@tanstack/react-router'
import { FilterBar } from '@/components/FilterBar'
import { QueryErrorState } from '@/components/QueryErrorState'
import { ExecutiveSummary } from '@/features/executive/ExecutiveSummary'
import { HealthScoreWidget } from '@/features/health/HealthScoreWidget'
import { DependencyWatchlist } from '@/features/dependencies/DependencyWatchlist'
import { NodeUpgradeCenter } from '@/features/node/NodeUpgradeCenter'
import { SecurityCenter } from '@/features/security/SecurityCenter'
import { BreakingChangesFeed } from '@/features/breaking/BreakingChangesFeed'
import { useActiveProject, useIsNodeConfigured } from '@/hooks/useActiveProject'
import { useConfiguredPackageCount } from '@/lib/section-empty'
import { useDashboardData } from '@/hooks/useDashboardData'

export function DashboardPage() {
  const activeProject = useActiveProject()
  const isNodeConfigured = useIsNodeConfigured()
  const configuredCount = useConfiguredPackageCount()
  const { data, isLoading, isError, isFetching, refetch, isRefetching } = useDashboardData()

  if (!activeProject) {
    return <Navigate to="/onboarding" />
  }

  if (isLoading && !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Fetching live data for {activeProject.name}…
        </Typography>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <QueryErrorState
        title="Failed to load dashboard"
        message="All data is fetched live. Check your network connection and try again."
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    )
  }

  return (
    <>
      <FilterBar />

      {isFetching && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          Refreshing live data…
        </Typography>
      )}

      <Box id="health-score">
        <HealthScoreWidget healthScore={data.healthScore} isConfigured={configuredCount > 0} />
      </Box>

      <ExecutiveSummary actions={data.executiveActions} />
      <DependencyWatchlist dependencies={data.dependencies} />
      <NodeUpgradeCenter nodeStatus={data.nodeStatus} isConfigured={isNodeConfigured} />
      <SecurityCenter alerts={data.securityAlerts} />
      <BreakingChangesFeed changes={data.breakingChanges} />
    </>
  )
}
