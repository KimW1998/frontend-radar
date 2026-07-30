export interface Project {
  id: string
  name: string
  configuredVersions: Record<string, string>
  nodeVersion: string
  createdAt: string
  updatedAt: string
}

export function createEmptyProject(name: string, configuredVersions: Record<string, string>): Project {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    configuredVersions: { ...configuredVersions },
    nodeVersion: '',
    createdAt: now,
    updatedAt: now,
  }
}
