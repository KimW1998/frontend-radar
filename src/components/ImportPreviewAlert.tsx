import { Alert, Box, Stack, Typography } from '@mui/material'
import type { ImportPreview } from '@/lib/import-preview'
import { formatImportPreviewSummary } from '@/lib/import-preview'
import { monoFont } from '@/theme'

interface ImportPreviewAlertProps {
  preview: ImportPreview
  severity?: 'info' | 'warning'
  title?: string
}

export function ImportPreviewAlert({
  preview,
  severity = 'info',
  title = 'Import preview',
}: ImportPreviewAlertProps) {
  if (!preview.hasChanges) {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        No changes detected — your stored stack already matches this import.
      </Alert>
    )
  }

  return (
    <Alert severity={severity} sx={{ mt: 2, alignItems: 'flex-start' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {formatImportPreviewSummary(preview)}
      </Typography>

      <Stack spacing={1} sx={{ width: '100%' }}>
        {preview.added.length > 0 && (
          <PreviewGroup
            label={`Added (${preview.added.length})`}
            items={preview.added.map((pkg) => `${pkg.npmPackage}@${pkg.version}`)}
          />
        )}
        {preview.removed.length > 0 && (
          <PreviewGroup
            label={`Removed (${preview.removed.length})`}
            items={preview.removed.map((pkg) => pkg.npmPackage)}
          />
        )}
        {preview.versionChanges.length > 0 && (
          <PreviewGroup
            label={`Version changes (${preview.versionChanges.length})`}
            items={preview.versionChanges.map(
              (item) => `${item.npmPackage}: ${item.storedVersion} → ${item.importedVersion}`,
            )}
          />
        )}
      </Stack>
    </Alert>
  )
}

function PreviewGroup({ label, items }: { label: string; items: string[] }) {
  const shown = items.slice(0, 6)
  const rest = items.length - shown.length

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Stack spacing={0.25}>
        {shown.map((item) => (
          <Typography key={item} variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
            · {item}
          </Typography>
        ))}
        {rest > 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            · and {rest} more
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
