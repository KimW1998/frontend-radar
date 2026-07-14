import type { Severity } from '@/types'
import { ENDPOINTS, fetchJson, type FetchResult } from '@/services/http'
import { compareVersions, maxVersion } from '@/services/semver'

interface OsvVulnerability {
  id: string
  summary: string
  details?: string
  published?: string
  modified?: string
  database_specific?: { severity?: string }
  affected?: Array<{
    package?: { name: string; ecosystem: string }
    ranges?: Array<{
      type: string
      events: Array<{ introduced?: string; fixed?: string }>
    }>
  }>
  severity?: Array<{ type: string; score: string }>
}

interface OsvResponse {
  vulns?: OsvVulnerability[]
}

export interface PackageVulnerability {
  id: string
  summary: string
  severity: Severity
  publishedAt: string
  fixedVersion: string | null
  details?: string
  sourceUrl: string
}

function mapSeverity(raw?: string): Severity {
  const value = (raw ?? '').toUpperCase()
  if (value.includes('CRITICAL')) return 'critical'
  if (value.includes('HIGH')) return 'high'
  if (value.includes('MODERATE') || value.includes('MEDIUM')) return 'medium'
  return 'low'
}

function extractFixedVersion(vuln: OsvVulnerability): string | null {
  const fixedVersions: string[] = []

  for (const affected of vuln.affected ?? []) {
    for (const range of affected.ranges ?? []) {
      for (const event of range.events ?? []) {
        if (event.fixed) fixedVersions.push(event.fixed)
      }
    }
  }

  return maxVersion(fixedVersions)
}

function isVulnRelevant(vuln: OsvVulnerability, currentVersion: string): boolean {
  const fixed = extractFixedVersion(vuln)
  if (!fixed) return true
  return compareVersions(currentVersion, fixed) < 0
}

export async function fetchPackageVulnerabilities(
  packageName: string,
  currentVersion: string,
): Promise<FetchResult<PackageVulnerability[]>> {
  const endpoint = ENDPOINTS.osv
  try {
    const data = await fetchJson<OsvResponse>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: { name: packageName, ecosystem: 'npm' } }),
    })

    const vulns = (data.vulns ?? [])
      .filter((v) => isVulnRelevant(v, currentVersion))
      .map((v) => ({
        id: v.id,
        summary: v.summary,
        severity: mapSeverity(v.database_specific?.severity ?? v.severity?.[0]?.score),
        publishedAt: (v.published ?? v.modified ?? new Date().toISOString()).slice(0, 10),
        fixedVersion: extractFixedVersion(v),
        details: v.details?.trim() || undefined,
        sourceUrl: `https://osv.dev/vulnerability/${v.id}`,
      }))

    return {
      data: vulns,
      source: 'OSV (Open Source Vulnerabilities)',
      endpoint,
      status: 'ok',
      itemCount: vulns.length,
    }
  } catch (error) {
    return {
      data: null,
      source: 'OSV (Open Source Vulnerabilities)',
      endpoint,
      status: 'error',
      error: error instanceof Error ? error.message : 'Fetch failed',
      itemCount: 0,
    }
  }
}
