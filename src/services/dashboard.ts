import type {
  BreakingChange,
  DashboardData,
  DataSourceStatus,
  Dependency,
  ExecutiveAction,
  HealthScore,
  RiskLevel,
  SecurityAlert,
  UpgradeUrgency,
} from '@/types'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { extractBreakingApiChanges } from '@/services/breaking-changes'
import { fetchGitHubLatestRelease, summarizeReleaseBody } from '@/services/github'
import { fetchNpmLatest } from '@/services/npm'
import { fetchNodeStatus } from '@/services/node'
import { fetchPackageVulnerabilities, type PackageVulnerability } from '@/services/osv'
import { buildSummary, estimateReadingTime } from '@/services/summary'
import { toSourceStatus } from '@/services/http'
import { isBehind, isMajorBump, maxVersion } from '@/services/semver'
import { calculateHealthScore } from '@/services/health'

interface DashboardInput {
  configuredVersions: Record<string, string>
  nodeVersion: string
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
): Promise<{ dependency: Dependency | null; vulns: PackageVulnerability[] }> {
  const currentVersion = configuredVersions[pkg.npmPackage]?.trim() || ''

  const [npmResult, githubResult, vulnResult] = await Promise.all([
    fetchNpmLatest(pkg.npmPackage),
    pkg.githubRepo ? fetchGitHubLatestRelease(pkg.githubRepo) : Promise.resolve(null),
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

  if (!npmResult.data) return { dependency: null, vulns: [] }

  const latestVersion = npmResult.data
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

  return { dependency, vulns }
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

const UNAVAILABLE_SOURCES: DataSourceStatus[] = [
  {
    id: 'typo3',
    name: 'TYPO3 News / Security',
    endpoint: 'https://typo3.org / https://news.typo3.com',
    status: 'unavailable',
    message: 'No public JSON/RSS API with browser CORS. HTML pages only.',
    itemCount: 0,
  },
  {
    id: 'browsers',
    name: 'Browser Release Notes',
    endpoint: 'Chrome / Firefox / Safari / Edge blogs',
    status: 'unavailable',
    message: 'No unified CORS-enabled API for browser changelogs.',
    itemCount: 0,
  },
  {
    id: 'ai-engine',
    name: 'AI Summary Engine',
    endpoint: 'N/A',
    status: 'unavailable',
    message: 'Summaries are rule-based from fetched API data, not LLM-generated.',
    itemCount: 0,
  },
]

export async function fetchDashboardData(input: DashboardInput): Promise<DashboardData> {
  const dataSources: DataSourceStatus[] = []
  const dependencies: Dependency[] = []
  const securityAlerts: SecurityAlert[] = []
  const breakingChanges: BreakingChange[] = []

  const depResults = await Promise.all(
    WATCHLIST_PACKAGES.map(async (pkg) => {
      const result = await buildDependency(pkg, input.configuredVersions)
      if (result.dependency) dependencies.push(result.dependency)
      securityAlerts.push(...buildSecurityAlerts(pkg, result.vulns))
      return { pkg, result }
    }),
  )

  dataSources.push({
    id: 'npm-registry',
    name: 'NPM Registry',
    endpoint: 'https://registry.npmjs.org/{package}/latest',
    status: dependencies.length > 0 ? 'ok' : 'error',
    message: `${dependencies.length}/${WATCHLIST_PACKAGES.length} packages resolved`,
    itemCount: dependencies.length,
  })

  const githubFetches = depResults.filter((r) => r.pkg.githubRepo)
  dataSources.push({
    id: 'github-releases',
    name: 'GitHub Releases',
    endpoint: 'https://api.github.com/repos/{owner}/{repo}/releases/latest',
    status: 'partial',
    message: `Release notes fetched per package (rate limit: 60 req/hr unauthenticated)`,
    itemCount: githubFetches.length,
  })

  dataSources.push({
    id: 'osv',
    name: 'OSV Vulnerabilities',
    endpoint: 'https://api.osv.dev/v1/query',
    status: 'ok',
    message: `${securityAlerts.length} relevant advisories for configured versions`,
    itemCount: securityAlerts.length,
  })

  for (const { pkg, result } of depResults) {
    if (!result.dependency?.breakingChanges || !pkg.githubRepo) continue
    const gh = await fetchGitHubLatestRelease(pkg.githubRepo)
    const bc = buildBreakingChanges(pkg, result.dependency, gh.data?.body ?? null)
    if (bc) breakingChanges.push(bc)
  }

  const { nodeStatus, sources: nodeSources } = await fetchNodeStatus(input.nodeVersion)
  dataSources.push(...nodeSources.map(toSourceStatus))
  dataSources.push(...UNAVAILABLE_SOURCES)

  const healthScore: HealthScore = calculateHealthScore(
    dependencies,
    nodeStatus,
    breakingChanges,
    securityAlerts,
  )

  const executiveActions = buildExecutiveActions(dependencies, securityAlerts, nodeStatus)

  return {
    dependencies,
    securityAlerts,
    breakingChanges,
    nodeStatus: nodeStatus ?? {
      currentVersion: input.nodeVersion,
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
      whyUpgrade: 'Node.js dist API unreachable.',
      newFeatures: [],
      securityImplications: 'Could not fetch Node release data.',
      migrationEffort: 'medium',
      summary: buildSummary({
        what: 'Node.js release data could not be fetched.',
        why: 'Node.js dist or endoflife.date API failed.',
        action: 'Check network and retry.',
        urgency: 'this-sprint',
      }),
    },
    typo3Updates: [],
    browserUpdates: [],
    executiveActions,
    healthScore,
    dataSources,
    lastUpdated: new Date().toISOString(),
  }
}
