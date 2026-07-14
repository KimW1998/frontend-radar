import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterCategory } from '@/types'
import { WATCHLIST_PACKAGES } from '@/data/package-catalog'
import {
  applyPackageJsonImport,
  parsePackageJsonInput,
  type PackageJsonImportResult,
} from '@/services/package-json'

const initialVersions = Object.fromEntries(
  WATCHLIST_PACKAGES.map((p) => [p.npmPackage, '']),
)

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

interface SettingsState {
  configuredVersions: Record<string, string>
  nodeVersion: string
  setConfiguredVersion: (pkg: string, version: string) => void
  setNodeVersion: (version: string) => void
  importFromPackageJson: (json: string) => PackageJsonImportResult
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      configuredVersions: initialVersions,
      nodeVersion: '22.14.0',
      setConfiguredVersion: (pkg, version) =>
        set((state) => ({
          configuredVersions: { ...state.configuredVersions, [pkg]: version },
        })),
      setNodeVersion: (version) => set({ nodeVersion: version }),
      importFromPackageJson: (json) => {
        const result = parsePackageJsonInput(json)
        set((state) => ({
          configuredVersions: applyPackageJsonImport(state.configuredVersions, result),
          nodeVersion: result.nodeVersion ?? state.nodeVersion,
        }))
        return result
      },
    }),
    { name: 'frontend-radar-settings' },
  ),
)

interface UiState {
  sidebarOpen: boolean
  colorMode: 'dark' | 'light'
  toggleSidebar: () => void
  toggleColorMode: () => void
  setColorMode: (mode: 'dark' | 'light') => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      colorMode: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleColorMode: () =>
        set((state) => ({
          colorMode: state.colorMode === 'dark' ? 'light' : 'dark',
        })),
      setColorMode: (mode) => set({ colorMode: mode }),
    }),
    { name: 'frontend-radar-ui', partialize: (state) => ({ colorMode: state.colorMode }) },
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
