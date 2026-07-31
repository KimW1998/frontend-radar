import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
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
import { TrackedPackagesEditor } from '@/components/TrackedPackagesEditor'
import { GitHubSyncCard } from '@/components/GitHubSyncCard'
import { NodeVersionFields } from '@/components/NodeVersionFields'
import { ImportPreviewAlert } from '@/components/ImportPreviewAlert'
import { useDashboardData } from '@/hooks/useDashboardData'
import { getConfiguredPackageCount } from '@/lib/section-empty'
import { getTrackedPackages, hasNoTrackedPackages } from '@/lib/watchlist'
import type { ImportPreview } from '@/lib/import-preview'
import { FrameworkPresetBanner } from '@/components/FrameworkPresetBanner'
import { detectFrameworkPreset } from '@/lib/framework-presets'
import { countActiveSnoozes, pruneExpiredSnoozes } from '@/lib/alert-snooze'
import { sendSlackNotification } from '@/services/slack-notify'
import { buildSlackMessageText } from '@/lib/stack-notifications'
import { hasActiveDrift } from '@/lib/version-drift'
import { useStackNotifications } from '@/hooks/useStackNotifications'
import { PACKAGE_MANAGER_LABELS, type PackageManager } from '@/lib/upgrade-command'
import { useSettingsStore, useUiStore } from '@/stores'
import { DiscoveredPackagesPrompt } from '@/components/DiscoveredPackagesPrompt'
import type { StackImportResult } from '@/services/stack-import'
import type { GitHubImportPayload } from '@/types/stack-import-ui'
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
    importFromStack,
    previewStackImport,
    checkStackDrift,
    trackDiscoveredPackages,
    clearDriftReport,
    trackRecommendedPackages,
    clearSnooze,
  } = useSettingsStore()
  const {
    packageManager,
    setPackageManager,
    notificationsEnabled,
    setNotificationsEnabled,
    slackWebhookUrl,
    setSlackWebhookUrl,
    slackNotificationsEnabled,
    setSlackNotificationsEnabled,
  } = useUiStore()
  const { requestPermission } = useStackNotifications(undefined, activeProject?.name)

  const { stackQuery } = useDashboardData(Boolean(activeProject))
  const upgradePlan = stackQuery.data?.upgradePlan ?? []

  const [packageJsonInput, setPackageJsonInput] = useState('')
  const [lockfileInput, setLockfileInput] = useState('')
  const [importResult, setImportResult] = useState<StackImportResult | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null)
  const [slackNotice, setSlackNotice] = useState<string | null>(null)
  const [frameworkPreset, setFrameworkPreset] = useState<ReturnType<typeof detectFrameworkPreset>>(null)

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (notificationsEnabled && Notification.permission !== 'granted') {
      setNotificationsEnabled(false)
    }
  }, [notificationsEnabled, setNotificationsEnabled])

  const configuredVersions = activeProject?.configuredVersions ?? {}
  const nodeVersion = activeProject?.nodeVersion ?? ''
  const enginesNodeRequirement = activeProject?.enginesNodeRequirement ?? ''

  const handlePreviewImport = () => {
    const { preview } = previewStackImport({ packageJson: packageJsonInput, lockfile: lockfileInput })
    setImportPreview(preview)
    setImportResult(null)
  }

  const handleImport = () => {
    const result = importFromStack({ packageJson: packageJsonInput, lockfile: lockfileInput })
    setImportResult(result)
    setImportPreview(null)
    setFrameworkPreset(
      detectFrameworkPreset(result.packagesFromPackageJson.map((pkg) => pkg.npmPackage)),
    )
    if (result.packagesFromPackageJson.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  const handleGitHubImportSuccess = (result: StackImportResult, files: GitHubImportPayload) => {
    setImportResult(result)
    setFrameworkPreset(
      detectFrameworkPreset(result.packagesFromPackageJson.map((pkg) => pkg.npmPackage)),
    )
    setPackageJsonInput(files.packageJson)
    if (files.lockfile) setLockfileInput(files.lockfile)
    if (result.packagesFromPackageJson.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  const handleCheckDrift = () => {
    checkStackDrift({ packageJson: packageJsonInput, lockfile: lockfileInput })
  }

  const configuredCount = getConfiguredPackageCount(
    configuredVersions,
    activeProject?.trackedPackageIds,
    activeProject?.customPackages,
  )
  const activeSnoozes = pruneExpiredSnoozes(activeProject?.snoozedAlerts)

  const handleTestSlack = async () => {
    if (!slackWebhookUrl.trim()) {
      setSlackNotice('Add your Slack incoming webhook URL first.')
      return
    }
    try {
      await sendSlackNotification(
        slackWebhookUrl.trim(),
        buildSlackMessageText(
          {
            title: 'Frontend Radar test message',
            body: 'Slack notifications are configured correctly.',
            fingerprint: 'test',
          },
          window.location.origin,
        ),
      )
      setSlackNotice('Test message sent to Slack.')
    } catch (error) {
      setSlackNotice(error instanceof Error ? error.message : 'Could not send Slack test message.')
    }
  }

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
            sx={{ mb: 2 }}
          >
            {(Object.keys(PACKAGE_MANAGER_LABELS) as PackageManager[]).map((pm) => (
              <ToggleButton key={pm} value={pm} sx={{ fontFamily: monoFont, px: 2 }}>
                {PACKAGE_MANAGER_LABELS[pm]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={async (_, checked) => {
                  if (checked) {
                    const permission = await requestPermission()
                    if (permission === 'granted') {
                      setNotificationsEnabled(true)
                      setNotificationNotice(null)
                      return
                    }
                    setNotificationsEnabled(false)
                    if (permission === 'unsupported') {
                      setNotificationNotice('Browser notifications are not available in this environment.')
                    } else if (permission === 'denied') {
                      setNotificationNotice(
                        'Notifications are blocked. Allow them in your browser’s site settings for this page.',
                      )
                    } else {
                      setNotificationNotice('Allow notifications when your browser prompts you, then try again.')
                    }
                    return
                  }
                  setNotificationsEnabled(false)
                  setNotificationNotice(null)
                }}
              />
            }
            label="Browser notifications for critical CVEs, major upgrades, and Node EOL"
          />
          {notificationNotice && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              {notificationNotice}
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2.5, mb: 1 }}>
            Slack alerts use an incoming webhook URL from your Slack workspace.
          </Typography>
          <TextField
            size="small"
            fullWidth
            label="Slack webhook URL"
            placeholder="https://hooks.slack.com/services/..."
            value={slackWebhookUrl}
            onChange={(event) => setSlackWebhookUrl(event.target.value)}
            sx={{ mb: 1.5, '& input': { fontFamily: monoFont, fontSize: '0.8125rem' } }}
          />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={slackNotificationsEnabled}
                  onChange={(_, checked) => {
                    setSlackNotificationsEnabled(checked)
                    if (checked) setSlackNotice(null)
                  }}
                  disabled={!slackWebhookUrl.trim()}
                />
              }
              label="Send Slack messages for critical CVEs, major upgrades, and Node EOL"
            />
            <Button size="small" variant="outlined" onClick={handleTestSlack} disabled={!slackWebhookUrl.trim()}>
              Send test message
            </Button>
          </Stack>
          {slackNotice && (
            <Alert severity={slackNotice.includes('correctly') || slackNotice.includes('sent') ? 'success' : 'warning'} sx={{ mt: 1 }}>
              {slackNotice}
            </Alert>
          )}
        </CardContent>
      </Card>

      {activeProject && countActiveSnoozes(activeSnoozes) > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 1 }}>
              Snoozed alerts — {activeProject.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              These alerts are hidden from the dashboard until their snooze expires.
            </Typography>
            <Stack spacing={1}>
              {Object.entries(activeSnoozes).map(([alertKey, until]) => (
                <Stack
                  key={alertKey}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontFamily: monoFont }}>
                      {alertKey}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Until {new Date(until).toLocaleString()}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => clearSnooze(alertKey)}>
                    Restore
                  </Button>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            Your projects
          </Typography>
          <Stack spacing={1}>
            {projects.map((project) => {
              const tracked = getTrackedPackages(project.trackedPackageIds, project.customPackages).length
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
                      {tracked} tracked package{tracked === 1 ? '' : 's'}
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
              <Typography variant="h3" sx={{ mb: 1 }}>
                Tracked packages — {activeProject.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Packages come from your imported <code style={{ fontFamily: monoFont }}>package.json</code>.
                Check the ones you want on the dashboard.
              </Typography>
              <TrackedPackagesEditor
                trackedPackageIds={activeProject.trackedPackageIds}
                customPackages={activeProject.customPackages}
                upgradePlan={upgradePlan}
              />
              {hasNoTrackedPackages(activeProject.trackedPackageIds, activeProject.customPackages) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No packages are checked — the dashboard will stay empty until you select at least one package
                  to monitor.
                </Alert>
              )}
            </CardContent>
          </Card>

          <GitHubSyncCard
            projectName={activeProject.name}
            githubSync={activeProject.githubSync}
            onImportSuccess={handleGitHubImportSuccess}
          />

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ContentPasteIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="h3">Import package.json — {activeProject.name}</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Paste your project&apos;s package.json and optionally a lockfile for exact installed versions.
                Lockfile versions take precedence over package.json ranges.
              </Typography>

              <TextField
                multiline
                minRows={8}
                maxRows={16}
                fullWidth
                label="package.json"
                placeholder={`{\n  "dependencies": {\n    "react": "^19.0.0",\n    "vite": "^6.1.0"\n  },\n  "engines": {\n    "node": ">=22.14.0"\n  }\n}`}
                value={packageJsonInput}
                onChange={(e) => setPackageJsonInput(e.target.value)}
                sx={{
                  mb: 2,
                  '& textarea': { fontFamily: monoFont, fontSize: '0.8125rem', lineHeight: 1.5 },
                }}
              />

              <TextField
                multiline
                minRows={6}
                maxRows={14}
                fullWidth
                label="Lockfile (optional)"
                placeholder="Paste package-lock.json, pnpm-lock.yaml, or yarn.lock"
                value={lockfileInput}
                onChange={(e) => setLockfileInput(e.target.value)}
                sx={{
                  mb: 2,
                  '& textarea': { fontFamily: monoFont, fontSize: '0.75rem', lineHeight: 1.4 },
                }}
              />

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  onClick={handlePreviewImport}
                  disabled={!packageJsonInput.trim() && !lockfileInput.trim()}
                >
                  Preview changes
                </Button>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={!packageJsonInput.trim() && !lockfileInput.trim()}
                >
                  Apply import
                </Button>
                <Button
                  variant="text"
                  onClick={handleCheckDrift}
                  disabled={!packageJsonInput.trim() && !lockfileInput.trim()}
                >
                  Check drift only
                </Button>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {configuredCount} package{configuredCount === 1 ? '' : 's'} configured
                </Typography>
              </Stack>

              {importPreview && (
                <ImportPreviewAlert preview={importPreview} title="Changes if you apply this import" />
              )}

              {frameworkPreset && importResult && (
                <FrameworkPresetBanner
                  match={frameworkPreset}
                  onTrackRecommended={() => {
                    const tracked = trackRecommendedPackages(frameworkPreset.preset.recommendedPackages)
                    if (tracked > 0) queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                  }}
                />
              )}

              {activeProject.lastDriftReport && hasActiveDrift(activeProject.lastDriftReport) && (
                <Alert severity="warning" sx={{ mt: 2 }} action={<Button size="small" onClick={clearDriftReport}>Dismiss</Button>}>
                  {activeProject.lastDriftReport.items.length} package
                  {activeProject.lastDriftReport.items.length === 1 ? '' : 's'} differ from stored versions.
                  {' '}
                  {activeProject.lastDriftReport.items.slice(0, 3).map((item) => `${item.name} (${item.storedVersion} → ${item.importedVersion})`).join(', ')}
                </Alert>
              )}

              {importResult && (
                <Box sx={{ mt: 2 }}>
                  {importResult.errors.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 1.5 }}>
                      {importResult.errors.join(' ')}
                    </Alert>
                  )}

                  {importResult.packagesFromPackageJson.length > 0 ? (
                    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1.5 }}>
                      Tracking {importResult.packagesFromPackageJson.length} package
                      {importResult.packagesFromPackageJson.length !== 1 ? 's' : ''} from package.json
                      {importResult.nodeVersion && ` · Node ${importResult.nodeVersion}`}
                    </Alert>
                  ) : (
                    <Alert severity="error">No dependencies found in package.json.</Alert>
                  )}

                  {importResult.packagesFromPackageJson.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5, maxHeight: 240, overflow: 'auto' }}>
                      {importResult.packagesFromPackageJson.map((item) => (
                        <Chip
                          key={item.npmPackage}
                          label={`${item.npmPackage} ${item.version}`}
                          size="small"
                          sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
                        />
                      ))}
                    </Stack>
                  )}
                  {importResult.discoveredFromLockfileOnly.length > 0 ? (
                    <DiscoveredPackagesPrompt
                      importResult={importResult}
                      onTrackLockfileExtras={() => {
                        const tracked = trackDiscoveredPackages(
                          importResult.discoveredFromLockfileOnly.map((item) => ({
                            npmPackage: item.npmPackage,
                            version: item.version,
                          })),
                        )
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                        return tracked
                      }}
                    />
                  ) : null}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 1 }}>
                Node.js — {activeProject.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Track what you run locally or in CI. This is separate from what the project declares
                in <code style={{ fontFamily: monoFont }}>engines.node</code>.
              </Typography>
              <NodeVersionFields
                nodeVersion={nodeVersion}
                enginesNodeRequirement={enginesNodeRequirement}
                onNodeVersionChange={setNodeVersion}
                compact
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
                      ? 'Edit installed versions for each tracked package.'
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
                  {getTrackedPackages(activeProject.trackedPackageIds, activeProject.customPackages).map((pkg) => (
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
