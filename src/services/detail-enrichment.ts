import { fetchNpmPackageMeta } from '@/services/npm'
import type { DetailSection } from '@/types/detail'

export async function enrichNpmPackage(packageName: string): Promise<DetailSection[]> {
  const meta = await fetchNpmPackageMeta(packageName)
  if (!meta) return []

  const sections: DetailSection[] = [
    {
      title: 'Package description',
      content: meta.description,
    },
  ]

  const facts: string[] = []
  if (meta.license) facts.push(`License: ${meta.license}`)
  if (meta.maintainers) facts.push(`Maintainers: ${meta.maintainers}`)
  if (meta.lastPublished) facts.push(`Last published: ${meta.lastPublished}`)

  if (facts.length > 0) {
    sections.push({
      title: 'Registry metadata',
      content: facts.join('\n'),
    })
  }

  return sections
}
