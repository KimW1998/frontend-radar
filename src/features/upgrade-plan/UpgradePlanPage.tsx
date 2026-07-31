import { Box, Typography } from '@mui/material'
import { Navigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { QueryErrorState } from '@/components/QueryErrorState'
import { SectionSkeleton } from '@/components/SectionSkeleton'
import {
  UpgradePlanContent,
} from '@/features/upgrade-plan/UpgradePlanContent'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useConfiguredPackageCount } from '@/lib/section-empty'
import { useDashboardData } from '@/hooks/useDashboardData'

export function UpgradePlanPage() {
  const { package: highlightPackage } = useSearch({ from: '/upgrade-plan' })
  const activeProject = useActiveProject()
  const configuredCount = useConfiguredPackageCount()
  const { stackQuery, isError, isFetching, isRefetching, refetch } = useDashboardData()

  const stackReady = Boolean(stackQuery.data)
  const initialLoad = Boolean(activeProject) && !stackReady && stackQuery.isFetching
  const upgradePlanLength = stackQuery.data?.upgradePlan.length ?? 0

  useEffect(() => {
    if (!highlightPackage || upgradePlanLength === 0) return
    const timer = window.setTimeout(() => {
      document.getElementById('upgrade-plan-highlight')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [highlightPackage, upgradePlanLength])

  if (!activeProject) {
    return <Navigate to="/onboarding" replace />
  }

  if (initialLoad) {
    return (
      <Box>
        <PageHeader />
        <SectionSkeleton title={DASHBOARD_SECTIONS.upgradePlan.title} rows={3} />
      </Box>
    )
  }

  if (isError && !stackReady) {
    return (
      <Box>
        <PageHeader />
        <QueryErrorState
          title="Failed to load upgrade plan"
          message="Could not fetch package data. Check your network connection and try again."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      </Box>
    )
  }

  const upgradePlan = stackQuery.data?.upgradePlan ?? []
  const dependencies = stackQuery.data?.dependencies ?? []

  return (
    <Box>
      <PageHeader />

      {isFetching && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Refreshing live data…
        </Typography>
      )}

      {configuredCount === 0 ? (
        <EmptySectionState
          variant="not-configured"
          title="Configure your stack first"
          description="Import your package.json in Settings so we can build an upgrade plan for your tracked packages."
          actionLabel="Open Settings"
          actionTo="/settings"
        />
      ) : upgradePlan.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            px: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1.5 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>
            Nothing to plan right now
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto' }}>
            Your tracked packages are up to date — no ordered upgrades needed. Check back after new versions
            are released or when peer dependency constraints appear.
          </Typography>
        </Box>
      ) : (
        <UpgradePlanContent
          upgradePlan={upgradePlan}
          dependencies={dependencies}
          highlightPackage={highlightPackage}
          showBlockers
          showProgress
          showExport
        />
      )}
    </Box>
  )
}

function PageHeader() {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        {DASHBOARD_SECTIONS.upgradePlan.title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {DASHBOARD_SECTIONS.upgradePlan.subtitle}
      </Typography>
    </Box>
  )
}
