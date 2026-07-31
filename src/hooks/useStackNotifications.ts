import { useEffect, useMemo } from 'react'
import type { DashboardData } from '@/types'
import {
  buildNotificationFingerprint,
  buildNotificationPayload,
  buildSlackMessageText,
} from '@/lib/stack-notifications'
import { sendSlackNotification } from '@/services/slack-notify'
import { useUiStore } from '@/stores'
import { useSettingsStore } from '@/stores/settings-store'
import { isAlertSnoozed, pruneExpiredSnoozes, securityAlertSnoozeKey } from '@/lib/alert-snooze'

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
  const slackWebhookUrl = useUiStore((s) => s.slackWebhookUrl)
  const slackNotificationsEnabled = useUiStore((s) => s.slackNotificationsEnabled)
  const lastSlackNotificationFingerprint = useUiStore((s) => s.lastSlackNotificationFingerprint)
  const setLastSlackNotificationFingerprint = useUiStore((s) => s.setLastSlackNotificationFingerprint)
  const activeProjectId = useSettingsStore((s) => s.activeProjectId)
  const rawSnoozedAlerts = useSettingsStore((s) => {
    const project = s.projects.find((p) => p.id === s.activeProjectId)
    return project?.snoozedAlerts
  })
  const snoozedAlerts = useMemo(
    () => pruneExpiredSnoozes(rawSnoozedAlerts),
    [rawSnoozedAlerts],
  )

  useEffect(() => {
    if (!data || !activeProjectId) return

    const filteredData: DashboardData = {
      ...data,
      securityAlerts: data.securityAlerts.filter(
        (alert) => !isAlertSnoozed(securityAlertSnoozeKey(alert.id), snoozedAlerts),
      ),
    }

    const fingerprint = buildNotificationFingerprint(activeProjectId, filteredData)
    if (fingerprint.endsWith(':')) return

    const payload = buildNotificationPayload(filteredData, projectName)
    if (!payload) return

    if (notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if (fingerprint !== lastNotificationFingerprint) {
        const notification = new Notification(payload.title, {
          body: payload.body,
          tag: fingerprint,
        })
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
        setLastNotificationFingerprint(fingerprint)
      }
    }

    if (slackNotificationsEnabled && slackWebhookUrl.trim() && fingerprint !== lastSlackNotificationFingerprint) {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : undefined
      void sendSlackNotification(
        slackWebhookUrl.trim(),
        buildSlackMessageText(payload, siteUrl),
      )
        .then(() => setLastSlackNotificationFingerprint(fingerprint))
        .catch(() => {
          // Slack delivery failures should not break the dashboard.
        })
    }
  }, [
    data,
    notificationsEnabled,
    lastNotificationFingerprint,
    setLastNotificationFingerprint,
    slackWebhookUrl,
    slackNotificationsEnabled,
    lastSlackNotificationFingerprint,
    setLastSlackNotificationFingerprint,
    activeProjectId,
    projectName,
    snoozedAlerts,
  ])

  return {
    requestPermission: requestStackNotificationPermission,
  }
}
