import type { DashboardData } from '@/types'

export interface StackNotificationPayload {
  title: string
  body: string
  fingerprint: string
}

export function buildNotificationFingerprint(
  activeProjectId: string,
  data: DashboardData,
): string {
  const parts = [
    ...data.securityAlerts
      .filter((alert) => alert.severity === 'critical' || alert.severity === 'high')
      .map((alert) => `sec:${alert.id}`),
    ...data.dependencies
      .filter((dep) => dep.riskLevel === 'major' || dep.riskLevel === 'security')
      .map((dep) => `dep:${dep.id}:${dep.recommendedVersion}`),
    data.nodeStatus.status !== 'supported'
      ? `node:${data.nodeStatus.status}:${data.nodeStatus.latestLts.version}`
      : '',
  ].filter(Boolean)

  return `${activeProjectId}:${parts.sort().join('|')}`
}

export function buildNotificationPayload(
  data: DashboardData,
  projectName?: string,
): StackNotificationPayload | null {
  const critical = data.securityAlerts.filter((alert) => alert.severity === 'critical')
  if (critical.length > 0) {
    const alert = critical[0]!
    return {
      title: `Critical security alert${projectName ? ` — ${projectName}` : ''}`,
      body: `${alert.affectedPackage}: ${alert.title}`,
      fingerprint: 'critical-security',
    }
  }

  const high = data.securityAlerts.filter((alert) => alert.severity === 'high')
  if (high.length > 0) {
    const alert = high[0]!
    return {
      title: `High severity vulnerability${projectName ? ` — ${projectName}` : ''}`,
      body: `${alert.affectedPackage}: ${alert.title}`,
      fingerprint: 'high-security',
    }
  }

  const major = data.dependencies.filter((dep) => dep.riskLevel === 'major')
  if (major.length > 0) {
    const dep = major[0]!
    return {
      title: `Major upgrade available${projectName ? ` — ${projectName}` : ''}`,
      body: `${dep.name} can upgrade to ${dep.recommendedVersion}`,
      fingerprint: 'major-upgrade',
    }
  }

  if (data.nodeStatus.status === 'end-of-life') {
    return {
      title: `Node.js end of life${projectName ? ` — ${projectName}` : ''}`,
      body: `Upgrade to Node ${data.nodeStatus.latestLts.version} LTS`,
      fingerprint: 'node-eol',
    }
  }

  const securityDeps = data.dependencies.filter((dep) => dep.riskLevel === 'security')
  if (securityDeps.length > 0) {
    const dep = securityDeps[0]!
    return {
      title: `Vulnerable package detected${projectName ? ` — ${projectName}` : ''}`,
      body: `${dep.name} has known security issues`,
      fingerprint: 'security-dep',
    }
  }

  return null
}

export function buildSlackMessageText(
  payload: StackNotificationPayload,
  siteUrl?: string,
): string {
  const lines = [`*${payload.title}*`, payload.body]
  if (siteUrl) lines.push(`<${siteUrl}|Open Frontend Radar>`)
  return lines.join('\n')
}
