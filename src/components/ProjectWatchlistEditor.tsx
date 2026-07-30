import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useState } from 'react'
import { getProjectPackageCatalog } from '@/lib/package-registry'
import { getTrackedPackages } from '@/lib/watchlist'
import { useSettingsStore } from '@/stores'
import type { CustomPackageEntry } from '@/types/custom-package'
import { monoFont } from '@/theme'

interface ProjectWatchlistEditorProps {
  trackedPackageIds: string[]
  customPackages: CustomPackageEntry[]
}

export function ProjectWatchlistEditor({ trackedPackageIds, customPackages }: ProjectWatchlistEditorProps) {
  const {
    toggleTrackedPackage,
    setTrackedPackages,
    addCustomPackage,
    removeCustomPackage,
  } = useSettingsStore()
  const catalog = getProjectPackageCatalog(customPackages)
  const tracked = new Set(getTrackedPackages(trackedPackageIds, customPackages).map((p) => p.id))

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {tracked.size} of {catalog.length} packages monitored on the dashboard
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setTrackedPackages(catalog.map((p) => p.id))}>
            Select all
          </Button>
          <Button
            size="small"
            onClick={() => setTrackedPackages([catalog[0]?.id].filter(Boolean))}
            disabled={tracked.size <= 1}
          >
            Minimal
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={0.5} mb={2}>
        {catalog.map((pkg) => {
          const checked = tracked.has(pkg.id)
          const isCustom = pkg.isCustom
          return (
            <Stack key={pkg.id} direction="row" alignItems="center" spacing={0.5}>
              <FormControlLabel
                sx={{ flex: 1, ml: 0, mr: 0 }}
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
                    <Typography variant="body2">
                      {pkg.name}
                      {isCustom ? ' (custom)' : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: monoFont }}>
                      {pkg.npmPackage}
                    </Typography>
                  </Box>
                }
              />
              {isCustom && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => removeCustomPackage(pkg.id)}
                  startIcon={<DeleteOutlineIcon fontSize="small" />}
                >
                  Remove
                </Button>
              )}
            </Stack>
          )
        })}
      </Stack>

      <CustomPackageForm onAdd={addCustomPackage} />
    </Box>
  )
}

function CustomPackageForm({ onAdd }: { onAdd: (npmPackage: string, name?: string) => void }) {
  const [value, setValue] = useState('')

  const handleAdd = () => {
    if (!value.trim()) return
    onAdd(value)
    setValue('')
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
      <TextField
        size="small"
        label="Add custom npm package"
        placeholder="@acme/design-system"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        sx={{ flex: 1, '& input': { fontFamily: monoFont } }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleAdd()
        }}
      />
      <Button size="small" variant="outlined" onClick={handleAdd} disabled={!value.trim()}>
        Add package
      </Button>
    </Stack>
  )
}
