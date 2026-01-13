import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const token = ref(localStorage.getItem('token') || null)
    const initialized = ref(false)
    const loading = ref(false)
    const error = ref(null)

    // Computed
    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
    const isAdmin = computed(() => user.value?.role === 'admin' || isSuperAdmin.value)
    const organization = computed(() => user.value?.organization)

    // Actions
    async function login(email, password) {
        loading.value = true
        error.value = null

        try {
            const response = await api.post('/auth/login', { email, password })

            token.value = response.data.token
            user.value = response.data.user

            localStorage.setItem('token', token.value)
            api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.error || 'Login failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    async function checkAuth() {
        if (!token.value) {
            initialized.value = true
            return
        }

        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
            const response = await api.get('/auth/me')
            user.value = response.data
        } catch (err) {
            // Token invalid or expired
            logout()
        } finally {
            initialized.value = true
        }
    }

    async function refreshToken() {
        try {
            const response = await api.post('/auth/refresh')
            token.value = response.data.token
            localStorage.setItem('token', token.value)
            api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        } catch (err) {
            logout()
        }
    }

    function logout() {
        user.value = null
        token.value = null
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
    }

    async function updatePassword(currentPassword, newPassword) {
        loading.value = true
        error.value = null

        try {
            await api.put('/auth/password', { currentPassword, newPassword })
            return { success: true }
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to update password'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    return {
        // State
        user,
        token,
        initialized,
        loading,
        error,

        // Computed
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        organization,

        // Actions
        login,
        checkAuth,
        refreshToken,
        logout,
        updatePassword
    }
})
