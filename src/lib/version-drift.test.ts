import { describe, expect, it } from 'vitest'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { createDriftReport, detectVersionDrift } from '@/lib/version-drift'

describe('detectVersionDrift', () => {
  it('finds differences between stored and imported versions', () => {
    const items = detectVersionDrift(
      { react: '18.2.0' },
      { react: '19.0.0' },
      WATCHLIST_PACKAGES.filter((pkg) => pkg.npmPackage === 'react'),
    )

    expect(items).toHaveLength(1)
    expect(items[0]?.importedVersion).toBe('19.0.0')
  })

  it('returns empty drift when versions match', () => {
    const items = detectVersionDrift(
      { react: '19.0.0' },
      { react: '19.0.0' },
      WATCHLIST_PACKAGES.filter((pkg) => pkg.npmPackage === 'react'),
    )

    expect(items).toEqual([])
    expect(createDriftReport(items).items).toEqual([])
  })
})
