import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterCategory } from '@/types'

export {
  useSettingsStore,
  selectActiveProject,
} from '@/stores/settings-store'

export { useUpgradePlanStore } from '@/stores/upgrade-plan-store'

interface FilterState {
  activeFilters: FilterCategory[]
  searchQuery: string
  toggleFilter: (category: FilterCategory) => void
  setFilters: (categories: FilterCategory[]) => void
  clearFilters: () => void
  setSearchQuery: (query: string) => void
}

export const useFilterStore = create<FilterState>()((set) => ({
  activeFilters: [],
  searchQuery: '',
  toggleFilter: (category) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(category)
        ? state.activeFilters.filter((f) => f !== category)
        : [...state.activeFilters, category],
    })),
  setFilters: (categories) => set({ activeFilters: categories }),
  clearFilters: () => set({ activeFilters: [], searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

import type { PackageManager } from '@/lib/upgrade-command'

interface UiState {
  sidebarOpen: boolean
  colorMode: 'dark' | 'light'
  packageManager: PackageManager
  notificationsEnabled: boolean
  lastNotificationFingerprint: string
  toggleSidebar: () => void
  closeSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleColorMode: () => void
  setColorMode: (mode: 'dark' | 'light') => void
  setPackageManager: (manager: PackageManager) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setLastNotificationFingerprint: (fingerprint: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      colorMode: 'dark',
      packageManager: 'npm',
      notificationsEnabled: false,
      lastNotificationFingerprint: '',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleColorMode: () =>
        set((state) => ({
          colorMode: state.colorMode === 'dark' ? 'light' : 'dark',
        })),
      setColorMode: (mode) => set({ colorMode: mode }),
      setPackageManager: (manager) => set({ packageManager: manager }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setLastNotificationFingerprint: (fingerprint) => set({ lastNotificationFingerprint: fingerprint }),
    }),
    {
      name: 'frontend-radar-ui',
      partialize: (state) => ({
        colorMode: state.colorMode,
        packageManager: state.packageManager,
        notificationsEnabled: state.notificationsEnabled,
        lastNotificationFingerprint: state.lastNotificationFingerprint,
      }),
    },
  ),
)

export function matchesFilter(
  categories: FilterCategory[],
  activeFilters: FilterCategory[],
  searchQuery: string,
  searchFields: string[],
): boolean {
  if (activeFilters.length > 0) {
    const hasMatch = categories.some((c) => activeFilters.includes(c))
    if (!hasMatch) return false
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    return searchFields.some((f) => f.toLowerCase().includes(q))
  }

  return true
}
