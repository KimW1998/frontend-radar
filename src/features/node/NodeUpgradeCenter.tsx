import { Box, Chip, Stack, Typography, useTheme } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import type { NodeStatus } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import { StatBox } from '@/components/Badges'
import { buildNodeDetail } from '@/lib/detail-builders'
import { cardSx, monoFont } from '@/theme'

interface NodeUpgradeCenterProps {
  nodeStatus: NodeStatus
}

const STATUS_CONFIG = {
  supported: { icon: <CheckCircleIcon sx={{ color: '#22C55E', fontSize: 18 }} />, label: 'Supported', color: '#22C55E' },
  'upgrade-recommended': { icon: <WarningIcon sx={{ color: '#EAB308', fontSize: 18 }} />, label: 'Upgrade Recommended', color: '#EAB308' },
  'end-of-life': { icon: <ErrorIcon sx={{ color: '#EF4444', fontSize: 18 }} />, label: 'End of Life', color: '#EF4444' },
}

const EFFORT_COLORS = { low: '#22C55E', medium: '#EAB308', high: '#EF4444' }

export function NodeUpgradeCenter({ nodeStatus }: NodeUpgradeCenterProps) {
  const theme = useTheme()
  const status = STATUS_CONFIG[nodeStatus.status]
  const nodeDetail = buildNodeDetail(nodeStatus)

  return (
    <SectionCard
      title="Node.js Upgrade Center"
      subtitle="LTS tracking, support dates, and migration guidance"
      id="node-upgrade"
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <DetailCard detail={nodeDetail} sx={{ ...cardSx(theme), p: 2.5, pr: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            {status.icon}
            <Typography variant="h3" sx={{ color: status.color }}>
              {status.label}
            </Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
            <StatBox label="Current" value={`v${nodeStatus.currentVersion}`} />
            <StatBox label="Latest LTS" value={`v${nodeStatus.latestLts.version}`} color="#22C55E" />
            <StatBox label="Latest Current" value={`v${nodeStatus.latestCurrent.version}`} color="#3B82F6" />
          </Box>

          <Stack spacing={1} mb={2}>
            <DateRow label="LTS Support Ends" date={nodeStatus.latestLts.supportEndDate} />
            <DateRow label="Current Support Ends" date={nodeStatus.latestCurrent.supportEndDate} />
          </Stack>

          <Chip
            label={`Migration: ${nodeStatus.migrationEffort} effort`}
            size="small"
            sx={{
              bgcolor: `${EFFORT_COLORS[nodeStatus.migrationEffort]}18`,
              color: EFFORT_COLORS[nodeStatus.migrationEffort],
            }}
          />
        </DetailCard>

        <Stack spacing={2}>
          <DetailCard detail={nodeDetail} sx={{ ...cardSx(theme), pr: 5 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Why Upgrade</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              {nodeStatus.whyUpgrade}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              New Features
            </Typography>
            <Stack spacing={0.5}>
              {nodeStatus.newFeatures.map((f, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={(t) => ({
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor: t.palette.primary.main,
                    opacity: 0.9,
                  })}
                >
                  {f}
                </Typography>
              ))}
            </Stack>
          </DetailCard>

          <DetailCard
            detail={{
              ...nodeDetail,
              title: 'Node.js security implications',
              body: nodeStatus.securityImplications,
            }}
            sx={{ ...cardSx(theme), pr: 5 }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Security Implications</Typography>
            <Typography variant="body2">{nodeStatus.securityImplications}</Typography>
          </DetailCard>
        </Stack>
      </Box>
    </SectionCard>
  )
}

function DateRow({ label, date }: { label: string; date: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontFamily: monoFont }}>{date}</Typography>
    </Stack>
  )
}
