import { describe, expect, it } from 'vitest'
import { buildTransitiveDependencyDetail } from '@/lib/detail-builders'
import type { TransitiveDependencyInsight } from '@/lib/transitive-deps'

const item: TransitiveDependencyInsight = {
  id: 'transitive-lodash-4.17.21',
  npmPackage: 'lodash',
  version: '4.17.21',
  requiredBy: ['react-scripts'],
  depth: 2,
  vulnerabilityCount: 1,
  highestSeverity: 'high',
  topAdvisoryId: 'GHSA-xxxxx',
  fixedVersion: '4.17.22',
}

describe('buildTransitiveDependencyDetail', () => {
  it('includes transitive context and advisory fields', () => {
    const detail = buildTransitiveDependencyDetail(item)
    expect(detail.title).toBe('lodash')
    expect(detail.fields?.some((field) => field.label === 'Required by')).toBe(true)
    expect(detail.links?.some((link) => link.label === 'Top advisory')).toBe(true)
    expect(detail.enrich).toEqual({ type: 'npm-package', packageName: 'lodash' })
  })
})
