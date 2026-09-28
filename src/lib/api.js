const API_PATH = '/api'
const TOKEN_KEY = 'hc_admin_token'

export function getApiUrl(path) {
  if (typeof window === 'undefined') return `${API_PATH}${path}`

  const configuredBase = window.__API_BASE_URL__ || import.meta.env.VITE_API_BASE_URL
  const base = (configuredBase || '').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return base ? `${base}${normalizedPath}` : `${API_PATH}${normalizedPath}`
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminToken(token) {
  if (typeof window === 'undefined') return
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore storage failures (private mode etc.)
  }
}

export async function adminFetch(path, options = {}) {
  const token = getAdminToken()
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(getApiUrl(path), { ...options, headers })
  if (response.status === 401) {
    setAdminToken(null)
  }
  return response
}
