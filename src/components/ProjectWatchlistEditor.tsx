import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { FILTER_LABELS } from '@/types'
import { getTrackedPackages } from '@/lib/watchlist'
import { useSettingsStore } from '@/stores'
import { monoFont } from '@/theme'

interface ProjectWatchlistEditorProps {
  trackedPackageIds: string[]
}

export function ProjectWatchlistEditor({ trackedPackageIds }: ProjectWatchlistEditorProps) {
  const { toggleTrackedPackage, setTrackedPackages } = useSettingsStore()
  const tracked = new Set(getTrackedPackages(trackedPackageIds).map((p) => p.id))

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {tracked.size} of {WATCHLIST_PACKAGES.length} packages monitored on the dashboard
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setTrackedPackages(WATCHLIST_PACKAGES.map((p) => p.id))}>
            Select all
          </Button>
          <Button
            size="small"
            onClick={() => setTrackedPackages([WATCHLIST_PACKAGES[0].id])}
            disabled={tracked.size <= 1}
          >
            Minimal
          </Button>
        </Stack>
      </Stack>

      <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
        {WATCHLIST_PACKAGES.map((pkg) => {
          const checked = tracked.has(pkg.id)
          return (
            <FormControlLabel
              key={pkg.id}
              control={
                <Checkbox
                  size="small"
                  checked={checked}
                  onChange={() => toggleTrackedPackage(pkg.id)}
                  disabled={checked && tracked.size <= 1}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">{pkg.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: monoFont }}>
                    {pkg.npmPackage} · {pkg.categories.map((c) => FILTER_LABELS[c]).join(', ')}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', ml: 0, mr: 0 }}
            />
          )
        })}
      </FormGroup>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
        Only checked packages appear in your dashboard and count toward setup. At least one is required.
      </Typography>
    </Box>
  )
}
