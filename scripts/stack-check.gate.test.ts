import { describe, expect, it } from 'vitest'
import { runStackCheck } from '../src/lib/stack-check'

describe('frontend-radar stack check', () => {
  it('passes configured CI gates', async () => {
    const result = await runStackCheck()

    for (const warning of result.warnings) {
      console.warn(`warning: ${warning}`)
    }

    if (!result.ok) {
      console.error('frontend-radar check failed:')
      for (const error of result.errors) {
        console.error(`  - ${error}`)
      }
    } else {
      console.log(
        `frontend-radar check passed` +
          (result.healthScore != null ? ` (health score ${result.healthScore})` : '') +
          (result.criticalCount + result.highCount > 0
            ? ` — ${result.criticalCount} critical, ${result.highCount} high advisories noted`
            : ''),
      )
    }

    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })
})
