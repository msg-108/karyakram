/**
 * api/client.ts — base Axios instance used by every other api/ module.
 *
 * Responsibilities:
 *  1. Attach the JWT access token to every outgoing request.
 *  2. On 401: silently refresh the access token (via auth/token/refresh/)
 *     and retry the original request exactly once.
 *  3. If the refresh itself fails, clear auth state and let the user re-login.
 *
 * Reads VITE_API_URL from the environment so the base URL is never
 * hardcoded — set it in .env (see .env.example).
 */
import axios, { type AxiosInstance } from 'axios'
import useAuthStore from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL as string
const BASE_URL = API_URL ? `${API_URL}/api` : ''

if (!API_URL) {
  console.error('[client.ts] VITE_API_URL is not set. Add it to .env.')
}

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
})

// ── Request interceptor: attach access token ──
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: silent token refresh on 401 ──
let isRefreshing = false

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        // Another refresh already in-flight; give up rather than queue
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        // Confirmed real path: auth/token/refresh/ (NOT auth/refresh/)
        const { data } = await axios.post<{ access: string }>(
          `${BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        )
        useAuthStore.getState().setAccessToken(data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default client
