const API_PREFIX = '/api'

export function apiUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${API_PREFIX}${path}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.pathname + url.search
}

export async function fetchApiText(path: string, params?: Record<string, string>): Promise<Response> {
  return fetch(apiUrl(path, params))
}

export async function fetchApiJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const response = await fetchApiText(path, params)
  if (!response.ok) {
    throw new Error(`API ${path} failed: HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

export interface DataHealth {
  githubToken: boolean
  proxies: string[]
}

export async function fetchDataHealth(): Promise<DataHealth | null> {
  try {
    return await fetchApiJson<DataHealth>('/data-health')
  } catch {
    return null
  }
}
