import type { Config } from '@netlify/functions'

export default async () => {
  const githubToken = Boolean(Netlify.env.get('GITHUB_TOKEN'))
  return Response.json({
    githubToken,
    proxies: ['github-releases', 'github-release-history', 'rss'],
  })
}

export const config: Config = {
  path: '/api/data-health',
}
