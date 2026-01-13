import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Track if we're currently refreshing
let isRefreshing = false

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Skip refresh for auth endpoints to prevent loops
        const isAuthEndpoint = originalRequest.url?.includes('/auth/')

        // Handle 401 - try to refresh token (only once and not for auth endpoints)
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isRefreshing) {
            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh token')
                }

                const response = await axios.post('/api/auth/refresh', { refreshToken })
                const newToken = response.data.token

                localStorage.setItem('token', newToken)
                if (response.data.refreshToken) {
                    localStorage.setItem('refreshToken', response.data.refreshToken)
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
                originalRequest.headers.Authorization = `Bearer ${newToken}`

                isRefreshing = false
                return api(originalRequest)
            } catch (refreshError) {
                isRefreshing = false
                // Refresh failed, clear tokens and redirect only if not already on login
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')

                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api
