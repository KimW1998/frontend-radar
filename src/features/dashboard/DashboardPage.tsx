import { Box, Typography } from '@mui/material'
import { Navigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { FilterBar } from '@/components/FilterBar'
import { QueryErrorState } from '@/components/QueryErrorState'
import { SectionSkeleton } from '@/components/SectionSkeleton'
import { ExecutiveSummary } from '@/features/executive/ExecutiveSummary'
import { HealthScoreWidget } from '@/features/health/HealthScoreWidget'
import { UpgradePlanTeaser } from '@/features/upgrade-plan/UpgradePlanContent'
import { VersionDriftBanner } from '@/components/VersionDriftBanner'
import { GitHubSyncChangeBanner } from '@/components/GitHubSyncChangeBanner'
import { TrackedPackagesEmptyBanner } from '@/components/TrackedPackagesEmptyBanner'
import { useStackNotifications } from '@/hooks/useStackNotifications'
import { useIssueFocusDeepLink } from '@/hooks/useIssueFocusDeepLink'
import { DependencyWatchlist } from '@/features/dependencies/DependencyWatchlist'
import { NodeUpgradeCenter } from '@/features/node/NodeUpgradeCenter'
import { SecurityCenter } from '@/features/security/SecurityCenter'
import { BreakingChangesFeed } from '@/features/breaking/BreakingChangesFeed'
import { TransitiveDependenciesSection } from '@/features/dependencies/TransitiveDependenciesSection'
import { useActiveProject, useIsNodeConfigured } from '@/hooks/useActiveProject'
import { useConfiguredPackageCount } from '@/lib/section-empty'
import { hasNoTrackedPackages } from '@/lib/watchlist'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useSettingsStore } from '@/stores'

export function DashboardPage() {
  const activeProject = useActiveProject()
  const isNodeConfigured = useIsNodeConfigured()
  const configuredCount = useConfiguredPackageCount()
  const {
    nodeQuery,
    stackQuery,
    isError,
    isFetching,
    isRefetching,
    refetch,
    healthScore,
    executiveActions,
    data,
  } = useDashboardData()
  const clearDriftReport = useSettingsStore((s) => s.clearDriftReport)
  const dismissGitHubSyncChange = useSettingsStore((s) => s.dismissGitHubSyncChange)
  useStackNotifications(data, activeProject?.name)

  const stackReady = Boolean(stackQuery.data)
  const nodeReady = Boolean(nodeQuery.data)

  useIssueFocusDeepLink({
    stackData: data,
    nodeStatus: data?.nodeStatus,
    transitiveDependencies: stackQuery.data?.transitiveDependencies,
  })

  const queriesEnabled = Boolean(activeProject)
  const initialLoad =
    queriesEnabled &&
    !stackReady &&
    !nodeReady &&
    (stackQuery.isFetching || nodeQuery.isFetching)

  const emptyHealthScore = useMemo(
    () => ({
      score: 0,
      securityWeight: 0,
      outdatedWeight: 0,
      nodeSupportWeight: 0,
      breakingChangesWeight: 0,
      recommendedActions: [],
    }),
    [],
  )

  if (!activeProject) {
    return <Navigate to="/onboarding" replace />
  }

  const noTrackedPackages = hasNoTrackedPackages(
    activeProject.trackedPackageIds,
    activeProject.customPackages,
  )
  const githubChangeNotice = activeProject.lastGitHubSyncChange
  const githubRepoLabel = activeProject.githubSync
    ? `${activeProject.githubSync.owner}/${activeProject.githubSync.repo}`
    : ''

  if (initialLoad) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Loading dashboard for {activeProject.name}…
        </Typography>
        <SectionSkeleton title={DASHBOARD_SECTIONS.healthScore.title} rows={1} />
      </Box>
    )
  }

  if (isError && !stackReady && !nodeReady) {
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

      {noTrackedPackages && <TrackedPackagesEmptyBanner />}

      {githubChangeNotice && !githubChangeNotice.dismissed && githubRepoLabel && (
        <GitHubSyncChangeBanner
          notice={githubChangeNotice}
          repoLabel={githubRepoLabel}
          onDismiss={dismissGitHubSyncChange}
        />
      )}

      {stackReady && (
        <VersionDriftBanner
          driftReport={activeProject.lastDriftReport}
          importSnapshot={activeProject.importSnapshot}
          onDismiss={clearDriftReport}
        />
      )}

      {stackReady ? (
        <Box id="health-score">
          <HealthScoreWidget
            healthScore={nodeReady ? healthScore : emptyHealthScore}
            isConfigured={configuredCount > 0}
          />
        </Box>
      ) : (
        <SectionSkeleton
          title={DASHBOARD_SECTIONS.healthScore.title}
          subtitle="Waiting for package data…"
          id={DASHBOARD_SECTIONS.healthScore.id}
          rows={1}
        />
      )}

      {stackReady ? (
        <ExecutiveSummary
          actions={executiveActions}
          dependencies={stackQuery.data!.dependencies}
          securityAlerts={stackQuery.data!.securityAlerts}
          nodeStatus={nodeReady ? nodeQuery.data!.nodeStatus : null}
        />
      ) : (
        <SectionSkeleton
          title={DASHBOARD_SECTIONS.executiveSummary.title}
          subtitle="Waiting for package data…"
          id={DASHBOARD_SECTIONS.executiveSummary.id}
          rows={2}
        />
      )}

      {stackReady ? (
        <>
          <UpgradePlanTeaser upgradePlan={stackQuery.data!.upgradePlan} />
          <DependencyWatchlist dependencies={stackQuery.data!.dependencies} />
        </>
      ) : (
        <SectionSkeleton
          title={DASHBOARD_SECTIONS.dependencies.title}
          id={DASHBOARD_SECTIONS.dependencies.id}
          rows={4}
        />
      )}

      {nodeReady ? (
        <NodeUpgradeCenter
          nodeStatus={nodeQuery.data!.nodeStatus}
          isConfigured={isNodeConfigured}
          enginesNodeRequirement={activeProject.enginesNodeRequirement}
          runtimeNodeVersion={activeProject.nodeVersion}
        />
      ) : (
        <SectionSkeleton
          title={DASHBOARD_SECTIONS.node.title}
          id={DASHBOARD_SECTIONS.node.id}
          rows={2}
        />
      )}

      {stackReady ? (
        <SecurityCenter alerts={stackQuery.data!.securityAlerts} />
      ) : (
        <SectionSkeleton
          title={DASHBOARD_SECTIONS.security.title}
          id={DASHBOARD_SECTIONS.security.id}
          rows={2}
        />
      )}

      {stackReady ? (
        <>
          <TransitiveDependenciesSection items={stackQuery.data!.transitiveDependencies} />
          <BreakingChangesFeed changes={stackQuery.data!.breakingChanges} />
        </>
      ) : (
        <>
          <SectionSkeleton
            title={DASHBOARD_SECTIONS.transitive.title}
            id={DASHBOARD_SECTIONS.transitive.id}
            rows={2}
          />
          <SectionSkeleton
            title={DASHBOARD_SECTIONS.breakingChanges.title}
            id={DASHBOARD_SECTIONS.breakingChanges.id}
            rows={2}
          />
        </>
      )}
    </>
  )
}
