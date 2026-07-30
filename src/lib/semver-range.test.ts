import { describe, expect, it } from 'vitest'
import { satisfiesSemverRange } from './semver-range'

describe('satisfiesSemverRange', () => {
  it('matches caret ranges', () => {
    expect(satisfiesSemverRange('19.0.0', '^19.0.0')).toBe(true)
    expect(satisfiesSemverRange('19.1.0', '^19.0.0')).toBe(true)
    expect(satisfiesSemverRange('18.3.1', '^19.0.0')).toBe(false)
  })

  it('matches greater-than-or-equal ranges', () => {
    expect(satisfiesSemverRange('18.2.0', '>=18.0.0')).toBe(true)
    expect(satisfiesSemverRange('17.9.9', '>=18.0.0')).toBe(false)
  })

  it('matches OR ranges', () => {
    expect(satisfiesSemverRange('18.3.1', '^18.0.0 || ^19.0.0')).toBe(true)
    expect(satisfiesSemverRange('19.0.0', '^18.0.0 || ^19.0.0')).toBe(true)
    expect(satisfiesSemverRange('17.0.0', '^18.0.0 || ^19.0.0')).toBe(false)
  })

  it('returns false for unconfigured versions', () => {
    expect(satisfiesSemverRange('Not configured', '^19.0.0')).toBe(false)
  })
})
