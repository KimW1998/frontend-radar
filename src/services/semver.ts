export function normalizeVersion(version: string): string {
  return version.replace(/^v/, '').split('-')[0]
}

export function parseVersion(version: string): number[] {
  return normalizeVersion(version)
    .split('.')
    .map((part) => parseInt(part, 10) || 0)
}

export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  const len = Math.max(pa.length, pb.length)

  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

export function isMajorBump(current: string, latest: string): boolean {
  const pc = parseVersion(current)
  const pl = parseVersion(latest)
  return pl[0] > pc[0]
}

export function isBehind(current: string, latest: string): boolean {
  return compareVersions(current, latest) < 0
}

export function maxVersion(versions: string[]): string | null {
  if (versions.length === 0) return null
  return versions.reduce((best, v) => (compareVersions(v, best) > 0 ? v : best))
}
