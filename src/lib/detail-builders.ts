import type {
  BreakingChange,
  DataSourceStatus,
  Dependency,
  ExecutiveAction,
  NodeStatus,
  RecommendedAction,
  SecurityAlert,
} from '@/types'
import { FILTER_LABELS, RISK_COLORS, SEVERITY_COLORS, URGENCY_LABELS } from '@/types'
import type { DetailContent, DetailField, DetailSection } from '@/types/detail'
import type { KnowledgeArticle } from '@/types/knowledge'
import { TONE_COLORS, TONE_LABELS } from '@/types/knowledge'

const RISK_LABELS = {
  safe: 'Safe',
  recommended: 'Update recommended',
  major: 'Major update available',
  security: 'Security issue',
}

const COLLAPSE_THRESHOLD = 400

function categoryTags(categories: Dependency['categories']): string[] {
  return categories.map((c) => FILTER_LABELS[c])
}

function cleanReleaseNotes(body: string, maxLength = 4000): string {
  const cleaned = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}…`
}

function releaseNotesSection(title: string, body?: string): DetailSection | null {
  if (!body?.trim()) return null
  const content = cleanReleaseNotes(body)
  return {
    title,
    content,
    collapsible: content.length > COLLAPSE_THRESHOLD,
  }
}

function npmLinks(npmPackage: string, sourceUrl?: string): DetailContent['links'] {
  const links: NonNullable<DetailContent['links']> = [
    { label: 'npm package', url: `https://www.npmjs.com/package/${npmPackage}` },
    { label: 'OSV advisories', url: `https://osv.dev/list?ecosystem=npm&q=${encodeURIComponent(npmPackage)}` },
  ]
  if (sourceUrl && !sourceUrl.includes('npmjs.com')) {
    links.unshift({ label: 'Latest release', url: sourceUrl })
  }
  return links
}

function breakingChangesField(dep: Dependency): DetailField[] {
  const count = dep.breakingApiChanges?.length ?? 0
  if (count > 0) {
    return [{ label: 'Breaking API changes', value: `${count} documented in release notes`, highlight: true }]
  }
  return [{ label: 'Breaking changes', value: dep.breakingChanges ? 'Major bump — see release notes' : 'None detected' }]
}

function withBreakingApiChanges(content: DetailContent, items?: string[]): DetailContent {
  if (!items?.length) return content
  return { ...content, breakingApiChanges: items }
}

export function buildDependencyDetail(dep: Dependency): DetailContent {
  const sections: DetailSection[] = []

  const releaseSection = releaseNotesSection('Full release notes', dep.releaseNotesFull)
  if (releaseSection) sections.push(releaseSection)

  if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
    sections.push({
      title: `Known vulnerabilities (${dep.vulnerabilities.length})`,
      content: dep.vulnerabilities
        .map((v) => {
          const fix = v.fixedVersion ? ` → fix in ${v.fixedVersion}` : ''
          const detail = v.details ? `\n${v.details}` : ''
          return `• [${v.severity.toUpperCase()}] ${v.id}: ${v.summary}${fix}${detail}`
        })
        .join('\n\n'),
      collapsible: true,
    })
  }

  return withBreakingApiChanges(
    {
      title: dep.name,
      subtitle: dep.npmPackage ?? dep.name,
      badge: { label: RISK_LABELS[dep.riskLevel], color: RISK_COLORS[dep.riskLevel] },
      tags: categoryTags(dep.categories),
      fields: [
        { label: 'npm package', value: dep.npmPackage ?? dep.name, mono: true },
        { label: 'Your version', value: dep.currentVersion, mono: true },
        { label: 'Latest', value: dep.latestVersion, mono: true },
        { label: 'Recommended', value: dep.recommendedVersion, mono: true, highlight: true },
        { label: 'Upgrade urgency', value: URGENCY_LABELS[dep.summary.upgradeUrgency] },
        ...(dep.releasePublishedAt ? [{ label: 'Release published', value: dep.releasePublishedAt }] : []),
        ...breakingChangesField(dep),
        ...(dep.upgradeBlockers?.length
          ? [{ label: 'Upgrade blockers', value: `${dep.upgradeBlockers.length} peer dependency constraint(s)`, highlight: true }]
          : []),
        ...(dep.relatedUpgrades?.length
          ? [{ label: 'Upgrade together', value: dep.relatedUpgrades.join(', ') }]
          : []),
        ...(dep.peerDependencies && Object.keys(dep.peerDependencies).length > 0
          ? [{
              label: 'Peer dependencies (latest)',
              value: Object.entries(dep.peerDependencies)
                .slice(0, 6)
                .map(([name, range]) => `${name} ${range}`)
                .join(', '),
            }]
          : []),
        { label: 'Security issues', value: String(dep.securityIssues) },
      ],
      body: dep.releaseNotesSummary,
      sections,
      links: dep.npmPackage ? npmLinks(dep.npmPackage, dep.sourceUrl) : undefined,
      sourceUrl: dep.sourceUrl,
      sourceLabel: 'View releases',
      enrich: dep.npmPackage ? { type: 'npm-package', packageName: dep.npmPackage } : undefined,
    },
    dep.breakingApiChanges,
  )
}

