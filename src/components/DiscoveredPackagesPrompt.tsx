import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { StackImportResult } from '@/services/stack-import'
import { monoFont } from '@/theme'

interface DiscoveredPackagesPromptProps {
  importResult: StackImportResult
  onTrackPackageJsonExtras: () => void
  onTrackLockfileExtras: () => void
}

export function DiscoveredPackagesPrompt({
  importResult,
  onTrackPackageJsonExtras,
  onTrackLockfileExtras,
}: DiscoveredPackagesPromptProps) {
  const pkgJsonExtras = importResult.discoveredFromPackageJson
  const lockfileExtras = importResult.discoveredFromLockfileOnly

  if (pkgJsonExtras.length === 0 && lockfileExtras.length === 0) return null

  return (
    <Box sx={{ mt: 1.5 }}>
      {pkgJsonExtras.length > 0 && (
        <Box sx={{ mb: lockfileExtras.length > 0 ? 2 : 0 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {pkgJsonExtras.length} extra direct dependencies in{' '}
            <code style={{ fontFamily: monoFont }}>package.json</code> — add any you want to track:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1}>
            {pkgJsonExtras.slice(0, 16).map((item) => (
              <Chip
                key={item.npmPackage}
                label={`${item.npmPackage} ${item.version}`}
                size="small"
                sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
              />
            ))}
            {pkgJsonExtras.length > 16 && (
              <Chip label={`+${pkgJsonExtras.length - 16} more`} size="small" variant="outlined" />
            )}
          </Stack>
          <Button size="small" variant="outlined" onClick={onTrackPackageJsonExtras}>
            Track all from package.json ({pkgJsonExtras.length})
          </Button>
        </Box>
      )}

      {lockfileExtras.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {lockfileExtras.length} additional packages only in your lockfile (transitive / indirect)
            — track any for deeper monitoring:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1}>
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
          <Button size="small" variant="outlined" onClick={onTrackLockfileExtras}>
            Track lockfile extras ({Math.min(lockfileExtras.length, 24)})
          </Button>
        </Box>
      )}
    </Box>
  )
}
