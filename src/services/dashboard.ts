import type {
  BreakingChange,
  DashboardData,
  DataSourceStatus,
  Dependency,
  ExecutiveAction,
  HealthScore,
  NodeStatus,
  RiskLevel,
  SecurityAlert,
  UpgradeUrgency,
} from '@/types'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { extractBreakingApiChanges } from '@/services/breaking-changes'
import { fetchGitHubReleasesBatch, summarizeReleaseBody, toGitHubFetchResult, type GitHubReleaseInfo } from '@/services/github'
import { fetchNpmLatestDoc } from '@/services/npm'
import { fetchNodeStatus } from '@/services/node'
import { fetchPackageVulnerabilities, type PackageVulnerability } from '@/services/osv'
import { buildSummary, estimateReadingTime } from '@/services/summary'
import { toSourceStatus, type FetchResult } from '@/services/http'
import { isBehind, isMajorBump, maxVersion } from '@/services/semver'
import { calculateHealthScore } from '@/services/health'
import { fetchDataHealth } from '@/services/api'

import { getTrackedPackages } from '@/lib/watchlist'
import { applyUpgradeConstraints } from '@/lib/upgrade-constraints'
import {
  collectTransitiveDependencies,
  highestSeverity as highestTransitiveSeverity,
  selectTransitiveForVulnScan,
} from '@/lib/transitive-deps'
import type { UpgradePlanStep } from '@/types'

import type { CustomPackageEntry } from '@/types/custom-package'
import type { LockfileGraphSnapshot } from '@/types/lockfile-graph'
import type { TransitiveDependencyInsight } from '@/lib/transitive-deps'

interface DashboardInput {
  configuredVersions: Record<string, string>
  nodeVersion: string
  trackedPackageIds: string[]
  customPackages: CustomPackageEntry[]
  lockfileGraph?: LockfileGraphSnapshot
}

export interface DashboardNodeSection {
  nodeStatus: NodeStatus
  dataSources: DataSourceStatus[]
}

export interface DashboardStackSection {
  dependencies: Dependency[]
  securityAlerts: SecurityAlert[]
  breakingChanges: BreakingChange[]
  transitiveDependencies: TransitiveDependencyInsight[]
  dataSources: DataSourceStatus[]
  upgradePlan: UpgradePlanStep[]
}

function buildFallbackNodeStatus(input: DashboardInput, hasNodeVersion: boolean): NodeStatus {
  return {
    currentVersion: input.nodeVersion.trim() || 'Not configured',
    latestLts: {
      version: 'unknown',
      releaseDate: 'unknown',
      supportEndDate: 'unknown',
      isLts: true,
      isCurrent: false,
    },
    latestCurrent: {
      version: 'unknown',
      releaseDate: 'unknown',
      supportEndDate: 'unknown',
      isLts: false,
      isCurrent: true,
    },
    status: 'upgrade-recommended',
    whyUpgrade: hasNodeVersion
      ? 'Node.js dist API unreachable.'
      : 'Set your Node.js version during project setup.',
    newFeatures: [],
    securityImplications: hasNodeVersion
      ? 'Could not fetch Node release data.'
      : 'Node version is set per project — add yours in Settings or onboarding.',
    migrationEffort: 'medium',
    summary: buildSummary({
      what: hasNodeVersion
        ? 'Node.js release data could not be fetched.'
        : 'Node.js version not configured for this project.',
      why: hasNodeVersion
        ? 'Node.js dist or endoflife.date API failed.'
        : 'Different developers and CI environments may run different Node versions.',
      action: hasNodeVersion ? 'Check network and retry.' : 'Complete project setup with your Node version.',
      urgency: 'this-sprint',
    }),
  }
}

function packageDisplayName(npmPackage: string): string {
  return WATCHLIST_PACKAGES.find((p) => p.npmPackage === npmPackage)?.name ?? npmPackage
}

function highestSeverity(vulns: PackageVulnerability[]): PackageVulnerability | null {
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  if (vulns.length === 0) return null
  return [...vulns].sort((a, b) => order[a.severity] - order[b.severity])[0]
}

