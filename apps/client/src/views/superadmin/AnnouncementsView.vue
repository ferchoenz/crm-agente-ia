<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Anuncios</h2>
        <p class="text-slate-500">Comunica información importante a todas las organizaciones</p>
      </div>
      <button @click="showModal = true" class="btn-primary">
        <PlusIcon class="w-4 h-4 mr-2" />
        Nuevo Anuncio
      </button>
    </div>

    <!-- Announcements List -->
    <div class="space-y-4">
      <div 
        v-for="announcement in announcements" 
        :key="announcement._id"
        class="bg-white rounded-2xl border shadow-sm overflow-hidden"
        :class="getTypeBorder(announcement.type)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="getTypeColor(announcement.type)"
              >
                <component :is="getTypeIcon(announcement.type)" class="w-5 h-5 text-white" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-slate-800">{{ announcement.title }}</h3>
                  <span 
                    v-if="!announcement.active"
                    class="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full"
                  >Inactivo</span>
                </div>
                <p class="text-slate-600 mt-1">{{ announcement.message }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>{{ formatDate(announcement.createdAt) }}</span>
                  <span class="capitalize">{{ announcement.targetType === 'all' ? 'Para todos' : announcement.targetType }}</span>
                  <span v-if="announcement.expiresAt">Expira: {{ formatDate(announcement.expiresAt) }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="toggleActive(announcement)" 
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                :class="announcement.active ? 'text-emerald-500' : 'text-slate-400'"
              >
                <PowerIcon class="w-4 h-4" />
              </button>
              <button 
                @click="deleteAnnouncement(announcement._id)" 
                class="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="announcements.length === 0" class="bg-white rounded-2xl border border-slate-200 text-center py-12 text-slate-400">
        No hay anuncios
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-primary-500 to-violet-500 px-6 py-4">
          <h3 class="text-lg font-semibold text-white">Nuevo Anuncio</h3>
        </div>
        
        <form @submit.prevent="createAnnouncement" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Título</label>
            <input v-model="form.title" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje</label>
            <textarea v-model="form.message" rows="4" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" required></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Tipo</label>
              <select v-model="form.type" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <option value="info">Información</option>
                <option value="warning">Advertencia</option>
                <option value="critical">Crítico</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="feature">Nueva Función</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Destinatarios</label>
              <select v-model="form.targetType" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <option value="all">Todos</option>
                <option value="plan">Por Plan</option>
              </select>
            </div>
          </div>
          
          <div v-if="form.targetType === 'plan'" class="flex flex-wrap gap-2">
            <label v-for="plan in ['free', 'basic', 'pro', 'enterprise']" :key="plan" class="flex items-center gap-2">
              <input type="checkbox" v-model="form.targetPlans" :value="plan" class="rounded" />
              <span class="capitalize text-slate-700">{{ plan }}</span>
            </label>
          </div>
          
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="form.dismissible" class="rounded" />
              <span class="text-sm text-slate-600">Puede cerrarse</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="form.showOnLogin" class="rounded" />
              <span class="text-sm text-slate-600">Mostrar al login</span>
            </label>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="button" @click="showModal = false" class="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">
              Cancelar
            </button>
            <button type="submit" class="flex-1 btn-primary" :disabled="creating">
              {{ creating ? 'Creando...' : 'Publicar Anuncio' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  Plus as PlusIcon,
  Power as PowerIcon,
  Trash2 as TrashIcon,
  Info as InfoIcon,
  AlertTriangle as WarningIcon,
  AlertCircle as CriticalIcon,
  Wrench as MaintenanceIcon,
  Sparkles as FeatureIcon
} from 'lucide-vue-next'

const announcements = ref([])
const showModal = ref(false)
const creating = ref(false)

const form = reactive({
  title: '',
  message: '',
  type: 'info',
  targetType: 'all',
  targetPlans: [],
  dismissible: true,
  showOnLogin: false
})

onMounted(loadAnnouncements)

async function loadAnnouncements() {
  try {
    const response = await api.get('/superadmin/announcements')
    announcements.value = response.data.announcements
  } catch (error) {
    console.error('Failed to load announcements:', error)
  }
}

async function createAnnouncement() {
  creating.value = true
  try {
    await api.post('/superadmin/announcements', form)
    showModal.value = false
    Object.assign(form, { title: '', message: '', type: 'info', targetType: 'all', targetPlans: [], dismissible: true, showOnLogin: false })
    await loadAnnouncements()
  } catch (error) {
    alert('Error al crear anuncio')
  } finally {
    creating.value = false
  }
}

async function toggleActive(announcement) {
  try {
    await api.put(`/superadmin/announcements/${announcement._id}`, { active: !announcement.active })
    announcement.active = !announcement.active
  } catch (error) {
    alert('Error al cambiar estado')
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('¿Eliminar este anuncio?')) return
  try {
    await api.delete(`/superadmin/announcements/${id}`)
    await loadAnnouncements()
  } catch (error) {
    alert('Error al eliminar')
  }
}

function getTypeColor(type) {
  const colors = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500',
    maintenance: 'bg-violet-500',
    feature: 'bg-emerald-500'
  }
  return colors[type] || colors.info
}

function getTypeBorder(type) {
  const borders = {
    info: 'border-blue-200',
    warning: 'border-amber-200',
    critical: 'border-rose-200',
    maintenance: 'border-violet-200',
    feature: 'border-emerald-200'
  }
  return borders[type] || borders.info
}

function getTypeIcon(type) {
  const icons = {
    info: InfoIcon,
    warning: WarningIcon,
    critical: CriticalIcon,
    maintenance: MaintenanceIcon,
    feature: FeatureIcon
  }
  return icons[type] || InfoIcon
}

function formatDate(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
