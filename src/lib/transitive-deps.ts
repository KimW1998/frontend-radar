import type { LockfileGraphSnapshot } from '@/types/lockfile-graph'
import type { Severity } from '@/types'

export interface TransitiveDependencyInsight {
  id: string
  npmPackage: string
  version: string
  requiredBy: string[]
  depth: number
  vulnerabilityCount: number
  highestSeverity: Severity | null
  topAdvisoryId: string | null
  fixedVersion: string | null
}

export function collectTransitiveDependencies(
  trackedNpmPackages: string[],
  graph: Pick<LockfileGraphSnapshot, 'dependencies' | 'versions'>,
  options: { maxDepth?: number; maxResults?: number } = {},
): Array<Omit<TransitiveDependencyInsight, 'vulnerabilityCount' | 'highestSeverity' | 'topAdvisoryId' | 'fixedVersion'>> {
  const maxDepth = options.maxDepth ?? 2
  const maxResults = options.maxResults ?? 40
  const tracked = new Set(trackedNpmPackages)
  const seen = new Set<string>()
  const results: Array<Omit<TransitiveDependencyInsight, 'vulnerabilityCount' | 'highestSeverity' | 'topAdvisoryId' | 'fixedVersion'>> = []

  for (const root of trackedNpmPackages) {
    const queue: Array<{ pkg: string; depth: number; requiredBy: string }> = [{ pkg: root, depth: 0, requiredBy: root }]

    while (queue.length > 0 && results.length < maxResults) {
      const current = queue.shift()!
      if (current.depth >= maxDepth) continue

      for (const dep of graph.dependencies[current.pkg] ?? []) {
        if (tracked.has(dep)) continue

        const version = graph.versions[dep]
        if (!version) continue

        const key = `${dep}@${version}`
        const existing = results.find((item) => item.npmPackage === dep && item.version === version)

        if (existing) {
          if (!existing.requiredBy.includes(current.requiredBy)) {
            existing.requiredBy.push(current.requiredBy)
          }
          continue
        }

        if (seen.has(key)) continue
        seen.add(key)

        results.push({
          id: `transitive-${dep}-${version}`,
          npmPackage: dep,
          version,
          requiredBy: [current.requiredBy],
          depth: current.depth + 1,
        })

        queue.push({ pkg: dep, depth: current.depth + 1, requiredBy: current.requiredBy })
      }
    }
  }

  return results.sort((a, b) => a.depth - b.depth || a.npmPackage.localeCompare(b.npmPackage))
}

export function selectTransitiveForVulnScan<T extends { npmPackage: string }>(
  items: T[],
  limit = 15,
): T[] {
  return items.slice(0, limit)
}

export function severityRank(severity: Severity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity]
}

export function highestSeverity(severities: Severity[]): Severity | null {
  if (severities.length === 0) return null
  return [...severities].sort((a, b) => severityRank(a) - severityRank(b))[0]
}
