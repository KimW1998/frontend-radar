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

export async function fetchApiText(
  path: string,
  params?: Record<string, string>,
  options?: { accessToken?: string | null },
): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }
  return fetch(apiUrl(path, params), { headers })
}

export async function fetchApiJson<T>(
  path: string,
  params?: Record<string, string>,
  options?: { accessToken?: string | null },
): Promise<T> {
  const response = await fetchApiText(path, params, options)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body.slice(0, 200) || `API ${path} failed: HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

export interface DataHealth {
  githubToken: boolean
  githubOAuth: boolean
  proxies: string[]
}

export async function fetchDataHealth(): Promise<DataHealth | null> {
  try {
    return await fetchApiJson<DataHealth>('/data-health')
  } catch {
    return null
  }
}
