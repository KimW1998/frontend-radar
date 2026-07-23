import type { Config } from '@netlify/functions'

export default async (req: Request) => {
  const feedUrl = new URL(req.url).searchParams.get('url')
  if (!feedUrl) {
    return Response.json({ error: 'Missing url query parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(feedUrl)
  } catch {
    return Response.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return Response.json({ error: 'Only http(s) feeds are allowed' }, { status: 400 })
  }

  const response = await fetch(parsed.toString(), {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
      'User-Agent': 'frontend-radar',
    },
  })

  const body = await response.text()
  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/xml',
      'Cache-Control': 'public, max-age=600',
    },
  })
}

export const config: Config = {
  path: '/api/rss',
}
