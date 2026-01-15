<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Loading Screen -->
    <LoadingScreen 
      v-if="isLoading" 
      :message="loadingMessage"
      @complete="isLoading = false"
    />
    
    <div v-else class="flex min-h-screen">
      <!-- Sidebar -->
      <aside 
        class="fixed left-0 top-0 h-full z-40 flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-out"
        :class="sidebarWidth"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- Logo -->
        <div class="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <RouterLink to="/dashboard" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ZapIcon class="w-5 h-5 text-white" />
            </div>
            <Transition name="fade">
              <span v-if="isExpanded" class="font-bold text-gray-900">
                CRM <span class="text-primary-600">IA</span>
              </span>
            </Transition>
          </RouterLink>
        </div>
        
        <!-- Lock toggle -->
        <div v-if="isExpanded" class="px-4 py-3 border-b border-slate-100">
          <button 
            @click="toggleLock" 
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="isLocked ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-100 text-slate-500'"
          >
            <component :is="isLocked ? LockIcon : UnlockIcon" class="w-4 h-4" />
            <span>{{ isLocked ? 'Sidebar fijo' : 'Fijar sidebar' }}</span>
          </button>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <RouterLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="sidebar-link relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            :class="{ '!bg-primary-50 !text-primary-600 font-medium': isActive(item.to) }"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <Transition name="fade">
              <span v-if="isExpanded" class="truncate">{{ item.label }}</span>
            </Transition>
            
            <!-- Badge -->
            <Transition name="fade">
              <span 
                v-if="item.badge && isExpanded" 
                class="ml-auto px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full"
              >
                {{ item.badge }}
              </span>
            </Transition>
          </RouterLink>
          
          <!-- Divider -->
          <div class="my-4 border-t border-slate-200"></div>
          
          <!-- Settings section -->
          <Transition name="fade">
            <div v-if="isExpanded" class="px-3 py-2">
              <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Configuración</p>
            </div>
          </Transition>
          
          <RouterLink
            v-for="item in settingsNav"
            :key="item.to"
            :to="item.to"
            class="sidebar-link relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            :class="{ '!bg-primary-50 !text-primary-600 font-medium': isActive(item.to) }"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <Transition name="fade">
              <span v-if="isExpanded" class="truncate">{{ item.label }}</span>
            </Transition>
          </RouterLink>
        </nav>
        
        <!-- User section -->
        <div class="p-3 border-t border-slate-200 bg-slate-50">
          <div 
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            @click="showUserMenu = !showUserMenu"
          >
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-semibold">
              {{ userName?.[0]?.toUpperCase() || 'U' }}
            </div>
            <Transition name="fade">
              <div v-if="isExpanded" class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ userName }}</p>
                <p class="text-xs text-slate-500 truncate">{{ userRole }}</p>
              </div>
            </Transition>
            <Transition name="fade">
              <MoreVerticalIcon v-if="isExpanded" class="w-4 h-4 text-slate-400" />
            </Transition>
          </div>
          
          <!-- User dropdown menu -->
          <Transition name="scale">
            <div 
              v-if="showUserMenu && isExpanded" 
              class="absolute bottom-20 left-3 right-3 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
            >
              <button 
                @click="logout" 
                class="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOutIcon class="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main 
        class="flex-1 transition-all duration-300 ease-out"
        :class="contentMargin"
      >
        <!-- Top bar -->
        <header class="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div class="flex items-center gap-4">
            <!-- Mobile menu button -->
            <button 
              @click="mobileMenuOpen = !mobileMenuOpen" 
              class="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <MenuIcon class="w-5 h-5 text-slate-600" />
            </button>
            
            <!-- Page title -->
            <div>
              <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>
              <p v-if="pageSubtitle" class="text-sm text-slate-500">{{ pageSubtitle }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <!-- Search -->
            <div class="relative hidden md:block">
              <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                class="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 w-64 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                v-model="searchQuery"
              />
            </div>
            
            <!-- Notifications Dropdown -->
            <div class="relative">
              <button 
                @click="showNotifications = !showNotifications"
                class="relative p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <BellIcon class="w-5 h-5 text-slate-600" />
                <span 
                  v-if="notificationUnreadCount > 0" 
                  class="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full font-medium min-w-[18px] flex items-center justify-center"
                >
                  {{ notificationUnreadCount > 9 ? '9+' : notificationUnreadCount }}
                </span>
              </button>

              <!-- Dropdown -->
              <Transition name="fade">
                <div 
                  v-if="showNotifications"
                  v-click-outside="() => showNotifications = false"
                  class="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-[500px] flex flex-col"
                >
                  <!-- Header -->
                  <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 class="font-semibold text-slate-800">Notificaciones</h3>
                    <button 
                      v-if="notifications.length > 0"
                      @click="markAllAsRead"
                      class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marcar todas como leídas
                    </button>
                  </div>

                  <!-- List -->
                  <div class="flex-1 overflow-y-auto">
                    <div v-if="loadingNotifications" class="p-8 text-center">
                      <LoaderIcon class="w-6 h-6 mx-auto animate-spin text-primary-500" />
                    </div>

                    <div v-else-if="notifications.length === 0" class="p-8 text-center">
                      <BellIcon class="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p class="text-slate-500 text-sm">No hay notificaciones</p>
                    </div>

                    <div v-else>
                      <div
                        v-for="notif in notifications"
                        :key="notif._id"
                        @click="handleNotificationClick(notif)"
                        class="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        :class="!notif.read ? 'bg-primary-50/30' : ''"
                      >
                        <div class="flex items-start gap-3">
                          <div 
                            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            :class="getNotificationIconClass(notif.type)"
                          >
                            <component :is="getNotificationIcon(notif.type)" class="w-4 h-4" />
                          </div>
                          <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-slate-800 text-sm">{{ notif.title }}</h4>
                            <p class="text-xs text-slate-600 mt-0.5">{{ notif.message }}</p>
                            <span class="text-xs text-slate-400 mt-1 block">{{ formatTime(notif.createdAt) }}</span>
                          </div>
                          <div v-if="!notif.read" class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </header>
        
        <!-- Page Content with transition -->
        <div class="p-6">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import LoadingScreen from '@/components/ui/LoadingScreen.vue'
import api from '@/services/api'
import { initSocket, onNewMessage, offEvent } from '@/services/socket'
import {
  Zap as ZapIcon,
  LayoutDashboard as DashboardIcon,
  Inbox as InboxIcon,
  Users as UsersIcon,
  Package as PackageIcon,
  Kanban as PipelineIcon,
  Settings as SettingsIcon,
  Sparkles as AIIcon,
  BookOpen as BookOpenIcon,
  Link2 as ChannelsIcon,
  UserCog as TeamIcon,
  MoreVertical as MoreVerticalIcon,
  LogOut as LogOutIcon,
  Search as SearchIcon,
  Bell as BellIcon,
  Menu as MenuIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const loadingMessage = ref('Preparando tu espacio de trabajo...')
const isLocked = ref(false)
const isHovering = ref(false)
const mobileMenuOpen = ref(false)
const showUserMenu = ref(false)
const showNotifications = ref(false)
const notifications = ref([])
const notificationUnreadCount = ref(0)
const loadingNotifications = ref(false)
const searchQuery = ref('')
const unreadCount = ref(0)

const isExpanded = computed(() => isLocked.value || isHovering.value)
const sidebarWidth = computed(() => isExpanded.value ? 'w-64' : 'w-20')
const contentMargin = computed(() => isExpanded.value ? 'ml-64' : 'ml-20')

const navigation = computed(() => [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/inbox', label: 'Bandeja de entrada', icon: InboxIcon, badge: unreadCount.value > 0 ? unreadCount.value : null },
  { to: '/customers', label: 'Clientes', icon: UsersIcon },
  { to: '/products', label: 'Productos', icon: PackageIcon },
  { to: '/pipeline', label: 'Pipeline', icon: PipelineIcon }
])

const settingsNav = [
  { to: '/settings', label: 'General', icon: SettingsIcon },
  { to: '/settings/ai', label: 'Agente IA', icon: AIIcon },
  { to: '/settings/knowledge', label: 'Base de Conocimiento', icon: BookOpenIcon },
  { to: '/settings/channels', label: 'Canales', icon: ChannelsIcon },
  { to: '/settings/team', label: 'Equipo', icon: TeamIcon }
]

const userName = computed(() => authStore.user?.name || authStore.user?.email || 'Usuario')
const userRole = computed(() => {
  const roles = { admin: 'Administrador', agent: 'Agente', viewer: 'Solo lectura' }
  return roles[authStore.user?.role] || authStore.user?.role
})

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/inbox': 'Bandeja de entrada',
    '/customers': 'Clientes',
    '/products': 'Productos',
    '/pipeline': 'Pipeline de ventas',
    '/settings': 'Configuración',
    '/settings/ai': 'Configuración IA',
    '/settings/knowledge': 'Base de Conocimiento',
    '/settings/channels': 'Canales',
    '/settings/team': 'Equipo'
  }
  return titles[route.path] || 'CRM Agente IA'
})

