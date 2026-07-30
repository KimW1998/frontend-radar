export type PackageManager = 'npm' | 'pnpm' | 'yarn'

export const PACKAGE_MANAGER_LABELS: Record<PackageManager, string> = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'yarn',
}

export function formatUpgradeCommand(
  npmPackage: string,
  version: string,
  manager: PackageManager,
): string {
  const spec = `${npmPackage}@${version}`
  switch (manager) {
    case 'npm':
      return `npm install ${spec}`
    case 'pnpm':
      return `pnpm add ${spec}`
    case 'yarn':
      return `yarn add ${spec}`
  }
}

export function needsDependencyUpgrade(
  currentVersion: string,
  recommendedVersion: string,
  riskLevel: string,
): boolean {
  if (!currentVersion.trim() || currentVersion === 'Not configured') return false
  if (riskLevel !== 'safe') return true
  return currentVersion !== recommendedVersion
}
