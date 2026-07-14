import { Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { DataSourceStatus } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import { buildDataSourceDetail } from '@/lib/detail-builders'
import { cardSx } from '@/theme'

interface DataSourcesPanelProps {
  sources: DataSourceStatus[]
}

const STATUS_CONFIG: Record<
  DataSourceStatus['status'],
  { color: string; icon: React.ReactNode; label: string }
> = {
  ok: { color: '#22C55E', icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, label: 'Reachable' },
  partial: { color: '#EAB308', icon: <WarningAmberIcon sx={{ fontSize: 16 }} />, label: 'Partial' },
  error: { color: '#EF4444', icon: <ErrorIcon sx={{ fontSize: 16 }} />, label: 'Error' },
  unavailable: { color: '#6B7280', icon: <HelpOutlineIcon sx={{ fontSize: 16 }} />, label: 'Unavailable' },
}

export function DataSourcesPanel({ sources }: DataSourcesPanelProps) {
  const theme = useTheme()

  const reachable = sources.filter((s) => s.status === 'ok' || s.status === 'partial').length
  const unavailable = sources.filter((s) => s.status === 'unavailable').length

  return (
    <SectionCard
      title="Data Sources"
      subtitle={`${reachable} reachable · ${unavailable} unavailable from browser · no mock data`}
      id="data-sources"
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
        {sources.map((source) => {
          const cfg = STATUS_CONFIG[source.status]
          return (
            <DetailCard key={source.id} detail={buildDataSourceDetail(source)} sx={{ ...cardSx(theme), pr: 5 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                <Box sx={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                  {source.name}
                </Typography>
                <Chip
                  label={cfg.label}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6875rem',
                    bgcolor: `${cfg.color}18`,
                    color: cfg.color,
                  }}
                />
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontFamily: '"JetBrains Mono", monospace',
                  display: 'block',
                  mb: 0.5,
                  wordBreak: 'break-all',
                }}
              >
                {source.endpoint}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {source.message}
                {source.itemCount > 0 && source.status !== 'unavailable' && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>
                    ({source.itemCount} items)
                  </Typography>
                )}
              </Typography>
            </DetailCard>
          )
        })}
      </Box>
    </SectionCard>
  )
}
