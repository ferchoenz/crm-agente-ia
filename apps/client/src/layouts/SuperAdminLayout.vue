<template>
  <div class="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Sidebar -->
    <aside 
      class="fixed left-0 top-0 h-full z-40 flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-out"
      :class="sidebarWidth"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        <RouterLink to="/superadmin" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldIcon class="w-5 h-5 text-white" />
          </div>
          <Transition name="fade">
            <div v-if="isExpanded" class="flex items-baseline gap-1">
              <span class="text-xl font-bold text-rose-600">Super</span>
              <span class="text-xl font-semibold text-slate-800">Admin</span>
            </div>
          </Transition>
        </RouterLink>
      </div>
      
      <!-- Lock toggle -->
      <div v-if="isExpanded" class="px-4 py-3 border-b border-slate-100">
        <button 
          @click="toggleLock" 
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isLocked ? 'bg-rose-50 text-rose-600' : 'hover:bg-slate-100 text-slate-500'"
        >
          <component :is="isLocked ? LockIcon : UnlockIcon" class="w-4 h-4" />
          <span>{{ isLocked ? 'Sidebar fijo' : 'Fijar sidebar' }}</span>
        </button>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          :class="isActive(item.to) ? '!bg-rose-50 !text-rose-600 font-medium' : ''"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <Transition name="fade">
            <span v-if="isExpanded">{{ item.label }}</span>
          </Transition>
        </RouterLink>
        
        <!-- Divider -->
        <div class="my-4 border-t border-slate-200"></div>
        
        <Transition name="fade">
          <div v-if="isExpanded" class="px-3 py-2">
            <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Sistema</p>
          </div>
        </Transition>
        
        <RouterLink
          v-for="item in systemNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          :class="isActive(item.to) ? '!bg-rose-50 !text-rose-600 font-medium' : ''"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <Transition name="fade">
            <span v-if="isExpanded">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </nav>
      
      <!-- Super Admin info -->
      <div class="p-4 border-t border-slate-200 bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-semibold">
            {{ authStore.user?.email?.[0]?.toUpperCase() || 'S' }}
          </div>
          <Transition name="fade">
            <div v-if="isExpanded" class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">{{ authStore.user?.email }}</div>
              <div class="text-rose-600 text-xs uppercase font-semibold tracking-wide">Super Admin</div>
            </div>
          </Transition>
        </div>
      </div>
    </aside>
    
    <!-- Main content -->
    <div 
      class="flex-1 flex flex-col transition-all duration-300 ease-out"
      :class="contentMargin"
    >
      <!-- Top bar -->
      <header class="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
        <h1 class="text-lg font-semibold text-slate-800">
          {{ currentPageTitle }}
        </h1>
        
        <div class="flex items-center gap-4">
          <button 
            @click="handleLogout"
            class="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOutIcon class="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </header>
      
      <!-- Page content -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { 
  LayoutDashboard as DashboardIcon,
  Building2 as OrganizationsIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  LogOut as LogOutIcon,
  Activity as SystemIcon,
  Settings as SettingsIcon,
  ClipboardList as LogsIcon,
  Megaphone as AnnouncementsIcon
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLocked = ref(false)
const isHovering = ref(false)

const isExpanded = computed(() => isLocked.value || isHovering.value)
const sidebarWidth = computed(() => isExpanded.value ? 'w-64' : 'w-20')
const contentMargin = computed(() => isExpanded.value ? 'ml-64' : 'ml-20')

const navItems = [
  { to: '/superadmin', label: 'Dashboard', icon: DashboardIcon },
  { to: '/superadmin/organizations', label: 'Organizaciones', icon: OrganizationsIcon }
]

const systemNav = [
  { to: '/superadmin/system', label: 'Salud del Sistema', icon: SystemIcon },
  { to: '/superadmin/settings', label: 'Configuración', icon: SettingsIcon },
  { to: '/superadmin/logs', label: 'Logs de Actividad', icon: LogsIcon },
  { to: '/superadmin/announcements', label: 'Anuncios', icon: AnnouncementsIcon }
]

function isActive(path) {
  if (path === '/superadmin') {
    return route.path === '/superadmin' || route.path === '/superadmin/dashboard'
  }
  return route.path.startsWith(path)
}

const currentPageTitle = computed(() => {
  const titles = {
    'superadmin-dashboard': 'Dashboard Global',
    'superadmin-organizations': 'Organizaciones',
    'superadmin-organization-detail': 'Detalle de Organización',
    'superadmin-system': 'Salud del Sistema',
    'superadmin-settings': 'Configuración Global',
    'superadmin-logs': 'Logs de Actividad',
    'superadmin-announcements': 'Anuncios'
  }
  return titles[route.name] || 'Super Admin'
})

function toggleLock() {
  isLocked.value = !isLocked.value
  localStorage.setItem('superadmin-sidebar-locked', isLocked.value)
}

function handleMouseEnter() {
  if (!isLocked.value) {
    isHovering.value = true
  }
}

function handleMouseLeave() {
  if (!isLocked.value) {
    isHovering.value = false
  }
}

async function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  const saved = localStorage.getItem('superadmin-sidebar-locked')
  if (saved !== null) {
    isLocked.value = saved === 'true'
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
