import { describe, expect, it } from 'vitest'
import { formatUpgradeCommand, needsDependencyUpgrade } from './upgrade-command'

describe('formatUpgradeCommand', () => {
  it('formats npm install commands', () => {
    expect(formatUpgradeCommand('react', '19.0.0', 'npm')).toBe('npm install react@19.0.0')
  })

  it('formats pnpm add commands', () => {
    expect(formatUpgradeCommand('react', '19.0.0', 'pnpm')).toBe('pnpm add react@19.0.0')
  })

  it('formats yarn add commands', () => {
    expect(formatUpgradeCommand('react', '19.0.0', 'yarn')).toBe('yarn add react@19.0.0')
  })
})

describe('needsDependencyUpgrade', () => {
  it('returns false when version is missing or not configured', () => {
    expect(needsDependencyUpgrade('', '19.0.0', 'safe')).toBe(false)
    expect(needsDependencyUpgrade('Not configured', '19.0.0', 'safe')).toBe(false)
  })

  it('returns true when risk is not safe', () => {
    expect(needsDependencyUpgrade('18.0.0', '18.0.0', 'major')).toBe(true)
  })

  it('returns true when safe but versions differ', () => {
    expect(needsDependencyUpgrade('18.0.0', '19.0.0', 'safe')).toBe(true)
  })

  it('returns false when safe and versions match', () => {
    expect(needsDependencyUpgrade('19.0.0', '19.0.0', 'safe')).toBe(false)
  })
})
