import { compareVersions, normalizeVersion } from '@/services/semver'

function parseNumericParts(version: string): number[] {
  return normalizeVersion(version)
    .split('.')
    .map((part) => parseInt(part, 10) || 0)
}

function compareNumericParts(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function satisfiesCaret(versionParts: number[], rangeParts: number[]): boolean {
  if (rangeParts[0] === 0) {
    return (
      versionParts[0] === rangeParts[0] &&
      versionParts[1] === rangeParts[1] &&
      compareNumericParts(versionParts, rangeParts) >= 0
    )
  }
  return versionParts[0] === rangeParts[0] && compareNumericParts(versionParts, rangeParts) >= 0
}

function satisfiesTilde(versionParts: number[], rangeParts: number[]): boolean {
  return (
    versionParts[0] === rangeParts[0] &&
    versionParts[1] === rangeParts[1] &&
    compareNumericParts(versionParts, rangeParts) >= 0
  )
}

function satisfiesSingleRange(version: string, range: string): boolean {
  const trimmed = range.trim()
  if (!trimmed || trimmed === '*' || trimmed === 'x' || trimmed === 'X') return true

  if (trimmed.startsWith('>=')) {
    return compareVersions(version, trimmed.slice(2).trim()) >= 0
  }

  if (trimmed.startsWith('^')) {
    return satisfiesCaret(parseNumericParts(version), parseNumericParts(trimmed.slice(1).trim()))
  }

  if (trimmed.startsWith('~')) {
    return satisfiesTilde(parseNumericParts(version), parseNumericParts(trimmed.slice(1).trim()))
  }

  if (/^\d+(?:\.\d+)?(?:\.x)?$/i.test(trimmed)) {
    const base = trimmed.replace(/\.x$/i, '')
    const rangeParts = parseNumericParts(base.includes('.') ? base : `${base}.0.0`)
    if (trimmed.toLowerCase().endsWith('.x') || !trimmed.includes('.')) {
      return versionPartsMatchMajor(version, rangeParts)
    }
    return satisfiesTilde(parseNumericParts(version), rangeParts)
  }

  return compareVersions(version, trimmed) === 0
}

function versionPartsMatchMajor(version: string, rangeParts: number[]): boolean {
  const versionParts = parseNumericParts(version)
  if (rangeParts.length === 1) return versionParts[0] === rangeParts[0]
  if (rangeParts.length === 2) {
    return versionParts[0] === rangeParts[0] && versionParts[1] === rangeParts[1]
  }
  return compareNumericParts(versionParts, rangeParts) === 0
}

export function satisfiesSemverRange(version: string, range: string): boolean {
  const normalized = normalizeVersion(version)
  if (!normalized || normalized === 'Not configured') return false

  const alternatives = range.split('||').map((part) => part.trim())
  return alternatives.some((part) => satisfiesSingleRange(normalized, part))
}
