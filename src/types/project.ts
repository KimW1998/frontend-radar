export interface Project {
  id: string
  name: string
  configuredVersions: Record<string, string>
  /** Raw engines.node / volta.node from package.json (project requirement) */
  enginesNodeRequirement: string
  /** Node version the developer runs locally or in CI */
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
    enginesNodeRequirement: '',
    nodeVersion: '',
    createdAt: now,
    updatedAt: now,
  }
}
