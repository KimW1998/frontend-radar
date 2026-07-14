import type { NodeRelease, NodeStatus } from '@/types'
import { ENDPOINTS, fetchJson, type FetchResult } from '@/services/http'
import { compareVersions, normalizeVersion } from '@/services/semver'
import { buildSummary } from '@/services/summary'

interface NodeDistEntry {
  version: string
  date: string
  lts: string | false
  security?: boolean
  npm?: string
}

interface EolRelease {
  name: string
  codename?: string | null
  releaseDate?: string
  isLts?: boolean
  eolFrom?: string | null
  latest?: { name?: string }
}

interface EolResponse {
  result: { releases: EolRelease[] }
}

function toNodeRelease(entry: NodeDistEntry, eol?: EolRelease): NodeRelease {
  const version = normalizeVersion(entry.version)
  return {
    version,
    codename: typeof entry.lts === 'string' ? entry.lts : eol?.codename ?? undefined,
    releaseDate: entry.date,
    supportEndDate: eol?.eolFrom?.slice(0, 10) ?? 'Unknown',
    isLts: typeof entry.lts === 'string',
    isCurrent: !entry.lts && !entry.security,
  }
}

function findEolMatch(releases: EolRelease[], major: string): EolRelease | undefined {
  return releases.find((r) => r.name === major)
}

export async function fetchNodeStatus(currentVersion: string): Promise<{
  nodeStatus: NodeStatus | null
  sources: FetchResult<unknown>[]
}> {
  const distEndpoint = ENDPOINTS.nodeDist
  const eolEndpoint = ENDPOINTS.nodeEol

  const sources: FetchResult<unknown>[] = []

  let dist: NodeDistEntry[] | null = null
  let eolReleases: EolRelease[] = []

  try {
    dist = await fetchJson<NodeDistEntry[]>(distEndpoint)
    sources.push({
      data: dist,
      source: 'Node.js Dist Index',
      endpoint: distEndpoint,
      status: 'ok',
      itemCount: dist.length,
    })
  } catch (error) {
    sources.push({
      data: null,
      source: 'Node.js Dist Index',
      endpoint: distEndpoint,
      status: 'error',
      error: error instanceof Error ? error.message : 'Fetch failed',
      itemCount: 0,
    })
  }

  try {
    const eol = await fetchJson<EolResponse>(eolEndpoint)
    eolReleases = eol.result.releases
    sources.push({
      data: eolReleases,
      source: 'endoflife.date (Node.js)',
      endpoint: eolEndpoint,
      status: 'ok',
      itemCount: eolReleases.length,
    })
  } catch (error) {
    sources.push({
      data: null,
      source: 'endoflife.date (Node.js)',
      endpoint: eolEndpoint,
      status: 'error',
      error: error instanceof Error ? error.message : 'Fetch failed',
      itemCount: 0,
    })
  }

  if (!dist || dist.length === 0) {
    return { nodeStatus: null, sources }
  }

  const ltsEntry = dist.find((d) => typeof d.lts === 'string')
  const currentEntry = dist.find((d) => !d.lts)
  const normalizedCurrent = normalizeVersion(currentVersion)

  const latestLts = ltsEntry
    ? toNodeRelease(ltsEntry, findEolMatch(eolReleases, normalizeVersion(ltsEntry.version).split('.')[0]))
    : toNodeRelease(dist[0], eolReleases[0])

  const latestCurrent = currentEntry
    ? toNodeRelease(currentEntry, findEolMatch(eolReleases, normalizeVersion(currentEntry.version).split('.')[0]))
    : latestLts

  const currentMajor = normalizedCurrent.split('.')[0]
  const ltsMajor = latestLts.version.split('.')[0]
  const currentEol = findEolMatch(eolReleases, currentMajor)

  let status: NodeStatus['status'] = 'supported'
  if (currentEol?.eolFrom && new Date(currentEol.eolFrom) < new Date()) {
    status = 'end-of-life'
  } else if (compareVersions(normalizedCurrent, latestLts.version) < 0 && currentMajor !== ltsMajor) {
    status = 'upgrade-recommended'
  }

  const nodeStatus: NodeStatus = {
    currentVersion: normalizedCurrent,
    latestLts,
    latestCurrent,
    status,
    whyUpgrade: `Latest LTS is v${latestLts.version}${latestLts.codename ? ` (${latestLts.codename})` : ''}. Latest current is v${latestCurrent.version}.`,
    newFeatures: currentEntry
      ? [`Current line: Node ${latestCurrent.version}`, `Bundled npm ${currentEntry.npm ?? 'n/a'}`]
      : ['Current release data unavailable from Node.js dist index.'],
    securityImplications: currentEol?.eolFrom
      ? `Your major line (v${currentMajor}) security support ends ${currentEol.eolFrom.slice(0, 10)}.`
      : 'EOL dates sourced from endoflife.date when available.',
    migrationEffort:
      Math.abs(parseInt(ltsMajor, 10) - parseInt(currentMajor, 10)) >= 2 ? 'high' : 'medium',
    summary: buildSummary({
      what: `Node ${normalizedCurrent} in use. Latest LTS: v${latestLts.version}.`,
      why:
        status === 'end-of-life'
          ? 'Your Node major version is past end of life.'
          : status === 'upgrade-recommended'
            ? 'A newer LTS or current release is available.'
            : 'Node version is within a supported release line.',
      action:
        status === 'supported'
          ? 'No immediate Node upgrade required.'
          : `Plan upgrade to Node ${latestLts.version} LTS.`,
      urgency: status === 'end-of-life' ? 'immediate' : status === 'upgrade-recommended' ? 'next-sprint' : 'backlog',
    }),
  }

  return { nodeStatus, sources }
}
