import { Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import type { TransitiveDependencyInsight } from '@/lib/transitive-deps'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { EmptySectionState } from '@/components/EmptySectionState'
import { SectionCard } from '@/components/SectionCard'
import { SeverityBadge } from '@/components/Badges'
import { resolveSectionEmpty, useIsStackConfigured } from '@/lib/section-empty'
import { cardSx, monoFont } from '@/theme'

interface TransitiveDependenciesSectionProps {
  items: TransitiveDependencyInsight[]
}

export function TransitiveDependenciesSection({ items }: TransitiveDependenciesSectionProps) {
  const theme = useTheme()
  const isConfigured = useIsStackConfigured()

  const withVulns = items.filter((item) => item.vulnerabilityCount > 0)
  const emptyVariant = resolveSectionEmpty(items.length, withVulns.length, {
    requiresConfig: true,
    isConfigured,
  })

  return (
    <SectionCard
      title={DASHBOARD_SECTIONS.transitive.title}
      subtitle={DASHBOARD_SECTIONS.transitive.subtitle}
      id={DASHBOARD_SECTIONS.transitive.id}
    >
      {items.length === 0 ? (
        <EmptySectionState
          variant={isConfigured ? 'all-clear' : 'not-configured'}
          title={isConfigured ? 'Import a lockfile to analyze transitive dependencies' : undefined}
          description={
            isConfigured
              ? 'Paste or sync a lockfile in Settings so Frontend Radar can walk your dependency tree.'
              : undefined
          }
        />
      ) : (
        <Stack spacing={1}>
          {emptyVariant === 'all-clear' && (
            <EmptySectionState
              variant="all-clear"
              title="No transitive advisories in scanned dependencies"
              description={`Scanned ${items.length} transitive packages (depth ≤ 2) from your lockfile.`}
            />
          )}
          {withVulns.map((item) => (
            <Box key={item.id} sx={{ ...cardSx(theme), p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                {item.highestSeverity && <SeverityBadge severity={item.highestSeverity} />}
                <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                  {item.npmPackage}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
                  {item.version}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Required by {item.requiredBy.join(', ')} · depth {item.depth}
                {item.vulnerabilityCount > 0 && ` · ${item.vulnerabilityCount} advisory(ies)`}
              </Typography>
              {item.topAdvisoryId && (
                <Chip
                  size="small"
                  label={item.topAdvisoryId}
                  sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
                />
              )}
            </Box>
          ))}
          {withVulns.length === 0 && items.length > 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {items.length} transitive dependencies mapped — none with critical/high advisories in the scanned set.
            </Typography>
          )}
        </Stack>
      )}
    </SectionCard>
  )
}
