import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
})

let _getToken = null

export function setTokenGetter(fn) {
  _getToken = fn
}

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error ?? 'Something went wrong'
    import('./toast').then(({ toast }) => toast.error(message))
    return Promise.reject(error)
  }
)

export default api
