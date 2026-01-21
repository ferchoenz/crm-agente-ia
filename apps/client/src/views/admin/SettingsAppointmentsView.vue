<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Configuración de Citas</h2>
        <p class="text-slate-500">Configura horarios y opciones para el agendado automático</p>
      </div>
      <button @click="saveConfig" class="btn-primary" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>
    
    <!-- Status Banner -->
    <div class="rounded-2xl p-4 border" :class="config.enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="config.enabled ? 'bg-emerald-500' : 'bg-slate-400'">
            <CalendarIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-semibold" :class="config.enabled ? 'text-emerald-800' : 'text-slate-600'">
              {{ config.enabled ? 'Citas Habilitadas' : 'Citas Deshabilitadas' }}
            </h3>
            <p class="text-sm" :class="config.enabled ? 'text-emerald-600' : 'text-slate-500'">
              {{ config.enabled ? 'El agente puede agendar citas automáticamente' : 'El agente no ofrecerá agendar citas' }}
            </p>
          </div>
        </div>
        <button 
          @click="config.enabled = !config.enabled"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="config.enabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-600 text-white hover:bg-slate-700'"
        >
          {{ config.enabled ? 'Desactivar' : 'Activar' }}
        </button>
      </div>
    </div>
    
    <!-- Calendar Connection Status -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="calendarConnected ? 'bg-blue-500' : 'bg-slate-300'">
          <CalendarIcon class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-slate-800">Google Calendar</h3>
          <p class="text-sm" :class="calendarConnected ? 'text-emerald-600' : 'text-slate-500'">
            {{ calendarConnected ? '✓ Conectado' : 'No conectado - requerido para citas' }}
          </p>
        </div>
        <RouterLink v-if="!calendarConnected" to="/settings/channels" class="text-sm text-primary-600 hover:text-primary-700">
          Conectar →
        </RouterLink>
      </div>
    </div>
    
    <!-- Duration & Buffer Settings -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <ClockIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Duración y Tiempos</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Duración de cita (minutos)</label>
          <select v-model.number="config.defaultDuration" class="input">
            <option :value="30">30 minutos</option>
            <option :value="45">45 minutos</option>
            <option :value="60">1 hora</option>
            <option :value="90">1 hora 30 min</option>
            <option :value="120">2 horas</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Buffer entre citas (minutos)</label>
          <select v-model.number="config.bufferMinutes" class="input">
            <option :value="0">Sin buffer</option>
            <option :value="5">5 minutos</option>
            <option :value="10">10 minutos</option>
            <option :value="15">15 minutos</option>
            <option :value="30">30 minutos</option>
          </select>
          <p class="text-xs text-slate-500 mt-1">Tiempo de descanso entre citas</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Máximo días anticipación</label>
          <select v-model.number="config.maxAdvanceDays" class="input">
            <option :value="7">1 semana</option>
            <option :value="14">2 semanas</option>
            <option :value="30">1 mes</option>
            <option :value="60">2 meses</option>
            <option :value="90">3 meses</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Business Hours -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <CalendarDaysIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Horario de Atención para Citas</h3>
      </div>
      
      <p class="text-sm text-slate-500 mb-4">Define los días y horarios disponibles para agendar citas</p>
      
      <div class="space-y-3">
        <div 
          v-for="(hours, day) in config.businessHours" 
          :key="day"
          class="flex items-center gap-4 p-3 rounded-xl border transition-colors"
          :class="hours.enabled ? 'border-primary-200 bg-primary-50/30' : 'border-slate-100 bg-slate-50'"
        >
          <button 
            @click="hours.enabled = !hours.enabled"
            class="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            :class="hours.enabled ? 'bg-primary-500 text-white' : 'bg-slate-200'"
          >
            <CheckIcon v-if="hours.enabled" class="w-4 h-4" />
          </button>
          
          <span class="w-24 font-medium capitalize" :class="hours.enabled ? 'text-slate-800' : 'text-slate-400'">
            {{ dayNames[day] }}
          </span>
          
          <div class="flex items-center gap-2 flex-1">
            <input 
              v-model="hours.start" 
              type="time" 
              class="input py-1.5 px-2 w-28"
              :disabled="!hours.enabled"
            />
            <span class="text-slate-400">a</span>
            <input 
              v-model="hours.end" 
              type="time" 
              class="input py-1.5 px-2 w-28"
              :disabled="!hours.enabled"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Reminder Settings -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <BellIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Recordatorios Automáticos</h3>
      </div>
      
      <p class="text-sm text-slate-500 mb-4">
        Los recordatorios se envían por el mismo canal donde se agendó la cita (WhatsApp, Messenger, Instagram)
      </p>
      
      <div class="flex flex-wrap gap-3">
        <label 
          v-for="option in reminderOptions" 
          :key="option.value"
          class="flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors"
          :class="config.reminderHoursBefore?.includes(option.value) ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'"
        >
          <input 
            type="checkbox" 
            :value="option.value"
            v-model="config.reminderHoursBefore"
            class="sr-only"
          />
          <div 
            class="w-5 h-5 rounded flex items-center justify-center"
            :class="config.reminderHoursBefore?.includes(option.value) ? 'bg-primary-500 text-white' : 'bg-slate-200'"
          >
            <CheckIcon v-if="config.reminderHoursBefore?.includes(option.value)" class="w-3 h-3" />
          </div>
          <span :class="config.reminderHoursBefore?.includes(option.value) ? 'text-primary-700' : 'text-slate-600'">
            {{ option.label }}
          </span>
        </label>
      </div>
    </div>
    
    <!-- Custom Messages -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <MessageSquareIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Mensajes Personalizados</h3>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje de confirmación</label>
          <textarea 
            v-model="config.confirmationMessage"
            class="input"
            rows="2"
            placeholder="✅ ¡Tu cita ha sido agendada! Te esperamos el {date} a las {time}."
          ></textarea>
          <p class="text-xs text-slate-500 mt-1">Variables: {date}, {time}, {name}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje de recordatorio</label>
          <textarea 
            v-model="config.reminderMessage"
            class="input"
            rows="2"
            placeholder="📅 Recordatorio: Tienes una cita programada para {date} a las {time}."
          ></textarea>
          <p class="text-xs text-slate-500 mt-1">Variables: {date}, {time}, {name}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import {
  Calendar as CalendarIcon,
  CalendarDays as CalendarDaysIcon,
  Clock as ClockIcon,
  Bell as BellIcon,
  MessageSquare as MessageSquareIcon,
  Check as CheckIcon
} from 'lucide-vue-next'

