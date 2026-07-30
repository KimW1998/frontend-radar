import { describe, expect, it } from 'vitest'
import { getConfiguredPackageCount, resolveSectionEmpty } from './section-empty'

describe('resolveSectionEmpty', () => {
  it('returns null when items are visible', () => {
    expect(resolveSectionEmpty(5, 2)).toBeNull()
  })

  it('returns filtered when total exists but filter hides all', () => {
    expect(resolveSectionEmpty(3, 0)).toBe('filtered')
  })

  it('returns not-configured when setup is required', () => {
    expect(
      resolveSectionEmpty(0, 0, { requiresConfig: true, isConfigured: false }),
    ).toBe('not-configured')
  })

  it('returns all-clear when empty but configured', () => {
    expect(resolveSectionEmpty(0, 0, { requiresConfig: true, isConfigured: true })).toBe(
      'all-clear',
    )
  })
})

describe('getConfiguredPackageCount', () => {
  it('counts only tracked packages with configured versions', () => {
    const configured = {
      react: '19.0.0',
      typescript: '5.7.0',
      zod: '3.24.0',
    }

    expect(getConfiguredPackageCount(configured, ['react', 'typescript'])).toBe(2)
    expect(getConfiguredPackageCount(configured, ['vitest'])).toBe(0)
  })
})
