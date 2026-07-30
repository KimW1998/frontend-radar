import { useEffect } from 'react'
import { consumeGitHubOAuthCallback, readGitHubOAuthError } from '@/services/github-auth'
import { useGitHubAuthStore } from '@/stores/github-auth-store'

export function useGitHubOAuthCallback(): void {
  const setConnection = useGitHubAuthStore((s) => s.setConnection)
  const setAuthNotice = useGitHubAuthStore((s) => s.setAuthNotice)

  useEffect(() => {
    const urlError = readGitHubOAuthError()
    if (urlError) {
      setAuthNotice(urlError)
      return
    }

    const result = consumeGitHubOAuthCallback()
    if (!result) return
    if ('error' in result) {
      setAuthNotice(result.error)
      return
    }
    setConnection(result.accessToken, result.login)
  }, [setConnection, setAuthNotice])
}
