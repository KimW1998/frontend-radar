import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated())

  useEffect(() => {
    setHydrated(useSettingsStore.persist.hasHydrated())
    return useSettingsStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}

export function useEnsureActiveProject(): void {
  useEffect(() => {
    const state = useSettingsStore.getState()
    if (!state.activeProjectId && state.projects.length > 0) {
      state.setActiveProject(state.projects[0]!.id)
    }
  }, [])
}
