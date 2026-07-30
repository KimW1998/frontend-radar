import { Alert, Button, Stack, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { formatDriftSummary, hasActiveDrift } from '@/lib/version-drift'
import type { DriftReport, ImportSnapshot } from '@/types/import-snapshot'
import { monoFont } from '@/theme'

interface VersionDriftBannerProps {
  driftReport?: DriftReport
  importSnapshot?: ImportSnapshot
  onDismiss?: () => void
}

export function VersionDriftBanner({ driftReport, importSnapshot, onDismiss }: VersionDriftBannerProps) {
  if (!hasActiveDrift(driftReport)) {
    if (!importSnapshot) return null

    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Last import: {new Date(importSnapshot.importedAt).toLocaleString()} ({importSnapshot.source.replace('-', ' ')}).
        Paste an updated lockfile in Settings to check for drift.
      </Alert>
    )
  }

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/settings" size="small" color="inherit">
            Review in Settings
          </Button>
          {onDismiss && (
            <Button size="small" color="inherit" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Version drift detected
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {formatDriftSummary(driftReport!)}
      </Typography>
      <Stack spacing={0.25}>
        {driftReport!.items.slice(0, 4).map((item) => (
          <Typography key={item.npmPackage} variant="caption" sx={{ fontFamily: monoFont }}>
            {item.name}: {item.storedVersion} → {item.importedVersion}
          </Typography>
        ))}
      </Stack>
    </Alert>
  )
}
