import { Box, Stack, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Typo3Update } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { AiSummaryCard } from '@/components/AiSummaryCard'
import { DetailCard } from '@/components/DetailCard'
import { buildTypo3Detail } from '@/lib/detail-builders'
import { useFilterStore, matchesFilter } from '@/stores'
import { cardSx, monoFont } from '@/theme'
import { useTheme } from '@mui/material'

interface Typo3WatchProps {
  updates: Typo3Update[]
}

export function Typo3Watch({ updates }: Typo3WatchProps) {
  const theme = useTheme()
  const { activeFilters, searchQuery } = useFilterStore()

  const filtered = updates.filter((u) =>
    matchesFilter(u.categories, activeFilters, searchQuery, [u.title, u.summary]),
  )

  return (
    <SectionCard
      title="TYPO3 Watch"
      subtitle="Releases, security advisories, TypoScript changes, and deprecations"
      id="typo3-watch"
    >
      {filtered.length === 0 ? (
        <Box sx={{ ...cardSx(theme), textAlign: 'center', py: 3 }}>
          <InfoOutlinedIcon sx={{ color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            No TYPO3 data — source unreachable from browser
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            typo3.org serves HTML only. No public JSON/RSS API with CORS. Requires a backend proxy or RSS parser.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {filtered.map((update) => (
            <DetailCard key={update.id} detail={buildTypo3Detail(update)} sx={{ ...cardSx(theme), pr: 5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {update.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: monoFont }}>
                {update.publishedAt}
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
