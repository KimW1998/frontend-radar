const OAUTH_STATE_KEY = 'frontend-radar-github-oauth-state'

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GITHUB_CLIENT_ID?.trim())
}

export function startGitHubOAuth(returnTo = `${window.location.pathname}${window.location.search}`): void {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID?.trim()
  if (!clientId) {
    throw new Error('GitHub OAuth is not configured for this site')
  }

  const state = btoa(
    JSON.stringify({
      returnTo: returnTo.startsWith('/') ? returnTo : '/settings',
    }),
  )
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const redirectUri = `${window.location.origin}/api/github-oauth-callback`
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'read:user repo')
  url.searchParams.set('state', state)

  window.location.assign(url.toString())
}

export function consumeGitHubOAuthCallback(): {
  accessToken: string
  login: string
} | { error: string } | null {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const accessToken = params.get('github_token')
  const login = params.get('github_login')
  const state = params.get('github_state')

  if (!accessToken || !login) return null

  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  if (!expectedState || state !== expectedState) {
    return { error: 'GitHub login could not be verified. Try connecting again.' }
  }

  sessionStorage.removeItem(OAUTH_STATE_KEY)
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)

  return { accessToken, login }
}

export function readGitHubOAuthError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const error = params.get('github_error')
  if (!error) return null

  params.delete('github_error')
  const nextSearch = params.toString()
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`,
  )
  return error
}
