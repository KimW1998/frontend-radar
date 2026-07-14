import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { useRouterState } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NewsPage } from '@/features/news/NewsPage'
import { TanStackPage } from '@/features/news/TanStackPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isReading = pathname === '/news' || pathname === '/tanstack'

  const dashboard = useDashboardData(!isReading)
  const knowledge = useKnowledgeData(isReading)

  const active = isReading ? knowledge : dashboard

  return (
    <AppLayout
      onRefresh={() => active.refetch()}
      isRefreshing={active.isFetching}
      lastUpdated={active.data?.lastUpdated}
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
  component: DashboardPage,
})

const newsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/news',
  component: NewsPage,
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

const routeTree = rootRoute.addChildren([indexRoute, newsRoute, tanStackRoute, settingsRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
