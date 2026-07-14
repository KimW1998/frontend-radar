import { Box, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material'
import type { HealthScore, RecommendedAction } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { DetailCard } from '@/components/DetailCard'
import { buildRecommendedActionDetail } from '@/lib/detail-builders'
import { cardSx, monoFont } from '@/theme'

interface HealthScoreWidgetProps {
  healthScore: HealthScore
}

const BREAKDOWN_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F97316']

const IMPACT_COLORS: Record<RecommendedAction['impact'], string> = {
  low: '#22C55E',
  medium: '#EAB308',
  high: '#EF4444',
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#EAB308'
  if (score >= 40) return '#F97316'
  return '#EF4444'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Needs Attention'
  if (score >= 40) return 'At Risk'
  return 'Critical'
}

function ScoreGauge({ score }: { score: number }) {
  const theme = useTheme()
  const color = getScoreColor(score)
  const radius = 54
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const trackColor = theme.colorMode === 'dark' ? '#1F1F23' : '#E4E4E7'

  return (
    <Box sx={{ position: 'relative', width: 140, height: 140, mx: 'auto' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h1"
          sx={{ color, fontFamily: monoFont, lineHeight: 1, fontSize: '2rem' }}
        >
          {score}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25 }}>
          {getScoreLabel(score)}
        </Typography>
      </Box>
    </Box>
  )
}

export function HealthScoreWidget({ healthScore }: HealthScoreWidgetProps) {
  const theme = useTheme()
  const { score, securityWeight, outdatedWeight, nodeSupportWeight, breakingChangesWeight, recommendedActions } =
    healthScore

  const breakdown = [
    { label: 'Security', weight: '50%', value: securityWeight, max: 50 },
    { label: 'Outdated', weight: '25%', value: outdatedWeight, max: 25 },
    { label: 'Node Support', weight: '15%', value: nodeSupportWeight, max: 15 },
    { label: 'Breaking Changes', weight: '10%', value: breakingChangesWeight, max: 10 },
  ]

  return (
    <SectionCard title="Dependency Health Score" subtitle="Weighted score across your stack">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3 }}>
        <Box sx={{ ...cardSx(theme), textAlign: 'center' }}>
          <ScoreGauge score={score} />

          <Stack spacing={1.5} sx={{ mt: 2.5, textAlign: 'left' }}>
            {breakdown.map((item, i) => (
              <Box key={item.label}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {item.label}{' '}
                    <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
                      ({item.weight})
                    </Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.primary' }}>
                    {Math.round(item.value)}/{item.max}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(item.value / item.max) * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: theme.tokens.border.subtle,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      bgcolor: BREAKDOWN_COLORS[i],
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="h3" sx={{ color: 'text.primary', mb: 1.5 }}>
            Recommended Actions Today
          </Typography>
          <Stack spacing={1}>
            {recommendedActions.map((item, i) => (
              <DetailCard
                key={i}
                detail={buildRecommendedActionDetail(item, i)}
                sx={{ ...cardSx(theme), pr: 5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Typography
                    sx={{
                      color: 'primary.main',
                      fontFamily: monoFont,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, flex: 1 }}>
                    {item.action}
                  </Typography>
                  <Chip
                    label={`${item.impact} effort`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6875rem',
                      bgcolor: `${IMPACT_COLORS[item.impact]}18`,
                      color: IMPACT_COLORS[item.impact],
                      border: `1px solid ${IMPACT_COLORS[item.impact]}30`,
                    }}
                  />
                </Stack>

                <Box sx={{ pl: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Why
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.why}
                  </Typography>
                </Box>
              </DetailCard>
            ))}
          </Stack>
        </Box>
      </Box>
    </SectionCard>
  )
}