const pageSubtitle = computed(() => {
  const subtitles = {
    '/dashboard': 'Resumen de tu negocio',
    '/inbox': 'Gestiona tus conversaciones',
    '/customers': 'Tu base de clientes',
    '/products': 'Catálogo de productos'
  }
  return subtitles[route.path] || ''
})

function isActive(path) {
  if (path === '/settings') {
    return route.path === '/settings'
  }
  return route.path.startsWith(path)
}

function toggleLock() {
  isLocked.value = !isLocked.value
  localStorage.setItem('sidebarLocked', isLocked.value)
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

async function logout() {
  await authStore.logout()
  router.push('/login')
}

// Notification functions
async function loadNotifications() {
  loadingNotifications.value = true
  try {
    const response = await api.get('/admin/notifications', { params: { limit: 20 } })
    notifications.value = response.data.notifications
    notificationUnreadCount.value = response.data.unreadCount
  } catch (error) {
    console.error('Error loading notifications:', error)
  } finally {
    loadingNotifications.value = false
  }
}

async function handleNotificationClick(notif) {
  if (!notif.read) {
    try {
      await api.patch(`/admin/notifications/${notif._id}/read`)
      notif.read = true
      notificationUnreadCount.value = Math.max(0, notificationUnreadCount.value - 1)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (notif.actionUrl) {
    router.push(notif.actionUrl)
    showNotifications.value = false
  } else if (notif.relatedConversation) {
    router.push(`/inbox/${notif.relatedConversation}`)
    showNotifications.value = false
  }
}

async function markAllAsRead() {
  try {
    await api.patch('/admin/notifications/mark-all-read')
    notifications.value.forEach(n => n.read = true)
    notificationUnreadCount.value = 0
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'handoff_request': return UserPlusIcon
    case 'assignment': return InboxIcon
    case 'mention': return AlertCircleIcon
    case 'system': return BellIcon
    default: return BellIcon
  }
}

function getNotificationIconClass(type) {
  switch (type) {
    case 'handoff_request': return 'bg-amber-100 text-amber-600'
    case 'assignment': return 'bg-primary-100 text-primary-600'
    case 'mention': return 'bg-violet-100 text-violet-600'
    case 'system': return 'bg-slate-100 text-slate-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

// Watch notifications dropdown
watch(showNotifications, async (val) => {
  if (val && notifications.value.length === 0) {
    await loadNotifications()
  }
})

onMounted(async () => {
  // Restore sidebar state
  const saved = localStorage.getItem('sidebarLocked')
  if (saved !== null) {
    isLocked.value = saved === 'true'
  }
  
  // Load unread count
  await loadUnreadCount()
  
  // Initialize socket for real-time updates
  initSocket()
  onNewMessage(() => {
    unreadCount.value++
  })
  
  // Simulate initial load
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
})

async function loadUnreadCount() {
  try {
    const response = await api.get('/admin/conversations?limit=100')
    const conversations = response.data.conversations || []
    unreadCount.value = conversations.filter(c => c.unreadCount > 0).length
  } catch (error) {
    console.error('Failed to load unread count:', error)
  }
}

// Close user menu when clicking outside
watch(showUserMenu, (val) => {
  if (val) {
    setTimeout(() => {
      document.addEventListener('click', closeUserMenu)
    }, 100)
  }
})

function closeUserMenu() {
  showUserMenu.value = false
  document.removeEventListener('click', closeUserMenu)
}
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

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(5px);
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
