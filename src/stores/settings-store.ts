import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import {
  applyPackageJsonImport,
  parsePackageJsonInput,
  type PackageJsonImportResult,
} from '@/services/package-json'
import { createEmptyProject, type Project } from '@/types/project'
import { resolveTrackedPackageIds } from '@/lib/watchlist'

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
      Pick<Project, 'name' | 'configuredVersions' | 'enginesNodeRequirement' | 'nodeVersion' | 'trackedPackageIds'>
    >,
  ) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string) => void
  renameActiveProject: (name: string) => void
  setConfiguredVersion: (pkg: string, version: string) => void
  setNodeVersion: (version: string) => void
  toggleTrackedPackage: (packageId: string) => void
  setTrackedPackages: (packageIds: string[]) => void
  importFromPackageJson: (json: string) => PackageJsonImportResult
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
          projects: state.projects.map((p) =>
            p.id === id ? touchProject(p, patch) : p,
          ),
        }))
      },

      deleteProject: (id) => {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id)
          const nextActive =
            state.activeProjectId === id
              ? (remaining[0]?.id ?? null)
              : state.activeProjectId
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
            const current = resolveTrackedPackageIds(p.trackedPackageIds)
            const has = current.includes(packageId)
            if (has && current.length <= 1) return p
            const next = has
              ? current.filter((id) => id !== packageId)
              : [...current, packageId]
            return touchProject(p, { trackedPackageIds: next })
          }),
        )
      },

      setTrackedPackages: (packageIds) => {
        const resolved = resolveTrackedPackageIds(packageIds)
        if (resolved.length === 0) return
        set((state) =>
          updateActiveProject(state, (p) => touchProject(p, { trackedPackageIds: resolved })),
        )
      },

      importFromPackageJson: (json) => {
        const state = get()
        const active = getActiveProject(state)
        if (!active) {
          return {
            matched: [],
            missing: WATCHLIST_PACKAGES.map((p) => ({ name: p.name, npmPackage: p.npmPackage })),
            nodeVersion: null,
            enginesNode: null,
            errors: ['Create a project first'],
          }
        }

        const result = parsePackageJsonInput(json)
        const configuredVersions = applyPackageJsonImport(active.configuredVersions, result)

        set((s) =>
          updateActiveProject(s, (p) =>
            touchProject(p, {
              configuredVersions,
              enginesNodeRequirement: result.enginesNode ?? p.enginesNodeRequirement,
              nodeVersion: p.nodeVersion.trim() ? p.nodeVersion : (result.nodeVersion ?? p.nodeVersion),
            }),
          ),
        )

        return result
      },
    }),
    {
      name: 'frontend-radar-settings',
      version: 3,
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as LegacySettingsState
          const project = createEmptyProject('My Project', old.configuredVersions ?? initialVersions)
          if (old.nodeVersion) project.nodeVersion = old.nodeVersion
          return {
            projects: [project],
            activeProjectId: project.id,
          }
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
        return persisted as SettingsState
      },
    },
  ),
)

export function selectActiveProject(state: SettingsState): Project | null {
  return getActiveProject(state)
}