const saving = ref(false)
const calendarConnected = ref(false)

const dayNames = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

const reminderOptions = [
  { value: 24, label: '24 horas antes' },
  { value: 2, label: '2 horas antes' },
  { value: 1, label: '1 hora antes' }
]

const config = reactive({
  enabled: false,
  defaultDuration: 60,
  bufferMinutes: 15,
  maxAdvanceDays: 30,
  calendarId: 'primary',
  reminderHoursBefore: [24, 1],
  confirmationMessage: '',
  reminderMessage: '',
  businessHours: {
    monday: { start: '09:00', end: '18:00', enabled: true },
    tuesday: { start: '09:00', end: '18:00', enabled: true },
    wednesday: { start: '09:00', end: '18:00', enabled: true },
    thursday: { start: '09:00', end: '18:00', enabled: true },
    friday: { start: '09:00', end: '18:00', enabled: true },
    saturday: { start: '09:00', end: '14:00', enabled: false },
    sunday: { start: '09:00', end: '14:00', enabled: false }
  }
})

onMounted(async () => {
  await loadConfig()
  await checkCalendarStatus()
})

async function loadConfig() {
  try {
    const response = await api.get('/appointments/config')
    const data = response.data.config || {}
    
    if (data.enabled !== undefined) config.enabled = data.enabled
    if (data.defaultDuration) config.defaultDuration = data.defaultDuration
    if (data.bufferMinutes !== undefined) config.bufferMinutes = data.bufferMinutes
    if (data.maxAdvanceDays) config.maxAdvanceDays = data.maxAdvanceDays
    if (data.calendarId) config.calendarId = data.calendarId
    if (data.reminderHoursBefore) config.reminderHoursBefore = data.reminderHoursBefore
    if (data.confirmationMessage) config.confirmationMessage = data.confirmationMessage
    if (data.reminderMessage) config.reminderMessage = data.reminderMessage
    
    // Merge business hours
    if (data.businessHours) {
      for (const [day, hours] of Object.entries(data.businessHours)) {
        if (config.businessHours[day]) {
          config.businessHours[day] = { ...config.businessHours[day], ...hours }
        }
      }
    }
    
    calendarConnected.value = response.data.calendarConnected
  } catch (error) {
    console.error('Failed to load appointments config:', error)
  }
}

async function checkCalendarStatus() {
  try {
    const response = await api.get('/integrations/google/calendar/status')
    calendarConnected.value = response.data.connected
  } catch (error) {
    console.error('Failed to check calendar status:', error)
  }
}

async function saveConfig() {
  saving.value = true
  
  try {
    await api.put('/appointments/config', config)
    alert('Configuración guardada correctamente')
  } catch (error) {
    console.error('Failed to save config:', error)
    alert('Error al guardar: ' + (error.response?.data?.error || error.message))
  } finally {
    saving.value = false
  }
}
</script>
