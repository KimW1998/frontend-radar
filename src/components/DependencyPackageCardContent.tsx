import { Alert, Box, Chip, Link as MuiLink, Stack, Typography } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link } from '@tanstack/react-router'
import type { Dependency, UpgradeUrgency } from '@/types'
import { RISK_COLORS, URGENCY_LABELS } from '@/types'
import { UpgradeCommandRow } from '@/components/UpgradeCommandRow'
import { RiskBadge } from '@/components/Badges'
import { formatUpgradeCommand, needsDependencyUpgrade } from '@/lib/upgrade-command'
import { useUiStore } from '@/stores'
import { monoFont } from '@/theme'

interface DependencyPackageCardContentProps {
  dep: Dependency
  urgency?: UpgradeUrgency
}

export function DependencyPackageCardContent({ dep, urgency }: DependencyPackageCardContentProps) {
  const packageManager = useUiStore((s) => s.packageManager)
  const showUpgrade =
    dep.npmPackage &&
    needsDependencyUpgrade(dep.currentVersion, dep.recommendedVersion, dep.riskLevel)
  const upgradeCommand =
    showUpgrade && dep.npmPackage
      ? formatUpgradeCommand(dep.npmPackage, dep.recommendedVersion, packageManager)
      : null

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {dep.name}
          </Typography>
          <RiskBadge level={dep.riskLevel} />
          {dep.securityIssues > 0 && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {dep.securityIssues} CVE{dep.securityIssues > 1 ? 's' : ''}
            </Typography>
          )}
          {urgency && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              · {URGENCY_LABELS[urgency]}
            </Typography>
          )}
        </Stack>
        {dep.sourceUrl && (
          <MuiLink
            href={dep.sourceUrl}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', flexShrink: 0 }}
          >
            Releases <OpenInNewIcon sx={{ fontSize: 12 }} />
          </MuiLink>
        )}
      </Stack>

      {(dep.upgradeBlockers?.length ?? 0) > 0 && (
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
          {dep.upgradeBlockers!.map((blocker) => (
            <Alert key={`${blocker.npmPackage}-${blocker.requiredRange}`} severity="warning" sx={{ py: 0.5 }}>
              <Typography variant="body2">{blocker.message}</Typography>
            </Alert>
          ))}
          <Typography
            component={Link}
            to="/upgrade-plan"
            variant="caption"
            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            onClick={(e) => e.stopPropagation()}
          >
            View suggested upgrade order →
          </Typography>
        </Stack>
      )}

      {(dep.relatedUpgrades?.length ?? 0) > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
            Upgrade together:
          </Typography>
          {dep.relatedUpgrades!.map((name) => (
            <Chip key={name} label={name} size="small" variant="outlined" sx={{ height: 22 }} />
          ))}
        </Stack>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <VersionCell label="Current" version={dep.currentVersion} />
        <VersionCell label="Latest" version={dep.latestVersion} />
        <VersionCell label="Recommended" version={dep.recommendedVersion} highlight />
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Breaking
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color:
                dep.breakingApiChanges?.length || dep.breakingChanges ? '#F97316' : '#22C55E',
            }}
          >
            {dep.breakingApiChanges?.length
              ? `${dep.breakingApiChanges.length} API change${dep.breakingApiChanges.length > 1 ? 's' : ''}`
              : dep.breakingChanges
                ? 'Major bump'
                : 'None'}
          </Typography>
        </Box>
      </Box>

      {dep.breakingApiChanges && dep.breakingApiChanges.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ color: '#F97316', fontWeight: 600, display: 'block', mb: 0.5 }}
          >
            Breaking API changes
          </Typography>
          <Stack component="ul" spacing={0.25} sx={{ m: 0, pl: 2 }}>
            {dep.breakingApiChanges.slice(0, 2).map((item, i) => (
              <Typography
                key={i}
                component="li"
                variant="caption"
                sx={{ color: 'text.secondary', lineHeight: 1.5 }}
              >
                {item}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {dep.releaseNotesSummary}
      </Typography>

      {upgradeCommand && <UpgradeCommandRow command={upgradeCommand} />}
    </>
  )
}

function VersionCell({
  label,
  version,
  highlight,
}: {
  label: string
  version: string
  highlight?: boolean
}) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontFamily: monoFont, color: highlight ? 'primary.main' : 'text.primary' }}
      >
        {version}
      </Typography>
    </Box>
  )
}

export function dependencyCardSx(dep: Dependency) {
  return {
    p: 2,
    pr: 5,
    bgcolor: 'background.paper',
    border: `1px solid ${RISK_COLORS[dep.riskLevel]}30`,
    borderLeft: `3px solid ${RISK_COLORS[dep.riskLevel]}`,
    borderRadius: 2,
    '&:hover': { borderColor: `${RISK_COLORS[dep.riskLevel]}50` },
  }
}
