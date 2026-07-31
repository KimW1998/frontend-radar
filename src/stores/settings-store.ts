import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { getTrackedPackages, resolveTrackedPackageIds } from '@/lib/watchlist'
import {
  createDriftReport,
  createImportSnapshot,
  detectVersionDrift,
} from '@/lib/version-drift'
import { computeImportPreview, type ImportPreview } from '@/lib/import-preview'
import { pruneExpiredSnoozes, snoozeUntil } from '@/lib/alert-snooze'
import { createLockfileGraphSnapshot } from '@/lib/lockfile-graph'
import {
  parseStackImport,
  type StackImportResult,
} from '@/services/stack-import'
import { parseLockfileInput } from '@/services/lockfile'
import { createEmptyProject, type Project } from '@/types/project'
import { createCustomPackage } from '@/types/custom-package'
import type { DriftReport } from '@/types/import-snapshot'
import type { GitHubSyncConfig, GitHubSyncChangeNotice } from '@/types/github-sync'

interface LegacySettingsState {
  configuredVersions?: Record<string, string>
  nodeVersion?: string
}

type LegacyProject = Omit<Project, 'trackedPackageIds'> & {
  trackedPackageIds?: string[]
}

interface SettingsState {
  projects: Project[]
  activeProjectId: string | null
  createProject: (name: string) => string
  updateProject: (
    id: string,
    patch: Partial<
      Pick<
        Project,
        | 'name'
        | 'configuredVersions'
        | 'enginesNodeRequirement'
        | 'nodeVersion'
        | 'customPackages'
        | 'trackedPackageIds'
        | 'importSnapshot'
        | 'lastDriftReport'
        | 'lockfileGraph'
        | 'githubSync'
        | 'lastGitHubSyncChange'
        | 'snoozedAlerts'
      >
    >,
  ) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string) => void
  renameActiveProject: (name: string) => void
  setConfiguredVersion: (pkg: string, version: string) => void
  setNodeVersion: (version: string) => void
  toggleTrackedPackage: (packageId: string) => void
  setTrackedPackages: (packageIds: string[]) => void
  addCustomPackage: (npmPackage: string, name?: string) => void
  removeCustomPackage: (packageId: string) => void
  trackDiscoveredPackages: (
    packages: Array<{ npmPackage: string; version: string }>,
  ) => number
  importFromStack: (input: { packageJson?: string; lockfile?: string }) => StackImportResult
  previewStackImport: (input: { packageJson?: string; lockfile?: string }) => {
    result: StackImportResult
    preview: ImportPreview
  }
  checkStackDrift: (input: { packageJson?: string; lockfile?: string }) => DriftReport
  importFromPackageJson: (json: string) => StackImportResult
  clearDriftReport: () => void
  setGitHubSync: (config: GitHubSyncConfig | undefined) => void
  applyGitHubImport: (input: {
    packageJson: string
    lockfile?: string
    githubSync: GitHubSyncConfig
    source?: 'auto' | 'manual'
  }) => StackImportResult
  dismissGitHubSyncChange: () => void
  snoozeAlert: (alertKey: string, days?: number) => void
  clearSnooze: (alertKey: string) => void
  trackRecommendedPackages: (npmPackages: string[]) => number
}

