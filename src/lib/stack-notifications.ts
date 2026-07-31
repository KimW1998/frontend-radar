import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import type { DashboardData } from '@/types'
import { upgradePlanHref } from '@/lib/upgrade-plan-links'
import { NODE_ISSUE_FOCUS_ID } from '@/lib/issue-focus'

export interface NotificationIssueLink {
  path: string
  label: string
}

export interface StackNotificationPayload {
  title: string
  body: string
  fingerprint: string
  issueLink: NotificationIssueLink
}

export function dashboardIssuePath(focus: string, sectionId: string): string {
  return `/?focus=${encodeURIComponent(focus)}#${sectionId}`
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
      issueLink: {
        path: dashboardIssuePath(alert.id, DASHBOARD_SECTIONS.security.id),
        label: 'View vulnerability in Frontend Radar',
      },
    }
  }

  const high = data.securityAlerts.filter((alert) => alert.severity === 'high')
  if (high.length > 0) {
    const alert = high[0]!
    return {
      title: `High severity vulnerability${projectName ? ` — ${projectName}` : ''}`,
      body: `${alert.affectedPackage}: ${alert.title}`,
      fingerprint: 'high-security',
      issueLink: {
        path: dashboardIssuePath(alert.id, DASHBOARD_SECTIONS.security.id),
        label: 'View vulnerability in Frontend Radar',
      },
    }
  }

  const major = data.dependencies.filter((dep) => dep.riskLevel === 'major')
  if (major.length > 0) {
    const dep = major[0]!
    return {
      title: `Major upgrade available${projectName ? ` — ${projectName}` : ''}`,
      body: `${dep.name} can upgrade to ${dep.recommendedVersion}`,
      fingerprint: 'major-upgrade',
      issueLink: {
        path: dep.npmPackage ? upgradePlanHref(dep.npmPackage) : dashboardIssuePath(dep.id, DASHBOARD_SECTIONS.dependencies.id),
        label: dep.npmPackage ? 'View upgrade plan' : 'View package in Frontend Radar',
      },
    }
  }

  if (data.nodeStatus.status === 'end-of-life') {
    return {
      title: `Node.js end of life${projectName ? ` — ${projectName}` : ''}`,
      body: `Upgrade to Node ${data.nodeStatus.latestLts.version} LTS`,
      fingerprint: 'node-eol',
      issueLink: {
        path: dashboardIssuePath(NODE_ISSUE_FOCUS_ID, DASHBOARD_SECTIONS.node.id),
        label: 'View Node.js status in Frontend Radar',
      },
    }
  }

  const securityDeps = data.dependencies.filter((dep) => dep.riskLevel === 'security')
  if (securityDeps.length > 0) {
    const dep = securityDeps[0]!
    return {
      title: `Vulnerable package detected${projectName ? ` — ${projectName}` : ''}`,
      body: `${dep.name} has known security issues`,
      fingerprint: 'security-dep',
      issueLink: {
        path: dashboardIssuePath(dep.id, DASHBOARD_SECTIONS.dependencies.id),
        label: 'View package in Frontend Radar',
      },
    }
  }

  return null
}

export function buildNotificationUrl(siteOrigin: string, issuePath: string): string {
  return new URL(issuePath, siteOrigin).toString()
}

export function buildSlackMessageText(
  payload: StackNotificationPayload,
  siteOrigin?: string,
): string {
  const lines = [`*${payload.title}*`, payload.body]
  if (siteOrigin) {
    lines.push(
      `<${buildNotificationUrl(siteOrigin, payload.issueLink.path)}|${payload.issueLink.label}>`,
    )
  }
  return lines.join('\n')
}
