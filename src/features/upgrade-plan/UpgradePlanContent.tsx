import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Stack, Typography } from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SettingsIcon from '@mui/icons-material/Settings'
import { Link } from '@tanstack/react-router'
import type { Dependency, UpgradePlanStep } from '@/types'
import { UpgradeCommandRow } from '@/components/UpgradeCommandRow'
import { CopyTextButton } from '@/components/CopyTextButton'
import { CopyUpgradeButton } from '@/components/CopyUpgradeButton'
import {
  buildFullUpgradeScript,
  buildUpgradeChecklistMarkdown,
} from '@/lib/upgrade-checklist'
import { formatUpgradeCommand } from '@/lib/upgrade-command'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useUpgradePlanStore, useUiStore } from '@/stores'
import { monoFont } from '@/theme'

interface UpgradePlanContentProps {
  upgradePlan: UpgradePlanStep[]
  dependencies?: Dependency[]
  highlightPackage?: string
  showBlockers?: boolean
  showProgress?: boolean
  showExport?: boolean
}

export function countUpgradePlanPackages(upgradePlan: UpgradePlanStep[]): number {
  return upgradePlan.reduce((sum, step) => sum + step.packages.length, 0)
}

export function UpgradePlanContent({
  upgradePlan,
  dependencies = [],
  highlightPackage,
  showBlockers = false,
  showProgress = false,
  showExport = false,
}: UpgradePlanContentProps) {
  const packageManager = useUiStore((s) => s.packageManager)
  const activeProject = useActiveProject()
  const projectId = activeProject?.id ?? ''
  const { togglePackageCompleted, markStepCompleted, isPackageCompleted } = useUpgradePlanStore()
  const depsWithBlockers = dependencies.filter((dep) => (dep.upgradeBlockers?.length ?? 0) > 0)
  const fullScript = buildFullUpgradeScript(upgradePlan, packageManager)
  const checklistMarkdown = activeProject
    ? buildUpgradeChecklistMarkdown(activeProject.name, upgradePlan, packageManager)
    : ''

  return (
    <Stack spacing={2}>
      {showExport && upgradePlan.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            component={Link}
            to="/settings"
            startIcon={<SettingsIcon />}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            Manage tracked packages
          </Button>
          <CopyTextButton
            size="small"
            variant="outlined"
            text={fullScript}
            disabled={!fullScript.trim()}
            snackbarMessage="Upgrade script copied"
          >
            Copy full upgrade script
          </CopyTextButton>
          <CopyTextButton
            size="small"
            variant="outlined"
            text={checklistMarkdown}
            disabled={!checklistMarkdown.trim()}
            snackbarMessage="PR checklist copied"
          >
            Copy PR checklist
          </CopyTextButton>
        </Stack>
      )}

      {showBlockers && depsWithBlockers.length > 0 && (
        <Alert severity="warning" sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Peer dependency constraints detected
          </Typography>
          {depsWithBlockers.map((dep) => (
            <Typography key={dep.id} variant="body2" sx={{ color: 'text.secondary' }}>
              · {dep.upgradeBlockers![0]?.message}
            </Typography>
          ))}
        </Alert>
      )}

      {upgradePlan.map((step) => {
        const stepCommands = step.packages.map((pkg) =>
          formatUpgradeCommand(pkg.npmPackage, pkg.toVersion, packageManager),
        )
        const combinedCommand = stepCommands.join(' && ')
        const allDone = showProgress && step.packages.every((pkg) => isPackageCompleted(projectId, pkg.id))
        const stepHighlighted = highlightPackage
          ? step.packages.some(
              (pkg) => pkg.npmPackage === highlightPackage || pkg.id === highlightPackage,
            )
          : false

        return (
          <Box
            key={step.step}
            id={stepHighlighted ? 'upgrade-plan-highlight' : undefined}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: stepHighlighted ? 'primary.main' : allDone ? 'success.main' : 'divider',
              bgcolor: stepHighlighted ? 'action.selected' : 'background.paper',
              opacity: allDone ? 0.85 : 1,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}
              mb={1.5}
            >
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <AccountTreeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {step.title}
                </Typography>
                <Chip label={`Step ${step.step}`} size="small" sx={{ height: 20, fontSize: '0.6875rem' }} />
                {allDone && <Chip label="Done" size="small" color="success" sx={{ height: 20 }} />}
              </Stack>
              <Stack direction="row" spacing={1}>
                {showProgress && (
                  <Button
                    size="small"
                    onClick={() => markStepCompleted(projectId, step.packages.map((pkg) => pkg.id))}
                  >
                    Mark step done
                  </Button>
                )}
                {stepCommands.length > 1 && (
                  <CopyUpgradeButton command={combinedCommand} label="Copy all for step" size="small" />
                )}
              </Stack>
            </Stack>

            <Stack spacing={1.5}>
              {step.packages.map((pkg) => {
                const command = formatUpgradeCommand(pkg.npmPackage, pkg.toVersion, packageManager)
                const done = showProgress && isPackageCompleted(projectId, pkg.id)
                const highlighted =
                  highlightPackage === pkg.npmPackage || highlightPackage === pkg.id
                return (
                  <Box
                    key={pkg.id}
                    sx={{
                      p: highlighted ? 1 : 0,
                      borderRadius: highlighted ? 1 : 0,
                      bgcolor: highlighted ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap mb={0.5}>
                      {showProgress && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={done}
                              onChange={() => togglePackageCompleted(projectId, pkg.id)}
                            />
                          }
                          label=""
                          sx={{ mr: 0 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, textDecoration: done ? 'line-through' : 'none' }}
                      >
                        {pkg.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
                        {pkg.fromVersion} → {pkg.toVersion}
                      </Typography>
                    </Stack>
                    <UpgradeCommandRow command={command} compact />
                  </Box>
                )
              })}
            </Stack>
          </Box>
        )
      })}

      <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
        Order is based on peer dependencies from the npm registry (e.g. React before React DOM or MUI).
        Complete each step before moving to the next when packages depend on each other.
      </Alert>
    </Stack>
  )
}

interface UpgradePlanTeaserProps {
  upgradePlan: UpgradePlanStep[]
}

export function UpgradePlanTeaser({ upgradePlan }: UpgradePlanTeaserProps) {
  if (upgradePlan.length === 0) return null

  const packageCount = countUpgradePlanPackages(upgradePlan)

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <AccountTreeIcon sx={{ fontSize: 22, color: 'primary.main', mt: 0.25 }} />
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {packageCount} package{packageCount === 1 ? '' : 's'} need ordered upgrades
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {upgradePlan.length} step{upgradePlan.length === 1 ? '' : 's'} based on peer dependencies between
            your tracked packages.
          </Typography>
        </Box>
      </Stack>
      <Button
        component={Link}
        to="/upgrade-plan"
        variant="contained"
        size="small"
        endIcon={<ArrowForwardIcon />}
        sx={{ flexShrink: 0 }}
      >
        View upgrade plan
      </Button>
    </Box>
  )
}
