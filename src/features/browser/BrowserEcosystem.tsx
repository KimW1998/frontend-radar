import { Box, Stack, Typography, useTheme } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { BrowserUpdate } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { AiSummaryCard } from '@/components/AiSummaryCard'
import { DetailCard } from '@/components/DetailCard'
import { buildBrowserDetail } from '@/lib/detail-builders'
import { useFilterStore, matchesFilter } from '@/stores'
import { cardSx } from '@/theme'

interface BrowserEcosystemProps {
  updates: BrowserUpdate[]
}

export function BrowserEcosystem({ updates }: BrowserEcosystemProps) {
  const theme = useTheme()
  const { activeFilters, searchQuery } = useFilterStore()

  const filtered = updates.filter((u) =>
    matchesFilter(u.categories, activeFilters, searchQuery, [u.browser, u.title, u.summary]),
  )

  return (
    <SectionCard
      title="Frontend Ecosystem"
      subtitle="Browser breaking changes, new APIs, security fixes, and CSS support"
      id="browser-ecosystem"
    >
      {filtered.length === 0 ? (
        <Box sx={{ ...cardSx(theme), textAlign: 'center', py: 3 }}>
          <InfoOutlinedIcon sx={{ color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            No browser data — no CORS-enabled unified API
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Chrome, Firefox, Safari, and Edge release notes require scraping or vendor-specific feeds via a backend.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {filtered.map((update) => (
            <DetailCard key={update.id} detail={buildBrowserDetail(update)} sx={{ ...cardSx(theme), pr: 5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {update.title}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <AiSummaryCard summary={update.aiSummary} compact />
              </Box>
            </DetailCard>
          ))}
        </Stack>
      )}
    </SectionCard>
  )
}
