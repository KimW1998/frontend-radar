export interface GitHubImportPayload {
  packageJson: string
  lockfile?: string
  lockfilePath?: string | null
}

export const emptyStackImportFields = {
  discoveredFromPackageJson: [] as Array<{ npmPackage: string; version: string; name: string }>,
  discoveredFromLockfileOnly: [] as Array<{ npmPackage: string; version: string; name: string }>,
}
