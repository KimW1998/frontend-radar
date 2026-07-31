import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { NODE_ISSUE_FOCUS_ID, resolveFocusedIssueDetail } from '@/lib/issue-focus'
import { useDetailStore } from '@/stores/detail'
import type { DashboardData, NodeStatus } from '@/types'
import type { TransitiveDependencyInsight } from '@/lib/transitive-deps'

interface UseIssueFocusDeepLinkOptions {
  stackData?: DashboardData
  nodeStatus?: NodeStatus | null
  transitiveDependencies?: TransitiveDependencyInsight[]
}

export function useIssueFocusDeepLink({
  stackData,
  nodeStatus,
  transitiveDependencies = [],
}: UseIssueFocusDeepLinkOptions) {
  const navigate = useNavigate()
  const { focus } = useSearch({ from: '/' })
  const showDetail = useDetailStore((state) => state.showDetail)
  const handledFocusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!stackData) return

    const hashFocus =
      typeof window !== 'undefined' && window.location.hash === `#${NODE_ISSUE_FOCUS_ID}`
        ? NODE_ISSUE_FOCUS_ID
        : undefined
    const effectiveFocus = focus ?? hashFocus
    if (!effectiveFocus) {
      handledFocusRef.current = null
      return
    }
    if (handledFocusRef.current === effectiveFocus) return

    const detail = resolveFocusedIssueDetail(
      effectiveFocus,
      stackData,
      nodeStatus,
      transitiveDependencies,
    )
    if (!detail) return

    handledFocusRef.current = effectiveFocus
    showDetail(detail)
    navigate({ to: '/', search: { focus: undefined }, replace: true })
  }, [focus, stackData, nodeStatus, transitiveDependencies, showDetail, navigate])
}
