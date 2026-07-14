import { Box, Link, Stack, Typography, useTheme } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import type { SecurityAlert } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { SeverityBadge } from '@/components/Badges'
import { AiSummaryCard } from '@/components/AiSummaryCard'
import { DetailCard } from '@/components/DetailCard'
import { buildSecurityDetail } from '@/lib/detail-builders'
import { useFilterStore, matchesFilter } from '@/stores'
import { cardSx, monoFont } from '@/theme'

interface SecurityCenterProps {
  alerts: SecurityAlert[]
}

export function SecurityCenter({ alerts }: SecurityCenterProps) {
  const theme = useTheme()
  const { activeFilters, searchQuery } = useFilterStore()

  const filtered = alerts
    .filter((a) =>
      matchesFilter(a.categories, activeFilters, searchQuery, [
        a.title,
        a.affectedPackage,
        a.actionNeeded,
      ]),
    )
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.severity] - order[b.severity]
    })

  return (
    <SectionCard
      title="Security Center"
      subtitle="CVEs, advisories, and supply chain alerts"
      id="security-center"
    >
      <Stack spacing={1}>
        {filtered.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            No security alerts match current filters.
          </Typography>
        )}
        {filtered.map((alert) => (
          <DetailCard key={alert.id} detail={buildSecurityDetail(alert)} sx={{ ...cardSx(theme), pr: 5 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <SeverityBadge severity={alert.severity} />
              <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                {alert.title}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
                {alert.publishedAt}
              </Typography>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Affected</Typography>
                <Typography variant="body2" sx={{ fontFamily: monoFont }}>{alert.affectedPackage}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Action</Typography>
                <Typography variant="body2" sx={{ color: 'primary.main' }}>{alert.actionNeeded}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Source</Typography>
                <Link
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Advisory <OpenInNewIcon sx={{ fontSize: 12 }} />
                </Link>
              </Box>
            </Box>

            <AiSummaryCard summary={alert.summary} compact />
          </DetailCard>
        ))}
      </Stack>
    </SectionCard>
  )
}
