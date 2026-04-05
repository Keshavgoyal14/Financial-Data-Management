import { useAuth } from '../context/AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ?? ''

function toApiUrl(endpoint: string): string {
  if (!API_BASE) {
    return endpoint
  }

  return `${API_BASE}${endpoint}`
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  }

  const response = await fetch(toApiUrl(endpoint), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error((errorData as { message?: string }).message || `API Error: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

// Hook for using API with auth context
export function useApi() {
  const { token } = useAuth()

  return {
    authenticated: !!token,
    fetch: apiFetch,
  }
}
