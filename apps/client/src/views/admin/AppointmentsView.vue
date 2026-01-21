<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Citas</h2>
        <p class="text-slate-500">Gestiona las citas agendadas por el agente</p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink to="/settings/appointments" class="btn-secondary flex items-center gap-2">
          <SettingsIcon class="w-4 h-4" />
          Configuración
        </RouterLink>
        <button @click="showNewAppointmentModal = true" class="btn-primary flex items-center gap-2">
          <PlusIcon class="w-4 h-4" />
          Nueva Cita
        </button>
      </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <CalendarIcon class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">{{ stats.today }}</div>
            <div class="text-sm text-slate-500">Hoy</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircleIcon class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">{{ stats.confirmed }}</div>
            <div class="text-sm text-slate-500">Confirmadas</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClockIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">{{ stats.pending }}</div>
            <div class="text-sm text-slate-500">Pendientes</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <XCircleIcon class="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">{{ stats.cancelled }}</div>
            <div class="text-sm text-slate-500">Canceladas</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          @click="currentFilter = filter.value"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="currentFilter === filter.value ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          {{ filter.label }}
        </button>
        
        <div class="ml-auto flex items-center gap-2">
          <input 
            type="date" 
            v-model="dateFilter"
            class="input py-2 text-sm"
          />
        </div>
      </div>
    </div>
    
    <!-- Appointments List -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <Loader2Icon class="w-8 h-8 mx-auto animate-spin text-primary-500" />
        <p class="text-slate-500 mt-2">Cargando citas...</p>
      </div>
      
      <div v-else-if="appointments.length === 0" class="p-8 text-center">
        <CalendarIcon class="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p class="text-slate-500">No hay citas para mostrar</p>
      </div>
      
      <div v-else class="divide-y divide-slate-100">
        <div 
          v-for="appointment in appointments" 
          :key="appointment._id"
          class="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
          @click="selectedAppointment = appointment"
        >
          <div class="flex items-center gap-4">
            <div class="w-14 text-center">
              <div class="text-2xl font-bold text-slate-800">{{ formatDay(appointment.startTime) }}</div>
              <div class="text-xs text-slate-500 uppercase">{{ formatMonth(appointment.startTime) }}</div>
            </div>
            
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-slate-800">{{ appointment.title }}</span>
                <span 
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(appointment.status)"
                >
                  {{ getStatusLabel(appointment.status) }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <span class="flex items-center gap-1">
                  <ClockIcon class="w-3.5 h-3.5" />
                  {{ formatTime(appointment.startTime) }} - {{ formatTime(appointment.endTime) }}
                </span>
                <span class="flex items-center gap-1">
                  <UserIcon class="w-3.5 h-3.5" />
                  {{ appointment.customer?.name || 'Sin nombre' }}
                </span>
                <span v-if="appointment.channel" class="flex items-center gap-1">
                  <component :is="getChannelIcon(appointment.channel)" class="w-3.5 h-3.5" />
                  {{ appointment.channel }}
                </span>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <button 
                v-if="appointment.status === 'scheduled'"
                @click.stop="confirmAppointment(appointment)"
                class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Confirmar"
              >
                <CheckIcon class="w-4 h-4" />
              </button>
              <button 
                v-if="['scheduled', 'confirmed'].includes(appointment.status)"
                @click.stop="cancelAppointment(appointment)"
                class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Cancelar"
              >
                <XIcon class="w-4 h-4" />
              </button>
              <ChevronRightIcon class="w-5 h-5 text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Appointment Detail Modal -->
    <div v-if="selectedAppointment" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-800">Detalle de Cita</h3>
          <button @click="selectedAppointment = null" class="p-1 hover:bg-slate-100 rounded-lg">
            <XIcon class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="p-4 bg-slate-50 rounded-xl">
            <div class="text-xl font-bold text-slate-800">{{ selectedAppointment.title }}</div>
            <div class="text-slate-500 mt-1">
              {{ formatFullDate(selectedAppointment.startTime) }}
            </div>
            <div class="text-slate-500">
              {{ formatTime(selectedAppointment.startTime) }} - {{ formatTime(selectedAppointment.endTime) }}
              ({{ selectedAppointment.duration }} min)
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-slate-500">Cliente</div>
              <div class="font-medium text-slate-800">{{ selectedAppointment.customer?.name || 'Sin nombre' }}</div>
              <div class="text-sm text-slate-500">{{ selectedAppointment.customer?.phone }}</div>
            </div>
            <div>
              <div class="text-sm text-slate-500">Estado</div>
              <span 
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(selectedAppointment.status)"
              >
                {{ getStatusLabel(selectedAppointment.status) }}
              </span>
            </div>
          </div>
          
          <div v-if="selectedAppointment.description">
            <div class="text-sm text-slate-500">Notas</div>
            <div class="text-slate-700">{{ selectedAppointment.description }}</div>
          </div>
          
          <div v-if="selectedAppointment.conversation" class="pt-2">
            <RouterLink 
              :to="`/inbox/${selectedAppointment.conversation}`"
              class="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            >
              <MessageSquareIcon class="w-4 h-4" />
              Ver conversación
            </RouterLink>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button 
            v-if="selectedAppointment.status === 'scheduled'"
            @click="confirmAppointment(selectedAppointment); selectedAppointment = null"
            class="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Confirmar
          </button>
          <button 
            v-if="['scheduled', 'confirmed'].includes(selectedAppointment.status)"
            @click="cancelAppointment(selectedAppointment); selectedAppointment = null"
            class="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Cancelar
          </button>
          <button @click="selectedAppointment = null" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  User as UserIcon,
  Settings as SettingsIcon,
  Plus as PlusIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  X as XIcon,
  ChevronRight as ChevronRightIcon,
  MessageSquare as MessageSquareIcon,
  Phone as PhoneIcon,
  MessageCircle as MessageCircleIcon,
  Instagram as InstagramIcon,
  Loader2 as Loader2Icon
} from 'lucide-vue-next'

