import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  fetchGitHubRepoFiles,
  resolveGitHubStackFiles,
} from '@/services/github-repo'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useGitHubAuthStore, useSettingsStore } from '@/stores'

/** Re-check linked GitHub repos every 30 minutes while the app is open. */
export const GITHUB_AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000

export function usePeriodicGitHubSync() {
  const queryClient = useQueryClient()
  const activeProject = useActiveProject()
  const accessToken = useGitHubAuthStore((s) => s.accessToken)
  const previewStackImport = useSettingsStore((s) => s.previewStackImport)
  const applyGitHubImport = useSettingsStore((s) => s.applyGitHubImport)
  const syncingRef = useRef(false)

  useEffect(() => {
    const githubSync = activeProject?.githubSync
    if (!githubSync || githubSync.autoSyncEnabled === false || !accessToken) return

    const runAutoSync = async () => {
      if (syncingRef.current || document.hidden) return
      syncingRef.current = true

      try {
        const response = await fetchGitHubRepoFiles(githubSync, accessToken)
        const resolved = resolveGitHubStackFiles(response, githubSync)
        if (!resolved.packageJson) return

        const active = useSettingsStore.getState().projects.find((p) => p.id === activeProject?.id)
        if (!active) return

        const { preview } = previewStackImport({
          packageJson: resolved.packageJson,
          lockfile: resolved.lockfile ?? undefined,
        })

        if (!preview.hasChanges) return

        applyGitHubImport({
          packageJson: resolved.packageJson,
          lockfile: resolved.lockfile ?? undefined,
          githubSync: {
            ...githubSync,
            lockfilePath: resolved.lockfilePath ?? githubSync.lockfilePath,
          },
          source: 'auto',
        })

        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } catch {
        // Silent failure for background sync — manual sync still available in Settings.
      } finally {
        syncingRef.current = false
      }
    }

    const initialTimer = window.setTimeout(runAutoSync, 15_000)
    const interval = window.setInterval(runAutoSync, GITHUB_AUTO_SYNC_INTERVAL_MS)

    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [
    accessToken,
    activeProject?.id,
    activeProject?.githubSync,
    applyGitHubImport,
    previewStackImport,
    queryClient,
  ])
}
