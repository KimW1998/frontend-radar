import { Box, Stack, Typography, useTheme } from '@mui/material'
import type { Dependency, ExecutiveAction, NodeStatus, SecurityAlert } from '@/types'
import { URGENCY_LABELS } from '@/types'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import {
  DependencyPackageCardContent,
  dependencyCardSx,
} from '@/components/DependencyPackageCardContent'
import { SecurityAlertCardContent } from '@/components/SecurityAlertCardContent'
import { buildDependencyDetail, buildExecutiveDetail, buildNodeDetail, buildSecurityDetail } from '@/lib/detail-builders'
import { resolveExecutiveActionContext } from '@/lib/executive-action-context'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { useFilterStore, matchesFilter } from '@/stores'
import { cardSx, monoFont } from '@/theme'

interface ExecutiveSummaryProps {
  actions: ExecutiveAction[]
  dependencies: Dependency[]
  securityAlerts: SecurityAlert[]
  nodeStatus: NodeStatus | null
}

export function ExecutiveSummary({
  actions,
  dependencies,
  securityAlerts,
  nodeStatus,
}: ExecutiveSummaryProps) {
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
            title={emptyVariant === 'all-clear' ? 'Nothing urgent right now' : undefined}
            description={
              emptyVariant === 'all-clear'
                ? 'Your stack looks good — no critical actions at the moment.'
                : undefined
            }
            onClearFilters={clearFilters}
          />
        )}
        {filtered.map((action) => {
          const context = resolveExecutiveActionContext(
            action,
            dependencies,
            securityAlerts,
            nodeStatus,
          )

          if (context?.kind === 'dependency') {
            return (
              <DetailCard
                key={action.id}
                detail={buildDependencyDetail(context.dep)}
                sx={dependencyCardSx(context.dep)}
              >
                <DependencyPackageCardContent dep={context.dep} urgency={action.urgency} />
              </DetailCard>
            )
          }

          if (context?.kind === 'security') {
            return (
              <DetailCard
                key={action.id}
                detail={buildSecurityDetail(context.alert)}
                sx={{ ...cardSx(theme), pr: 5 }}
              >
                <SecurityAlertCardContent
                  alert={context.alert}
                  currentVersion={context.currentVersion}
                  urgency={action.urgency}
                />
              </DetailCard>
            )
          }

          if (context?.kind === 'node') {
            return (
              <DetailCard
                key={action.id}
                detail={buildNodeDetail(context.nodeStatus)}
                sx={{ ...cardSx(theme), pr: 5 }}
              >
                <NodeAttentionCardContent nodeStatus={context.nodeStatus} urgency={action.urgency} />
              </DetailCard>
            )
          }

          return (
            <DetailCard key={action.id} detail={buildExecutiveDetail(action)} sx={{ ...cardSx(theme), pr: 5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                {action.title}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
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
                  <Typography variant="body2">{action.impact.charAt(0).toUpperCase() + action.impact.slice(1)} effort</Typography>
                </Box>
              </Box>
            </DetailCard>
          )
        })}
      </Stack>
    </SectionCard>
  )
}

function NodeAttentionCardContent({
  nodeStatus,
  urgency,
}: {
  nodeStatus: NodeStatus
  urgency: ExecutiveAction['urgency']
}) {
  return (
    <>
      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Node.js {nodeStatus.status === 'end-of-life' ? 'end of life' : 'upgrade recommended'}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <VersionCell label="Current" version={nodeStatus.currentVersion} />
        <VersionCell
          label="Latest LTS"
          version={`${nodeStatus.latestLts.version}${nodeStatus.latestLts.codename ? ` (${nodeStatus.latestLts.codename})` : ''}`}
          highlight
        />
        <VersionCell label="Migration effort" version={nodeStatus.migrationEffort} />
        <VersionCell label="Urgency" version={URGENCY_LABELS[urgency]} />
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {nodeStatus.whyUpgrade}
      </Typography>
    </>
  )
}

function VersionCell({
  label,
  version,
  highlight,
}: {
  label: string
  version: string
  highlight?: boolean
}) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: label === 'Migration effort' || label === 'Urgency' ? undefined : monoFont,
          color: highlight ? 'primary.main' : 'text.primary',
          textTransform: label === 'Migration effort' ? 'capitalize' : undefined,
        }}
      >
        {version}
      </Typography>
    </Box>
  )
}
