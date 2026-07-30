import { useEffect } from 'react'
import type { DashboardData } from '@/types'
import { useUiStore } from '@/stores'
import { useSettingsStore } from '@/stores/settings-store'

function buildNotificationFingerprint(data: DashboardData): string {
  const parts = [
    ...data.securityAlerts
      .filter((alert) => alert.severity === 'critical' || alert.severity === 'high')
      .map((alert) => `sec:${alert.id}`),
    ...data.dependencies
      .filter((dep) => dep.riskLevel === 'major' || dep.riskLevel === 'security')
      .map((dep) => `dep:${dep.id}:${dep.recommendedVersion}`),
    data.nodeStatus.status !== 'supported' ? `node:${data.nodeStatus.status}:${data.nodeStatus.latestLts.version}` : '',
  ].filter(Boolean)

  return parts.sort().join('|')
}

function buildNotificationBody(data: DashboardData): { title: string; body: string } | null {
  const critical = data.securityAlerts.filter((alert) => alert.severity === 'critical')
  if (critical.length > 0) {
    return {
      title: 'Critical security alert',
      body: critical[0]!.title,
    }
  }

  const major = data.dependencies.filter((dep) => dep.riskLevel === 'major')
  if (major.length > 0) {
    return {
      title: 'Major upgrade available',
      body: `${major[0]!.name} can upgrade to ${major[0]!.recommendedVersion}`,
    }
  }

  if (data.nodeStatus.status === 'end-of-life') {
    return {
      title: 'Node.js end of life',
      body: `Upgrade to Node ${data.nodeStatus.latestLts.version} LTS`,
    }
  }

  const securityDeps = data.dependencies.filter((dep) => dep.riskLevel === 'security')
  if (securityDeps.length > 0) {
    return {
      title: 'Vulnerable package detected',
      body: `${securityDeps[0]!.name} has known security issues`,
    }
  }

  return null
}

export type NotificationPermissionResult = 'granted' | 'denied' | 'default' | 'unsupported'

export async function requestStackNotificationPermission(): Promise<NotificationPermissionResult> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function useStackNotifications(data: DashboardData | undefined, projectName?: string) {
  const notificationsEnabled = useUiStore((s) => s.notificationsEnabled)
  const lastNotificationFingerprint = useUiStore((s) => s.lastNotificationFingerprint)
  const setLastNotificationFingerprint = useUiStore((s) => s.setLastNotificationFingerprint)
  const activeProjectId = useSettingsStore((s) => s.activeProjectId)

  useEffect(() => {
    if (!data || !notificationsEnabled || !activeProjectId) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return

    const fingerprint = `${activeProjectId}:${buildNotificationFingerprint(data)}`
    if (!fingerprint.endsWith(':') && fingerprint === lastNotificationFingerprint) return

    const payload = buildNotificationBody(data)
    if (!payload) return

    const notification = new Notification(`Frontend Radar${projectName ? ` — ${projectName}` : ''}`, {
      body: payload.body,
      tag: fingerprint,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    setLastNotificationFingerprint(fingerprint)
  }, [
    data,
    notificationsEnabled,
    lastNotificationFingerprint,
    setLastNotificationFingerprint,
    activeProjectId,
    projectName,
  ])

  return {
    requestPermission: requestStackNotificationPermission,
  }
}
