import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
    // Auth routes
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { guest: true }
    },

    // Legal routes
    {
        path: '/privacy',
        name: 'privacy',
        component: () => import('@/views/legal/PrivacyPolicyView.vue')
    },

    // Super Admin routes
    {
        path: '/superadmin',
        component: () => import('@/layouts/SuperAdminLayout.vue'),
        meta: { requiresAuth: true, role: 'super_admin' },
        children: [
            {
                path: '',
                redirect: '/superadmin/dashboard'
            },
            {
                path: 'dashboard',
                name: 'superadmin-dashboard',
                component: () => import('@/views/superadmin/DashboardView.vue')
            },
            {
                path: 'organizations',
                name: 'superadmin-organizations',
                component: () => import('@/views/superadmin/OrganizationsView.vue')
            },
            {
                path: 'organizations/:id',
                name: 'superadmin-organization-detail',
                component: () => import('@/views/superadmin/OrganizationDetailView.vue')
            },
            {
                path: 'system',
                name: 'superadmin-system',
                component: () => import('@/views/superadmin/SystemHealthView.vue')
            },
            {
                path: 'settings',
                name: 'superadmin-settings',
                component: () => import('@/views/superadmin/SettingsView.vue')
            },
            {
                path: 'logs',
                name: 'superadmin-logs',
                component: () => import('@/views/superadmin/ActivityLogsView.vue')
            },
            {
                path: 'announcements',
                name: 'superadmin-announcements',
                component: () => import('@/views/superadmin/AnnouncementsView.vue')
            }
        ]
    },

    // Admin / Agent routes
    {
        path: '/',
        component: () => import('@/layouts/AdminLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/dashboard'
            },
            {
                path: 'dashboard',
                name: 'dashboard',
                component: () => import('@/views/admin/DashboardView.vue')
            },
            {
                path: 'inbox',
                name: 'inbox',
                component: () => import('@/views/admin/InboxView.vue')
            },
            {
                path: 'inbox/:id',
                name: 'conversation',
                component: () => import('@/views/admin/ConversationView.vue')
            },
            {
                path: 'customers',
                name: 'customers',
                component: () => import('@/views/admin/CustomersView.vue')
            },
            {
                path: 'customers/:id',
                name: 'customer-detail',
                component: () => import('@/views/admin/CustomerDetailView.vue')
            },
            {
                path: 'products',
                name: 'products',
                component: () => import('@/views/admin/ProductsView.vue')
            },
            {
                path: 'pipeline',
                name: 'pipeline',
                component: () => import('@/views/admin/PipelineView.vue')
            },
            {
                path: 'settings',
                name: 'settings',
                component: () => import('@/views/admin/SettingsView.vue')
            },
            {
                path: 'settings/ai',
                name: 'settings-ai',
                component: () => import('@/views/admin/SettingsAIView.vue')
            },
            {
                path: 'settings/channels',
                name: 'settings-channels',
                component: () => import('@/views/admin/SettingsChannelsView.vue')
            },
            {
                path: 'settings/team',
                name: 'settings-team',
                component: () => import('@/views/admin/SettingsTeamView.vue')
            }
        ]
    },

    // 404
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Wait for auth check to complete
    if (!authStore.initialized) {
        await authStore.checkAuth()
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isGuestRoute = to.matched.some(record => record.meta.guest)
    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role

    if (requiresAuth && !authStore.isAuthenticated) {
        // Not logged in, redirect to login
        return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    if (isGuestRoute && authStore.isAuthenticated) {
        // Already logged in, redirect to appropriate dashboard
        if (authStore.isSuperAdmin) {
            return next({ name: 'superadmin-dashboard' })
        }
        return next({ name: 'dashboard' })
    }

    if (requiredRole && authStore.user?.role !== requiredRole) {
        // Role mismatch
        if (authStore.isSuperAdmin) {
            return next({ name: 'superadmin-dashboard' })
        }
        return next({ name: 'dashboard' })
    }

    next()
})

export default router
