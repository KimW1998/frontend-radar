import type { LockfileParseResult } from '@/services/lockfile'
import type { LockfileGraphSnapshot } from '@/types/lockfile-graph'

export function createLockfileGraphSnapshot(parsed: LockfileParseResult): LockfileGraphSnapshot {
  return {
    format: parsed.format,
    versions: { ...parsed.versions },
    dependencies: Object.fromEntries(
      Object.entries(parsed.dependencies).map(([pkg, deps]) => [pkg, [...deps]]),
    ),
    capturedAt: new Date().toISOString(),
  }
}
