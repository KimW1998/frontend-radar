import { Box, CircularProgress, Typography } from '@mui/material'
import { FilterBar } from '@/components/FilterBar'
import { ExecutiveSummary } from '@/features/executive/ExecutiveSummary'
import { HealthScoreWidget } from '@/features/health/HealthScoreWidget'
import { DependencyWatchlist } from '@/features/dependencies/DependencyWatchlist'
import { NodeUpgradeCenter } from '@/features/node/NodeUpgradeCenter'
import { SecurityCenter } from '@/features/security/SecurityCenter'
import { BreakingChangesFeed } from '@/features/breaking/BreakingChangesFeed'
import { useDashboardData } from '@/hooks/useDashboardData'

export function DashboardPage() {
  const { data, isLoading, isError, isFetching } = useDashboardData()

  if (isLoading && !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Fetching live data from NPM, GitHub, OSV, and Node.js APIs…
        </Typography>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Failed to load dashboard</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          All data is fetched live. Check your network connection and try again.
        </Typography>
      </Box>
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
        <HealthScoreWidget healthScore={data.healthScore} />
      </Box>

      <ExecutiveSummary actions={data.executiveActions} />
      <DependencyWatchlist dependencies={data.dependencies} />
      <NodeUpgradeCenter nodeStatus={data.nodeStatus} />
      <SecurityCenter alerts={data.securityAlerts} />
      <BreakingChangesFeed changes={data.breakingChanges} />
    </>
  )
}