function determineRisk(
  current: string,
  latest: string,
  vulnCount: number,
): RiskLevel {
  if (!current) return 'safe'
  if (vulnCount > 0) return 'security'
  if (isMajorBump(current, latest)) return 'major'
  if (isBehind(current, latest)) return 'recommended'
  return 'safe'
}

function determineUrgency(risk: RiskLevel, vulnCount: number): UpgradeUrgency {
  if (vulnCount > 0) return 'immediate'
  if (risk === 'major') return 'next-sprint'
  if (risk === 'recommended') return 'this-sprint'
  return 'backlog'
}

async function buildDependency(
  pkg: (typeof WATCHLIST_PACKAGES)[number],
  configuredVersions: Record<string, string>,
  githubBatch: Awaited<ReturnType<typeof fetchGitHubReleasesBatch>>,
): Promise<{
  dependency: Dependency | null
  vulns: PackageVulnerability[]
  githubResult: FetchResult<GitHubReleaseInfo> | null
}> {
  const currentVersion = configuredVersions[pkg.npmPackage]?.trim() || ''

  const [npmResult, vulnResult] = await Promise.all([
    fetchNpmLatestDoc(pkg.npmPackage),
    currentVersion
      ? fetchPackageVulnerabilities(pkg.npmPackage, currentVersion)
      : Promise.resolve({
          data: [] as PackageVulnerability[],
          source: 'OSV',
          endpoint: 'skipped',
          status: 'unavailable' as const,
          itemCount: 0,
          error: 'Set current version in Settings to check vulnerabilities',
        }),
  ])

  const githubResult = pkg.githubRepo ? toGitHubFetchResult(pkg.githubRepo, githubBatch) : null

  if (!npmResult.data) return { dependency: null, vulns: [], githubResult: githubResult ?? null }

  const latestVersion = npmResult.data.version
  const vulns = vulnResult.data ?? []
  const fixedVersions = vulns.map((v) => v.fixedVersion).filter((v): v is string => Boolean(v))
  const recommendedVersion = maxVersion([...fixedVersions, latestVersion]) ?? latestVersion
  const riskLevel = determineRisk(currentVersion, latestVersion, vulns.length)
  const releaseNotes = githubResult?.data
    ? summarizeReleaseBody(githubResult.data.body)
    : 'GitHub release notes unavailable (no repo mapped or API error).'
  const releaseBody = githubResult?.data?.body ?? ''
  const breakingApiChanges = extractBreakingApiChanges(releaseBody)

  const topVuln = highestSeverity(vulns)
  const urgency = determineUrgency(riskLevel, vulns.length)

  const dependency: Dependency = {
    id: pkg.id,
    name: pkg.name,
    npmPackage: pkg.npmPackage,
    currentVersion: currentVersion || 'Not configured',
    latestVersion,
    recommendedVersion,
    riskLevel,
    breakingChanges: currentVersion ? isMajorBump(currentVersion, latestVersion) : false,
    breakingApiChanges: breakingApiChanges.length > 0 ? breakingApiChanges : undefined,
    releaseNotesSummary: releaseNotes,
    releaseNotesFull: githubResult?.data?.body?.trim() || undefined,
    releasePublishedAt: githubResult?.data?.publishedAt?.slice(0, 10),
    securityIssues: vulns.length,
    categories: pkg.categories,
    vulnerabilities: vulns.map((v) => ({
      id: v.id,
      summary: v.summary,
      severity: v.severity,
      fixedVersion: v.fixedVersion,
      details: v.details,
    })),
    sourceUrl: githubResult?.data?.url ?? `https://www.npmjs.com/package/${pkg.npmPackage}`,
    peerDependencies: npmResult.data.peerDependencies,
    summary: buildSummary(
      {
        what: vulns.length
          ? `${vulns.length} known vulnerability(s) affect ${pkg.name}${currentVersion ? ` below fixed versions` : ''}.`
          : currentVersion && isBehind(currentVersion, latestVersion)
            ? `${pkg.name} ${currentVersion} is behind latest ${latestVersion}.`
            : `${pkg.name} is at latest (${latestVersion}).`,
        why: topVuln
          ? topVuln.summary
          : currentVersion && isMajorBump(currentVersion, latestVersion)
            ? 'Major version bump may include breaking API changes.'
            : 'Staying current reduces security and compatibility risk.',
        action: vulns.length
          ? `Upgrade to ${recommendedVersion}${topVuln?.fixedVersion ? ` (fixes ${topVuln.id})` : ''}.`
          : currentVersion && isBehind(currentVersion, latestVersion)
            ? `Upgrade to ${recommendedVersion}.`
            : 'No action required.',
        urgency,
      },
      estimateReadingTime(releaseNotes, topVuln?.summary ?? ''),
    ),
  }

  return { dependency, vulns, githubResult }
}

