import { createRootRoute, createRoute, createRouter, Outlet, Navigate } from '@tanstack/react-router'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useRouterState } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NewsPage } from '@/features/news/NewsPage'
import { ReleaseNotesPage } from '@/features/news/ReleaseNotesPage'
import { TanStackPage } from '@/features/news/TanStackPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { UpgradePlanPage } from '@/features/upgrade-plan/UpgradePlanPage'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useEnsureActiveProject, useSettingsHydrated } from '@/hooks/useSettingsHydrated'
import { useGitHubOAuthCallback } from '@/hooks/useGitHubOAuthCallback'
import { useSettingsStore } from '@/stores'

import { usePeriodicGitHubSync } from '@/hooks/usePeriodicGitHubSync'

function RootComponent() {
  const hydrated = useSettingsHydrated()
  useEnsureActiveProject()
  useGitHubOAuthCallback()
  usePeriodicGitHubSync()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeProject = useActiveProject()
  const projects = useSettingsStore((s) => s.projects)
  const isReading = pathname === '/news' || pathname === '/news/releases' || pathname === '/tanstack'
  const needsProject = pathname === '/' || pathname === '/upgrade-plan'

  const dashboard = useDashboardData(true)
  const knowledge = useKnowledgeData(isReading)

  const active = isReading ? knowledge : dashboard

  if (!hydrated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={28} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Loading your workspace…
        </Typography>
      </Box>
    )
  }

  if (needsProject && projects.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  if (needsProject && !activeProject) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <AppLayout
      onRefresh={() => active.refetch()}
      isRefreshing={active.isFetching}
      lastUpdated={isReading ? knowledge.data?.lastUpdated : dashboard.lastUpdated}
      dataSources={dashboard.dataSources}
      upgradePlanStepCount={dashboard.stackQuery.data?.upgradePlan.length ?? 0}
    >
      <Outlet />
    </AppLayout>
  )
}

const rootRoute = createRootRoute({
  component: RootComponent,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    focus: typeof search.focus === 'string' ? search.focus : undefined,
  }),
  component: DashboardPage,
})

const newsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/news',
  component: NewsPage,
})

const releaseNotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/news/releases',
  component: ReleaseNotesPage,
})

const tanStackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tanstack',
  component: TanStackPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const upgradePlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upgrade-plan',
  validateSearch: (search: Record<string, unknown>) => ({
    package: typeof search.package === 'string' ? search.package : undefined,
  }),
  component: UpgradePlanPage,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  newsRoute,
  releaseNotesRoute,
  tanStackRoute,
  settingsRoute,
  upgradePlanRoute,
  onboardingRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
