import type { AiSummary, UpgradeUrgency } from '@/types'

interface SummaryInput {
  what: string
  why: string
  action: string
  urgency: UpgradeUrgency
}

export function buildSummary(input: SummaryInput, readingTimeSeconds = 25): AiSummary {
  return {
    whatHappened: input.what,
    whyCare: input.why,
    actionRequired: input.action,
    upgradeUrgency: input.urgency,
    readingTimeSeconds,
  }
}

export function estimateReadingTime(...texts: string[]): number {
  const words = texts.join(' ').split(/\s+/).length
  return Math.max(15, Math.min(30, Math.ceil(words / 4)))
}
