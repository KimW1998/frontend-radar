import type { Config } from '@netlify/functions'

interface OAuthState {
  returnTo?: string
}

function appOrigin(req: Request): string {
  return new URL(req.url).origin
}

function decodeState(state: string | null): OAuthState {
  if (!state) return {}
  try {
    return JSON.parse(atob(state)) as OAuthState
  } catch {
    return {}
  }
}

function redirectWithError(origin: string, returnTo: string, message: string): Response {
  const path = returnTo.startsWith('/') ? returnTo : '/settings'
  const params = new URLSearchParams({ github_error: message })
  return Response.redirect(`${origin}${path}?${params.toString()}`, 302)
}

export default async (req: Request) => {
  const url = new URL(req.url)
  const origin = appOrigin(req)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')
  const { returnTo = '/settings' } = decodeState(state)

  if (oauthError) {
    return redirectWithError(origin, returnTo, oauthError)
  }

  if (!code) {
    return redirectWithError(origin, returnTo, 'Missing OAuth code from GitHub')
  }

  const clientId = Netlify.env.get('GITHUB_CLIENT_ID')
  const clientSecret = Netlify.env.get('GITHUB_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    return redirectWithError(origin, returnTo, 'GitHub OAuth is not configured on this site')
  }

  const redirectUri = `${origin}/api/github-oauth-callback`

  let tokenResponse: Response
  try {
    tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })
  } catch {
    return redirectWithError(origin, returnTo, 'Could not reach GitHub to complete login')
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!tokenResponse.ok || !tokenData.access_token) {
    const message = tokenData.error_description ?? tokenData.error ?? 'GitHub token exchange failed'
    return redirectWithError(origin, returnTo, message)
  }

  let login = 'github-user'
  try {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'frontend-radar',
      },
    })
    if (userResponse.ok) {
      const user = (await userResponse.json()) as { login?: string }
      if (user.login) login = user.login
    }
  } catch {
    // Non-fatal — token still works for repo access
  }

  const hash = new URLSearchParams({
    github_token: tokenData.access_token,
    github_login: login,
    github_state: state ?? '',
  }).toString()

  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/settings'
  return Response.redirect(`${origin}${safeReturnTo}#${hash}`, 302)
}

export const config: Config = {
  path: '/api/github-oauth-callback',
}
