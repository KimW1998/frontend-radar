import type { LockfileFormat } from '@/services/lockfile'

export interface LockfileGraphSnapshot {
  format: LockfileFormat
  versions: Record<string, string>
  dependencies: Record<string, string[]>
  capturedAt: string
}
