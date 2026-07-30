import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UpgradePlanState {
  completed: Record<string, Record<string, boolean>>
  togglePackageCompleted: (projectId: string, packageId: string) => void
  markStepCompleted: (projectId: string, packageIds: string[]) => void
  clearProjectProgress: (projectId: string) => void
  isPackageCompleted: (projectId: string, packageId: string) => boolean
}

export const useUpgradePlanStore = create<UpgradePlanState>()(
  persist(
    (set, get) => ({
      completed: {},

      togglePackageCompleted: (projectId, packageId) => {
        set((state) => {
          const projectProgress = { ...(state.completed[projectId] ?? {}) }
          projectProgress[packageId] = !projectProgress[packageId]
          return {
            completed: {
              ...state.completed,
              [projectId]: projectProgress,
            },
          }
        })
      },

      markStepCompleted: (projectId, packageIds) => {
        set((state) => {
          const projectProgress = { ...(state.completed[projectId] ?? {}) }
          for (const packageId of packageIds) {
            projectProgress[packageId] = true
          }
          return {
            completed: {
              ...state.completed,
              [projectId]: projectProgress,
            },
          }
        })
      },

      clearProjectProgress: (projectId) => {
        set((state) => {
          const next = { ...state.completed }
          delete next[projectId]
          return { completed: next }
        })
      },

      isPackageCompleted: (projectId, packageId) => {
        return Boolean(get().completed[projectId]?.[packageId])
      },
    }),
    { name: 'frontend-radar-upgrade-plan' },
  ),
)
