import type { Dependency, HealthScore, NodeStatus, RecommendedAction, SecurityAlert } from '@/types'
import type { BreakingChange } from '@/types'

export function calculateHealthScore(
  deps: Dependency[],
  nodeStatus: NodeStatus | null,
  breakingChanges: BreakingChange[],
  securityAlerts: SecurityAlert[],
): HealthScore {
  const securityIssues = deps.filter((d) => d.securityIssues > 0).length
  const securityScore = deps.length
    ? Math.max(0, 100 - (securityIssues / deps.length) * 100)
    : 0

  const outdated = deps.filter((d) => d.riskLevel !== 'safe').length
  const outdatedScore = deps.length
    ? Math.max(0, 100 - (outdated / deps.length) * 100)
    : 0

  const nodeScore = !nodeStatus
    ? 50
    : nodeStatus.status === 'supported'
      ? 100
      : nodeStatus.status === 'upgrade-recommended'
        ? 70
        : 30

  const breakingScore = Math.max(0, 100 - breakingChanges.length * 15)

  const score = Math.round(
    securityScore * 0.5 +
      outdatedScore * 0.25 +
      nodeScore * 0.15 +
      breakingScore * 0.1,
  )

  const recommendedActions: RecommendedAction[] = []

  for (const alert of securityAlerts.slice(0, 3)) {
    recommendedActions.push({
      action: alert.actionNeeded,
      why: alert.summary.whatHappened,
      impact: alert.severity === 'critical' || alert.severity === 'high' ? 'high' : 'low',
    })
  }

  for (const dep of deps.filter((d) => d.riskLevel === 'major' || d.riskLevel === 'recommended').slice(0, 3)) {
    if (recommendedActions.length >= 6) break
    recommendedActions.push({
      action: `Upgrade ${dep.name} to ${dep.recommendedVersion}`,
      why: dep.releaseNotesSummary,
      impact: dep.riskLevel === 'major' ? 'medium' : 'low',
    })
  }

  if (nodeStatus && nodeStatus.status !== 'supported' && recommendedActions.length < 6) {
    recommendedActions.push({
      action: `Upgrade Node.js to ${nodeStatus.latestLts.version} LTS`,
      why: nodeStatus.whyUpgrade,
      impact: nodeStatus.migrationEffort === 'high' ? 'high' : 'medium',
    })
  }

  return {
    score,
    securityWeight: securityScore * 0.5,
    outdatedWeight: outdatedScore * 0.25,
    nodeSupportWeight: nodeScore * 0.15,
    breakingChangesWeight: breakingScore * 0.1,
    recommendedActions: recommendedActions.slice(0, 6),
  }
}
