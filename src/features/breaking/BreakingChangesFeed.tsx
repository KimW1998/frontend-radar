import { Box, Chip, Link, Stack, Typography, useTheme } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CodeIcon from '@mui/icons-material/Code'
import type { BreakingChange } from '@/types'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import { buildBreakingChangeDetail } from '@/lib/detail-builders'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { useFilterStore, matchesFilter } from '@/stores'
import { cardSx, monoFont } from '@/theme'

interface BreakingChangesFeedProps {
  changes: BreakingChange[]
}

export function BreakingChangesFeed({ changes }: BreakingChangesFeedProps) {
  const theme = useTheme()
  const isConfigured = useIsStackConfigured()
  const { activeFilters, searchQuery, clearFilters } = useFilterStore()

  const filtered = changes.filter((c) =>
    matchesFilter(c.categories, activeFilters, searchQuery, [
      c.technology,
      c.title,
      c.whatChanged,
      c.migrationGuidance,
      ...(c.breakingApiChanges ?? []),
    ]),
  )

  const emptyVariant = resolveSectionEmpty(changes.length, filtered.length, {
    requiresConfig: true,
    isConfigured,
  })

  return (
    <SectionCard
      title={DASHBOARD_SECTIONS.breakingChanges.title}
      subtitle={DASHBOARD_SECTIONS.breakingChanges.subtitle}
      id={DASHBOARD_SECTIONS.breakingChanges.id}
    >
      <Stack spacing={1.5}>
        {emptyVariant && (
          <EmptySectionState
            variant={emptyVariant}
            title={
              emptyVariant === 'all-clear'
                ? 'No major upgrades pending'
                : undefined
            }
            description={
              emptyVariant === 'all-clear'
                ? 'None of your configured packages have a major version bump available.'
                : undefined
            }
            onClearFilters={clearFilters}
          />
        )}
        {filtered.map((change) => (
          <DetailCard key={change.id} detail={buildBreakingChangeDetail(change)} sx={{ ...cardSx(theme), pr: 5 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Chip
                label={change.technology}
                size="small"
                sx={{ bgcolor: '#F9731618', color: '#F97316', fontWeight: 600 }}
              />
              <Chip
                label={`v${change.version}`}
                size="small"
                sx={{ bgcolor: theme.tokens.surface.hover, fontFamily: monoFont, fontSize: '0.6875rem' }}
              />
              <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                {change.title}
              </Typography>
              <Link
                href={change.sourceUrl}
                target="_blank"
                rel="noopener"
                onClick={(e) => e.stopPropagation()}
                sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                Docs <OpenInNewIcon sx={{ fontSize: 12 }} />
              </Link>
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              {change.whatChanged}
            </Typography>

            {change.breakingApiChanges && change.breakingApiChanges.length > 0 ? (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#F97316', fontWeight: 600, display: 'block', mb: 0.75 }}>
                  Breaking API changes
                </Typography>
                <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
                  {change.breakingApiChanges.slice(0, 4).map((item, i) => (
                    <Typography key={i} component="li" variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                      {item}
                    </Typography>
                  ))}
                </Stack>
                {change.breakingApiChanges.length > 4 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    +{change.breakingApiChanges.length - 4} more in details
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                  <CodeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Migration notes</Typography>
                </Stack>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    bgcolor: theme.tokens.code.bg,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    fontFamily: monoFont,
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    overflow: 'auto',
                    color: theme.tokens.code.text,
                    m: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {change.codeExample}
                </Box>
              </Box>
            )}

            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                Migration:{' '}
              </Typography>
              {change.migrationGuidance}
            </Typography>
          </DetailCard>
        ))}
      </Stack>
    </SectionCard>
  )
}
