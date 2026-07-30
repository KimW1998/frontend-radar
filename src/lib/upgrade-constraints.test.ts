import { describe, expect, it } from 'vitest'
import { analyzeUpgradeConstraints } from './upgrade-constraints'

function makeDep(overrides: Partial<Parameters<typeof analyzeUpgradeConstraints>[0][number]> = {}) {
  return {
    id: 'react-dom',
    name: 'React DOM',
    npmPackage: 'react-dom',
    currentVersion: '18.2.0',
    recommendedVersion: '19.0.0',
    riskLevel: 'major' as const,
    peerDependencies: { react: '^19.0.0' },
    ...overrides,
  }
}

describe('analyzeUpgradeConstraints', () => {
  it('blocks a package until its watchlist peer is upgraded first', () => {
    const deps = [
      {
        id: 'react',
        name: 'React',
        npmPackage: 'react',
        currentVersion: '18.2.0',
        recommendedVersion: '19.0.0',
        riskLevel: 'major' as const,
      },
      makeDep(),
    ]

    const { enriched, upgradePlan } = analyzeUpgradeConstraints(deps)
    const reactDom = enriched.find((dep) => dep.id === 'react-dom')

    expect(reactDom?.upgradeBlockers).toHaveLength(1)
    expect(reactDom?.upgradeBlockers?.[0]?.packageName).toBe('React')
    expect(reactDom?.relatedUpgrades).toContain('React')
    expect(upgradePlan[0]?.packages.map((pkg) => pkg.id)).toContain('react')
    expect(upgradePlan.at(-1)?.packages.map((pkg) => pkg.id)).toContain('react-dom')
  })

  it('marks react and react-dom as related when either needs an upgrade', () => {
    const { enriched } = analyzeUpgradeConstraints([
      {
        id: 'react',
        name: 'React',
        npmPackage: 'react',
        currentVersion: '18.2.0',
        recommendedVersion: '19.0.0',
        riskLevel: 'major' as const,
      },
      makeDep({ currentVersion: '18.2.0', recommendedVersion: '19.0.0', peerDependencies: { react: '^19.0.0' } }),
    ])

    expect(enriched.find((dep) => dep.id === 'react')?.relatedUpgrades).toContain('React DOM')
    expect(enriched.find((dep) => dep.id === 'react-dom')?.relatedUpgrades).toContain('React')
  })

  it('returns an empty plan when nothing needs upgrading', () => {
    const { upgradePlan } = analyzeUpgradeConstraints([
      {
        id: 'react',
        name: 'React',
        npmPackage: 'react',
        currentVersion: '19.0.0',
        recommendedVersion: '19.0.0',
        riskLevel: 'safe' as const,
      },
    ])

    expect(upgradePlan).toEqual([])
  })
})
