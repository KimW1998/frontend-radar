import { Alert, Button, Chip, Stack, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { FrameworkPresetMatch } from '@/lib/framework-presets'

interface FrameworkPresetBannerProps {
  match: FrameworkPresetMatch
  onTrackRecommended?: () => void
}

export function FrameworkPresetBanner({ match, onTrackRecommended }: FrameworkPresetBannerProps) {
  const { preset, matchedPackages, missingRecommended } = match

  return (
    <Alert severity="info" sx={{ mt: 2, alignItems: 'flex-start' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Detected stack: {preset.name}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        We matched {matchedPackages.length} recommended package{matchedPackages.length === 1 ? '' : 's'} from
        this preset in your import.
      </Typography>

      {matchedPackages.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
          {matchedPackages.map((pkg) => (
            <Chip key={pkg} label={pkg} size="small" color="primary" variant="outlined" />
          ))}
        </Stack>
      )}

      {missingRecommended.length > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          Common additions for this stack: {missingRecommended.join(', ')}
        </Typography>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {onTrackRecommended && (
          <Button size="small" variant="contained" onClick={onTrackRecommended}>
            Track recommended packages
          </Button>
        )}
        {preset.readingLinks.map((link) => (
          <Button key={link.path} size="small" variant="outlined" component={Link} to={link.path}>
            {link.label}
          </Button>
        ))}
      </Stack>
    </Alert>
  )
}
