import { z } from 'zod'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'

const PackageJsonSchema = z.object({
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  engines: z
    .object({
      node: z.string().optional(),
    })
    .optional(),
  volta: z
    .object({
      node: z.string().optional(),
    })
    .optional(),
})

export interface PackageJsonImportResult {
  matched: Array<{ name: string; npmPackage: string; version: string }>
  missing: Array<{ name: string; npmPackage: string }>
  /** Normalized semver suggestion for pre-fill */
  nodeVersion: string | null
  /** Raw engines.node or volta.node value from package.json */
  enginesNode: string | null
  errors: string[]
}

export function normalizeVersionRange(range: string): string | null {
  const trimmed = range.trim()
  if (!trimmed || trimmed === '*' || trimmed === 'latest') return null

  if (trimmed.startsWith('workspace:') || trimmed.startsWith('file:') || trimmed.startsWith('link:')) {
    return null
  }

  // Extract first semver-like x.y.z from ranges like ^1.2.3, ~1.2.3, >=1.2.3, 1.2.3-beta.1
  const match = trimmed.match(/(\d+)\.(\d+)\.(\d+)/)
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`
  }

  // Handle "22.x" or "22" style
  const majorOnly = trimmed.match(/(\d+)(?:\.x)?$/)
  if (majorOnly) {
    return `${majorOnly[1]}.0.0`
  }

  return null
}

function extractEnginesNodeRaw(pkg: z.infer<typeof PackageJsonSchema>): string | null {
  const raw = pkg.engines?.node?.trim() || pkg.volta?.node?.trim()
  return raw || null
}

function extractNodeVersion(pkg: z.infer<typeof PackageJsonSchema>): string | null {
  const candidates = [pkg.volta?.node, pkg.engines?.node].filter(Boolean) as string[]

  for (const raw of candidates) {
    const normalized = normalizeVersionRange(raw.replace(/^>=?\s*/, '').replace(/^v/, ''))
    if (normalized) return normalized
  }

  return null
}

export function parsePackageJsonInput(input: string): PackageJsonImportResult {
  const errors: string[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    return {
      matched: [],
      missing: WATCHLIST_PACKAGES.map((p) => ({ name: p.name, npmPackage: p.npmPackage })),
      nodeVersion: null,
      enginesNode: null,
      errors: ['Invalid JSON — paste your full package.json contents.'],
    }
  }

  const result = PackageJsonSchema.safeParse(parsed)
  if (!result.success) {
    return {
      matched: [],
      missing: WATCHLIST_PACKAGES.map((p) => ({ name: p.name, npmPackage: p.npmPackage })),
      nodeVersion: null,
      enginesNode: null,
      errors: ['Unrecognized package.json structure.'],
    }
  }

  const pkg = result.data
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  }

  const matched: PackageJsonImportResult['matched'] = []
  const missing: PackageJsonImportResult['missing'] = []

  for (const entry of WATCHLIST_PACKAGES) {
    const raw = allDeps[entry.npmPackage]
    if (!raw) {
      missing.push({ name: entry.name, npmPackage: entry.npmPackage })
      continue
    }

    const version = normalizeVersionRange(raw)
    if (!version) {
      missing.push({ name: entry.name, npmPackage: entry.npmPackage })
      errors.push(`Could not parse version for ${entry.npmPackage}: "${raw}"`)
      continue
    }

    matched.push({ name: entry.name, npmPackage: entry.npmPackage, version })
  }

  const nodeVersion = extractNodeVersion(pkg)
  const enginesNode = extractEnginesNodeRaw(pkg)

  return { matched, missing, nodeVersion, enginesNode, errors }
}

export function applyPackageJsonImport(
  currentVersions: Record<string, string>,
  importResult: PackageJsonImportResult,
): Record<string, string> {
  const next = { ...currentVersions }

  for (const item of importResult.matched) {
    next[item.npmPackage] = item.version
  }

  return next
}
