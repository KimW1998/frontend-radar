const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function snoozeUntil(days = 30): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export function isAlertSnoozed(
  alertKey: string,
  snoozedAlerts: Record<string, string> | undefined,
  now = Date.now(),
): boolean {
  const until = snoozedAlerts?.[alertKey]
  if (!until) return false
  return Date.parse(until) > now
}

export function pruneExpiredSnoozes(
  snoozedAlerts: Record<string, string> | undefined,
  now = Date.now(),
): Record<string, string> {
  if (!snoozedAlerts) return {}
  return Object.fromEntries(
    Object.entries(snoozedAlerts).filter(([, until]) => Date.parse(until) > now),
  )
}

export function countActiveSnoozes(snoozedAlerts: Record<string, string> | undefined): number {
  return Object.keys(pruneExpiredSnoozes(snoozedAlerts)).length
}

export function securityAlertSnoozeKey(alertId: string): string {
  return `sec-${alertId}`
}

export function dependencySnoozeKey(depId: string): string {
  return `dep:${depId}`
}

export const NODE_UPGRADE_SNOOZE_KEY = 'node:upgrade'
export const DEFAULT_SNOOZE_DAYS = 30
export const DEFAULT_SNOOZE_MS = THIRTY_DAYS_MS
