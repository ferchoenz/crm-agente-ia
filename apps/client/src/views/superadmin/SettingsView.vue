<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-800">Configuración Global</h2>
      <p class="text-slate-500">Administra la configuración del sistema, planes y seguridad</p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div class="border-b border-slate-200 px-6">
        <nav class="flex gap-6">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="py-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.id ? 'text-primary-600 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-700'"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="p-6">
        <!-- Plans Tab -->
        <div v-if="activeTab === 'plans'" class="space-y-6">
          <div v-for="(plan, key) in settings.plans" :key="key" class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-semibold text-slate-800 capitalize">{{ plan.name || key }}</h4>
              <span class="text-lg font-bold text-primary-600">{{ formatCurrency(plan.price) }}/mes</span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-slate-500">Usuarios</span>
                <p class="font-medium text-slate-800">{{ plan.limits?.users === -1 ? 'Ilimitado' : plan.limits?.users }}</p>
              </div>
              <div>
                <span class="text-slate-500">Clientes</span>
                <p class="font-medium text-slate-800">{{ plan.limits?.customers === -1 ? 'Ilimitado' : plan.limits?.customers }}</p>
              </div>
              <div>
                <span class="text-slate-500">Mensajes IA</span>
                <p class="font-medium text-slate-800">{{ plan.limits?.aiMessages === -1 ? 'Ilimitado' : formatNumber(plan.limits?.aiMessages) }}</p>
              </div>
              <div>
                <span class="text-slate-500">Almacenamiento</span>
                <p class="font-medium text-slate-800">{{ plan.limits?.storage === -1 ? 'Ilimitado' : plan.limits?.storage + ' MB' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Maintenance Tab -->
        <div v-if="activeTab === 'maintenance'" class="space-y-6">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-amber-800">Modo Mantenimiento</h4>
                <p class="text-sm text-amber-600">Cuando está activo, los usuarios verán un mensaje de mantenimiento</p>
              </div>
              <button 
                @click="toggleMaintenance"
                class="px-4 py-2 rounded-xl font-medium transition-colors"
                :class="settings.maintenanceMode?.enabled ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'"
              >
                {{ settings.maintenanceMode?.enabled ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje de Mantenimiento</label>
            <textarea 
              v-model="maintenanceMessage"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Security Tab -->
        <div v-if="activeTab === 'security'" class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Tiempo de Sesión (ms)</label>
              <input 
                v-model.number="securityForm.sessionTimeout" 
                type="number" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Intentos Máximos de Login</label>
              <input 
                v-model.number="securityForm.maxLoginAttempts" 
                type="number" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Duración de Bloqueo (ms)</label>
              <input 
                v-model.number="securityForm.lockoutDuration" 
                type="number" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">IPs Bloqueadas</label>
            <textarea 
              v-model="blockedIPsText"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm"
              rows="4"
              placeholder="Una IP por línea"
            ></textarea>
          </div>
          
          <button @click="saveSecurity" class="btn-primary" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>

        <!-- Backup Tab -->
        <div v-if="activeTab === 'backup'" class="space-y-6">
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-blue-800">Backup Manual</h4>
                <p class="text-sm text-blue-600">Último backup: {{ settings.backup?.lastBackup ? formatDate(settings.backup.lastBackup) : 'Nunca' }}</p>
              </div>
              <button 
                @click="triggerBackup"
                class="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                :disabled="backingUp"
              >
                {{ backingUp ? 'Ejecutando...' : 'Ejecutar Backup' }}
              </button>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold text-slate-800 mb-4">Historial de Backups</h4>
            <div v-if="backupHistory.length" class="space-y-2">
              <div 
                v-for="backup in backupHistory" 
                :key="backup._id"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <div>
                  <span class="text-slate-800">{{ backup.description }}</span>
                  <span class="text-slate-500 text-sm ml-2">{{ formatDate(backup.createdAt) }}</span>
                </div>
                <span class="text-emerald-600 text-sm">● Completado</span>
              </div>
            </div>
            <div v-else class="text-center py-8 text-slate-400">
              No hay backups registrados
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'

const activeTab = ref('plans')
const settings = ref({})
const backupHistory = ref([])
const saving = ref(false)
const backingUp = ref(false)

const tabs = [
  { id: 'plans', label: 'Planes' },
  { id: 'maintenance', label: 'Mantenimiento' },
  { id: 'security', label: 'Seguridad' },
  { id: 'backup', label: 'Backup' }
]

const maintenanceMessage = ref('')
const securityForm = reactive({
  sessionTimeout: 86400000,
  maxLoginAttempts: 5,
  lockoutDuration: 900000
})
const blockedIPsText = ref('')

onMounted(loadSettings)

async function loadSettings() {
  try {
    const response = await api.get('/superadmin/settings')
    settings.value = response.data.settings
    
    maintenanceMessage.value = settings.value.maintenanceMode?.message || ''
    securityForm.sessionTimeout = settings.value.security?.sessionTimeout || 86400000
    securityForm.maxLoginAttempts = settings.value.security?.maxLoginAttempts || 5
    securityForm.lockoutDuration = settings.value.security?.lockoutDuration || 900000
    blockedIPsText.value = settings.value.security?.blockedIPs?.join('\n') || ''
    
    const historyRes = await api.get('/superadmin/backup/history')
    backupHistory.value = historyRes.data.backups || []
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

async function toggleMaintenance() {
  try {
    const response = await api.put('/superadmin/settings/maintenance', {
      enabled: !settings.value.maintenanceMode?.enabled,
      message: maintenanceMessage.value
    })
    settings.value.maintenanceMode = response.data.maintenanceMode
  } catch (error) {
    alert('Error al cambiar modo mantenimiento')
  }
}

async function saveSecurity() {
  saving.value = true
  try {
    await api.put('/superadmin/settings/security', {
      ...securityForm,
      blockedIPs: blockedIPsText.value.split('\n').filter(ip => ip.trim())
    })
    alert('Configuración guardada')
  } catch (error) {
    alert('Error al guardar')
  } finally {
    saving.value = false
  }
}

async function triggerBackup() {
  backingUp.value = true
  try {
    await api.post('/superadmin/backup/trigger')
    alert('Backup ejecutado correctamente')
    await loadSettings()
  } catch (error) {
    alert('Error al ejecutar backup')
  } finally {
    backingUp.value = false
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num || 0)
}

function formatDate(date) {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: es })
}
</script>