export function buildSecurityDetail(alert: SecurityAlert): DetailContent {
  const sections: DetailSection[] = []

  if (alert.details) {
    sections.push({
      title: 'Advisory details',
      content: alert.details,
      collapsible: alert.details.length > COLLAPSE_THRESHOLD,
    })
  }

  return {
    title: alert.title,
    subtitle: alert.affectedPackage,
    badge: { label: alert.severity, color: SEVERITY_COLORS[alert.severity] },
    tags: alert.categories.map((c) => FILTER_LABELS[c]),
    fields: [
      ...(alert.advisoryId ? [{ label: 'Advisory ID', value: alert.advisoryId, mono: true }] : []),
      { label: 'Severity', value: alert.severity },
      { label: 'Affected package', value: alert.affectedPackage, mono: true },
      { label: 'Published', value: alert.publishedAt },
      ...(alert.fixedVersion
        ? [{ label: 'Fixed in', value: alert.fixedVersion, mono: true, highlight: true }]
        : [{ label: 'Fix version', value: 'No fixed version listed — review advisory' }]),
      { label: 'Recommended action', value: alert.actionNeeded, highlight: true },
      { label: 'Urgency', value: URGENCY_LABELS[alert.summary.upgradeUrgency] },
    ],
    sections,
    links: [
      { label: 'OSV advisory', url: alert.sourceUrl },
      {
        label: 'npm advisories',
        url: `https://www.npmjs.com/advisories?search=${encodeURIComponent(alert.affectedPackage)}`,
      },
    ],
    sourceUrl: alert.sourceUrl,
    sourceLabel: 'View advisory',
    enrich: { type: 'npm-package', packageName: alert.affectedPackage },
  }
}

export function buildBreakingChangeDetail(change: BreakingChange): DetailContent {
  const sections: DetailSection[] = []
  const releaseSection = releaseNotesSection('Full release notes', change.releaseNotesFull)
  if (releaseSection) sections.push(releaseSection)

  return withBreakingApiChanges(
    {
      title: change.title,
      subtitle: `${change.technology} · v${change.version}`,
      badge: { label: 'Breaking change', color: '#F97316' },
      tags: change.categories.map((c) => FILTER_LABELS[c]),
      body: change.whatChanged,
      fields: [
        { label: 'Technology', value: change.technology },
        { label: 'Version', value: change.version, mono: true },
        {
          label: 'Breaking API changes',
          value: change.breakingApiChanges?.length
            ? `${change.breakingApiChanges.length} extracted from release notes`
            : 'Major bump — review full release notes',
          highlight: Boolean(change.breakingApiChanges?.length),
        },
        { label: 'Urgency', value: URGENCY_LABELS[change.summary.upgradeUrgency] },
      ],
      sections,
      codeBlock: change.breakingApiChanges?.length ? undefined : change.codeExample,
      bullets: change.breakingApiChanges?.length ? undefined : [change.migrationGuidance],
      sourceUrl: change.sourceUrl,
      sourceLabel: 'Read migration docs',
    },
    change.breakingApiChanges,
  )
}

export function buildExecutiveDetail(action: ExecutiveAction): DetailContent {
  return withBreakingApiChanges(
    {
      title: action.title,
      subtitle: action.type.replace('-', ' '),
      badge: { label: URGENCY_LABELS[action.urgency], color: '#3B82F6' },
      tags: action.categories.map((c) => FILTER_LABELS[c]),
      fields: [
        { label: 'Type', value: action.type },
        { label: 'Why it matters', value: action.why },
        { label: 'What to do', value: action.action, highlight: true },
        { label: 'Effort', value: `${action.impact} effort` },
        { label: 'Urgency', value: URGENCY_LABELS[action.urgency] },
        ...(action.breakingApiChanges?.length
          ? [{ label: 'Breaking API changes', value: `${action.breakingApiChanges.length} to review`, highlight: true }]
          : []),
      ],
      body: 'This item was prioritized based on severity, version gap, and impact on your configured stack.',
    },
    action.breakingApiChanges,
  )
}

