import { Box, LinearProgress, Stack, Typography, useTheme } from '@mui/material'
import type { HealthScore } from '@/types'
import { SectionCard } from '@/components/SectionCard'
import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import { cardSx, monoFont } from '@/theme'

interface HealthScoreWidgetProps {
  healthScore: HealthScore
  isConfigured?: boolean
}

const BREAKDOWN_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F97316']

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

export function HealthScoreWidget({ healthScore, isConfigured = true }: HealthScoreWidgetProps) {
  const theme = useTheme()
  const { score, securityWeight, outdatedWeight, nodeSupportWeight, breakingChangesWeight } = healthScore

  const breakdown = [
    { label: 'Security', weight: '50%', value: securityWeight, max: 50 },
    { label: 'Outdated', weight: '25%', value: outdatedWeight, max: 25 },
    { label: 'Node Support', weight: '15%', value: nodeSupportWeight, max: 15 },
    { label: 'Breaking Changes', weight: '10%', value: breakingChangesWeight, max: 10 },
  ]

  return (
    <SectionCard
      title={DASHBOARD_SECTIONS.healthScore.title}
      subtitle={
        isConfigured
          ? DASHBOARD_SECTIONS.healthScore.subtitle
          : 'Complete project setup for an accurate score'
      }
    >
      <Box sx={{ maxWidth: 360, mx: { xs: 'auto', md: 0 } }}>
        <Box sx={{ ...cardSx(theme), textAlign: 'center' }}>
          {isConfigured ? (
            <ScoreGauge score={score} />
          ) : (
            <Box sx={{ py: 4 }}>
              <Typography variant="h1" sx={{ color: 'text.disabled', fontFamily: monoFont, fontSize: '2.5rem' }}>
                —
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                Set up required
              </Typography>
            </Box>
          )}

          {isConfigured && (
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
          )}
        </Box>
      </Box>
    </SectionCard>
  )
}
