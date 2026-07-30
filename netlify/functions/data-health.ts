import type { Config } from '@netlify/functions'

export default async () => {
  const githubToken = Boolean(Netlify.env.get('GITHUB_TOKEN'))
  const githubOAuth = Boolean(
    Netlify.env.get('GITHUB_CLIENT_ID') && Netlify.env.get('GITHUB_CLIENT_SECRET'),
  )
  return Response.json({
    githubToken,
    githubOAuth,
    proxies: ['github-releases', 'github-release-history', 'github-repo-files', 'github-user-repos', 'github-oauth-callback', 'rss'],
  })
}

export const config: Config = {
  path: '/api/data-health',
}
