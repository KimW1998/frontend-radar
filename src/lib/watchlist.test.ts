import { describe, expect, it } from 'vitest'
import { createCustomPackage } from '@/types/custom-package'
import {
  getConfiguredPackageCountForProject,
  getTrackedPackages,
  isProjectStackConfigured,
  resolveTrackedPackageIds,
} from '@/lib/watchlist'

describe('resolveTrackedPackageIds', () => {
  it('falls back to all custom packages when none selected', () => {
    const customPackages = [createCustomPackage('react'), createCustomPackage('vite')]
    expect(resolveTrackedPackageIds([], customPackages)).toEqual([
      customPackages[0].id,
      customPackages[1].id,
    ])
  })

  it('keeps only valid custom package ids', () => {
    const customPackages = [createCustomPackage('react')]
    expect(resolveTrackedPackageIds([customPackages[0].id, 'missing'], customPackages)).toEqual([
      customPackages[0].id,
    ])
  })
})

describe('getTrackedPackages', () => {
  it('returns only checked custom packages', () => {
    const customPackages = [createCustomPackage('react'), createCustomPackage('vite')]
    const packages = getTrackedPackages([customPackages[0].id], customPackages)
    expect(packages.map((pkg) => pkg.npmPackage)).toEqual(['react'])
  })
})

describe('getConfiguredPackageCountForProject', () => {
  it('counts checked packages with configured versions', () => {
    const customPackages = [createCustomPackage('react'), createCustomPackage('vite')]
    const count = getConfiguredPackageCountForProject(
      { react: '19.0.0', vite: '' },
      [customPackages[0].id, customPackages[1].id],
      customPackages,
    )
    expect(count).toBe(1)
  })
})

describe('isProjectStackConfigured', () => {
  it('is true when at least one checked package has a version', () => {
    const customPackages = [createCustomPackage('react')]
    expect(
      isProjectStackConfigured(
        { react: '19.0.0' },
        [customPackages[0].id],
        customPackages,
      ),
    ).toBe(true)
  })
})