function buildSecurityAlerts(
  pkg: (typeof WATCHLIST_PACKAGES)[number],
  vulns: PackageVulnerability[],
): SecurityAlert[] {
  return vulns.map((vuln) => ({
    id: `${pkg.id}-${vuln.id}`,
    title: vuln.summary,
    severity: vuln.severity,
    affectedPackage: pkg.npmPackage,
    advisoryId: vuln.id,
    actionNeeded: vuln.fixedVersion
      ? `Upgrade ${pkg.name} to ${vuln.fixedVersion} or later`
      : `Review ${pkg.name} advisory and assess exposure`,
    sourceUrl: vuln.sourceUrl,
    publishedAt: vuln.publishedAt,
    fixedVersion: vuln.fixedVersion,
    details: vuln.details,
    categories: [...new Set([...pkg.categories, 'security' as const])],
    summary: buildSummary({
      what: `${pkg.name}: ${vuln.summary}`,
      why: `Affects your installed ${pkg.npmPackage} version. Advisory: ${vuln.id}.`,
      action: vuln.fixedVersion
        ? `Upgrade ${pkg.name} to ${vuln.fixedVersion}+.`
        : 'Check OSV advisory for mitigation steps.',
      urgency: vuln.severity === 'critical' || vuln.severity === 'high' ? 'immediate' : 'this-sprint',
    }),
  }))
}

function buildBreakingChanges(
  pkg: (typeof WATCHLIST_PACKAGES)[number],
  dependency: Dependency,
  githubBody: string | null,
): BreakingChange | null {
  if (!dependency.breakingChanges) return null

  const breakingApiChanges = githubBody ? extractBreakingApiChanges(githubBody) : []
  const excerpt =
    breakingApiChanges.length > 0
      ? breakingApiChanges.slice(0, 2).join(' ')
      : githubBody
        ? summarizeReleaseBody(githubBody, 100)
        : 'Major version available.'

  return {
    id: `bc-${pkg.id}`,
    technology: pkg.name,
    title: `Major update: v${dependency.latestVersion}`,
    whatChanged: excerpt,
    codeExample:
      breakingApiChanges.length > 0
        ? breakingApiChanges.slice(0, 3).map((c, i) => `${i + 1}. ${c}`).join('\n')
        : 'See release notes — migration examples not available via API.',
    migrationGuidance:
      breakingApiChanges.length > 0
        ? `Review ${breakingApiChanges.length} breaking API change(s) below before upgrading.`
        : githubBody
          ? 'Review the linked GitHub release for breaking change notes.'
          : 'Compare changelog between your version and latest major.',
    version: dependency.latestVersion,
    sourceUrl: dependency.sourceUrl ?? `https://www.npmjs.com/package/${pkg.npmPackage}`,
    breakingApiChanges: breakingApiChanges.length > 0 ? breakingApiChanges : undefined,
    releaseNotesFull: githubBody?.trim() || undefined,
    categories: pkg.categories,
    summary: buildSummary({
      what: `${pkg.name} major version ${dependency.latestVersion} is available.`,
      why: 'Major bumps can break APIs, build tooling, or peer dependency resolution.',
      action: `Read release notes and test upgrade to ${dependency.latestVersion}.`,
      urgency: 'next-sprint',
    }),
  }
}

