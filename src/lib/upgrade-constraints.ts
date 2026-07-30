import type { Dependency, UpgradeBlocker, UpgradePlanStep } from '@/types'
import { needsDependencyUpgrade } from '@/lib/upgrade-command'
import { satisfiesSemverRange } from '@/lib/semver-range'

/** Packages that should stay on matching versions when either one upgrades. */
export const VERSION_LOCKED_PAIRS: Array<[string, string]> = [
  ['react', 'react-dom'],
]

export interface UpgradeConstraintInput {
  id: string
  name: string
  npmPackage: string
  currentVersion: string
  recommendedVersion: string
  riskLevel: Dependency['riskLevel']
  peerDependencies?: Record<string, string>
}

function packageNeedsUpgrade(dep: UpgradeConstraintInput): boolean {
  if (!dep.currentVersion.trim() || dep.currentVersion === 'Not configured') return false
  return needsDependencyUpgrade(dep.currentVersion, dep.recommendedVersion, dep.riskLevel)
}

function findWatchlistPeer(
  npmPackage: string,
  byNpmPackage: Map<string, UpgradeConstraintInput>,
): UpgradeConstraintInput | undefined {
  return byNpmPackage.get(npmPackage)
}

function buildBlockerMessage(
  dependentName: string,
  peerName: string,
  requiredRange: string,
  currentVersion: string,
  targetVersion: string,
): string {
  return `${dependentName} requires ${peerName} ${requiredRange}, but you have ${currentVersion}. Upgrade ${peerName} to ${targetVersion} first.`
}

export function analyzeUpgradeConstraints(deps: UpgradeConstraintInput[]): {
  enriched: Array<
    UpgradeConstraintInput & {
      upgradeBlockers: UpgradeBlocker[]
      relatedUpgrades: string[]
    }
  >
  upgradePlan: UpgradePlanStep[]
} {
  const byNpmPackage = new Map(deps.map((dep) => [dep.npmPackage, dep]))
  const blockersById = new Map<string, UpgradeBlocker[]>()
  const relatedById = new Map<string, Set<string>>()
  const edges: Array<{ before: string; after: string }> = []

  const ensureSets = (id: string) => {
    if (!blockersById.has(id)) blockersById.set(id, [])
    if (!relatedById.has(id)) relatedById.set(id, new Set())
  }

  for (const dep of deps) {
    ensureSets(dep.id)
    if (!packageNeedsUpgrade(dep)) continue

    for (const [peerPackage, requiredRange] of Object.entries(dep.peerDependencies ?? {})) {
      const peer = findWatchlistPeer(peerPackage, byNpmPackage)
      if (!peer || peer.id === dep.id) continue

      ensureSets(peer.id)

      const currentOk = satisfiesSemverRange(peer.currentVersion, requiredRange)
      if (currentOk) continue

      const recommendedOk = satisfiesSemverRange(peer.recommendedVersion, requiredRange)

      relatedById.get(dep.id)!.add(peer.name)
      relatedById.get(peer.id)!.add(dep.name)
      edges.push({ before: peer.id, after: dep.id })

      if (recommendedOk) {
        blockersById.get(dep.id)!.push({
          packageName: peer.name,
          npmPackage: peer.npmPackage,
          requiredRange,
          currentVersion: peer.currentVersion,
          targetVersion: peer.recommendedVersion,
          message: buildBlockerMessage(
            dep.name,
            peer.name,
            requiredRange,
            peer.currentVersion,
            peer.recommendedVersion,
          ),
        })
      } else {
        blockersById.get(dep.id)!.push({
          packageName: peer.name,
          npmPackage: peer.npmPackage,
          requiredRange,
          currentVersion: peer.currentVersion,
          targetVersion: peer.recommendedVersion,
          message: `${dep.name} requires ${peer.name} ${requiredRange}, but ${peer.recommendedVersion} still may not satisfy that range. Review compatibility manually.`,
        })
      }
    }
  }

  for (const [left, right] of VERSION_LOCKED_PAIRS) {
    const a = byNpmPackage.get(left)
    const b = byNpmPackage.get(right)
    if (!a || !b) continue

    ensureSets(a.id)
    ensureSets(b.id)

    const aNeeds = packageNeedsUpgrade(a)
    const bNeeds = packageNeedsUpgrade(b)
    if (!aNeeds && !bNeeds) continue

    relatedById.get(a.id)!.add(b.name)
    relatedById.get(b.id)!.add(a.name)
  }

  const upgradeCandidates = new Set<string>()
  for (const dep of deps) {
    if (packageNeedsUpgrade(dep)) upgradeCandidates.add(dep.id)
  }
  for (const blockers of blockersById.values()) {
    for (const blocker of blockers) {
      const peer = [...byNpmPackage.values()].find((dep) => dep.npmPackage === blocker.npmPackage)
      if (peer) upgradeCandidates.add(peer.id)
    }
  }

  const upgradePlan = buildUpgradePlan(deps, upgradeCandidates, edges, blockersById)

  const enriched = deps.map((dep) => ({
    ...dep,
    upgradeBlockers: blockersById.get(dep.id) ?? [],
    relatedUpgrades: [...(relatedById.get(dep.id) ?? [])],
  }))

  return { enriched, upgradePlan }
}

