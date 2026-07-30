import { describe, expect, it } from 'vitest'
import { collectTransitiveDependencies } from '@/lib/transitive-deps'

describe('collectTransitiveDependencies', () => {
  it('collects transitive deps within depth limit', () => {
    const graph = {
      dependencies: {
        react: ['loose-envify'],
        'loose-envify': ['js-tokens'],
      },
      versions: {
        react: '19.0.0',
        'loose-envify': '1.4.0',
        'js-tokens': '4.0.0',
      },
    }

    const result = collectTransitiveDependencies(['react'], graph, { maxDepth: 2 })

    expect(result.map((item) => item.npmPackage)).toEqual(['loose-envify', 'js-tokens'])
    expect(result[0]?.requiredBy).toContain('react')
  })

  it('skips tracked packages in the tree', () => {
    const graph = {
      dependencies: {
        vite: ['react'],
      },
      versions: {
        vite: '6.0.0',
        react: '19.0.0',
      },
    }

    const result = collectTransitiveDependencies(['vite', 'react'], graph)
    expect(result.some((item) => item.npmPackage === 'react')).toBe(false)
  })
})