function buildExecutiveActions(
  dependencies: Dependency[],
  securityAlerts: SecurityAlert[],
  nodeStatus: DashboardData['nodeStatus'] | null,
): ExecutiveAction[] {
  const actions: ExecutiveAction[] = []

  for (const alert of securityAlerts.slice(0, 3)) {
    actions.push({
      id: `sec-${alert.id}`,
      type: 'security',
      title: `${packageDisplayName(alert.affectedPackage)}: ${alert.title}`,
      why: alert.summary.whyCare,
      action: alert.actionNeeded,
      impact: alert.severity === 'critical' ? 'high' : 'low',
      urgency: alert.summary.upgradeUrgency,
      categories: alert.categories,
    })
  }

  for (const dep of dependencies.filter((d) => d.riskLevel === 'major').slice(0, 2)) {
    actions.push({
      id: `major-${dep.id}`,
      type: 'breaking',
      title: `${dep.name} major update available`,
      why: dep.summary.whyCare,
      action: `Upgrade to ${dep.recommendedVersion}`,
      impact: 'medium',
      urgency: 'next-sprint',
      categories: dep.categories,
      breakingApiChanges: dep.breakingApiChanges,
    })
  }

  for (const dep of dependencies.filter((d) => d.riskLevel === 'recommended').slice(0, 2)) {
    actions.push({
      id: `dep-${dep.id}`,
      type: 'dependency',
      title: `${dep.name} update available`,
      why: dep.releaseNotesSummary,
      action: `Upgrade to ${dep.recommendedVersion}`,
      impact: 'low',
      urgency: 'this-sprint',
      categories: dep.categories,
    })
  }

  if (nodeStatus && nodeStatus.status !== 'supported') {
    actions.push({
      id: 'node-upgrade',
      type: 'recommendation',
      title: `Node.js ${nodeStatus.status === 'end-of-life' ? 'end of life' : 'upgrade recommended'}`,
      why: nodeStatus.whyUpgrade,
      action: `Upgrade to Node ${nodeStatus.latestLts.version} LTS`,
      impact: nodeStatus.migrationEffort === 'high' ? 'high' : 'medium',
      urgency: nodeStatus.status === 'end-of-life' ? 'immediate' : 'next-sprint',
      categories: ['node'],
    })
  }

  return actions.slice(0, 8)
}

export { buildExecutiveActions }

function isStackConfigured(
  configuredVersions: Record<string, string>,
  trackedPackageIds: string[],
  customPackages: CustomPackageEntry[],
): boolean {
  return getTrackedPackages(trackedPackageIds, customPackages).some((pkg) =>
    configuredVersions[pkg.npmPackage]?.trim(),
  )
}

export async function fetchDashboardNodeSection(input: DashboardInput): Promise<DashboardNodeSection> {
  const hasNodeVersion = Boolean(input.nodeVersion.trim())
  const nodeBundle = hasNodeVersion
    ? await fetchNodeStatus(input.nodeVersion)
    : { nodeStatus: null, sources: [] }

  return {
    nodeStatus: nodeBundle.nodeStatus ?? buildFallbackNodeStatus(input, hasNodeVersion),
    dataSources: hasNodeVersion ? nodeBundle.sources.map(toSourceStatus) : [],
  }
}

