import { Alert, Button, Stack, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { GitHubSyncChangeNotice } from '@/types/github-sync'
import { formatImportPreviewSummary } from '@/lib/import-preview'
import { monoFont } from '@/theme'

interface GitHubSyncChangeBannerProps {
  notice: GitHubSyncChangeNotice
  repoLabel: string
  onDismiss: () => void
}

export function GitHubSyncChangeBanner({ notice, repoLabel, onDismiss }: GitHubSyncChangeBannerProps) {
  if (notice.dismissed) return null

  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/settings" size="small" color="inherit">
            View in Settings
          </Button>
          <Button size="small" color="inherit" onClick={onDismiss}>
            Dismiss
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        GitHub sync updated your stack
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {repoLabel} changed since the last check ({notice.source === 'auto' ? 'automatic' : 'manual'} sync at{' '}
        {new Date(notice.detectedAt).toLocaleString()}).
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {formatImportPreviewSummary(notice.preview)}
      </Typography>
      {notice.preview.versionChanges.slice(0, 3).map((item) => (
        <Typography key={item.npmPackage} variant="caption" sx={{ fontFamily: monoFont, display: 'block' }}>
          {item.name}: {item.storedVersion} → {item.importedVersion}
        </Typography>
      ))}
    </Alert>
  )
}
