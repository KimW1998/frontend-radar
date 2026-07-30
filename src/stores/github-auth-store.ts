import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GitHubAuthState {
  accessToken: string | null
  login: string | null
  connectedAt: string | null
  authNotice: string | null
  setConnection: (accessToken: string, login: string) => void
  disconnect: () => void
  setAuthNotice: (message: string | null) => void
}

export const useGitHubAuthStore = create<GitHubAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      login: null,
      connectedAt: null,
      authNotice: null,
      setConnection: (accessToken, login) =>
        set({
          accessToken,
          login,
          connectedAt: new Date().toISOString(),
          authNotice: `Connected as @${login}`,
        }),
      disconnect: () =>
        set({
          accessToken: null,
          login: null,
          connectedAt: null,
          authNotice: null,
        }),
      setAuthNotice: (message) => set({ authNotice: message }),
    }),
    {
      name: 'frontend-radar-github-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        login: state.login,
        connectedAt: state.connectedAt,
      }),
    },
  ),
)

export function selectGitHubAccessToken(state: GitHubAuthState): string | null {
  return state.accessToken
}

export function selectIsGitHubConnected(state: GitHubAuthState): boolean {
  return Boolean(state.accessToken)
}
