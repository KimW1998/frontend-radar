import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterCategory } from '@/types'

export {
  useSettingsStore,
  selectActiveProject,
} from '@/stores/settings-store'

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
