<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Logs de Actividad</h2>
        <p class="text-slate-500">Auditoría de todas las acciones del sistema</p>
      </div>
      <button @click="loadLogs" class="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-200 transition-colors">
        <RefreshIcon class="w-4 h-4 inline mr-1" />
        Actualizar
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap gap-4">
        <select v-model="filterAction" @change="loadLogs" class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
          <option value="">Todas las acciones</option>
          <option value="create">Crear</option>
          <option value="update">Actualizar</option>
          <option value="delete">Eliminar</option>
          <option value="login">Login</option>
          <option value="password_reset">Reset Password</option>
          <option value="impersonate_start">Impersonar</option>
          <option value="settings_change">Cambio Config</option>
        </select>
        <select v-model="filterTarget" @change="loadLogs" class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
          <option value="">Todos los tipos</option>
          <option value="organization">Organizaciones</option>
          <option value="user">Usuarios</option>
          <option value="system">Sistema</option>
          <option value="settings">Configuración</option>
        </select>
      </div>
    </div>

    <!-- Logs List -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
      <div 
        v-for="log in logs" 
        :key="log._id"
        class="p-4 hover:bg-slate-50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="getActionColor(log.action)"
            >
              <component :is="getActionIcon(log.action)" class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-slate-800">
                <span class="capitalize">{{ log.action.replace('_', ' ') }}</span>
                <span v-if="log.targetName" class="text-slate-600"> - {{ log.targetName }}</span>
              </div>
              <p v-if="log.description" class="text-sm text-slate-600">{{ log.description }}</p>
              <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
                <span>{{ log.actorEmail || log.actor?.email }}</span>
                <span v-if="log.organization?.name">{{ log.organization.name }}</span>
                <span v-if="log.ipAddress">IP: {{ log.ipAddress }}</span>
              </div>
            </div>
          </div>
          <div class="text-sm text-slate-400 whitespace-nowrap">
            {{ formatDate(log.createdAt) }}
          </div>
        </div>
      </div>
      
      <div v-if="!loading && logs.length === 0" class="text-center py-12 text-slate-400">
        No hay logs de actividad
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="flex items-center justify-center gap-2">
      <button 
        @click="goToPage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        ←
      </button>
      <span class="text-slate-600">{{ pagination.page }} / {{ pagination.pages }}</span>
      <button 
        @click="goToPage(pagination.page + 1)"
        :disabled="pagination.page === pagination.pages"
        class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  RefreshCw as RefreshIcon,
  Plus as CreateIcon,
  Pencil as UpdateIcon,
  Trash2 as DeleteIcon,
  LogIn as LoginIcon,
  Key as PasswordIcon,
  User as ImpersonateIcon,
  Settings as SettingsIcon,
  Activity as DefaultIcon
} from 'lucide-vue-next'

const logs = ref([])
const loading = ref(false)
const filterAction = ref('')
const filterTarget = ref('')
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

onMounted(loadLogs)

async function loadLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...(filterAction.value && { action: filterAction.value }),
      ...(filterTarget.value && { targetType: filterTarget.value })
    })
    
    const response = await api.get(`/superadmin/activity-logs?${params}`)
    logs.value = response.data.logs
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Failed to load logs:', error)
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pages) return
  pagination.value.page = page
  loadLogs()
}

function getActionColor(action) {
  const colors = {
    create: 'bg-emerald-500',
    update: 'bg-blue-500',
    delete: 'bg-rose-500',
    login: 'bg-violet-500',
    logout: 'bg-slate-500',
    password_reset: 'bg-amber-500',
    impersonate_start: 'bg-orange-500',
    settings_change: 'bg-primary-500',
    backup: 'bg-cyan-500'
  }
  return colors[action] || 'bg-slate-400'
}

function getActionIcon(action) {
  const icons = {
    create: CreateIcon,
    update: UpdateIcon,
    delete: DeleteIcon,
    login: LoginIcon,
    password_reset: PasswordIcon,
    impersonate_start: ImpersonateIcon,
    settings_change: SettingsIcon
  }
  return icons[action] || DefaultIcon
}

function formatDate(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
