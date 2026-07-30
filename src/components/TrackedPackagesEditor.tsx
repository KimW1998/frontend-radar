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

interface TrackedPackagesEditorProps {
  trackedPackageIds: string[]
  customPackages: CustomPackageEntry[]
}

export function TrackedPackagesEditor({
  trackedPackageIds,
  customPackages,
}: TrackedPackagesEditorProps) {
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
          {tracked.size} package{tracked.size === 1 ? '' : 's'} monitored
          {catalog.length === 0 ? ' — import package.json to populate this list.' : ''}
        </Typography>
        {catalog.length > 0 && (
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
        )}
      </Stack>

      {catalog.length > 0 && (
        <Stack spacing={0.5} mb={2} sx={{ maxHeight: 360, overflow: 'auto' }}>
          {catalog.map((pkg) => {
            const checked = tracked.has(pkg.id)
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
                      <Typography variant="body2">{pkg.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: monoFont }}>
                        {pkg.npmPackage}
                      </Typography>
                    </Box>
                  }
                />
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => removeCustomPackage(pkg.id)}
                  disabled={catalog.length <= 1}
                  startIcon={<DeleteOutlineIcon fontSize="small" />}
                >
                  Remove
                </Button>
              </Stack>
            )
          })}
        </Stack>
      )}

      <AddPackageForm onAdd={addCustomPackage} />
    </Box>
  )
}

function AddPackageForm({ onAdd }: { onAdd: (npmPackage: string, name?: string) => void }) {
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
        label="Add npm package manually"
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
