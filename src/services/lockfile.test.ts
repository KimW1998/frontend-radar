import { describe, expect, it } from 'vitest'
import { parseLockfileInput } from '@/services/lockfile'

describe('parseLockfileInput', () => {
  it('parses npm package-lock v3 packages map', () => {
    const result = parseLockfileInput(
      JSON.stringify({
        packages: {
          'node_modules/react': { version: '19.0.0' },
          'node_modules/react-dom': { version: '19.0.0' },
        },
      }),
    )

    expect(result.format).toBe('npm')
    expect(result.versions.react).toBe('19.0.0')
    expect(result.versions['react-dom']).toBe('19.0.0')
  })

  it('parses yarn.lock version blocks', () => {
    const result = parseLockfileInput(`
"react@^19.0.0":
  version "19.0.0"
`)

    expect(result.format).toBe('yarn')
    expect(result.versions.react).toBe('19.0.0')
  })
})
