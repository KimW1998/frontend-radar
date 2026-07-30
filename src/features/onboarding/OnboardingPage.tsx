import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import MemoryIcon from '@mui/icons-material/Memory'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { getConfiguredPackageCountForProject, getTrackedPackages } from '@/lib/watchlist'
import {
  clearOnboardingWizard,
  initialWizardDraftId,
  initialWizardNodeVersion,
  initialWizardProjectName,
  initialWizardStep,
  readOnboardingWizard,
  saveOnboardingWizard,
} from '@/lib/onboarding-wizard'
import { useActiveProject } from '@/hooks/useActiveProject'
import { DiscoveredPackagesPrompt } from '@/components/DiscoveredPackagesPrompt'
import type { StackImportResult } from '@/services/stack-import'
import type { GitHubImportPayload } from '@/types/stack-import-ui'
import { useSettingsStore } from '@/stores'
import { monoFont } from '@/theme'
import { NodeVersionFields } from '@/components/NodeVersionFields'
import { GitHubSyncDivider, GitHubSyncPanel } from '@/components/GitHubSyncPanel'
import { formatGitHubRepo } from '@/lib/parse-github-repo'

const STEPS = ['Project', 'Stack import', 'Node.js', 'Review']

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeProject = useActiveProject()
  const { createProject, setActiveProject, updateProject, importFromStack, trackDiscoveredPackages, projects } =
    useSettingsStore()

  const [step, setStep] = useState(initialWizardStep)
  const [projectName, setProjectName] = useState(initialWizardProjectName)
  const [draftProjectId, setDraftProjectId] = useState<string | null>(initialWizardDraftId)
  const [packageJsonInput, setPackageJsonInput] = useState('')
  const [lockfileInput, setLockfileInput] = useState('')
  const [importResult, setImportResult] = useState<StackImportResult | null>(null)
  const [nodeVersion, setNodeVersion] = useState(initialWizardNodeVersion)

  const workingProject = useMemo(() => {
    const id = draftProjectId ?? activeProject?.id
    if (!id) return null
    return projects.find((p) => p.id === id) ?? null
  }, [draftProjectId, activeProject, projects])

  const persistWizard = () => {
    saveOnboardingWizard({
      step,
      draftProjectId: draftProjectId ?? workingProject?.id ?? null,
      projectName,
      nodeVersion,
    })
  }

  useEffect(() => {
    persistWizard()
  }, [step, draftProjectId, projectName, nodeVersion, workingProject?.id])

  useEffect(() => {
    const saved = readOnboardingWizard()
    if (saved) {
      if (saved.step >= 1) setStep(saved.step)
      if (saved.draftProjectId) {
        setDraftProjectId(saved.draftProjectId)
        setActiveProject(saved.draftProjectId)
      }
      if (saved.projectName) setProjectName(saved.projectName)
      if (saved.nodeVersion) setNodeVersion(saved.nodeVersion)
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('new') === 'true' || params.get('new') === '1') return

    if (activeProject && !draftProjectId) {
      const count = getConfiguredPackageCountForProject(
        activeProject.configuredVersions,
        activeProject.trackedPackageIds,
        activeProject.customPackages,
      )
      if (count === 0) {
        setDraftProjectId(activeProject.id)
        setProjectName(activeProject.name)
        setNodeVersion(activeProject.nodeVersion)
        setStep(activeProject.name ? 1 : 0)
      }
    }
  }, [activeProject, draftProjectId])

  const configuredCount = workingProject
    ? getConfiguredPackageCountForProject(
        workingProject.configuredVersions,
        workingProject.trackedPackageIds,
        workingProject.customPackages,
      )
    : 0

  const trackedCount = workingProject
    ? getTrackedPackages(workingProject.trackedPackageIds, workingProject.customPackages).length
    : WATCHLIST_PACKAGES.length

  const handleCreateProject = () => {
    const name = projectName.trim() || 'My project'
    const id = createProject(name)
    setDraftProjectId(id)
    setStep(1)
  }

  const ensureWorkingProject = (): string => {
    if (workingProject) return workingProject.id
    const id = createProject(projectName.trim() || 'My project')
    setDraftProjectId(id)
    setActiveProject(id)
    return id
  }

  const handleImport = () => {
    ensureWorkingProject()
    const result = importFromStack({ packageJson: packageJsonInput, lockfile: lockfileInput })
    setImportResult(result)
    if (result.nodeVersion && !nodeVersion.trim()) setNodeVersion(result.nodeVersion)
  }

  const handleGitHubImportSuccess = (result: StackImportResult, files: GitHubImportPayload) => {
    setImportResult(result)
    setPackageJsonInput(files.packageJson)
    if (files.lockfile) setLockfileInput(files.lockfile)
    if (result.nodeVersion && !nodeVersion.trim()) setNodeVersion(result.nodeVersion)
    setStep(1)
  }

  const handlePersistBeforeGitHub = () => {
    const id = ensureWorkingProject()
    saveOnboardingWizard({
      step: 1,
      draftProjectId: id,
      projectName: projectName.trim() || workingProject?.name || 'My project',
      nodeVersion,
    })
  }

  const canImport = packageJsonInput.trim().length > 0 || lockfileInput.trim().length > 0

  const handleSaveNode = () => {
    if (!workingProject) return
    updateProject(workingProject.id, { nodeVersion: nodeVersion.trim() })
    setStep(3)
  }

  const handleFinish = () => {
    if (workingProject) {
      setActiveProject(workingProject.id)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
    clearOnboardingWizard()
    navigate({ to: '/' })
  }

  const canContinueFromImport =
    configuredCount > 0 ||
    (importResult?.packagesFromPackageJson.length ?? 0) > 0 ||
    (importResult?.discoveredFromLockfileOnly.length ?? 0) > 0

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <RocketLaunchIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h1">Set up your project</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Frontend Radar tracks dependencies per project. Each teammate can add their own projects
        with their package versions and Node runtime.
      </Typography>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <FolderOpenIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h3">Name your project</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Use a name that identifies the app or repo — e.g. &quot;Customer Portal&quot; or
              &quot;Design System&quot;.
            </Typography>
            <TextField
              fullWidth
              label="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My frontend app"
              sx={{ mb: 2 }}
              autoFocus
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleCreateProject}>
                Continue
              </Button>
              {projects.length > 0 && (
                <Button component={Link} to="/">
                  Cancel
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <ContentPasteIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h3">Import your stack</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Connect GitHub and pick your repo, or paste{' '}
              <code style={{ fontFamily: monoFont }}>package.json</code> and a lockfile manually.
            </Typography>

            <GitHubSyncPanel
              compact
              githubSync={workingProject?.githubSync}
              onBeforeConnect={handlePersistBeforeGitHub}
              onBeforeSync={ensureWorkingProject}
              onImportSuccess={handleGitHubImportSuccess}
            />

            <GitHubSyncDivider />

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
              minRows={5}
              maxRows={12}
              fullWidth
              label="Lockfile (optional)"
              placeholder="package-lock.json, pnpm-lock.yaml, or yarn.lock"
              value={lockfileInput}
              onChange={(e) => setLockfileInput(e.target.value)}
              sx={{
                mb: 2,
                '& textarea': { fontFamily: monoFont, fontSize: '0.75rem', lineHeight: 1.4 },
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Button variant="contained" onClick={handleImport} disabled={!canImport}>
                Import versions
              </Button>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {configuredCount}/{trackedCount} packages configured
              </Typography>
            </Stack>

            {importResult && (
              <Box sx={{ mb: 2 }}>
                {importResult.errors.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    {importResult.errors.join(' ')}
                  </Alert>
                )}
                {importResult.packagesFromPackageJson.length > 0 ? (
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1.5 }}>
                    Tracking {importResult.packagesFromPackageJson.length} package
                    {importResult.packagesFromPackageJson.length !== 1 ? 's' : ''} from{' '}
                    <code style={{ fontFamily: monoFont }}>package.json</code>
                    {importResult.lockfileFormat && ` · lockfile parsed (${importResult.lockfileFormat})`}
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    No dependencies found in package.json — paste your project files or import from GitHub.
                  </Alert>
                )}
                {importResult.packagesFromPackageJson.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
                    {importResult.packagesFromPackageJson.slice(0, 16).map((item) => (
                      <Chip
                        key={item.npmPackage}
                        label={`${item.name} ${item.version}`}
                        size="small"
                        sx={{ fontFamily: monoFont, fontSize: '0.75rem' }}
                      />
                    ))}
                    {importResult.packagesFromPackageJson.length > 16 && (
                      <Chip
                        label={`+${importResult.packagesFromPackageJson.length - 16} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                )}
                <DiscoveredPackagesPrompt
                  importResult={importResult}
                  onTrackLockfileExtras={() =>
                    trackDiscoveredPackages(
                      importResult.discoveredFromLockfileOnly.slice(0, 24).map((item) => ({
                        npmPackage: item.npmPackage,
                        version: item.version,
                      })),
                    )
                  }
                />
              </Box>
            )}

            <Stack direction="row" spacing={1}>
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button variant="contained" onClick={() => setStep(2)} disabled={!canContinueFromImport}>
                Continue
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <MemoryIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h3">Your Node.js version</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              We track the Node version <strong>you</strong> use — not just what the app declares.
              Run <code style={{ fontFamily: monoFont }}>node -v</code> in your terminal and enter
              that value, or use the version your CI pipeline runs.
            </Typography>
            <NodeVersionFields
              nodeVersion={nodeVersion}
              enginesNodeRequirement={workingProject?.enginesNodeRequirement}
              onNodeVersionChange={setNodeVersion}
              compact
            />
            <Stack direction="row" spacing={1}>
              <Button onClick={() => setStep(1)}>Back</Button>
              <Button variant="contained" onClick={handleSaveNode} disabled={!nodeVersion.trim()}>
                Continue
              </Button>
              <Button onClick={() => setStep(3)} sx={{ color: 'text.secondary' }}>
                Skip for now
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {step === 3 && workingProject && (
        <Card>
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Ready to track {workingProject.name}
            </Typography>
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <SummaryRow label="Project" value={workingProject.name} />
              <SummaryRow
                label="Packages configured"
                value={`${configuredCount} of ${trackedCount}`}
              />
              <SummaryRow
                label="Node you run"
                value={nodeVersion.trim() || workingProject.nodeVersion || 'Not set'}
              />
              {workingProject.enginesNodeRequirement && (
                <SummaryRow
                  label="Project requires"
                  value={workingProject.enginesNodeRequirement}
                />
              )}
              {workingProject.githubSync && (
                <SummaryRow
                  label="GitHub"
                  value={`${formatGitHubRepo(workingProject.githubSync)} (${workingProject.githubSync.branch})`}
                />
              )}
            </Stack>
            {configuredCount === 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Import at least one tracked package from package.json or a lockfile before opening the dashboard.
                Go back and paste your project files.
              </Alert>
            )}
            <Stack direction="row" spacing={1}>
              <Button onClick={() => setStep(2)}>Back</Button>
              <Button variant="contained" onClick={handleFinish} disabled={configuredCount === 0}>
                Open dashboard
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontFamily: monoFont, fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  )
}
