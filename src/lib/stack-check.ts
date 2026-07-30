import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { parseStackImport } from '@/services/stack-import'
import { fetchNodeStatus } from '@/services/node'
import { fetchPackageVulnerabilities } from '@/services/osv'
import { calculateHealthScore } from '@/services/health'

export interface StackCheckOptions {
  cwd?: string
  packageJsonPath?: string
  lockfilePath?: string
  nodeVersion?: string
  failOnCritical?: boolean
  failOnHigh?: boolean
  failOnNodeEol?: boolean
  minHealthScore?: number
  maxVulnQueries?: number
}

export interface StackCheckResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  criticalCount: number
  highCount: number
  healthScore: number | null
  nodeStatus: string | null
}

function readOptionalFile(cwd: string, path: string | undefined): string | undefined {
  if (!path) return undefined
  const full = resolve(cwd, path)
  if (!existsSync(full)) return undefined
  return readFileSync(full, 'utf8')
}

function detectLockfile(cwd: string): string | undefined {
  for (const candidate of ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']) {
    const full = resolve(cwd, candidate)
    if (existsSync(full)) return readFileSync(full, 'utf8')
  }
  return undefined
}

function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase()
  if (!value) return defaultValue
  return value === '1' || value === 'true' || value === 'yes'
}

function envNumber(name: string): number | undefined {
  const value = process.env[name]?.trim()
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function runStackCheck(options: StackCheckOptions = {}): Promise<StackCheckResult> {
  const cwd = options.cwd ?? process.cwd()
  const packageJsonPath = options.packageJsonPath ?? 'package.json'
  const failOnCritical = options.failOnCritical ?? envFlag('FRONTEND_RADAR_FAIL_ON_CRITICAL', true)
  const failOnHigh = options.failOnHigh ?? envFlag('FRONTEND_RADAR_FAIL_ON_HIGH', false)
  const failOnNodeEol = options.failOnNodeEol ?? envFlag('FRONTEND_RADAR_FAIL_ON_NODE_EOL', true)
  const minHealthScore = options.minHealthScore ?? envNumber('FRONTEND_RADAR_MIN_HEALTH_SCORE')
  const maxVulnQueries = options.maxVulnQueries ?? 40

  const errors: string[] = []
  const warnings: string[] = []

  const packageJson = readOptionalFile(cwd, packageJsonPath)
  if (!packageJson) {
    return {
      ok: false,
      errors: [`Missing ${packageJsonPath} in ${cwd}`],
      warnings,
      criticalCount: 0,
      highCount: 0,
      healthScore: null,
      nodeStatus: null,
    }
  }

  const lockfile = options.lockfilePath
    ? readOptionalFile(cwd, options.lockfilePath)
    : detectLockfile(cwd)

  const importResult = parseStackImport([], { packageJson, lockfile })
  if (importResult.errors.length > 0) warnings.push(...importResult.errors)

  const packagesToCheck = importResult.packagesFromPackageJson
  const versionsToCheck = packagesToCheck
    .slice(0, maxVulnQueries)
    .map((item) => [item.npmPackage, item.version] as const)
  let criticalCount = 0
  let highCount = 0

  for (const [npmPackage, version] of versionsToCheck) {
    const result = await fetchPackageVulnerabilities(npmPackage, version)
    for (const vuln of result.data ?? []) {
      if (vuln.severity === 'critical') criticalCount += 1
      if (vuln.severity === 'high') highCount += 1
      const line = `${npmPackage}@${version}: ${vuln.id} (${vuln.severity}) — ${vuln.summary}`
      if (vuln.severity === 'critical' && failOnCritical) errors.push(line)
      else if (vuln.severity === 'high' && failOnHigh) errors.push(line)
      else if (vuln.severity === 'critical' || vuln.severity === 'high') warnings.push(line)
    }
  }

  const nodeVersion =
    options.nodeVersion?.trim() ||
    process.env.FRONTEND_RADAR_NODE_VERSION?.trim() ||
    importResult.nodeVersion?.trim() ||
    ''

  let nodeStatusLabel: string | null = null
  if (nodeVersion) {
    const nodeBundle = await fetchNodeStatus(nodeVersion)
    const status = nodeBundle.nodeStatus?.status ?? null
    nodeStatusLabel = status
    if (failOnNodeEol && status === 'end-of-life') {
      errors.push(`Node.js ${nodeVersion} is end-of-life`)
    } else if (failOnNodeEol && status === 'upgrade-recommended') {
      warnings.push(`Node.js ${nodeVersion} upgrade recommended`)
    }
  } else {
    warnings.push('No Node version configured — set FRONTEND_RADAR_NODE_VERSION or engines.node in package.json')
  }

  let healthScore: number | null = null
  if (minHealthScore != null && packagesToCheck.length > 0) {
    const deps = packagesToCheck.map((item) => {
      const catalog = WATCHLIST_PACKAGES.find((p) => p.npmPackage === item.npmPackage)
      return {
        id: catalog?.id ?? item.npmPackage,
        name: item.name,
        npmPackage: item.npmPackage,
        currentVersion: item.version,
        latestVersion: item.version,
        recommendedVersion: item.version,
        riskLevel: 'safe' as const,
        breakingChanges: false,
        releaseNotesSummary: '',
        securityIssues: 0,
        categories: catalog?.categories ?? (['infrastructure'] as const),
        summary: {
          whatHappened: '',
          whyCare: '',
          actionRequired: '',
          upgradeUrgency: 'backlog' as const,
          readingTimeSeconds: 0,
        },
      }
    })

    const nodeBundle = nodeVersion ? await fetchNodeStatus(nodeVersion) : { nodeStatus: null }
    healthScore = calculateHealthScore(deps, nodeBundle.nodeStatus ?? {
      currentVersion: nodeVersion || 'unknown',
      latestLts: { version: 'unknown', releaseDate: '', supportEndDate: '', isLts: true, isCurrent: false },
      latestCurrent: { version: 'unknown', releaseDate: '', supportEndDate: '', isLts: false, isCurrent: true },
      status: 'upgrade-recommended',
      whyUpgrade: '',
      newFeatures: [],
      securityImplications: '',
      migrationEffort: 'medium',
      summary: { whatHappened: '', whyCare: '', actionRequired: '', upgradeUrgency: 'backlog', readingTimeSeconds: 0 },
    }, [], []).score

    if (healthScore < minHealthScore) {
      errors.push(`Health score ${healthScore} is below minimum ${minHealthScore}`)
    }
  }

  const ok = errors.length === 0
  return { ok, errors, warnings, criticalCount, highCount, healthScore, nodeStatus: nodeStatusLabel }
}