export function buildRecommendedActionDetail(
  action: RecommendedAction,
  index: number,
): DetailContent {
  return {
    title: action.action,
    subtitle: `Recommended action #${index + 1}`,
    badge: {
      label: `${action.impact} effort`,
      color: action.impact === 'high' ? '#EF4444' : action.impact === 'medium' ? '#EAB308' : '#22C55E',
    },
    fields: [
      { label: 'Why', value: action.why },
      { label: 'Action', value: action.action, highlight: true },
      { label: 'Estimated effort', value: action.impact },
    ],
    body: 'This action contributes to your overall dependency health score. Tackle high-effort items in sprint planning; low-effort patches can often ship in a single PR.',
    sections: [
      {
        title: 'How to approach',
        content:
          '1. Check the dependency or security popup for version targets.\n2. Run your test suite after upgrading.\n3. Scan release notes for breaking API changes.\n4. Deploy to staging before production.',
      },
    ],
  }
}

export function buildNodeDetail(status: NodeStatus): DetailContent {
  const statusColor =
    status.status === 'supported' ? '#22C55E' : status.status === 'upgrade-recommended' ? '#EAB308' : '#EF4444'

  return {
    title: 'Node.js upgrade overview',
    subtitle: `Running v${status.currentVersion}`,
    badge: { label: status.status.replace('-', ' '), color: statusColor },
    tags: ['Node'],
    fields: [
      { label: 'Your version', value: status.currentVersion, mono: true },
      {
        label: 'Latest LTS',
        value: `v${status.latestLts.version}${status.latestLts.codename ? ` (${status.latestLts.codename})` : ''}`,
        mono: true,
        highlight: status.status !== 'supported',
      },
      { label: 'LTS released', value: status.latestLts.releaseDate },
      { label: 'Latest current', value: `v${status.latestCurrent.version}`, mono: true },
      { label: 'Current released', value: status.latestCurrent.releaseDate },
      { label: 'LTS support ends', value: status.latestLts.supportEndDate },
      { label: 'Current support ends', value: status.latestCurrent.supportEndDate },
      { label: 'Migration effort', value: status.migrationEffort },
      { label: 'Urgency', value: URGENCY_LABELS[status.summary.upgradeUrgency] },
    ],
    body: status.whyUpgrade,
    bullets: status.newFeatures,
    sections: [
      {
        title: 'Security implications',
        content: status.securityImplications,
      },
    ],
    links: [
      { label: 'Node release schedule', url: 'https://nodejs.org/en/about/previous-releases' },
      { label: 'Node.js dist index', url: 'https://nodejs.org/dist/index.json' },
      { label: 'endoflife.date — Node', url: 'https://endoflife.date/nodejs' },
    ],
    sourceUrl: 'https://nodejs.org/en/about/previous-releases',
    sourceLabel: 'Node release schedule',
  }
}

export function buildDataSourceDetail(source: DataSourceStatus): DetailContent {
  const statusColors = {
    ok: '#22C55E',
    partial: '#EAB308',
    error: '#EF4444',
    unavailable: '#6B7280',
  }

  return {
    title: source.name,
    subtitle: source.endpoint,
    badge: { label: source.status, color: statusColors[source.status] },
    fields: [
      { label: 'Status', value: source.status },
      { label: 'Items fetched', value: String(source.itemCount) },
      { label: 'Endpoint', value: source.endpoint, mono: true },
    ],
    body: source.message,
    sections:
      source.id === 'github-releases' && source.status !== 'ok'
        ? [
            {
              title: 'How to fix GitHub releases',
              content:
                '1. Deploy on Netlify (or run `netlify dev` locally).\n2. Add GITHUB_TOKEN in Site settings → Environment variables (read-only PAT).\n3. Redeploy. One batch call fetches all watchlist repos via /api/github-releases.',
            },
          ]
        : source.status === 'unavailable'
          ? [
              {
                title: 'Why unavailable',
                content: 'This data source is not configured or has no mapped endpoints.',
              },
            ]
          : undefined,
  }
}

export function buildArticleDetail(article: KnowledgeArticle): DetailContent {
  return {
    title: article.title,
    subtitle: `${article.source} · ${article.readTimeMinutes} min read`,
    badge: { label: TONE_LABELS[article.tone], color: TONE_COLORS[article.tone] },
    tags: article.topics.map((t) => FILTER_LABELS[t]),
    body: article.excerpt,
    fields: [
      { label: 'Source', value: article.source },
      { label: 'Published', value: new Date(article.publishedAt).toLocaleDateString() },
      { label: 'Read time', value: `${article.readTimeMinutes} minutes` },
      { label: 'Tone', value: TONE_LABELS[article.tone] },
    ],
    sourceUrl: article.sourceUrl,
    sourceLabel: 'Read full article',
  }
}