function shouldIncludeInPlan(
  dep: UpgradeConstraintInput,
  blockersById: Map<string, UpgradeBlocker[]>,
): boolean {
  if (packageNeedsUpgrade(dep)) return true
  for (const blockers of blockersById.values()) {
    if (blockers.some((blocker) => blocker.npmPackage === dep.npmPackage)) return true
  }
  return false
}

function buildUpgradePlan(
  deps: UpgradeConstraintInput[],
  candidateIds: Set<string>,
  edges: Array<{ before: string; after: string }>,
  blockersById: Map<string, UpgradeBlocker[]>,
): UpgradePlanStep[] {
  if (candidateIds.size === 0) return []

  const depById = new Map(deps.map((dep) => [dep.id, dep]))
  const incoming = new Map<string, Set<string>>()
  const outgoing = new Map<string, Set<string>>()

  for (const id of candidateIds) {
    incoming.set(id, new Set())
    outgoing.set(id, new Set())
  }

  for (const edge of edges) {
    if (!candidateIds.has(edge.before) || !candidateIds.has(edge.after) || edge.before === edge.after) {
      continue
    }
    outgoing.get(edge.before)!.add(edge.after)
    incoming.get(edge.after)!.add(edge.before)
  }

  const remaining = new Set(candidateIds)
  const steps: UpgradePlanStep[] = []
  let stepNumber = 1

  while (remaining.size > 0) {
    const ready = [...remaining].filter((id) => incoming.get(id)!.size === 0)
    if (ready.length === 0) {
      ready.push(...remaining)
    }

    const packages = ready
      .map((id) => depById.get(id))
      .filter((dep): dep is UpgradeConstraintInput => Boolean(dep))
      .filter((dep) => shouldIncludeInPlan(dep, blockersById))
      .map((dep) => ({
        id: dep.id,
        name: dep.name,
        npmPackage: dep.npmPackage,
        fromVersion: dep.currentVersion,
        toVersion: dep.recommendedVersion,
      }))

    if (packages.length > 0) {
      steps.push({
        step: stepNumber,
        title:
          stepNumber === 1
            ? 'Upgrade these packages first'
            : `Step ${stepNumber}`,
        packages,
      })
      stepNumber += 1
    }

    for (const id of ready) {
      remaining.delete(id)
      for (const next of outgoing.get(id) ?? []) {
        incoming.get(next)?.delete(id)
      }
    }
  }

  return steps
}

export function applyUpgradeConstraints(dependencies: Dependency[]): {
  dependencies: Dependency[]
  upgradePlan: UpgradePlanStep[]
} {
  const input: UpgradeConstraintInput[] = dependencies.map((dep) => ({
    id: dep.id,
    name: dep.name,
    npmPackage: dep.npmPackage ?? dep.name,
    currentVersion: dep.currentVersion,
    recommendedVersion: dep.recommendedVersion,
    riskLevel: dep.riskLevel,
    peerDependencies: dep.peerDependencies,
  }))

  const { enriched, upgradePlan } = analyzeUpgradeConstraints(input)

  const enrichedById = new Map(enriched.map((dep) => [dep.id, dep]))

  return {
    dependencies: dependencies.map((dep) => {
      const analysis = enrichedById.get(dep.id)
      if (!analysis) return dep
      return {
        ...dep,
        upgradeBlockers: analysis.upgradeBlockers,
        relatedUpgrades: analysis.relatedUpgrades,
      }
    }),
    upgradePlan,
  }
}
