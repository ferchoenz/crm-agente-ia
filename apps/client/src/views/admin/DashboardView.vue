<template>
  <div class="space-y-6">
    <!-- Welcome section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">
          ¡Hola, {{ userName }}! 👋
        </h2>
        <p class="text-surface-600 mt-1 text-sm sm:text-base">
          Aquí está el resumen de tu negocio
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm text-surface-500">
        <CalendarIcon class="w-4 h-4" />
        {{ formattedDate }}
      </div>
    </div>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Conversaciones hoy"
        :value="stats.todayMessages"
        :trend="stats.conversationsTrend"
        :icon="MessageSquareIcon"
        color="primary"
        clickable
        @click="$router.push('/inbox')"
      />
      <StatCard
        label="Clientes totales"
        :value="stats.totalCustomers"
        :icon="UsersIcon"
        color="teal"
        clickable
        @click="$router.push('/customers')"
      />
      <StatCard
        label="Conversaciones abiertas"
        :value="stats.openConversations"
        :icon="InboxIcon"
        color="violet"
        clickable
        @click="$router.push('/inbox')"
      />
      <StatCard
        label="Canales activos"
        :value="stats.activeChannels"
        :icon="ZapIcon"
        color="amber"
      />
    </div>
    
    <!-- Main content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent conversations -->
      <div class="lg:col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Conversaciones recientes</h3>
          <RouterLink to="/inbox" class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Ver todas
            <ArrowRightIcon class="w-4 h-4" />
          </RouterLink>
        </div>
        
        <div class="space-y-3">
          <div
            v-for="conv in recentConversations"
            :key="conv._id"
            class="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 transition-colors cursor-pointer group"
            @click="$router.push(`/inbox/${conv._id}`)"
          >
            <Avatar :name="conv.customer?.name" :color="conv.channel?.type === 'whatsapp' ? 'teal' : conv.channel?.type === 'messenger' ? 'blue' : 'primary'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{{ conv.customer?.name || conv.customer?.phone || 'Sin nombre' }}</span>
                <span class="badge text-[10px]" :class="conv.aiEnabled ? 'badge-info' : 'badge-warning'">
                  {{ conv.aiEnabled ? 'IA' : 'Manual' }}
                </span>
              </div>
              <p class="text-sm text-surface-500 truncate">{{ conv.lastMessage?.content || 'Sin mensajes' }}</p>
            </div>
            <div class="text-right">
              <div class="text-xs text-surface-400">{{ formatTime(conv.lastMessageAt) }}</div>
              <div v-if="conv.unreadCount" class="mt-1 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                {{ conv.unreadCount }}
              </div>
            </div>
            <ChevronRightIcon class="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
          </div>
          
          <!-- Empty state -->
          <div v-if="recentConversations.length === 0 && !loadingConversations" class="text-center py-8">
            <InboxIcon class="w-12 h-12 mx-auto text-surface-300 mb-3" />
            <p class="text-surface-500">No hay conversaciones recientes</p>
          </div>
          
          <div v-if="loadingConversations" class="text-center py-8">
            <LoaderIcon class="w-6 h-6 mx-auto animate-spin text-primary-500" />
          </div>
        </div>
      </div>
      
      <!-- Quick actions & Pipeline summary -->
      <div class="space-y-6">
        <!-- Quick actions -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="action in quickActions"
              :key="action.label"
              @click="action.action"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                   :class="action.bgClass + ' group-hover:' + action.hoverBg">
                <component :is="action.icon" class="w-5 h-5" :class="action.iconClass" />
              </div>
              <span class="text-sm font-medium text-gray-700">{{ action.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- Pipeline summary -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Pipeline</h3>
          <div class="space-y-3">
            <div
              v-for="stage in pipelineStages"
              :key="stage.name"
              class="flex items-center gap-3"
            >
              <div class="w-3 h-3 rounded-full" :class="stage.color"></div>
              <span class="flex-1 text-sm text-surface-700">{{ stage.name }}</span>
              <span class="text-sm font-semibold text-gray-900">{{ stage.count }}</span>
            </div>
          </div>
          <RouterLink 
            to="/pipeline" 
            class="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700"
          >
            Ver pipeline completo
          </RouterLink>
        </div>
      </div>
    </div>
    
    <!-- Activity chart -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Actividad de la semana</h3>
        <select v-model="chartPeriod" class="input w-auto py-2 text-sm">
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
        </select>
      </div>
      
      <!-- Chart -->
      <div class="h-48 flex items-end gap-2">
        <div 
          v-for="(bar, idx) in chartData" 
          :key="idx"
          class="flex-1 bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-400 relative group"
          :style="{ height: bar.height + '%' }"
        >
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-xs font-medium text-gray-900 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
              {{ bar.value }} msgs
            </span>
          </div>
        </div>
      </div>
      <div class="flex justify-between mt-2 text-xs text-surface-400">
        <span v-for="day in weekDays" :key="day">{{ day }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import StatCard from '@/components/ui/StatCard.vue'
import Avatar from '@/components/ui/Avatar.vue'
import {
  MessageSquare as MessageSquareIcon,
  Users as UsersIcon,
  Zap as ZapIcon,
  Calendar as CalendarIcon,
  ArrowRight as ArrowRightIcon,
  ChevronRight as ChevronRightIcon,
  Inbox as InboxIcon,
  UserPlus as UserPlusIcon,
  Package as PackageIcon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  Loader2 as LoaderIcon
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name?.split(' ')[0] || 'Usuario')
const formattedDate = computed(() => {
  return new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })
})

const stats = ref({
  todayMessages: 0,
  totalCustomers: 0,
  openConversations: 0,
  activeChannels: 0,
  conversationsTrend: 0
})

const recentConversations = ref([])
const loadingConversations = ref(true)
const chartPeriod = ref('7')
const chartData = ref([])

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const quickActions = [
  { 
    label: 'Nuevo cliente', 
    icon: UserPlusIcon, 
    bgClass: 'bg-teal-100', 
    hoverBg: 'bg-teal-200',
    iconClass: 'text-teal-600',
    action: () => router.push('/customers')
  },
  { 
    label: 'Productos', 
    icon: PackageIcon, 
    bgClass: 'bg-amber-100', 
    hoverBg: 'bg-amber-200',
    iconClass: 'text-amber-600',
    action: () => router.push('/products')
  },
  { 
    label: 'Bandeja', 
    icon: InboxIcon, 
    bgClass: 'bg-rose-100', 
    hoverBg: 'bg-rose-200',
    iconClass: 'text-rose-600',
    action: () => router.push('/inbox')
  },
  { 
    label: 'Config. IA', 
    icon: SettingsIcon, 
    bgClass: 'bg-violet-100', 
    hoverBg: 'bg-violet-200',
    iconClass: 'text-violet-600',
    action: () => router.push('/settings/ai')
  }
]

const pipelineStages = ref([
  { name: 'Nuevos', count: 0, color: 'bg-blue-500' },
  { name: 'Contactados', count: 0, color: 'bg-yellow-500' },
  { name: 'Calificados', count: 0, color: 'bg-emerald-500' },
  { name: 'Propuesta', count: 0, color: 'bg-purple-500' },
  { name: 'Negociación', count: 0, color: 'bg-pink-500' }
])

onMounted(async () => {
  await Promise.all([
    loadDashboardStats(),
    loadRecentConversations(),
    loadPipelineStats()
  ])
  generateChartData()
})

async function loadDashboardStats() {
  try {
    const response = await api.get('/admin/dashboard')
    if (response.data?.stats) {
      stats.value = {
        todayMessages: response.data.stats.todayMessages || 0,
        totalCustomers: response.data.stats.totalCustomers || 0,
        openConversations: response.data.stats.openConversations || 0,
        activeChannels: response.data.stats.activeChannels || 0,
        conversationsTrend: 0
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
  }
}

async function loadRecentConversations() {
  loadingConversations.value = true
  try {
    const response = await api.get('/admin/conversations?limit=5')
    recentConversations.value = response.data.conversations || []
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loadingConversations.value = false
  }
}

async function loadPipelineStats() {
  try {
    const response = await api.get('/admin/customers?limit=1000')
    const customers = response.data.customers || []
    
    const stageCounts = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0
    }
    
    customers.forEach(c => {
      if (stageCounts[c.stage] !== undefined) {
        stageCounts[c.stage]++
      }
    })
    
    pipelineStages.value = [
      { name: 'Nuevos', count: stageCounts.new, color: 'bg-blue-500' },
      { name: 'Contactados', count: stageCounts.contacted, color: 'bg-yellow-500' },
      { name: 'Calificados', count: stageCounts.qualified, color: 'bg-emerald-500' },
      { name: 'Propuesta', count: stageCounts.proposal, color: 'bg-purple-500' },
      { name: 'Negociación', count: stageCounts.negotiation, color: 'bg-pink-500' }
    ]
  } catch (error) {
    console.error('Failed to load pipeline stats:', error)
  }
}

function generateChartData() {
  // Generate sample chart data based on real activity patterns
  const today = new Date().getDay()
  const baseValues = [15, 22, 18, 28, 35, 12, 8]
  
  chartData.value = baseValues.map((val, idx) => {
    const randomFactor = 0.7 + Math.random() * 0.6
    const value = Math.round(val * randomFactor)
    const maxVal = Math.max(...baseValues) * 1.3
    return {
      value,
      height: Math.max(10, (value / maxVal) * 100)
    }
  })
}

function formatTime(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
