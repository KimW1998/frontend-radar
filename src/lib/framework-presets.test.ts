import { describe, expect, it } from 'vitest'
import { detectFrameworkPreset } from '@/lib/framework-presets'
import { isAlertSnoozed, snoozeUntil } from '@/lib/alert-snooze'

describe('detectFrameworkPreset', () => {
  it('detects Vite + React + TypeScript stacks', () => {
    const match = detectFrameworkPreset(['react', 'react-dom', 'vite', 'typescript', 'eslint'])
    expect(match?.preset.id).toBe('vite-react-ts')
    expect(match?.matchedPackages).toContain('react')
  })

  it('detects Next.js stacks', () => {
    const match = detectFrameworkPreset(['next', 'react', 'react-dom'])
    expect(match?.preset.id).toBe('next-react-ts')
  })
})

describe('isAlertSnoozed', () => {
  it('returns true before snooze expiry', () => {
    const until = snoozeUntil(30)
    expect(isAlertSnoozed('sec-abc', { 'sec-abc': until })).toBe(true)
  })
})
