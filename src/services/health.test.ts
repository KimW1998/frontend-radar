import { describe, expect, it } from 'vitest'
import type { BreakingChange, Dependency, NodeStatus, SecurityAlert } from '@/types'
import { calculateHealthScore } from './health'

const baseSummary = {
  whatHappened: 'Change happened',
  whyCare: 'Because',
  actionRequired: 'Upgrade',
  upgradeUrgency: 'this-sprint' as const,
  readingTimeSeconds: 30,
}

function makeDep(overrides: Partial<Dependency> = {}): Dependency {
  return {
    id: 'react',
    name: 'React',
    currentVersion: '18.0.0',
    latestVersion: '19.0.0',
    recommendedVersion: '19.0.0',
    riskLevel: 'safe',
    breakingChanges: false,
    releaseNotesSummary: 'Bug fixes',
    securityIssues: 0,
    categories: ['react'],
    summary: baseSummary,
    ...overrides,
  }
}

function makeNodeStatus(status: NodeStatus['status']): NodeStatus {
  const release = {
    version: '22.0.0',
    codename: 'Jod',
    releaseDate: '2024-01-01',
    supportEndDate: '2027-01-01',
    isLts: true,
    isCurrent: true,
  }

  return {
    currentVersion: '18.0.0',
    status,
    latestLts: release,
    latestCurrent: release,
    whyUpgrade: 'Node 18 is end of life',
    newFeatures: [],
    securityImplications: 'Security patches no longer available',
    migrationEffort: 'medium',
    summary: baseSummary,
  }
}

describe('calculateHealthScore', () => {
  it('returns a high score when everything is healthy', () => {
    const score = calculateHealthScore([makeDep()], makeNodeStatus('supported'), [], [])

    expect(score.score).toBeGreaterThanOrEqual(90)
    expect(score.recommendedActions).toHaveLength(0)
  })

  it('prioritizes security alerts in recommended actions', () => {
    const dep = makeDep({ securityIssues: 2, riskLevel: 'major' })
    const alert: SecurityAlert = {
      id: 'cve-1',
      title: 'Critical XSS',
      severity: 'critical',
      affectedPackage: 'react',
      actionNeeded: 'Upgrade react immediately',
      sourceUrl: 'https://example.com',
      publishedAt: '2024-01-01',
      categories: ['react'],
      summary: baseSummary,
    }

    const score = calculateHealthScore([dep], makeNodeStatus('supported'), [], [alert])

    expect(score.score).toBeLessThan(90)
    expect(score.recommendedActions[0]?.action).toBe('Upgrade react immediately')
  })

  it('includes node upgrade when runtime is unsupported', () => {
    const score = calculateHealthScore([], makeNodeStatus('end-of-life'), [], [])

    expect(score.recommendedActions.some((a) => a.action.includes('Upgrade Node.js'))).toBe(true)
  })

  it('lowers score when breaking changes accumulate', () => {
    const breaking: BreakingChange = {
      id: 'bc-1',
      technology: 'React',
      title: 'Removed legacy API',
      whatChanged: 'API removed',
      codeExample: 'n/a',
      migrationGuidance: 'Migrate',
      version: '19.0.0',
      sourceUrl: 'https://example.com',
      categories: ['react'],
      summary: baseSummary,
    }

    const healthy = calculateHealthScore([makeDep()], makeNodeStatus('supported'), [], [])
    const withBreaking = calculateHealthScore(
      [makeDep()],
      makeNodeStatus('supported'),
      [breaking, breaking, breaking],
      [],
    )

    expect(withBreaking.score).toBeLessThan(healthy.score)
  })
})
