import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import { getTrackedPackages, resolveTrackedPackageIds } from '@/lib/watchlist'
import {
  createDriftReport,
  createImportSnapshot,
  detectVersionDrift,
} from '@/lib/version-drift'
import { createLockfileGraphSnapshot } from '@/lib/lockfile-graph'
import {
  parseStackImport,
  type StackImportResult,
} from '@/services/stack-import'
import { parseLockfileInput } from '@/services/lockfile'
import { createEmptyProject, type Project } from '@/types/project'
import { createCustomPackage } from '@/types/custom-package'
import type { DriftReport } from '@/types/import-snapshot'
import type { GitHubSyncConfig } from '@/types/github-sync'

const initialVersions = Object.fromEntries(
  WATCHLIST_PACKAGES.map((p) => [p.npmPackage, '']),
)

interface LegacySettingsState {
  configuredVersions?: Record<string, string>
  nodeVersion?: string
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
        | 'trackedPackageIds'
        | 'customPackages'
        | 'importSnapshot'
        | 'lastDriftReport'
        | 'lockfileGraph'
        | 'githubSync'
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
  trackDiscoveredPackages: (npmPackages: string[]) => void
  importFromStack: (input: { packageJson?: string; lockfile?: string }) => StackImportResult
  checkStackDrift: (input: { packageJson?: string; lockfile?: string }) => DriftReport
  importFromPackageJson: (json: string) => StackImportResult
  clearDriftReport: () => void
  setGitHubSync: (config: GitHubSyncConfig | undefined) => void
  applyGitHubImport: (input: {
    packageJson: string
    lockfile?: string
    githubSync: GitHubSyncConfig
  }) => StackImportResult
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
  const customPackages = [...project.customPackages]
  const configuredVersions = { ...project.configuredVersions }
  const trackedPackageIds: string[] = []

  for (const item of packages) {
    configuredVersions[item.npmPackage] = item.version
    const catalogEntry = WATCHLIST_PACKAGES.find((p) => p.npmPackage === item.npmPackage)
    if (catalogEntry) {
      trackedPackageIds.push(catalogEntry.id)
      continue
    }
    let custom = customPackages.find((p) => p.npmPackage === item.npmPackage)
    if (!custom) {
      custom = createCustomPackage(item.npmPackage, item.name)
      customPackages.push(custom)
    }
    trackedPackageIds.push(custom.id)
  }

  return {
    customPackages,
    trackedPackageIds: resolveTrackedPackageIds(trackedPackageIds, customPackages),
    configuredVersions,
  }
}

function runStackImport(active: Project, input: { packageJson?: string; lockfile?: string }): {
  result: StackImportResult
  drift: DriftReport
} {
  const packages = getTrackedPackagesForProject(active)
  const result = parseStackImport(packages, input)
  const drift = createDriftReport(
    detectVersionDrift(active.configuredVersions, result.importedVersions, packages),
  )
  return { result, drift }
}

function getTrackedPackagesForProject(project: Project) {
  return getTrackedPackages(project.trackedPackageIds, project.customPackages)
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name) => {
        const project = createEmptyProject(name.trim() || 'Untitled project', initialVersions)
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
            if (has && current.length <= 1) return p
            const next = has ? current.filter((id) => id !== packageId) : [...current, packageId]
            return touchProject(p, { trackedPackageIds: next })
          }),
        )
      },

      setTrackedPackages: (packageIds) => {
        set((state) => {
          const active = getActiveProject(state)
          if (!active) return state
          const resolved = resolveTrackedPackageIds(packageIds, active.customPackages)
          if (resolved.length === 0) return state
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
            const trackedPackageIds = resolveTrackedPackageIds(
              [...p.trackedPackageIds, custom.id],
              [...p.customPackages, custom],
            )
            return touchProject(p, {
              customPackages: [...p.customPackages, custom],
              trackedPackageIds,
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

      trackDiscoveredPackages: (npmPackages) => {
        for (const npmPackage of npmPackages) {
          get().addCustomPackage(npmPackage)
        }
      },

      importFromStack: (input) => {
        const active = getActiveProject(get())
        if (!active) {
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
            source: 'package-json' as const,
            errors: ['Create a project first'],
          }
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
            }),
          ),
        )

        return result
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

      applyGitHubImport: ({ packageJson, lockfile, githubSync }) => {
        const active = getActiveProject(get())
        if (!active) {
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
            source: 'package-json' as const,
            errors: ['Create a project first'],
          }
        }

        const { result, drift } = runStackImport(active, { packageJson, lockfile })
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
            }),
          ),
        )

        return result
      },
    }),
    {
      name: 'frontend-radar-settings',
      version: 5,
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as LegacySettingsState
          const project = createEmptyProject('My Project', old.configuredVersions ?? initialVersions)
          if (old.nodeVersion) project.nodeVersion = old.nodeVersion
          return { projects: [project], activeProjectId: project.id }
        }
        if (version === 1) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              enginesNodeRequirement: (p as Project).enginesNodeRequirement ?? '',
            })),
          }
        }
        if (version === 2) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              trackedPackageIds: resolveTrackedPackageIds((p as Project).trackedPackageIds),
            })),
          }
        }
        if (version === 3) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              customPackages: (p as Project).customPackages ?? [],
              importSnapshot: (p as Project).importSnapshot,
              lastDriftReport: (p as Project).lastDriftReport,
            })),
          }
        }
        if (version === 4) {
          const state = persisted as SettingsState
          return {
            ...state,
            projects: state.projects.map((p) => ({
              ...p,
              lockfileGraph: (p as Project).lockfileGraph,
              githubSync: (p as Project).githubSync,
            })),
          }
        }
        return persisted as SettingsState
      },
    },
  ),
)

export function selectActiveProject(state: SettingsState): Project | null {
  return getActiveProject(state)
}
