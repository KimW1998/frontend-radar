import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TRACKED_PACKAGE_IDS,
  getConfiguredPackageCountForProject,
  getTrackedPackages,
  isProjectStackConfigured,
  resolveTrackedPackageIds,
} from './watchlist'

describe('resolveTrackedPackageIds', () => {
  it('defaults to full watchlist when empty', () => {
    expect(resolveTrackedPackageIds(undefined)).toEqual(DEFAULT_TRACKED_PACKAGE_IDS)
    expect(resolveTrackedPackageIds([])).toEqual(DEFAULT_TRACKED_PACKAGE_IDS)
  })

  it('filters unknown ids', () => {
    expect(resolveTrackedPackageIds(['react', 'not-real'])).toEqual(['react'])
  })
})

describe('getTrackedPackages', () => {
  it('returns catalog entries for tracked ids', () => {
    const packages = getTrackedPackages(['react', 'typescript'])

    expect(packages.map((p) => p.id)).toEqual(['react', 'typescript'])
  })
})

describe('getConfiguredPackageCountForProject', () => {
  it('counts configured versions among tracked packages only', () => {
    const configured = { react: '19.0.0', typescript: '5.7.0', zod: '3.24.0' }

    expect(getConfiguredPackageCountForProject(configured, ['react', 'vitest'])).toBe(1)
  })
})

describe('isProjectStackConfigured', () => {
  it('is true when at least one tracked package has a version', () => {
    expect(isProjectStackConfigured({ react: '19.0.0' }, ['react'])).toBe(true)
    expect(isProjectStackConfigured({}, ['react'])).toBe(false)
  })
})
