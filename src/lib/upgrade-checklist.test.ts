import { describe, expect, it } from 'vitest'
import { buildFullUpgradeScript, buildUpgradeChecklistMarkdown } from '@/lib/upgrade-checklist'

describe('upgrade checklist helpers', () => {
  const plan = [
    {
      step: 1,
      title: 'Upgrade these packages first',
      packages: [
        {
          id: 'react',
          name: 'React',
          npmPackage: 'react',
          fromVersion: '18.2.0',
          toVersion: '19.0.0',
        },
      ],
    },
  ]

  it('builds markdown checklist', () => {
    const markdown = buildUpgradeChecklistMarkdown('Portal', plan, 'npm')
    expect(markdown).toContain('# Upgrade checklist — Portal')
    expect(markdown).toContain('npm install react@19.0.0')
  })

  it('builds full upgrade script', () => {
    expect(buildFullUpgradeScript(plan, 'pnpm')).toBe('pnpm add react@19.0.0')
  })
})
