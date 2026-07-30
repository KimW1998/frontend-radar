import type { PackageCatalogEntry } from '@/data/package-catalog'
import { normalizeVersionRange } from '@/services/package-json'
import { mergeImportedVersions, parseLockfileInput, type LockfileFormat } from '@/services/lockfile'
import type { ImportSource } from '@/types/import-snapshot'

export interface StackImportMatch {
  name: string
  npmPackage: string
  version: string
}

export interface StackImportResult {
  matched: StackImportMatch[]
  missing: Array<{ name: string; npmPackage: string }>
  discovered: Array<{ npmPackage: string; version: string; name: string }>
  /** Direct package.json deps not in the built-in watchlist */
  discoveredFromPackageJson: Array<{ npmPackage: string; version: string; name: string }>
  /** Present in lockfile but not listed in package.json dependencies */
  discoveredFromLockfileOnly: Array<{ npmPackage: string; version: string; name: string }>
  importedVersions: Record<string, string>
  nodeVersion: string | null
  enginesNode: string | null
  lockfileFormat: LockfileFormat | null
  source: ImportSource
  errors: string[]
}

interface ParsePackageJsonCoreResult {
  allDeps: Record<string, string>
  nodeVersion: string | null
  enginesNode: string | null
  errors: string[]
}

function parsePackageJsonCore(input: string): ParsePackageJsonCoreResult | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object') return null

  const pkg = parsed as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    engines?: { node?: string }
    volta?: { node?: string }
  }

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  }

  const enginesNode = pkg.engines?.node?.trim() || pkg.volta?.node?.trim() || null
  let nodeVersion: string | null = null
  for (const raw of [pkg.volta?.node, pkg.engines?.node].filter(Boolean) as string[]) {
    const normalized = normalizeVersionRange(raw.replace(/^>=?\s*/, '').replace(/^v/, ''))
    if (normalized) {
      nodeVersion = normalized
      break
    }
  }

  return { allDeps: allDeps ?? {}, nodeVersion, enginesNode, errors: [] }
}

export function parseStackImport(
  packages: PackageCatalogEntry[],
  options: {
    packageJson?: string
    lockfile?: string
  },
): StackImportResult {
  const errors: string[] = []
  const packageJsonCore = options.packageJson?.trim()
    ? parsePackageJsonCore(options.packageJson)
    : null

  if (options.packageJson?.trim() && !packageJsonCore) {
    errors.push('Invalid package.json — expected JSON.')
  }

  const lockfileResult = options.lockfile?.trim() ? parseLockfileInput(options.lockfile) : null
  if (lockfileResult?.errors.length) errors.push(...lockfileResult.errors)

  const packageJsonVersions: Record<string, string> = {}
  if (packageJsonCore) {
    for (const [npmPackage, raw] of Object.entries(packageJsonCore.allDeps)) {
      const version = normalizeVersionRange(raw)
      if (version) packageJsonVersions[npmPackage] = version
      else errors.push(`Could not parse version for ${npmPackage}: "${raw}"`)
    }
  }

  const importedVersions = mergeImportedVersions(packageJsonVersions, lockfileResult?.versions ?? {})

  const matched: StackImportMatch[] = []
  const missing: Array<{ name: string; npmPackage: string }> = []

  for (const entry of packages) {
    const version = importedVersions[entry.npmPackage]
    if (!version) {
      missing.push({ name: entry.name, npmPackage: entry.npmPackage })
      continue
    }
    matched.push({ name: entry.name, npmPackage: entry.npmPackage, version })
  }

  const tracked = new Set(packages.map((pkg) => pkg.npmPackage))
  const packageJsonDepNames = new Set(Object.keys(packageJsonCore?.allDeps ?? {}))

  const discovered = Object.entries(importedVersions)
    .filter(([npmPackage]) => !tracked.has(npmPackage))
    .map(([npmPackage, version]) => ({
      npmPackage,
      version,
      name: npmPackage.replace(/^@/, '').split('/').pop() ?? npmPackage,
    }))
    .sort((a, b) => a.npmPackage.localeCompare(b.npmPackage))

  const discoveredFromPackageJson = discovered.filter((item) => packageJsonDepNames.has(item.npmPackage))
  const discoveredFromLockfileOnly = discovered.filter((item) => !packageJsonDepNames.has(item.npmPackage))

  let source: ImportSource = 'package-json'
  if (packageJsonCore && lockfileResult) source = 'combined'
  else if (lockfileResult) source = 'lockfile'

  return {
    matched,
    missing,
    discovered,
    discoveredFromPackageJson,
    discoveredFromLockfileOnly,
    importedVersions,
    nodeVersion: packageJsonCore?.nodeVersion ?? null,
    enginesNode: packageJsonCore?.enginesNode ?? null,
    lockfileFormat: lockfileResult?.format ?? null,
    source,
    errors,
  }
}

export function applyStackImportVersions(
  currentVersions: Record<string, string>,
  result: StackImportResult,
): Record<string, string> {
  const next = { ...currentVersions }
  for (const item of result.matched) {
    next[item.npmPackage] = item.version
  }
  return next
}
