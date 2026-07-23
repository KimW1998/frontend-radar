import { useState } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import StorageIcon from '@mui/icons-material/Storage'
import type { DataSourceStatus } from '@/types'
import { DetailCard } from '@/components/DetailCard'
import { buildDataSourceDetail } from '@/lib/detail-builders'

interface DataSourcesIndicatorProps {
  sources?: DataSourceStatus[]
}

const STATUS_CONFIG: Record<
  DataSourceStatus['status'],
  { color: string; icon: React.ReactNode; label: string }
> = {
  ok: { color: '#22C55E', icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, label: 'OK' },
  partial: { color: '#EAB308', icon: <WarningAmberIcon sx={{ fontSize: 14 }} />, label: 'Partial' },
  error: { color: '#EF4444', icon: <ErrorIcon sx={{ fontSize: 14 }} />, label: 'Error' },
  unavailable: { color: '#6B7280', icon: <HelpOutlineIcon sx={{ fontSize: 14 }} />, label: 'N/A' },
}

function overallStatus(sources: DataSourceStatus[]): DataSourceStatus['status'] {
  if (sources.some((s) => s.status === 'error')) return 'error'
  if (sources.some((s) => s.status === 'partial' || s.status === 'unavailable')) return 'partial'
  return 'ok'
}

export function DataSourcesIndicator({ sources }: DataSourcesIndicatorProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)

  if (!sources?.length) {
    return (
      <Tooltip title="Data sources loading…">
        <IconButton size="small" disabled sx={{ color: 'text.disabled' }}>
          <StorageIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    )
  }

  const overall = overallStatus(sources)
  const cfg = STATUS_CONFIG[overall]
  const okCount = sources.filter((s) => s.status === 'ok').length

  return (
    <>
      <Tooltip title={`${okCount}/${sources.length} data sources OK — click for details`}>
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ color: cfg.color }}
          aria-label="Data sources status"
        >
          {overall === 'ok' ? (
            <CheckCircleIcon sx={{ fontSize: 16 }} />
          ) : (
            <StorageIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 420,
              overflow: 'auto',
              p: 1.5,
              borderRadius: 2,
            },
          },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Data Sources
        </Typography>
        <Stack spacing={0.75}>
          {sources.map((source) => {
            const sc = STATUS_CONFIG[source.status]
            return (
              <DetailCard
                key={source.id}
                detail={buildDataSourceDetail(source)}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  pr: 4,
                  cursor: 'pointer',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
                  <Box sx={{ color: sc.color, display: 'flex' }}>{sc.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
                    {source.name}
                  </Typography>
                  <Chip
                    label={sc.label}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.625rem',
                      bgcolor: `${sc.color}18`,
                      color: sc.color,
                    }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {source.message}
                </Typography>
              </DetailCard>
            )
          })}
        </Stack>
      </Popover>
    </>
  )
}
