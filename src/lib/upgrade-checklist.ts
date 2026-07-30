import type { UpgradePlanStep } from '@/types'
import { formatUpgradeCommand, type PackageManager } from '@/lib/upgrade-command'

export function buildUpgradeChecklistMarkdown(
  projectName: string,
  upgradePlan: UpgradePlanStep[],
  packageManager: PackageManager,
): string {
  const lines = [
    `# Upgrade checklist — ${projectName}`,
    '',
    `- Generated: ${new Date().toLocaleString()}`,
    `- Package manager: ${packageManager}`,
    '',
  ]

  for (const step of upgradePlan) {
    lines.push(`## Step ${step.step}: ${step.title}`, '')
    for (const pkg of step.packages) {
      lines.push(
        `- [ ] **${pkg.name}** \`${pkg.fromVersion}\` → \`${pkg.toVersion}\``,
        `      \`${formatUpgradeCommand(pkg.npmPackage, pkg.toVersion, packageManager)}\``,
        '',
      )
    }
  }

  lines.push('## Notes', '', '- Run your test suite after each step.', '- Deploy to staging before production.')
  return lines.join('\n')
}

export function buildFullUpgradeScript(
  upgradePlan: UpgradePlanStep[],
  packageManager: PackageManager,
): string {
  const commands = upgradePlan.flatMap((step) =>
    step.packages.map((pkg) => formatUpgradeCommand(pkg.npmPackage, pkg.toVersion, packageManager)),
  )
  return commands.join(' && ')
}
