import { Box, Link, Stack, Typography } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import type { SecurityAlert, UpgradeUrgency } from '@/types'
import { URGENCY_LABELS } from '@/types'
import { UpgradeCommandRow } from '@/components/UpgradeCommandRow'
import { SeverityBadge } from '@/components/Badges'
import { formatUpgradeCommand } from '@/lib/upgrade-command'
import { useUiStore } from '@/stores'
import { SnoozeAlertButton } from '@/components/SnoozeAlertButton'
import { securityAlertSnoozeKey } from '@/lib/alert-snooze'
import { monoFont } from '@/theme'

interface SecurityAlertCardContentProps {
  alert: SecurityAlert
  currentVersion?: string | null
  urgency?: UpgradeUrgency
}

export function SecurityAlertCardContent({
  alert,
  currentVersion,
  urgency,
}: SecurityAlertCardContentProps) {
  const packageManager = useUiStore((s) => s.packageManager)
  const upgradeCommand = alert.fixedVersion
    ? formatUpgradeCommand(alert.affectedPackage, alert.fixedVersion, packageManager)
    : null

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5} flexWrap="wrap" useFlexGap>
        <SeverityBadge severity={alert.severity} />
        <Typography variant="body1" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
          {alert.title}
        </Typography>
        {urgency && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {URGENCY_LABELS[urgency]}
          </Typography>
        )}
        <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
          {alert.publishedAt}
        </Typography>
        <SnoozeAlertButton alertKey={securityAlertSnoozeKey(alert.id)} />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Package
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: monoFont }}>
            {alert.affectedPackage}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Current
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: monoFont }}>
            {currentVersion?.trim() || 'Not configured'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Fixed in
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: monoFont, color: alert.fixedVersion ? 'primary.main' : 'text.primary' }}
          >
            {alert.fixedVersion ?? 'No fix listed'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Action
          </Typography>
          <Typography variant="body2" sx={{ color: 'primary.main' }}>
            {alert.actionNeeded}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: upgradeCommand ? 0 : undefined }}>
        {alert.summary.whyCare}
      </Typography>

      {upgradeCommand && <UpgradeCommandRow command={upgradeCommand} />}

      <Link
        href={alert.sourceUrl}
        target="_blank"
        rel="noopener"
        onClick={(e) => e.stopPropagation()}
        sx={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1 }}
      >
        View advisory <OpenInNewIcon sx={{ fontSize: 12 }} />
      </Link>
    </>
  )
}