function touchProject(project: Project, patch: Partial<Project>): Project {
  return {
    ...project,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
}

function getActiveProject(state: SettingsState): Project | null {
  if (!state.activeProjectId) return null
  return state.projects.find((p) => p.id === state.activeProjectId) ?? null
}

function updateActiveProject(
  state: SettingsState,
  updater: (project: Project) => Project,
): Partial<SettingsState> {
  const active = getActiveProject(state)
  if (!active) return {}
  return {
    projects: state.projects.map((p) => (p.id === active.id ? updater(p) : p)),
  }
}

function buildLockfileGraph(lockfile?: string) {
  if (!lockfile?.trim()) return undefined
  return createLockfileGraphSnapshot(parseLockfileInput(lockfile))
}

function applyPackageJsonTracking(
  project: Project,
  packages: Array<{ npmPackage: string; version: string; name: string }>,
): Pick<Project, 'customPackages' | 'trackedPackageIds' | 'configuredVersions'> {
  const packageJsonNames = new Set(packages.map((item) => item.npmPackage))
  const lockfileExtras = project.customPackages.filter((pkg) => !packageJsonNames.has(pkg.npmPackage))
  const configuredVersions = { ...project.configuredVersions }
  const previousTracked = new Set(project.trackedPackageIds)

  const fromPackageJson = packages.map((item) => {
    configuredVersions[item.npmPackage] = item.version
    const existing = project.customPackages.find((pkg) => pkg.npmPackage === item.npmPackage)
    return existing ?? createCustomPackage(item.npmPackage, item.name)
  })

  const customPackages = [...fromPackageJson, ...lockfileExtras]
  const trackedPackageIds = customPackages
    .filter((pkg) => packageJsonNames.has(pkg.npmPackage) || previousTracked.has(pkg.id))
    .map((pkg) => pkg.id)

  return {
    customPackages,
    trackedPackageIds,
    configuredVersions,
  }
}

function buildGitHubSyncChangeNotice(
  preview: ImportPreview,
  source: 'auto' | 'manual',
): GitHubSyncChangeNotice | undefined {
  if (!preview.hasChanges) return undefined
  return {
    detectedAt: new Date().toISOString(),
    source,
    preview,
  }
}

function runStackImport(active: Project, input: { packageJson?: string; lockfile?: string }): {
  result: StackImportResult
  drift: DriftReport
} {
  const packages = getTrackedPackages(active.trackedPackageIds, active.customPackages)
  const result = parseStackImport(packages, input)
  const drift = createDriftReport(
    detectVersionDrift(active.configuredVersions, result.importedVersions, packages),
  )
  return { result, drift }
}

function migrateToPackageJsonOnly(project: LegacyProject): Project {
  const npmNames = new Set<string>()

  for (const custom of project.customPackages ?? []) {
    npmNames.add(custom.npmPackage)
  }
  for (const [npm, version] of Object.entries(project.configuredVersions ?? {})) {
    if (version.trim()) npmNames.add(npm)
  }

  const customPackages = [...npmNames].map((npmPackage) => {
    const existing = project.customPackages?.find((pkg) => pkg.npmPackage === npmPackage)
    if (existing) return existing
    const known = WATCHLIST_PACKAGES.find((pkg) => pkg.npmPackage === npmPackage)
    return createCustomPackage(npmPackage, known?.name)
  })

  const configuredVersions = Object.fromEntries(
    customPackages
      .map((pkg) => [pkg.npmPackage, project.configuredVersions?.[pkg.npmPackage]?.trim() ?? ''] as const)
      .filter(([, version]) => version.length > 0),
  )

  const { trackedPackageIds: _legacyTracked, ...rest } = project
  return {
    ...rest,
    customPackages,
    trackedPackageIds: customPackages.map((pkg) => pkg.id),
    configuredVersions,
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name) => {
        const project = createEmptyProject(name.trim() || 'Untitled project')
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
        }))
        return project.id
      },

      updateProject: (id, patch) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? touchProject(p, patch) : p)),
        }))
      },

      deleteProject: (id) => {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id)
          const nextActive =
            state.activeProjectId === id ? (remaining[0]?.id ?? null) : state.activeProjectId
          return { projects: remaining, activeProjectId: nextActive }
        })
      },

      setActiveProject: (id) => {
        if (get().projects.some((p) => p.id === id)) {
          set({ activeProjectId: id })
        }
      },

      renameActiveProject: (name) => {
        set((state) => updateActiveProject(state, (p) => touchProject(p, { name: name.trim() || p.name })))
      },

      setConfiguredVersion: (pkg, version) => {
        set((state) =>
          updateActiveProject(state, (p) =>
            touchProject(p, {
              configuredVersions: { ...p.configuredVersions, [pkg]: version },
            }),
          ),
        )
      },

      setNodeVersion: (version) => {
        set((state) => updateActiveProject(state, (p) => touchProject(p, { nodeVersion: version })))
      },

      toggleTrackedPackage: (packageId) => {
        set((state) =>
          updateActiveProject(state, (p) => {
            const current = resolveTrackedPackageIds(p.trackedPackageIds, p.customPackages)
            const has = current.includes(packageId)
            const next = has ? current.filter((id) => id !== packageId) : [...current, packageId]
            return touchProject(p, { trackedPackageIds: next })
          }),
        )
      },

      setTrackedPackages: (packageIds) => {
        set((state) => {
          const active = getActiveProject(state)
          if (!active) return state
          const valid = new Set(active.customPackages.map((pkg) => pkg.id))
          const resolved = packageIds.filter((id) => valid.has(id))
          return updateActiveProject(state, (p) => touchProject(p, { trackedPackageIds: resolved }))
        })
      },

      addCustomPackage: (npmPackage, name) => {
        const trimmed = npmPackage.trim()
        if (!trimmed) return
        set((state) =>
          updateActiveProject(state, (p) => {
            if (p.customPackages.some((pkg) => pkg.npmPackage === trimmed)) return p
            const custom = createCustomPackage(trimmed, name)
            return touchProject(p, {
              customPackages: [...p.customPackages, custom],
              trackedPackageIds: resolveTrackedPackageIds(
                [...p.trackedPackageIds, custom.id],
                [...p.customPackages, custom],
              ),
              configuredVersions: { ...p.configuredVersions, [trimmed]: p.configuredVersions[trimmed] ?? '' },
            })
          }),
        )
      },

      removeCustomPackage: (packageId) => {
        set((state) =>
          updateActiveProject(state, (p) => {
            const custom = p.customPackages.find((pkg) => pkg.id === packageId)
            if (!custom) return p
            const nextCustom = p.customPackages.filter((pkg) => pkg.id !== packageId)
            if (nextCustom.length === 0) return p
            const nextVersions = { ...p.configuredVersions }
            delete nextVersions[custom.npmPackage]
            return touchProject(p, {
              customPackages: nextCustom,
              trackedPackageIds: resolveTrackedPackageIds(
                p.trackedPackageIds.filter((id) => id !== packageId),
                nextCustom,
              ),
              configuredVersions: nextVersions,
            })
          }),
        )
      },

      trackDiscoveredPackages: (packages) => {
        const active = getActiveProject(get())
        if (!active || packages.length === 0) return 0

        let trackedCount = 0

        set((state) =>
          updateActiveProject(state, (p) => {
            const customPackages = [...p.customPackages]
            let trackedPackageIds = [...p.trackedPackageIds]
            const configuredVersions = { ...p.configuredVersions }

            for (const item of packages) {
              const trimmed = item.npmPackage.trim()
              const version = item.version.trim()
              if (!trimmed || !version) continue

              configuredVersions[trimmed] = version
              trackedCount += 1

              const existing = customPackages.find((pkg) => pkg.npmPackage === trimmed)
              if (existing) {
                if (!trackedPackageIds.includes(existing.id)) {
                  trackedPackageIds.push(existing.id)
                }
                continue
              }

              const custom = createCustomPackage(trimmed)
              customPackages.push(custom)
              trackedPackageIds.push(custom.id)
            }

            return touchProject(p, {
              customPackages,
              trackedPackageIds: resolveTrackedPackageIds(trackedPackageIds, customPackages),
              configuredVersions,
            })
          }),
        )

        return trackedCount
      },

      importFromStack: (input) => {
        const active = getActiveProject(get())
        if (!active) {
          return emptyStackImportResult('Create a project first')
        }

        const { result, drift } = runStackImport(active, input)
        const packageJsonTracking =
          result.packagesFromPackageJson.length > 0
            ? applyPackageJsonTracking(active, result.packagesFromPackageJson)
            : {
                customPackages: active.customPackages,
                trackedPackageIds: active.trackedPackageIds,
                configuredVersions: active.configuredVersions,
              }
        const nodeVersion = active.nodeVersion.trim() ? active.nodeVersion : (result.nodeVersion ?? active.nodeVersion)
        const lockfileGraph = buildLockfileGraph(input.lockfile)

        set((state) =>
          updateActiveProject(state, (p) =>
            touchProject(p, {
              ...packageJsonTracking,
              enginesNodeRequirement: result.enginesNode ?? p.enginesNodeRequirement,
              nodeVersion,
              importSnapshot: createImportSnapshot(
                packageJsonTracking.configuredVersions,
                nodeVersion,
                result.source,
              ),
              lastDriftReport: drift,
              lockfileGraph: lockfileGraph ?? p.lockfileGraph,
              lastGitHubSyncChange: undefined,
            }),
          ),
        )

        return result
      },

      previewStackImport: (input) => {
        const active = getActiveProject(get())
        if (!active) {
          const result = emptyStackImportResult('Create a project first')
          return { result, preview: { added: [], removed: [], versionChanges: [], hasChanges: false } }
        }

        const { result } = runStackImport(active, input)
        const preview = computeImportPreview(active, result)
        return { result, preview }
      },

      checkStackDrift: (input) => {
        const active = getActiveProject(get())
        if (!active) return createDriftReport([])

        const { drift } = runStackImport(active, input)
        set((state) => updateActiveProject(state, (p) => touchProject(p, { lastDriftReport: drift })))
        return drift
      },

      importFromPackageJson: (json) => get().importFromStack({ packageJson: json }),

      clearDriftReport: () => {
        set((state) => updateActiveProject(state, (p) => touchProject(p, { lastDriftReport: undefined })))
      },

      setGitHubSync: (config) => {
        set((state) => updateActiveProject(state, (p) => touchProject(p, { githubSync: config })))
      },

      applyGitHubImport: ({ packageJson, lockfile, githubSync, source = 'manual' }) => {
        const active = getActiveProject(get())
        if (!active) {
          return emptyStackImportResult('Create a project first')
        }

        const { result, drift } = runStackImport(active, { packageJson, lockfile })
        const preview = computeImportPreview(active, result)
        const packageJsonTracking =
          result.packagesFromPackageJson.length > 0
            ? applyPackageJsonTracking(active, result.packagesFromPackageJson)
            : {
                customPackages: active.customPackages,
                trackedPackageIds: active.trackedPackageIds,
                configuredVersions: active.configuredVersions,
              }
        const nodeVersion = active.nodeVersion.trim() ? active.nodeVersion : (result.nodeVersion ?? active.nodeVersion)
        const lockfileGraph = buildLockfileGraph(lockfile)
        const syncConfig = { ...githubSync, lastSyncedAt: new Date().toISOString() }
        const changeNotice = buildGitHubSyncChangeNotice(preview, source)

        set((state) =>
          updateActiveProject(state, (p) =>
            touchProject(p, {
              ...packageJsonTracking,
              enginesNodeRequirement: result.enginesNode ?? p.enginesNodeRequirement,
              nodeVersion,
              importSnapshot: createImportSnapshot(
                packageJsonTracking.configuredVersions,
                nodeVersion,
                result.source,
              ),
              lastDriftReport: drift,
              lockfileGraph: lockfileGraph ?? p.lockfileGraph,
              githubSync: syncConfig,
              lastGitHubSyncChange:
                source === 'auto' ? (changeNotice ?? p.lastGitHubSyncChange) : p.lastGitHubSyncChange,
            }),
          ),
        )

        return result
      },

      dismissGitHubSyncChange: () => {
        set((state) =>
          updateActiveProject(state, (p) =>
            touchProject(p, {
              lastGitHubSyncChange: p.lastGitHubSyncChange
                ? { ...p.lastGitHubSyncChange, dismissed: true }
                : undefined,
            }),
          ),
        )
      },

      snoozeAlert: (alertKey, days = 30) => {
        const trimmed = alertKey.trim()
        if (!trimmed) return
        set((state) =>
          updateActiveProject(state, (p) => {
            const snoozedAlerts = pruneExpiredSnoozes(p.snoozedAlerts)
            return touchProject(p, {
              snoozedAlerts: {
                ...snoozedAlerts,
                [trimmed]: snoozeUntil(days),
              },
            })
          }),
        )
      },

      clearSnooze: (alertKey) => {
        const trimmed = alertKey.trim()
        if (!trimmed) return
        set((state) =>
          updateActiveProject(state, (p) => {
            const snoozedAlerts = pruneExpiredSnoozes(p.snoozedAlerts)
            if (!snoozedAlerts[trimmed]) return p
            const next = { ...snoozedAlerts }
            delete next[trimmed]
            return touchProject(p, { snoozedAlerts: next })
          }),
        )
      },

      trackRecommendedPackages: (npmPackages) => {
        const active = getActiveProject(get())
        if (!active || npmPackages.length === 0) return 0

        const names = new Set(npmPackages.map((pkg) => pkg.trim()).filter(Boolean))
        const idsToTrack = active.customPackages
          .filter((pkg) => names.has(pkg.npmPackage))
          .map((pkg) => pkg.id)

        if (idsToTrack.length === 0) return 0

        set((state) =>
          updateActiveProject(state, (p) => {
            const merged = new Set([...p.trackedPackageIds, ...idsToTrack])
            return touchProject(p, {
              trackedPackageIds: [...merged],
            })
          }),
        )

        return idsToTrack.length
      },
    }),
    {
      name: 'frontend-radar-settings',
      version: 9,
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as LegacySettingsState
          const project = createEmptyProject('My Project')
          if (old.configuredVersions) {
            project.configuredVersions = old.configuredVersions
          }
          if (old.nodeVersion) project.nodeVersion = old.nodeVersion
          return { projects: [migrateToPackageJsonOnly(project)], activeProjectId: project.id }
        }
        if (version === 1) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) =>
              migrateToPackageJsonOnly({
                ...(p as LegacyProject),
                enginesNodeRequirement: (p as Project).enginesNodeRequirement ?? '',
              }),
            ),
          }
        }
        if (version === 2 || version === 3 || version === 4 || version === 5) {
          const state = persisted as SettingsState & { projects: LegacyProject[] }
          return {
            ...state,
            projects: state.projects.map((p) => migrateToPackageJsonOnly(p as LegacyProject)),
          }
        }
        if (version === 6) {
          const state = persisted as SettingsState & { projects: LegacyProject[] }
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              trackedPackageIds: resolveTrackedPackageIds(p.trackedPackageIds, p.customPackages ?? []),
            })),
          }
        }
        if (version === 7) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              trackedPackageIds:
                p.trackedPackageIds.length === 0 && p.customPackages.length > 0
                  ? p.customPackages.map((pkg) => pkg.id)
                  : resolveTrackedPackageIds(p.trackedPackageIds, p.customPackages),
            })),
          }
        }
        if (version === 8) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              snoozedAlerts: p.snoozedAlerts ?? {},
            })),
          }
        }
        return persisted as SettingsState
      },
    },
  ),
)

function emptyStackImportResult(error: string): StackImportResult {
  return {
    matched: [],
    missing: [],
    discovered: [],
    packagesFromPackageJson: [],
    discoveredFromPackageJson: [],
    discoveredFromLockfileOnly: [],
    importedVersions: {},
    nodeVersion: null,
    enginesNode: null,
    lockfileFormat: null,
    source: 'package-json',
    errors: [error],
  }
}

export function selectActiveProject(state: SettingsState): Project | null {
  return getActiveProject(state)
}
