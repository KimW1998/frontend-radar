import { Box, Chip, Stack, Typography } from '@mui/material'
import type { RiskLevel, Severity } from '@/types'
import { RISK_COLORS, SEVERITY_COLORS } from '@/types'

const RISK_LABELS: Record<RiskLevel, string> = {
  safe: 'Safe',
  recommended: 'Update Recommended',
  major: 'Major Update',
  security: 'Security Issue',
}

interface RiskBadgeProps {
  level: RiskLevel
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const color = RISK_COLORS[level]
  return (
    <Chip
      label={RISK_LABELS[level]}
      size="small"
      sx={{
        bgcolor: `${color}18`,
        color,
        fontWeight: 600,
        fontSize: '0.6875rem',
        height: 22,
        border: `1px solid ${color}30`,
      }}
    />
  )
}

interface SeverityBadgeProps {
  severity: Severity
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const color = SEVERITY_COLORS[severity]
  return (
    <Chip
      label={severity.charAt(0).toUpperCase() + severity.slice(1)}
      size="small"
      sx={{
        bgcolor: `${color}18`,
        color,
        fontWeight: 600,
        fontSize: '0.6875rem',
        height: 22,
        border: `1px solid ${color}30`,
      }}
    />
  )
}

interface StatBoxProps {
  label: string
  value: string | number
  color?: string
  icon?: React.ReactNode
}

export function StatBox({ label, value, color, icon }: StatBoxProps) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        minWidth: 120,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
        {icon}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="h3"
        sx={{ color: color ?? 'text.primary', fontFamily: '"JetBrains Mono", monospace' }}
      >
        {value}
      </Typography>
    </Box>
  )
}
