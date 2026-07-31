import type { Config } from '@netlify/functions'

interface SlackNotifyBody {
  webhookUrl?: string
  text?: string
}

function isValidSlackWebhook(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'hooks.slack.com'
  } catch {
    return false
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let body: SlackNotifyBody
  try {
    body = (await req.json()) as SlackNotifyBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const webhookUrl = body.webhookUrl?.trim()
  const text = body.text?.trim()

  if (!webhookUrl || !text) {
    return Response.json({ error: 'webhookUrl and text are required' }, { status: 400 })
  }

  if (!isValidSlackWebhook(webhookUrl)) {
    return Response.json({ error: 'Only https://hooks.slack.com webhook URLs are allowed' }, { status: 400 })
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const detail = await response.text()
    return Response.json(
      { error: 'Slack webhook rejected the message', detail: detail.slice(0, 200) },
      { status: 502 },
    )
  }

  return Response.json({ ok: true })
}

export const config: Config = {
  path: '/api/slack-notify',
}
