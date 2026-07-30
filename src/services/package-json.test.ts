import { describe, expect, it } from 'vitest'
import {
  applyPackageJsonImport,
  normalizeVersionRange,
  parsePackageJsonInput,
} from './package-json'
import { parseStackImport } from './stack-import'

describe('normalizeVersionRange', () => {
  it('extracts semver from caret ranges', () => {
    expect(normalizeVersionRange('^19.0.0')).toBe('19.0.0')
  })

  it('returns null for workspace and wildcard ranges', () => {
    expect(normalizeVersionRange('workspace:*')).toBeNull()
    expect(normalizeVersionRange('*')).toBeNull()
  })

  it('normalizes major-only ranges', () => {
    expect(normalizeVersionRange('22.x')).toBe('22.0.0')
  })
})

describe('parsePackageJsonInput', () => {
  const sample = JSON.stringify({
    dependencies: {
      react: '^19.0.0',
      'react-dom': '~19.0.0',
    },
    devDependencies: {
      typescript: '5.7.3',
      vite: '^6.1.0',
    },
    engines: {
      node: '>=20.11.0',
    },
  })

  it('extracts direct dependencies from package.json', () => {
    const result = parseStackImport([], { packageJson: sample })

    expect(result.errors).toEqual([])
    expect(result.packagesFromPackageJson.map((m) => m.npmPackage)).toEqual(
      expect.arrayContaining(['react', 'react-dom', 'typescript', 'vite']),
    )
    expect(result.nodeVersion).toBe('20.11.0')
    expect(result.enginesNode).toBe('>=20.11.0')
  })

  it('returns errors for invalid JSON', () => {
    const result = parsePackageJsonInput('{ not json')

    expect(result.matched).toEqual([])
    expect(result.errors[0]).toMatch(/Invalid package\.json/)
  })
})

describe('applyPackageJsonImport', () => {
  it('merges matched versions into existing configured versions', () => {
    const importResult = parseStackImport([], {
      packageJson: JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    })

    const next = applyPackageJsonImport({ typescript: '5.0.0' }, importResult)

    expect(next).toEqual({
      typescript: '5.0.0',
      react: '19.0.0',
    })
  })
})
