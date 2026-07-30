import { describe, expect, it } from 'vitest'
import {
  compareVersions,
  isBehind,
  isMajorBump,
  maxVersion,
  normalizeVersion,
  parseVersion,
} from './semver'

describe('normalizeVersion', () => {
  it('strips v prefix and pre-release suffix', () => {
    expect(normalizeVersion('v18.2.0-beta.1')).toBe('18.2.0')
  })
})

describe('parseVersion', () => {
  it('parses dotted semver parts', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3])
  })

  it('parses partial semver strings', () => {
    expect(parseVersion('2')).toEqual([2])
  })
})

describe('compareVersions', () => {
  it('orders semver strings', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0)
    expect(compareVersions('2.1.0', '2.0.9')).toBeGreaterThan(0)
    expect(compareVersions('3.4.5', '3.4.5')).toBe(0)
  })
})

describe('isMajorBump', () => {
  it('detects major version increases', () => {
    expect(isMajorBump('17.0.0', '18.0.0')).toBe(true)
    expect(isMajorBump('18.1.0', '18.2.0')).toBe(false)
  })
})

describe('isBehind', () => {
  it('returns true when current is older than latest', () => {
    expect(isBehind('1.0.0', '1.0.1')).toBe(true)
    expect(isBehind('2.0.0', '1.9.9')).toBe(false)
  })
})

describe('maxVersion', () => {
  it('returns null for empty input', () => {
    expect(maxVersion([])).toBeNull()
  })

  it('picks the highest version', () => {
    expect(maxVersion(['1.0.0', '2.0.0', '1.9.0'])).toBe('2.0.0')
  })
})
