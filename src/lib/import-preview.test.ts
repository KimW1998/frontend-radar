import { describe, expect, it } from 'vitest'
import { createCustomPackage } from '@/types/custom-package'
import { computeImportPreview, formatImportPreviewSummary } from '@/lib/import-preview'

describe('computeImportPreview', () => {
  it('detects added, removed, and version changes', () => {
    const react = createCustomPackage('react', 'React')
    const vite = createCustomPackage('vite', 'Vite')

    const preview = computeImportPreview(
      {
        customPackages: [react, vite],
        configuredVersions: { react: '18.0.0', vite: '5.0.0' },
        trackedPackageIds: [react.id, vite.id],
      },
      {
        matched: [],
        missing: [],
        discovered: [],
        packagesFromPackageJson: [
          { npmPackage: 'react', version: '19.0.0', name: 'React' },
          { npmPackage: 'typescript', version: '5.8.0', name: 'TypeScript' },
        ],
        discoveredFromPackageJson: [],
        discoveredFromLockfileOnly: [],
        importedVersions: { react: '19.0.0', typescript: '5.8.0' },
        nodeVersion: null,
        enginesNode: null,
        lockfileFormat: null,
        source: 'package-json',
        errors: [],
      },
    )

    expect(preview.added.map((pkg) => pkg.npmPackage)).toEqual(['typescript'])
    expect(preview.removed.map((pkg) => pkg.npmPackage)).toEqual(['vite'])
    expect(preview.versionChanges[0]?.npmPackage).toBe('react')
    expect(preview.hasChanges).toBe(true)
    expect(formatImportPreviewSummary(preview)).toContain('1 new package')
  })
})
