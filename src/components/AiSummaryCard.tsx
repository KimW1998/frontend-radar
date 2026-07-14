import { Box, Chip, Stack, Typography, useTheme, alpha } from '@mui/material'
import type { AiSummary } from '@/types'
import { URGENCY_LABELS } from '@/types'

const URGENCY_COLORS: Record<AiSummary['upgradeUrgency'], string> = {
  immediate: '#EF4444',
  'this-sprint': '#F97316',
  'next-sprint': '#EAB308',
  backlog: '#6B7280',
}

interface AiSummaryCardProps {
  summary: AiSummary
  compact?: boolean
}

export function AiSummaryCard({ summary, compact = false }: AiSummaryCardProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        p: compact ? 1.5 : 2,
        bgcolor: theme.tokens.surface.nested,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          AI Summary
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Chip
            label={URGENCY_LABELS[summary.upgradeUrgency]}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              bgcolor: alpha(URGENCY_COLORS[summary.upgradeUrgency], 0.12),
              color: URGENCY_COLORS[summary.upgradeUrgency],
            }}
          />
          <Chip
            label={`${summary.readingTimeSeconds}s read`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              bgcolor: theme.tokens.surface.hover,
              color: 'text.secondary',
            }}
          />
        </Stack>
      </Stack>

      <Stack spacing={compact ? 0.75 : 1}>
        <SummaryRow label="What happened?" text={summary.whatHappened} />
        <SummaryRow label="Why care?" text={summary.whyCare} />
        <SummaryRow label="Action?" text={summary.actionRequired} />
      </Stack>
    </Box>
  )
}

function SummaryRow({ label, text }: { label: string; text: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary' }}>
        {text}
      </Typography>
    </Box>
  )
}