const loading = ref(true)
const appointments = ref([])
const selectedAppointment = ref(null)
const showNewAppointmentModal = ref(false)
const currentFilter = ref('all')
const dateFilter = ref('')

const filters = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'scheduled', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'cancelled', label: 'Canceladas' }
]

const stats = ref({
  today: 0,
  confirmed: 0,
  pending: 0,
  cancelled: 0
})

onMounted(async () => {
  await loadAppointments()
})

watch([currentFilter, dateFilter], () => {
  loadAppointments()
})

async function loadAppointments() {
  loading.value = true
  
  try {
    const params = {}
    
    if (currentFilter.value === 'today') {
      const today = new Date()
      params.startDate = today.toISOString().split('T')[0]
      params.endDate = params.startDate
    } else if (currentFilter.value === 'upcoming') {
      params.startDate = new Date().toISOString()
    } else if (['scheduled', 'confirmed', 'cancelled'].includes(currentFilter.value)) {
      params.status = currentFilter.value
    }
    
    if (dateFilter.value) {
      params.startDate = dateFilter.value
      params.endDate = dateFilter.value
    }
    
    const response = await api.get('/appointments', { params })
    appointments.value = response.data.appointments || []
    
    // Calculate stats
    const all = response.data.appointments || []
    const today = new Date().toDateString()
    stats.value = {
      today: all.filter(a => new Date(a.startTime).toDateString() === today).length,
      confirmed: all.filter(a => a.status === 'confirmed').length,
      pending: all.filter(a => a.status === 'scheduled').length,
      cancelled: all.filter(a => a.status === 'cancelled').length
    }
  } catch (error) {
    console.error('Failed to load appointments:', error)
  } finally {
    loading.value = false
  }
}

async function confirmAppointment(appointment) {
  try {
    await api.put(`/appointments/${appointment._id}`, { status: 'confirmed' })
    appointment.status = 'confirmed'
    await loadAppointments()
  } catch (error) {
    console.error('Failed to confirm:', error)
    alert('Error al confirmar: ' + error.message)
  }
}

async function cancelAppointment(appointment) {
  if (!confirm('¿Estás seguro de cancelar esta cita?')) return
  
  try {
    await api.delete(`/appointments/${appointment._id}`)
    await loadAppointments()
  } catch (error) {
    console.error('Failed to cancel:', error)
    alert('Error al cancelar: ' + error.message)
  }
}

function formatDay(date) {
  return new Date(date).getDate()
}

function formatMonth(date) {
  return new Date(date).toLocaleDateString('es-MX', { month: 'short' })
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

function formatFullDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function getStatusClass(status) {
  const classes = {
    scheduled: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    completed: 'bg-blue-100 text-blue-700',
    no_show: 'bg-slate-100 text-slate-700'
  }
  return classes[status] || 'bg-slate-100 text-slate-700'
}

function getStatusLabel(status) {
  const labels = {
    scheduled: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    no_show: 'No asistió'
  }
  return labels[status] || status
}

function getChannelIcon(channel) {
  const icons = {
    whatsapp: MessageCircleIcon,
    messenger: MessageCircleIcon,
    instagram: InstagramIcon
  }
  return icons[channel] || PhoneIcon
}
</script>
