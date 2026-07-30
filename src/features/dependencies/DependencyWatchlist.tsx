import { Stack } from '@mui/material'
import type { Dependency } from '@/types'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import {
  DependencyPackageCardContent,
  dependencyCardSx,
} from '@/components/DependencyPackageCardContent'
import { buildDependencyDetail } from '@/lib/detail-builders'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { useFilterStore, matchesFilter } from '@/stores'

interface DependencyWatchlistProps {
  dependencies: Dependency[]
}

export function DependencyWatchlist({ dependencies }: DependencyWatchlistProps) {
  const isConfigured = useIsStackConfigured()
  const { activeFilters, searchQuery, clearFilters } = useFilterStore()

  const filtered = dependencies.filter((d) =>
    matchesFilter(d.categories, activeFilters, searchQuery, [
      d.name,
      d.releaseNotesSummary,
      d.currentVersion,
      d.latestVersion,
      ...(d.breakingApiChanges ?? []),
    ]),
  )

  const emptyVariant = resolveSectionEmpty(dependencies.length, filtered.length, {
    requiresConfig: true,
    isConfigured,
  })

  return (
    <SectionCard
      title={DASHBOARD_SECTIONS.dependencies.title}
      subtitle={DASHBOARD_SECTIONS.dependencies.subtitle}
      id={DASHBOARD_SECTIONS.dependencies.id}
    >
      <Stack spacing={1}>
        {emptyVariant && (
          <EmptySectionState variant={emptyVariant} onClearFilters={clearFilters} />
        )}
        {filtered.map((dep) => (
          <DetailCard
            key={dep.id}
            detail={buildDependencyDetail(dep)}
            sx={dependencyCardSx(dep)}
          >
            <DependencyPackageCardContent dep={dep} />
          </DetailCard>
        ))}
      </Stack>
    </SectionCard>
  )
}
