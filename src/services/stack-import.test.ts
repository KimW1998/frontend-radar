import { describe, expect, it } from 'vitest'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { parseStackImport } from './stack-import'

describe('parseStackImport discovered split', () => {
  it('separates package.json extras from lockfile-only packages', () => {
    const packageJson = JSON.stringify({
      dependencies: {
        react: '^19.0.0',
        lodash: '^4.17.21',
      },
    })

    const lockfile = JSON.stringify({
      name: 'demo',
      lockfileVersion: 3,
      packages: {
        '': { name: 'demo', version: '1.0.0' },
        'node_modules/react': { version: '19.0.0' },
        'node_modules/lodash': { version: '4.17.21' },
        'node_modules/ms': { version: '2.1.3' },
      },
    })

    const result = parseStackImport(WATCHLIST_PACKAGES, { packageJson, lockfile })

    expect(result.packagesFromPackageJson.map((item) => item.npmPackage)).toEqual(['lodash', 'react'])
    expect(result.discoveredFromPackageJson.map((item) => item.npmPackage)).toEqual(['lodash'])
    expect(result.discoveredFromLockfileOnly.map((item) => item.npmPackage)).toEqual(['ms'])
    expect(result.matched.some((item) => item.npmPackage === 'react')).toBe(true)
  })
})
