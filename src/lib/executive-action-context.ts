import type { Dependency, ExecutiveAction, NodeStatus, SecurityAlert } from '@/types'

export type ExecutiveActionContext =
  | { kind: 'dependency'; dep: Dependency }
  | { kind: 'security'; alert: SecurityAlert; currentVersion: string | null }
  | { kind: 'node'; nodeStatus: NodeStatus }

export function resolveExecutiveActionContext(
  action: ExecutiveAction,
  dependencies: Dependency[],
  securityAlerts: SecurityAlert[],
  nodeStatus: NodeStatus | null,
): ExecutiveActionContext | null {
  if (action.id.startsWith('sec-')) {
    const alertId = action.id.slice('sec-'.length)
    const alert = securityAlerts.find((a) => a.id === alertId)
    if (!alert) return null

    const dep = dependencies.find(
      (d) => d.npmPackage === alert.affectedPackage || d.name === alert.affectedPackage,
    )

    return {
      kind: 'security',
      alert,
      currentVersion: dep?.currentVersion ?? null,
    }
  }

  if (action.id.startsWith('major-') || action.id.startsWith('dep-')) {
    const prefix = action.id.startsWith('major-') ? 'major-' : 'dep-'
    const depId = action.id.slice(prefix.length)
    const dep = dependencies.find((d) => d.id === depId)
    if (!dep) return null
    return { kind: 'dependency', dep }
  }

  if (action.id === 'node-upgrade' && nodeStatus) {
    return { kind: 'node', nodeStatus }
  }

  return null
}
