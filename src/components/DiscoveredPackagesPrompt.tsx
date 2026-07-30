import { useState } from 'react'
import { Alert, Box, Button, Chip, Collapse, Stack, Typography, alpha } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { StackImportResult } from '@/services/stack-import'
import { monoFont } from '@/theme'

interface DiscoveredPackagesPromptProps {
  importResult: StackImportResult
  onTrackLockfileExtras: () => number
}

export function DiscoveredPackagesPrompt({
  importResult,
  onTrackLockfileExtras,
}: DiscoveredPackagesPromptProps) {
  const lockfileExtras = importResult.discoveredFromLockfileOnly.slice(0, 24)
  const [trackedCount, setTrackedCount] = useState<number | null>(null)

  if (lockfileExtras.length === 0) return null

  const handleTrack = () => {
    const count = onTrackLockfileExtras()
    setTrackedCount(count)
  }

  const isDone = trackedCount !== null

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDone ? 'success.main' : 'divider',
        bgcolor: isDone
          ? (theme) => alpha(theme.palette.success.main, 0.08)
          : 'action.hover',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
      }}
    >
      <Collapse in={isDone}>
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: isDone ? 1.5 : 0 }}>
          {trackedCount === 0
            ? 'Those lockfile packages are already tracked.'
            : `Added ${trackedCount} lockfile package${trackedCount === 1 ? '' : 's'} to your watchlist with installed versions.`}
        </Alert>
      </Collapse>

      <Collapse in={!isDone}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {lockfileExtras.length} additional packages only in your lockfile (transitive / indirect)
          — track any for deeper monitoring:
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.5}>
          {lockfileExtras.slice(0, 16).map((item) => (
            <Chip
              key={item.npmPackage}
              label={`${item.npmPackage} ${item.version}`}
              size="small"
              variant="outlined"
              sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
            />
          ))}
          {lockfileExtras.length > 16 && (
            <Chip label={`+${lockfileExtras.length - 16} more`} size="small" variant="outlined" />
          )}
        </Stack>
        <Button
          size="medium"
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleTrack}
        >
          Track lockfile extras ({lockfileExtras.length})
        </Button>
      </Collapse>

      {isDone && trackedCount !== null && trackedCount > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.5 }}>
          {lockfileExtras.slice(0, 8).map((item) => (
            <Chip
              key={item.npmPackage}
              label={`${item.npmPackage} ${item.version}`}
              size="small"
              color="success"
              icon={<CheckCircleIcon />}
              sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
            />
          ))}
          {lockfileExtras.length > 8 && (
            <Chip
              label={`+${lockfileExtras.length - 8} more tracked`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Stack>
      )}
    </Box>
  )
}
