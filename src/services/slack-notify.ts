import { apiUrl } from '@/services/api'
import { fetchJson } from '@/services/http'

export async function sendSlackNotification(webhookUrl: string, text: string): Promise<void> {
  await fetchJson<{ ok: boolean }>(apiUrl('/slack-notify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookUrl, text }),
  })
}
