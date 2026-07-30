import { normalizeVersionRange } from '@/services/package-json'

export type LockfileFormat = 'npm' | 'pnpm' | 'yarn' | 'unknown'

export interface LockfileParseResult {
  format: LockfileFormat
  versions: Record<string, string>
  /** npm package name → direct dependency names from lockfile */
  dependencies: Record<string, string[]>
  errors: string[]
}

function emptyLockfileResult(format: LockfileFormat, errors: string[] = []): LockfileParseResult {
  return { format, versions: {}, dependencies: {}, errors }
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
      return emptyLockfileResult(format, [
        'Unrecognized lockfile format. Paste package-lock.json, pnpm-lock.yaml, or yarn.lock.',
      ])
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

function npmPackageFromPath(path: string): string | null {
  if (!path || path === '') return null
  return path.replace(/^node_modules\//, '').split('node_modules/').pop() ?? null
}

function parseNpmLockfile(input: string): LockfileParseResult {
  const errors: string[] = []
  const versions: Record<string, string> = {}
  const dependencies: Record<string, string[]> = {}

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    return emptyLockfileResult('npm', ['Invalid package-lock.json — expected JSON.'])
  }

  const root = parsed as {
    packages?: Record<string, { version?: string; dependencies?: Record<string, string> }>
    dependencies?: Record<string, { version?: string; dependencies?: Record<string, string> }>
  }

  if (root.packages) {
    for (const [path, entry] of Object.entries(root.packages)) {
      if (!entry?.version || path === '') continue
      const npmPackage = npmPackageFromPath(path)
      if (!npmPackage) continue
      addVersion(versions, npmPackage, entry.version, errors)
      if (entry.dependencies && Object.keys(entry.dependencies).length > 0) {
        dependencies[npmPackage] = Object.keys(entry.dependencies)
      }
    }
  }

  if (root.dependencies) {
    for (const [npmPackage, entry] of Object.entries(root.dependencies)) {
      if (entry?.version) addVersion(versions, npmPackage, entry.version, errors)
      if (entry?.dependencies && Object.keys(entry.dependencies).length > 0) {
        dependencies[npmPackage] = Object.keys(entry.dependencies)
      }
    }
  }

  return { format: 'npm', versions, dependencies, errors }
}

function parsePnpmLockfile(input: string): LockfileParseResult {
  const errors: string[] = []
  const versions: Record<string, string> = {}
  const dependencies: Record<string, string[]> = {}

  const importerBlock = input.match(/importers:\s*\n(?:\s+\.:\s*\n)?([\s\S]*?)(?:\npackages:|\n__metadata:|$)/)
  if (importerBlock) {
    const depLines = importerBlock[1].matchAll(/^\s{6}((?:@[\w.-]+\/)?[\w.-]+):\s*\n(?:\s+specifier:[^\n]+\n)?\s+version:\s*([^\n]+)$/gm)
    for (const match of depLines) {
      addVersion(versions, match[1], match[2].trim(), errors)
    }
  }

  const packageBlocks = input.split(/\n(?=\s{2}\/?(?:@[\w.-]+\/)?[\w.-]+@)/)
  for (const block of packageBlocks) {
    const header = block.match(/^\s{2}((?:\/(?:@[\w.-]+\/)?[\w.-]+@)?((?:@[\w.-]+\/)?[\w.-]+))@(\d+\.\d+\.\d+(?:[.-][\w.]+)?):/)
    if (!header) continue
    const npmPackage = header[2]
    addVersion(versions, npmPackage, header[3], errors)

    const depSection = block.match(/^\s{4}dependencies:\s*\n((?:\s{6}.+\n?)+)/m)
    if (depSection) {
      const deps = [...depSection[1].matchAll(/^\s{6}((?:@[\w.-]+\/)?[\w.-]+):/gm)].map((m) => m[1])
      if (deps.length > 0) dependencies[npmPackage] = deps
    }
  }

  return { format: 'pnpm', versions, dependencies, errors }
}

function parseYarnLockfile(input: string): LockfileParseResult {
  const errors: string[] = []
  const versions: Record<string, string> = {}
  const dependencies: Record<string, string[]> = {}

  const blocks = input.split(/\n(?=")/)
  for (const block of blocks) {
    const header = block.match(/^"((?:@[^"]+\/)?[^"]+)"/)
    const versionLine = block.match(/^\s+version\s+"([^"]+)"/m)
    if (!header || !versionLine) continue

    const npmPackage = header[1].split('@').slice(0, header[1].startsWith('@') ? 2 : 1).join('@').replace(/@$/, '')
    addVersion(versions, npmPackage, versionLine[1], errors)

    const depSection = block.match(/^\s+dependencies:\s*\n((?:\s+.+\n?)+)/m)
    if (depSection) {
      const deps = [...depSection[1].matchAll(/^\s+((?:@[\w.-]+\/)?[\w.-]+)\s/m)].map((m) => m[1])
      if (deps.length > 0) dependencies[npmPackage] = deps
    }
  }

  return { format: 'yarn', versions, dependencies, errors }
}

export function mergeImportedVersions(
  ...maps: Array<Record<string, string>>
): Record<string, string> {
  return Object.assign({}, ...maps)
}
