import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/Search'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { getProjectPackageCatalog } from '@/lib/package-registry'
import { findUpgradeStepForPackage } from '@/lib/import-preview'
import { upgradePlanHref } from '@/lib/upgrade-plan-links'
import { getTrackedPackages } from '@/lib/watchlist'
import { useSettingsStore } from '@/stores'
import type { CustomPackageEntry } from '@/types/custom-package'
import type { UpgradePlanStep } from '@/types'
import { monoFont } from '@/theme'

interface TrackedPackagesEditorProps {
  trackedPackageIds: string[]
  customPackages: CustomPackageEntry[]
  upgradePlan?: UpgradePlanStep[]
}

export function TrackedPackagesEditor({
  trackedPackageIds,
  customPackages,
  upgradePlan = [],
}: TrackedPackagesEditorProps) {
  const {
    toggleTrackedPackage,
    setTrackedPackages,
    addCustomPackage,
    removeCustomPackage,
  } = useSettingsStore()
  const [searchQuery, setSearchQuery] = useState('')

  const catalog = getProjectPackageCatalog(customPackages)
  const tracked = new Set(getTrackedPackages(trackedPackageIds, customPackages).map((p) => p.id))

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(q) ||
        pkg.npmPackage.toLowerCase().includes(q),
    )
  }, [catalog, searchQuery])

  const filteredIds = filteredCatalog.map((pkg) => pkg.id)
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => tracked.has(id))

  const selectFiltered = () => {
    const merged = new Set([...trackedPackageIds, ...filteredIds])
    setTrackedPackages([...merged])
  }

  const clearFiltered = () => {
    const filteredSet = new Set(filteredIds)
    setTrackedPackages(trackedPackageIds.filter((id) => !filteredSet.has(id)))
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {tracked.size} package{tracked.size === 1 ? '' : 's'} monitored
          {catalog.length === 0 ? ' — import package.json to populate this list.' : ''}
        </Typography>
        {catalog.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" onClick={() => setTrackedPackages(catalog.map((p) => p.id))}>
              Select all
            </Button>
            <Button size="small" onClick={() => setTrackedPackages([])} disabled={tracked.size === 0}>
              Clear all
            </Button>
            {searchQuery.trim() && filteredCatalog.length > 0 && (
              <>
                <Button size="small" onClick={selectFiltered} disabled={allFilteredSelected}>
                  Select filtered
                </Button>
                <Button
                  size="small"
                  onClick={clearFiltered}
                  disabled={!filteredIds.some((id) => tracked.has(id))}
                >
                  Clear filtered
                </Button>
              </>
            )}
          </Stack>
        )}
      </Stack>

      {catalog.length > 0 && (
        <TextField
          size="small"
          fullWidth
          placeholder="Search packages…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{ mb: 1.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {catalog.length > 0 && (
        <Stack spacing={0.5} mb={2} sx={{ maxHeight: 360, overflow: 'auto' }}>
          {filteredCatalog.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
              No packages match &ldquo;{searchQuery.trim()}&rdquo;.
            </Typography>
          ) : (
            filteredCatalog.map((pkg) => {
              const checked = tracked.has(pkg.id)
              const upgradeStep = findUpgradeStepForPackage(upgradePlan, pkg.id, pkg.npmPackage)

              return (
                <Stack key={pkg.id} direction="row" alignItems="center" spacing={0.5}>
                  <FormControlLabel
                    sx={{ flex: 1, ml: 0, mr: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={() => toggleTrackedPackage(pkg.id)}
                      />
                    }
                    label={
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Typography variant="body2">{pkg.name}</Typography>
                          {upgradeStep !== null && (
                            <Link to={upgradePlanHref(pkg.npmPackage)}>
                              <Chip
                                label={`Upgrade step ${upgradeStep}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                clickable
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            </Link>
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: monoFont }}>
                          {pkg.npmPackage}
                        </Typography>
                      </Box>
                    }
                  />
                  {upgradeStep !== null && (
                    <Button
                      size="small"
                      component={Link}
                      to={upgradePlanHref(pkg.npmPackage)}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Plan
                    </Button>
                  )}
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
            })
          )}
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
