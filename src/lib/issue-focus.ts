import { DASHBOARD_SECTIONS } from '@/data/dashboard-sections'
import {
  buildDependencyDetail,
  buildNodeDetail,
  buildSecurityDetail,
  buildTransitiveDependencyDetail,
} from '@/lib/detail-builders'
import type { TransitiveDependencyInsight } from '@/lib/transitive-deps'
import type { DashboardData, NodeStatus } from '@/types'
import type { DetailContent } from '@/types/detail'

export const NODE_ISSUE_FOCUS_ID = DASHBOARD_SECTIONS.node.id

export function resolveFocusedIssueDetail(
  focusId: string,
  data: DashboardData,
  nodeStatus?: NodeStatus | null,
  transitiveDependencies: TransitiveDependencyInsight[] = [],
): DetailContent | null {
  const alert = data.securityAlerts.find((item) => item.id === focusId)
  if (alert) return buildSecurityDetail(alert)

  const dependency = data.dependencies.find((item) => item.id === focusId)
  if (dependency) return buildDependencyDetail(dependency)

  const transitive = transitiveDependencies.find((item) => item.id === focusId)
  if (transitive) return buildTransitiveDependencyDetail(transitive)

  if (focusId === NODE_ISSUE_FOCUS_ID && nodeStatus) {
    return buildNodeDetail(nodeStatus)
  }

  return null
}
