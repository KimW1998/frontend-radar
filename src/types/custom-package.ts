import type { FilterCategory } from '@/types'

export interface CustomPackageEntry {
  id: string
  name: string
  npmPackage: string
  categories: FilterCategory[]
}

export function customPackageId(npmPackage: string): string {
  return `custom:${npmPackage}`
}

export function createCustomPackage(npmPackage: string, name?: string): CustomPackageEntry {
  const trimmed = npmPackage.trim()
  const displayName =
    name?.trim() ||
    trimmed
      .replace(/^@/, '')
      .split('/')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

  return {
    id: customPackageId(trimmed),
    name: displayName,
    npmPackage: trimmed,
    categories: ['infrastructure'],
  }
}
