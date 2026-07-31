import { describe, expect, it } from 'vitest'
import {
  buildNotificationUrl,
  buildSlackMessageText,
  dashboardIssuePath,
} from '@/lib/stack-notifications'

describe('buildSlackMessageText', () => {
  it('includes a deep link to the specific issue', () => {
    const text = buildSlackMessageText(
      {
        title: 'Critical security alert',
        body: 'vite: prototype pollution',
        fingerprint: 'critical-security',
        issueLink: {
          path: dashboardIssuePath('vite-OSV-123', 'security-center'),
          label: 'View vulnerability in Frontend Radar',
        },
      },
      'https://frontendradardashboard.netlify.app',
    )

    expect(text).toContain('View vulnerability in Frontend Radar')
    expect(text).toContain('focus=vite-OSV-123')
    expect(text).toContain('#security-center')
  })
})

describe('buildNotificationUrl', () => {
  it('builds absolute URLs from site origin and path', () => {
    expect(
      buildNotificationUrl('https://example.com', '/?focus=abc#security-center'),
    ).toBe('https://example.com/?focus=abc#security-center')
  })
})
