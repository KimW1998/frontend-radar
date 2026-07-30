import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardRefreshOnSettingsChange } from '@/hooks/useDashboardRefreshOnSettingsChange'
import { useActiveProject } from '@/hooks/useActiveProject'
import { getConfiguredPackageCount } from '@/lib/section-empty'
import { PACKAGE_MANAGER_LABELS, type PackageManager } from '@/lib/upgrade-command'
import { useSettingsStore, useUiStore } from '@/stores'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import type { PackageJsonImportResult } from '@/services/package-json'
import { monoFont } from '@/theme'

export function SettingsPage() {
  const queryClient = useQueryClient()
  useDashboardRefreshOnSettingsChange()

  const activeProject = useActiveProject()
  const {
    projects,
    setActiveProject,
    updateProject,
    deleteProject,
    setConfiguredVersion,
    setNodeVersion,
    importFromPackageJson,
  } = useSettingsStore()
  const { packageManager, setPackageManager } = useUiStore()

  const [packageJsonInput, setPackageJsonInput] = useState('')
  const [importResult, setImportResult] = useState<PackageJsonImportResult | null>(null)
  const [showManual, setShowManual] = useState(false)

  const configuredVersions = activeProject?.configuredVersions ?? {}
  const nodeVersion = activeProject?.nodeVersion ?? ''

  const handleImport = () => {
    const result = importFromPackageJson(packageJsonInput)
    setImportResult(result)
    if (result.matched.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  const configuredCount = getConfiguredPackageCount(configuredVersions)

  if (projects.length === 0) {
    return (
      <Box sx={{ maxWidth: 560, textAlign: 'center', py: 6 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          No projects yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Add a project to track package versions and Node.js per app.
        </Typography>
        <Button variant="contained" component={Link} to="/onboarding">
          Set up your first project
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Settings
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Manage projects and configure versions for the active project.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Preferences
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Package manager used for copy-to-clipboard upgrade commands on the dashboard.
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={packageManager}
            onChange={(_, value: PackageManager | null) => {
              if (value) setPackageManager(value)
            }}
          >
            {(Object.keys(PACKAGE_MANAGER_LABELS) as PackageManager[]).map((pm) => (
              <ToggleButton key={pm} value={pm} sx={{ fontFamily: monoFont, px: 2 }}>
                {PACKAGE_MANAGER_LABELS[pm]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Your projects
          </Typography>
          <Stack spacing={1}>
            {projects.map((project) => {
              const count = getConfiguredPackageCount(project.configuredVersions)
              const isActive = project.id === activeProject?.id
              return (
                <Stack
                  key={project.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isActive ? 'primary.main' : 'divider',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {count} packages
                      {project.nodeVersion ? ` · Node ${project.nodeVersion}` : ' · Node not set'}
                    </Typography>
                  </Box>
                  {!isActive && (
                    <Button size="small" onClick={() => setActiveProject(project.id)}>
                      Switch
                    </Button>
                  )}
                  {isActive && (
                    <Chip label="Active" size="small" color="primary" variant="outlined" />
                  )}
                  <IconButton
                    size="small"
                    aria-label={`Delete ${project.name}`}
                    onClick={() => deleteProject(project.id)}
                    disabled={projects.length === 1}
                    sx={{ color: 'text.secondary' }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )
            })}
          </Stack>
          <Button component={Link} to="/onboarding?new=1" size="small" sx={{ mt: 2 }}>
            + Add another project
          </Button>
        </CardContent>
      </Card>

      {activeProject && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ContentPasteIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="h3">Import package.json — {activeProject.name}</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Paste your project&apos;s package.json to update versions for this project only.
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
                <Button variant="contained" onClick={handleImport} disabled={!packageJsonInput.trim()}>
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
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 1 }}>
                Node.js version — {activeProject.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                The version you run locally or in CI — check with{' '}
                <code style={{ fontFamily: monoFont }}>node -v</code>. This is separate from{' '}
                <code style={{ fontFamily: monoFont }}>engines.node</code> in package.json, which
                only states what the project supports.
              </Typography>
              <TextField
                label="Node version you run"
                value={nodeVersion}
                onChange={(e) => setNodeVersion(e.target.value)}
                size="small"
                placeholder="e.g. 22.14.0"
                sx={{ width: 240, '& input': { fontFamily: monoFont } }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                Stored per project in your browser — teammates track their own version separately.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={showManual ? 2 : 1}>
                <Box>
                  <Typography variant="h3" sx={{ mb: 0.5 }}>
                    Package versions
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {showManual
                      ? 'Edit installed versions for each watchlist package.'
                      : 'Imported from package.json above. Edit manually if you need to adjust a version.'}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant={showManual ? 'contained' : 'outlined'}
                  startIcon={showManual ? <CheckIcon /> : <EditIcon />}
                  onClick={() => setShowManual((v) => !v)}
                  sx={{ flexShrink: 0, ml: 2 }}
                >
                  {showManual ? 'Done editing' : 'Edit versions'}
                </Button>
              </Stack>

              <TextField
                label="Project name"
                value={activeProject.name}
                onChange={(e) => updateProject(activeProject.id, { name: e.target.value })}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />

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
                        label="Installed version"
                        value={configuredVersions[pkg.npmPackage] ?? ''}
                        onChange={(e) => setConfiguredVersion(pkg.npmPackage, e.target.value)}
                        size="small"
                        placeholder="e.g. 19.0.0"
                        sx={{ width: 200, '& input': { fontFamily: monoFont, fontSize: '0.8125rem' } }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
