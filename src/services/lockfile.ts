import { normalizeVersionRange } from '@/services/package-json'

export type LockfileFormat = 'npm' | 'pnpm' | 'yarn' | 'unknown'

export interface LockfileParseResult {
  format: LockfileFormat
  versions: Record<string, string>
  errors: string[]
}

export function detectLockfileFormat(input: string): LockfileFormat {
  const trimmed = input.trim()
  if (!trimmed) return 'unknown'
  if (trimmed.startsWith('{')) return 'npm'
  if (/^__metadata:/m.test(trimmed) || /^lockfileVersion:/m.test(trimmed) || /^importers:/m.test(trimmed)) {
    return 'pnpm'
  }
  if (/^"?(?:@[^"]+\/)?[^"\n]+@/.test(trimmed) && /version "/m.test(trimmed)) {
    return 'yarn'
  }
  return 'unknown'
}

export function parseLockfileInput(input: string): LockfileParseResult {
  const format = detectLockfileFormat(input)
  switch (format) {
    case 'npm':
      return parseNpmLockfile(input)
    case 'pnpm':
      return parsePnpmLockfile(input)
    case 'yarn':
      return parseYarnLockfile(input)
    default:
      return { format, versions: {}, errors: ['Unrecognized lockfile format. Paste package-lock.json, pnpm-lock.yaml, or yarn.lock.'] }
  }
}

function addVersion(
  versions: Record<string, string>,
  npmPackage: string,
  rawVersion: string,
  errors: string[],
): void {
  const version = normalizeVersionRange(rawVersion.replace(/^v/, '')) ?? normalizeVersionRange(rawVersion)
  if (!version) {
    errors.push(`Could not parse lockfile version for ${npmPackage}: "${rawVersion}"`)
    return
  }
  versions[npmPackage] = version
}

function parseNpmLockfile(input: string): LockfileParseResult {
  const errors: string[] = []
  const versions: Record<string, string> = {}

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    return { format: 'npm', versions: {}, errors: ['Invalid package-lock.json — expected JSON.'] }
  }

  const root = parsed as {
    packages?: Record<string, { version?: string }>
    dependencies?: Record<string, { version?: string }>
  }

  if (root.packages) {
    for (const [path, entry] of Object.entries(root.packages)) {
      if (!entry?.version || path === '') continue
      const npmPackage = path.replace(/^node_modules\//, '').split('node_modules/').pop()!
      addVersion(versions, npmPackage, entry.version, errors)
    }
  }

  if (root.dependencies) {
    for (const [npmPackage, entry] of Object.entries(root.dependencies)) {
      if (entry?.version) addVersion(versions, npmPackage, entry.version, errors)
    }
  }

  return { format: 'npm', versions, errors }
}

function parsePnpmLockfile(input: string): LockfileParseResult {
  const errors: string[] = []
  const versions: Record<string, string> = {}

  const importerBlock = input.match(/importers:\s*\n(?:\s+\.:\s*\n)?([\s\S]*?)(?:\npackages:|\n__metadata:|$)/)
  if (importerBlock) {
    const depLines = importerBlock[1].matchAll(/^\s{6}((?:@[\w.-]+\/)?[\w.-]+):\s*\n(?:\s+specifier:[^\n]+\n)?\s+version:\s*([^\n]+)$/gm)
    for (const match of depLines) {
      addVersion(versions, match[1], match[2].trim(), errors)
    }
  }

  const packageEntries = input.matchAll(
    /^\s{2}((?:@[\w.-]+\/)?[\w.-]+)@(\d+\.\d+\.\d+(?:[.-][\w.]+)?):/gm,
  )
  for (const match of packageEntries) {
    addVersion(versions, match[1], match[2], errors)
  }

  return { format: 'pnpm', versions, errors }
}

function parseYarnLockfile(input: string): LockfileParseResult {
  const errors: string[] = []
  const versions: Record<string, string> = {}

  const blocks = input.split(/\n(?=")/)
  for (const block of blocks) {
    const header = block.match(/^"((?:@[^"]+\/)?[^"]+)"/)
    const versionLine = block.match(/^\s+version\s+"([^"]+)"/m)
    if (!header || !versionLine) continue

    const npmPackage = header[1].split('@').slice(0, header[1].startsWith('@') ? 2 : 1).join('@').replace(/@$/, '')
    addVersion(versions, npmPackage, versionLine[1], errors)
  }

  return { format: 'yarn', versions, errors }
}

export function mergeImportedVersions(
  ...maps: Array<Record<string, string>>
): Record<string, string> {
  return Object.assign({}, ...maps)
}
