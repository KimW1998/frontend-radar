import { describe, expect, it } from 'vitest'
import { NODE_ISSUE_FOCUS_ID, resolveFocusedIssueDetail } from '@/lib/issue-focus'
import type { DashboardData, NodeStatus } from '@/types'

const baseData = {
  dependencies: [
    {
      id: 'dep-react',
      name: 'React',
      npmPackage: 'react',
      currentVersion: '18.0.0',
      latestVersion: '19.0.0',
      recommendedVersion: '19.0.0',
      riskLevel: 'major',
      breakingChanges: true,
      releaseNotesSummary: 'Major release',
      securityIssues: 0,
      categories: ['react'],
      summary: {
        whatHappened: 'Major release',
        whyCare: 'Features',
        actionRequired: 'Review',
        upgradeUrgency: 'next-sprint',
        readingTimeSeconds: 30,
      },
    },
  ],
  securityAlerts: [
    {
      id: 'sec-vite',
      title: 'Prototype pollution',
      affectedPackage: 'vite',
      severity: 'critical',
      publishedAt: '2024-01-01',
      actionNeeded: 'Upgrade vite',
      sourceUrl: 'https://osv.dev/vuln/1',
      categories: ['security'],
      summary: {
        whatHappened: 'Issue',
        whyCare: 'Risk',
        actionRequired: 'Upgrade',
        upgradeUrgency: 'immediate',
        readingTimeSeconds: 30,
      },
    },
  ],
} as DashboardData

const nodeStatus = {
  currentVersion: '18.0.0',
  status: 'end-of-life',
  latestLts: { version: '22.0.0', codename: 'Jod', releaseDate: '2024-04-24', isLts: true, isCurrent: true },
  latestCurrent: { version: '23.0.0', releaseDate: '2024-10-16', isLts: false, isCurrent: true },
  whyUpgrade: 'Security and support',
  newFeatures: [],
  securityImplications: 'Unsupported runtime',
  migrationEffort: 'medium',
  summary: {
    whatHappened: 'Node EOL',
    whyCare: 'Security',
    actionRequired: 'Upgrade',
    upgradeUrgency: 'immediate',
    readingTimeSeconds: 30,
  },
} as NodeStatus

describe('resolveFocusedIssueDetail', () => {
  it('opens security alert details by alert id', () => {
    const detail = resolveFocusedIssueDetail('sec-vite', baseData)
    expect(detail?.title).toBe('Prototype pollution')
    expect(detail?.subtitle).toBe('vite')
  })

  it('opens dependency details by dependency id', () => {
    const detail = resolveFocusedIssueDetail('dep-react', baseData)
    expect(detail?.title).toBe('React')
  })

  it('opens node status details for the node focus id', () => {
    const detail = resolveFocusedIssueDetail(NODE_ISSUE_FOCUS_ID, baseData, nodeStatus)
    expect(detail?.title).toContain('Node.js')
  })

  it('returns null when the focus id is unknown', () => {
    expect(resolveFocusedIssueDetail('missing', baseData)).toBeNull()
  })
})
