import { Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import SecurityIcon from '@mui/icons-material/Security'
import UpdateIcon from '@mui/icons-material/Update'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ScheduleIcon from '@mui/icons-material/Schedule'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import type { ExecutiveAction } from '@/types'
import { URGENCY_LABELS } from '@/types'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import { buildExecutiveDetail } from '@/lib/detail-builders'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { useFilterStore, matchesFilter } from '@/stores'
import { cardSx } from '@/theme'

const TYPE_ICONS: Record<ExecutiveAction['type'], React.ReactNode> = {
  security: <SecurityIcon sx={{ fontSize: 16, color: '#EF4444' }} />,
  dependency: <UpdateIcon sx={{ fontSize: 16, color: '#3B82F6' }} />,
  breaking: <WarningAmberIcon sx={{ fontSize: 16, color: '#F97316' }} />,
  deprecation: <ScheduleIcon sx={{ fontSize: 16, color: '#EAB308' }} />,
  recommendation: <LightbulbIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />,
}

const IMPACT_COLORS = { low: '#22C55E', medium: '#EAB308', high: '#EF4444' }

interface ExecutiveSummaryProps {
  actions: ExecutiveAction[]
}

export function ExecutiveSummary({ actions }: ExecutiveSummaryProps) {
  const theme = useTheme()
  const isConfigured = useIsStackConfigured()
  const { activeFilters, searchQuery, clearFilters } = useFilterStore()

  const filtered = actions.filter((a) =>
    matchesFilter(a.categories, activeFilters, searchQuery, [a.title, a.why, a.action]),
  )

  const emptyVariant = resolveSectionEmpty(actions.length, filtered.length, {
    requiresConfig: true,
    isConfigured,
  })

  return (
    <SectionCard
      title={DASHBOARD_SECTIONS.executiveSummary.title}
      subtitle={DASHBOARD_SECTIONS.executiveSummary.subtitle}
      id={DASHBOARD_SECTIONS.executiveSummary.id}
    >
      <Stack spacing={1.5}>
        {emptyVariant && (
          <EmptySectionState
            variant={emptyVariant}
            title={
              emptyVariant === 'all-clear'
                ? 'Nothing urgent right now'
                : undefined
            }
            description={
              emptyVariant === 'all-clear'
                ? 'Your stack looks good — no critical actions at the moment.'
                : undefined
            }
            onClearFilters={clearFilters}
          />
        )}
        {filtered.map((action) => (
          <DetailCard key={action.id} detail={buildExecutiveDetail(action)} sx={{ ...cardSx(theme), pr: 5 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              {TYPE_ICONS[action.type]}
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', flex: 1 }}>
                {action.title}
              </Typography>
              <Chip
                label={URGENCY_LABELS[action.urgency]}
                size="small"
                sx={{ height: 20, fontSize: '0.6875rem' }}
              />
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, pl: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Why</Typography>
                <Typography variant="body2">{action.why}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Action</Typography>
                <Typography variant="body2" sx={{ color: 'primary.main' }}>{action.action}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Impact</Typography>
                <Typography variant="body2" sx={{ color: IMPACT_COLORS[action.impact] }}>
                  {action.impact.charAt(0).toUpperCase() + action.impact.slice(1)} effort
                </Typography>
              </Box>
            </Box>
          </DetailCard>
        ))}
      </Stack>
    </SectionCard>
  )
}
