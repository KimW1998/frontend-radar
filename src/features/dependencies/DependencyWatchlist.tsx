import { Box, Link, Stack, Typography } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import type { Dependency } from '@/types'
import { RISK_COLORS } from '@/types'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { SectionCard } from '@/components/SectionCard'
import { UpgradeCommandRow } from '@/components/UpgradeCommandRow'
import { RiskBadge } from '@/components/Badges'
import { DetailCard } from '@/components/DetailCard'
import { buildDependencyDetail } from '@/lib/detail-builders'
import { formatUpgradeCommand, needsDependencyUpgrade } from '@/lib/upgrade-command'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { useFilterStore, useUiStore, matchesFilter } from '@/stores'
import { monoFont } from '@/theme'

interface DependencyWatchlistProps {
  dependencies: Dependency[]
}

export function DependencyWatchlist({ dependencies }: DependencyWatchlistProps) {
  const isConfigured = useIsStackConfigured()
  const packageManager = useUiStore((s) => s.packageManager)
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
        {filtered.map((dep) => {
          const showUpgrade = dep.npmPackage &&
            needsDependencyUpgrade(dep.currentVersion, dep.recommendedVersion, dep.riskLevel)
          const upgradeCommand = showUpgrade && dep.npmPackage
            ? formatUpgradeCommand(dep.npmPackage, dep.recommendedVersion, packageManager)
            : null

          return (
          <DetailCard
            key={dep.id}
            detail={buildDependencyDetail(dep)}
            sx={{
              p: 2,
              pr: 5,
              bgcolor: 'background.paper',
              border: `1px solid ${RISK_COLORS[dep.riskLevel]}30`,
              borderLeft: `3px solid ${RISK_COLORS[dep.riskLevel]}`,
              borderRadius: 2,
              '&:hover': { borderColor: `${RISK_COLORS[dep.riskLevel]}50` },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {dep.name}
                </Typography>
                <RiskBadge level={dep.riskLevel} />
                {dep.securityIssues > 0 && (
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                    {dep.securityIssues} CVE{dep.securityIssues > 1 ? 's' : ''}
                  </Typography>
                )}
              </Stack>
              {dep.sourceUrl && (
                <Link
                  href={dep.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}
                >
                  Releases <OpenInNewIcon sx={{ fontSize: 12 }} />
                </Link>
              )}
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 1.5 }}>
              <VersionCell label="Current" version={dep.currentVersion} />
              <VersionCell label="Latest" version={dep.latestVersion} />
              <VersionCell label="Recommended" version={dep.recommendedVersion} highlight />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Breaking</Typography>
                <Typography variant="body2" sx={{ color: dep.breakingApiChanges?.length || dep.breakingChanges ? '#F97316' : '#22C55E' }}>
                  {dep.breakingApiChanges?.length
                    ? `${dep.breakingApiChanges.length} API change${dep.breakingApiChanges.length > 1 ? 's' : ''}`
                    : dep.breakingChanges
                      ? 'Major bump'
                      : 'None'}
                </Typography>
              </Box>
            </Box>

            {dep.breakingApiChanges && dep.breakingApiChanges.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#F97316', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Breaking API changes
                </Typography>
                <Stack component="ul" spacing={0.25} sx={{ m: 0, pl: 2 }}>
                  {dep.breakingApiChanges.slice(0, 2).map((item, i) => (
                    <Typography key={i} component="li" variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {dep.releaseNotesSummary}
            </Typography>

            {upgradeCommand && <UpgradeCommandRow command={upgradeCommand} />}
          </DetailCard>
          )
        })}
      </Stack>
    </SectionCard>
  )
}

function VersionCell({ label, version, highlight }: { label: string; version: string; highlight?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography
        variant="body2"
        sx={{ fontFamily: monoFont, color: highlight ? 'primary.main' : 'text.primary' }}
      >
        {version}
      </Typography>
    </Box>
  )
}
