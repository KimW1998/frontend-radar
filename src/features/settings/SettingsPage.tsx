import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from '@/stores'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import type { PackageJsonImportResult } from '@/services/package-json'
import { monoFont } from '@/theme'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const {
    configuredVersions,
    nodeVersion,
    setConfiguredVersion,
    setNodeVersion,
    importFromPackageJson,
  } = useSettingsStore()

  const [packageJsonInput, setPackageJsonInput] = useState('')
  const [importResult, setImportResult] = useState<PackageJsonImportResult | null>(null)
  const [showManual, setShowManual] = useState(false)

  const handleImport = () => {
    const result = importFromPackageJson(packageJsonInput)
    setImportResult(result)
    if (result.matched.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  const configuredCount = WATCHLIST_PACKAGES.filter(
    (p) => configuredVersions[p.npmPackage]?.trim(),
  ).length

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Settings
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Paste your project's package.json to auto-detect versions. The dashboard uses these for
        vulnerability checks and upgrade comparisons.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ContentPasteIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="h3">Import from package.json</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Copy your entire <code style={{ fontFamily: monoFont }}>package.json</code> and paste it
            below. We'll read <code style={{ fontFamily: monoFont }}>dependencies</code>,{' '}
            <code style={{ fontFamily: monoFont }}>devDependencies</code>, and{' '}
            <code style={{ fontFamily: monoFont }}>engines.node</code>.
          </Typography>

          <TextField
            multiline
            minRows={8}
            maxRows={16}
            fullWidth
            placeholder={`{\n  "dependencies": {\n    "react": "^19.0.0",\n    "vite": "^6.1.0"\n  },\n  "engines": {\n    "node": ">=22.14.0"\n  }\n}`}
            value={packageJsonInput}
            onChange={(e) => setPackageJsonInput(e.target.value)}
            sx={{
              mb: 2,
              '& textarea': { fontFamily: monoFont, fontSize: '0.8125rem', lineHeight: 1.5 },
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={!packageJsonInput.trim()}
            >
              Import versions
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {configuredCount}/{WATCHLIST_PACKAGES.length} packages configured
            </Typography>
          </Stack>

          {importResult && (
            <Box sx={{ mt: 2 }}>
              {importResult.errors.length > 0 && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {importResult.errors.join(' ')}
                </Alert>
              )}

              {importResult.matched.length > 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1.5 }}>
                  Imported {importResult.matched.length} package
                  {importResult.matched.length !== 1 ? 's' : ''}
                  {importResult.nodeVersion && ` · Node ${importResult.nodeVersion}`}
                </Alert>
              ) : (
                <Alert severity="error">No matching packages found in package.json.</Alert>
              )}

              {importResult.matched.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
                  {importResult.matched.map((item) => (
                    <Chip
                      key={item.npmPackage}
                      label={`${item.name} ${item.version}`}
                      size="small"
                      sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
                    />
                  ))}
                </Stack>
              )}

              {importResult.missing.length > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Not in your package.json:{' '}
                  {importResult.missing.map((m) => m.name).join(', ')}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Node.js Version
          </Typography>
          <TextField
            label="Current Node version"
            value={nodeVersion}
            onChange={(e) => setNodeVersion(e.target.value)}
            size="small"
            placeholder="e.g. 22.14.0"
            sx={{ width: 240, '& input': { fontFamily: monoFont } }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
            Auto-detected from <code style={{ fontFamily: monoFont }}>engines.node</code> or{' '}
            <code style={{ fontFamily: monoFont }}>volta.node</code> when importing.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h3">Manual overrides</Typography>
            <Button size="small" onClick={() => setShowManual((v) => !v)}>
              {showManual ? 'Hide' : 'Show'}
            </Button>
          </Stack>

          <Collapse in={showManual}>
            <Stack spacing={1.5}>
              {WATCHLIST_PACKAGES.map((pkg) => (
                <Stack key={pkg.npmPackage} direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 160, flexShrink: 0 }}>
                    <Typography variant="body2">{pkg.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: monoFont }}>
                      {pkg.npmPackage}
                    </Typography>
                  </Box>
                  <TextField
                    value={configuredVersions[pkg.npmPackage] ?? ''}
                    onChange={(e) => setConfiguredVersion(pkg.npmPackage, e.target.value)}
                    size="small"
                    placeholder="Not set"
                    sx={{ width: 200, '& input': { fontFamily: monoFont, fontSize: '0.8125rem' } }}
                  />
                </Stack>
              ))}
            </Stack>
          </Collapse>

          {!showManual && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Versions are managed via package.json import. Expand to tweak individual packages.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
