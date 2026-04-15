import axios from 'axios'
import toast from 'react-hot-toast'

// Axios instance — cookies handled by Better Auth (session cookie sent automatically)
const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ?? '/api',
  timeout:         10_000,
  withCredentials: true,
})

api.interceptors.response.use(
  response => response,
  error => {
    const silent  = error.config?._silent
    const message = error.response?.data?.message ?? error.message ?? 'Something went wrong'
    console.error('[api]', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status ?? 'network', message)
    if (!silent) toast.error(message)
    return Promise.reject(error)
  }
)

export default api

// No-op shims kept so any existing import of these doesn't break at compile time
export const setAccessToken       = () => {}
export const getAccessToken       = () => null
export const setNavigateCallback  = () => {}
export const setTokenExpiredCallback = () => {}
