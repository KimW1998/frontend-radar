import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import type { PackageCatalogEntry } from '@/data/package-catalog'
import {
  applyStackImportVersions,
  parseStackImport,
  type StackImportResult,
} from '@/services/stack-import'

export interface PackageJsonImportResult {
  matched: Array<{ name: string; npmPackage: string; version: string }>
  missing: Array<{ name: string; npmPackage: string }>
  nodeVersion: string | null
  enginesNode: string | null
  errors: string[]
}

export function normalizeVersionRange(range: string): string | null {
  const trimmed = range.trim()
  if (!trimmed || trimmed === '*' || trimmed === 'latest') return null

  if (trimmed.startsWith('workspace:') || trimmed.startsWith('file:') || trimmed.startsWith('link:')) {
    return null
  }

  const match = trimmed.match(/(\d+)\.(\d+)\.(\d+)/)
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`
  }

  const majorOnly = trimmed.match(/(\d+)(?:\.x)?$/)
  if (majorOnly) {
    return `${majorOnly[1]}.0.0`
  }

  return null
}

export function parsePackageJsonInput(
  input: string,
  packages: PackageCatalogEntry[] = WATCHLIST_PACKAGES,
): PackageJsonImportResult {
  const result = parseStackImport(packages, { packageJson: input })
  return {
    matched: result.matched,
    missing: result.missing,
    nodeVersion: result.nodeVersion,
    enginesNode: result.enginesNode,
    errors: result.errors,
  }
}

export function applyPackageJsonImport(
  currentVersions: Record<string, string>,
  importResult: Pick<StackImportResult, 'matched'>,
): Record<string, string> {
  return applyStackImportVersions(currentVersions, {
    ...importResult,
    missing: [],
    discovered: [],
    importedVersions: {},
    lockfileFormat: null,
    source: 'package-json',
    errors: [],
    nodeVersion: null,
    enginesNode: null,
  })
}

export type { StackImportResult }