export async function fetchDashboardStackSection(input: DashboardInput): Promise<DashboardStackSection> {
  const packages = getTrackedPackages(input.trackedPackageIds, input.customPackages)
  const isConfigured = isStackConfigured(input.configuredVersions, input.trackedPackageIds, input.customPackages)
  const dataSources: DataSourceStatus[] = []
  const dependencies: Dependency[] = []
  const securityAlerts: SecurityAlert[] = []
  const breakingChanges: BreakingChange[] = []

  if (!isConfigured) {
    dataSources.push(
      {
        id: 'npm-registry',
        name: 'NPM Registry',
        endpoint: 'https://registry.npmjs.org/{package}/latest',
        status: 'unavailable',
        message: 'Import package.json to compare your stack',
        itemCount: 0,
      },
      {
        id: 'osv',
        name: 'OSV Vulnerabilities',
        endpoint: 'https://api.osv.dev/v1/query',
        status: 'unavailable',
        message: 'Configure package versions to run CVE checks',
        itemCount: 0,
      },
    )
    return { dependencies, securityAlerts, breakingChanges, transitiveDependencies: [], dataSources, upgradePlan: [] }
  }

  const githubRepos = [
    ...new Set(packages.map((pkg) => pkg.githubRepo).filter(Boolean) as string[]),
  ]

  const [githubBatch, dataHealth] = await Promise.all([
    fetchGitHubReleasesBatch(githubRepos),
    fetchDataHealth(),
  ])

  const depResults = await Promise.all(
    packages.map(async (pkg) => {
      const result = await buildDependency(pkg, input.configuredVersions, githubBatch)
      return { pkg, result }
    }),
  )

  for (const { pkg, result } of depResults) {
    if (result.dependency) dependencies.push(result.dependency)
    securityAlerts.push(...buildSecurityAlerts(pkg, result.vulns))
  }

  for (const { pkg, result } of depResults) {
    if (!result.dependency?.breakingChanges || !pkg.githubRepo) continue
    const bc = buildBreakingChanges(pkg, result.dependency, result.githubResult?.data?.body ?? null)
    if (bc) breakingChanges.push(bc)
  }

  dataSources.push({
    id: 'npm-registry',
    name: 'NPM Registry',
    endpoint: 'https://registry.npmjs.org/{package}/latest',
    status: dependencies.length > 0 ? 'ok' : 'error',
    message: `${dependencies.length}/${packages.length} packages resolved`,
    itemCount: dependencies.length,
  })

  const githubResults = depResults
    .filter((r) => r.pkg.githubRepo)
    .map((r) => r.result.githubResult)
    .filter(Boolean) as FetchResult<GitHubReleaseInfo>[]
  const githubOk = githubResults.filter((r) => r.status === 'ok' && r.data).length
  const githubTotal = depResults.filter((r) => r.pkg.githubRepo).length

  let githubStatus: DataSourceStatus['status'] = 'error'
  let githubMessage = 'GitHub release fetch failed'

  if (githubTotal === 0) {
    githubStatus = 'unavailable'
    githubMessage = 'No GitHub repos mapped in watchlist'
  } else if (githubOk === githubTotal) {
    githubStatus = dataHealth?.githubToken || githubBatch.authenticated ? 'ok' : 'partial'
    githubMessage =
      dataHealth?.githubToken || githubBatch.authenticated
        ? `${githubOk}/${githubTotal} release notes via /api/github-releases`
        : `${githubOk}/${githubTotal} fetched — set GITHUB_TOKEN on Netlify for 5000 req/hr`
  } else if (githubOk > 0) {
    githubStatus = 'partial'
    githubMessage = `${githubOk}/${githubTotal} release notes fetched`
  }

  dataSources.push(
    {
      id: 'github-releases',
      name: 'GitHub Releases',
      endpoint: '/api/github-releases?repos={owner}/{repo},…',
      status: githubStatus,
      message: githubMessage,
      itemCount: githubOk,
    },
    {
      id: 'osv',
      name: 'OSV Vulnerabilities',
      endpoint: 'https://api.osv.dev/v1/query',
      status: 'ok',
      message: `${securityAlerts.length} relevant advisories for configured versions`,
      itemCount: securityAlerts.length,
    },
  )

  const constrained = applyUpgradeConstraints(dependencies)

  let transitiveDependencies: TransitiveDependencyInsight[] = []
  if (input.lockfileGraph) {
    const trackedNpm = packages
      .map((pkg) => pkg.npmPackage)
      .filter((npmPackage) => input.configuredVersions[npmPackage]?.trim())

    const transitiveBase = collectTransitiveDependencies(trackedNpm, input.lockfileGraph)
    const toScan = selectTransitiveForVulnScan(transitiveBase, 15)

    const vulnResults = await Promise.all(
      toScan.map(async (item) => {
        const result = await fetchPackageVulnerabilities(item.npmPackage, item.version)
        return { item, vulns: result.data ?? [] }
      }),
    )

    transitiveDependencies = transitiveBase.map((item) => {
      const scanned = vulnResults.find((entry) => entry.item.id === item.id)
      const vulns = scanned?.vulns ?? []
      const top = vulns.sort(
        (a, b) =>
          ({ critical: 0, high: 1, medium: 2, low: 3 }[a.severity] -
            { critical: 0, high: 1, medium: 2, low: 3 }[b.severity]),
      )[0]

      return {
        ...item,
        vulnerabilityCount: vulns.length,
        highestSeverity: highestTransitiveSeverity(vulns.map((v) => v.severity)),
        topAdvisoryId: top?.id ?? null,
        fixedVersion: top?.fixedVersion ?? null,
      }
    })

    const transitiveVulnCount = transitiveDependencies.filter((item) => item.vulnerabilityCount > 0).length
    if (transitiveBase.length > 0) {
      dataSources.push({
        id: 'lockfile-graph',
        name: 'Lockfile dependency graph',
        endpoint: 'local lockfile import',
        status: 'ok',
        message: `${transitiveBase.length} transitive dependencies (${transitiveVulnCount} with advisories)`,
        itemCount: transitiveBase.length,
      })
    }

    for (const item of transitiveDependencies.filter((entry) => entry.vulnerabilityCount > 0)) {
      securityAlerts.push({
        id: `transitive-${item.id}`,
        title: item.topAdvisoryId ? `${item.npmPackage}: transitive advisory` : `${item.npmPackage}: vulnerabilities in dependency tree`,
        severity: item.highestSeverity ?? 'medium',
        affectedPackage: item.npmPackage,
        advisoryId: item.topAdvisoryId ?? undefined,
        actionNeeded: item.fixedVersion
          ? `Transitive ${item.npmPackage}@${item.version} — upgrade path via ${item.requiredBy.join(', ')} to ${item.fixedVersion}+`
          : `Review transitive dependency ${item.npmPackage} required by ${item.requiredBy.join(', ')}`,
        sourceUrl: item.topAdvisoryId ? `https://osv.dev/vulnerability/${item.topAdvisoryId}` : `https://www.npmjs.com/package/${item.npmPackage}`,
        publishedAt: new Date().toISOString().slice(0, 10),
        fixedVersion: item.fixedVersion,
        categories: ['security'],
        summary: buildSummary({
          what: `${item.npmPackage}@${item.version} in your lockfile has ${item.vulnerabilityCount} relevant advisory(ies).`,
          why: `Required transitively by ${item.requiredBy.join(', ')} — not a direct dependency you track.`,
          action: item.fixedVersion
            ? `Upgrade parent package(s) or run npm audit fix targeting ${item.fixedVersion}+.`
            : 'Review OSV advisory and parent package upgrade paths.',
          urgency: item.highestSeverity === 'critical' || item.highestSeverity === 'high' ? 'immediate' : 'this-sprint',
        }),
      })
    }
  }

  return {
    dependencies: constrained.dependencies,
    securityAlerts,
    breakingChanges,
    transitiveDependencies,
    dataSources,
    upgradePlan: constrained.upgradePlan,
  }
}

export async function fetchDashboardData(input: DashboardInput): Promise<DashboardData> {
  const isConfigured = isStackConfigured(input.configuredVersions, input.trackedPackageIds, input.customPackages)
  const [nodeSection, stackSection] = await Promise.all([
    fetchDashboardNodeSection(input),
    fetchDashboardStackSection(input),
  ])

  const { nodeStatus, dataSources: nodeSources } = nodeSection
  const { dependencies, securityAlerts, breakingChanges, dataSources: stackSources, upgradePlan } =
    stackSection

  const healthScore: HealthScore = isConfigured
    ? calculateHealthScore(dependencies, nodeStatus, breakingChanges, securityAlerts)
    : {
        score: 0,
        securityWeight: 0,
        outdatedWeight: 0,
        nodeSupportWeight: 0,
        breakingChangesWeight: 0,
        recommendedActions: [],
      }

  const executiveActions = isConfigured
    ? buildExecutiveActions(dependencies, securityAlerts, nodeStatus)
    : []

  return {
    dependencies,
    securityAlerts,
    breakingChanges,
    nodeStatus,
    executiveActions,
    healthScore,
    dataSources: [...stackSources, ...nodeSources],
    upgradePlan,
    lastUpdated: new Date().toISOString(),
  }
}
