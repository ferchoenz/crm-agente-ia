<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Salud del Sistema</h2>
        <p class="text-slate-500">Monitoreo en tiempo real del servidor y base de datos</p>
      </div>
      <button @click="loadHealth" class="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-200 transition-colors">
        <RefreshIcon class="w-4 h-4 inline mr-1" :class="{ 'animate-spin': loading }" />
        Actualizar
      </button>
    </div>

    <!-- Status Banner -->
    <div 
      class="rounded-2xl p-4 border"
      :class="health.status === 'healthy' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'"
    >
      <div class="flex items-center gap-3">
        <div 
          class="w-12 h-12 rounded-xl flex items-center justify-center"
          :class="health.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'"
        >
          <CheckCircleIcon v-if="health.status === 'healthy'" class="w-6 h-6 text-white" />
          <AlertTriangleIcon v-else class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="font-semibold" :class="health.status === 'healthy' ? 'text-emerald-800' : 'text-amber-800'">
            {{ health.status === 'healthy' ? 'Sistema Operativo' : 'Sistema Degradado' }}
          </h3>
          <p class="text-sm" :class="health.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'">
            Latencia: {{ health.latency }}ms | Última actualización: {{ formatTime(health.timestamp) }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Server Info -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <ServerIcon class="w-5 h-5 text-blue-600" />
          </div>
          <h3 class="font-semibold text-slate-800">Servidor</h3>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-slate-500">Uptime</span>
            <span class="text-slate-800 font-medium">{{ health.server?.uptimeFormatted }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Node.js</span>
            <span class="text-slate-800 font-medium">{{ health.server?.nodeVersion }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Plataforma</span>
            <span class="text-slate-800 font-medium">{{ health.server?.platform }} {{ health.server?.arch }}</span>
          </div>
        </div>
      </div>

      <!-- Memory -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <CpuIcon class="w-5 h-5 text-violet-600" />
          </div>
          <h3 class="font-semibold text-slate-800">Memoria</h3>
        </div>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-slate-500">Heap</span>
              <span class="text-slate-800">{{ health.memory?.usedPercentage }}%</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-violet-500 rounded-full transition-all"
                :style="{ width: (health.memory?.usedPercentage || 0) + '%' }"
              ></div>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Usado</span>
            <span class="text-slate-800 font-medium">{{ formatBytes(health.memory?.used) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Total</span>
            <span class="text-slate-800 font-medium">{{ formatBytes(health.memory?.total) }}</span>
          </div>
        </div>
      </div>

      <!-- CPU -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <ActivityIcon class="w-5 h-5 text-amber-600" />
          </div>
          <h3 class="font-semibold text-slate-800">CPU</h3>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-slate-500">Cores</span>
            <span class="text-slate-800 font-medium">{{ health.cpu?.cores }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Load (1m)</span>
            <span class="text-slate-800 font-medium">{{ health.cpu?.loadAverage?.['1m'] }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Load (5m)</span>
            <span class="text-slate-800 font-medium">{{ health.cpu?.loadAverage?.['5m'] }}</span>
          </div>
        </div>
      </div>

      <!-- Database -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <DatabaseIcon class="w-5 h-5 text-emerald-600" />
          </div>
          <h3 class="font-semibold text-slate-800">MongoDB</h3>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-slate-500">Estado</span>
            <span :class="health.database?.status === 'healthy' ? 'text-emerald-600' : 'text-rose-600'" class="font-medium">
              {{ health.database?.status === 'healthy' ? '● Conectado' : '● Error' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Latencia</span>
            <span class="text-slate-800 font-medium">{{ health.database?.latency }}ms</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Colecciones</span>
            <span class="text-slate-800 font-medium">{{ health.database?.collections }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Documentos</span>
            <span class="text-slate-800 font-medium">{{ formatNumber(health.database?.documents) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tamaño</span>
            <span class="text-slate-800 font-medium">{{ formatBytes(health.database?.dataSize) }}</span>
          </div>
        </div>
      </div>

      <!-- System -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <HardDriveIcon class="w-5 h-5 text-rose-600" />
          </div>
          <h3 class="font-semibold text-slate-800">Sistema</h3>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-slate-500">Hostname</span>
            <span class="text-slate-800 font-medium">{{ health.system?.hostname }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">OS</span>
            <span class="text-slate-800 font-medium">{{ health.system?.platform }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Uptime</span>
            <span class="text-slate-800 font-medium">{{ health.system?.uptimeFormatted }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <BarChartIcon class="w-5 h-5 text-primary-600" />
          </div>
          <h3 class="font-semibold text-slate-800">Estadísticas Rápidas</h3>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-slate-500">Organizaciones</span>
            <span class="text-slate-800 font-medium">{{ systemStats.organizations?.total }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Usuarios</span>
            <span class="text-slate-800 font-medium">{{ systemStats.users?.total }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Conversaciones Hoy</span>
            <span class="text-slate-800 font-medium">{{ systemStats.conversations?.today }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Mensajes Hoy</span>
            <span class="text-slate-800 font-medium">{{ systemStats.messages?.today }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import api from '@/services/api'
import {
  RefreshCw as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Server as ServerIcon,
  Cpu as CpuIcon,
  Activity as ActivityIcon,
  Database as DatabaseIcon,
  HardDrive as HardDriveIcon,
  BarChart3 as BarChartIcon
} from 'lucide-vue-next'

const loading = ref(false)
const health = ref({})
const systemStats = ref({})
let interval = null

onMounted(() => {
  loadHealth()
  interval = setInterval(loadHealth, 30000) // Refresh every 30s
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

async function loadHealth() {
  loading.value = true
  try {
    const [healthRes, statsRes] = await Promise.all([
      api.get('/superadmin/system/health'),
      api.get('/superadmin/system/stats')
    ])
    health.value = healthRes.data
    systemStats.value = statsRes.data
  } catch (error) {
    console.error('Failed to load health:', error)
  } finally {
    loading.value = false
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '-'
  return format(new Date(timestamp), 'HH:mm:ss')
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

function formatNumber(num) {
  if (!num) return '0'
  return new Intl.NumberFormat().format(num)
}
</script>
