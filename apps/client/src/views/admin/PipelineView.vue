<template>
  <div class="space-y-6">
    <!-- Premium Header -->
    <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold">Pipeline de Ventas</h2>
          <p class="text-white/80 mt-1">{{ totalLeads }} leads en proceso</p>
        </div>
        
        <!-- Stats -->
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold">{{ formatCurrency(totalValue) }}</div>
            <div class="text-xs text-white/70">Valor estimado</div>
          </div>
          <div class="h-10 w-px bg-white/20"></div>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ conversionRate }}%</div>
            <div class="text-xs text-white/70">Conversión</div>
          </div>
          <div class="h-10 w-px bg-white/20 hidden md:block"></div>
          <button @click="loadPipeline" class="p-2 hover:bg-white/20 rounded-xl transition-colors hidden md:block">
            <RefreshIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mt-4">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="currentFilter = filter.value"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-sm"
          :class="currentFilter === filter.value 
            ? 'bg-white text-indigo-600' 
            : 'bg-white/20 text-white hover:bg-white/30'"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>
    
    <!-- Kanban Board -->
    <div class="flex gap-4 overflow-x-auto pb-4" style="min-height: calc(100vh - 16rem);">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="flex-shrink-0 w-80 flex flex-col"
        @dragover.prevent
        @drop="handleDrop($event, stage.id)"
      >
        <!-- Stage Header with Glassmorphism -->
        <div 
          class="rounded-2xl p-4 mb-3 backdrop-blur-md border shadow-lg"
          :class="stage.headerClass"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :class="stage.dotColor"></div>
              <h3 class="font-semibold text-slate-800">{{ stage.label }}</h3>
            </div>
            <span class="px-2.5 py-1 bg-white/60 backdrop-blur-sm text-slate-700 text-xs font-bold rounded-full shadow-sm">
              {{ getStageLeads(stage.id).length }}
            </span>
          </div>
          <div class="text-sm text-slate-600 mt-1 font-medium">
            {{ formatCurrency(getStageValue(stage.id)) }}
          </div>
        </div>
        
        <!-- Cards Container -->
        <div class="flex-1 space-y-3 min-h-[200px]">
          <div
            v-for="lead in getStageLeads(stage.id)"
            :key="lead._id"
            draggable="true"
            @dragstart="handleDragStart($event, lead)"
            class="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg border border-slate-200 
                   cursor-grab active:cursor-grabbing transition-all duration-200
                   hover:-translate-y-0.5 group"
          >
            <!-- Lead Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                  :class="lead.source?.channel === 'whatsapp' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                        : lead.source?.channel === 'messenger' ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : lead.source?.channel === 'instagram' ? 'bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400'
                        : 'bg-gradient-to-br from-slate-400 to-slate-600'"
                >
                  {{ lead.name?.[0]?.toUpperCase() || '?' }}
                </div>
                <div>
                  <div class="font-semibold text-slate-800 text-sm">{{ lead.name || 'Sin nombre' }}</div>
                  <div class="text-xs text-slate-500">{{ lead.phone }}</div>
                </div>
              </div>
              
              <!-- Inactivity Indicator -->
              <div class="flex items-center gap-1">
                <div 
                  class="w-2.5 h-2.5 rounded-full"
                  :class="getInactivityClass(lead.stats?.lastContactAt)"
                  :title="getInactivityTooltip(lead.stats?.lastContactAt)"
                ></div>
              </div>
            </div>
            
            <!-- Lead Score -->
            <div class="mb-3">
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="text-slate-500 font-medium">Lead Score</span>
                <span class="font-bold" :class="getScoreColor(lead.leadScore)">{{ lead.leadScore || 0 }}%</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="getScoreBarColor(lead.leadScore)"
                  :style="{ width: `${lead.leadScore || 0}%` }"
                ></div>
              </div>
            </div>
            
            <!-- Tags -->
            <div v-if="lead.tags?.length" class="flex flex-wrap gap-1 mb-3">
              <span 
                v-for="tag in lead.tags.slice(0, 3)" 
                :key="tag" 
                class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full font-medium"
              >
                {{ tag }}
              </span>
              <span v-if="lead.tags.length > 3" class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                +{{ lead.tags.length - 3 }}
              </span>
            </div>
            
            <!-- Footer with Quick Actions -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100">
              <span class="text-xs text-slate-400">{{ formatDate(lead.stats?.lastContactAt) }}</span>
              
              <!-- Quick Actions (visible on hover) -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <RouterLink 
                  :to="`/customers/${lead._id}`" 
                  class="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Ver perfil"
                >
                  <UserIcon class="w-4 h-4" />
                </RouterLink>
                <button 
                  @click.stop="openWhatsApp(lead)"
                  v-if="lead.phone"
                  class="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="WhatsApp"
                >
                  <PhoneIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="getStageLeads(stage.id).length === 0" 
               class="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm bg-white/50">
            <div class="text-center">
              <TargetIcon class="w-6 h-6 mx-auto mb-1 opacity-50" />
              <span>Arrastra leads aquí</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatDistanceToNow, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  RefreshCw as RefreshIcon,
  User as UserIcon,
  Phone as PhoneIcon,
  Target as TargetIcon
} from 'lucide-vue-next'

const loading = ref(true)
const leads = ref([])
const draggedLead = ref(null)
const currentFilter = ref('all')

const filters = [
  { label: 'Todos', value: 'all' },
  { label: '🟢 Activos (24h)', value: 'active' },
  { label: '🟡 Tibios (48h)', value: 'warm' },
  { label: '🔴 Fríos (+48h)', value: 'cold' },
  { label: '🔥 Score > 70', value: 'hot' }
]

const stages = [
  { id: 'new', label: 'Nuevos', dotColor: 'bg-blue-500', headerClass: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' },
  { id: 'contacted', label: 'Contactados', dotColor: 'bg-yellow-500', headerClass: 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200' },
  { id: 'qualified', label: 'Calificados', dotColor: 'bg-orange-500', headerClass: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' },
  { id: 'proposal', label: 'Propuesta', dotColor: 'bg-violet-500', headerClass: 'bg-gradient-to-br from-violet-50 to-purple-100 border-purple-200' },
  { id: 'negotiation', label: 'Negociación', dotColor: 'bg-pink-500', headerClass: 'bg-gradient-to-br from-pink-50 to-rose-100 border-rose-200' },
  { id: 'won', label: 'Ganados', dotColor: 'bg-emerald-500', headerClass: 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200' },
  { id: 'lost', label: 'Perdidos', dotColor: 'bg-slate-400', headerClass: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200' }
]

const totalLeads = computed(() => filteredLeads.value.length)
const totalValue = computed(() => filteredLeads.value.length * 2500) // Estimate
const conversionRate = computed(() => {
  const won = leads.value.filter(l => l.stage === 'won').length
  const total = leads.value.length
  return total ? Math.round((won / total) * 100) : 0
})

const filteredLeads = computed(() => {
  let filtered = leads.value
  
  if (currentFilter.value === 'active') {
    filtered = filtered.filter(l => getHoursSinceContact(l.stats?.lastContactAt) < 24)
  } else if (currentFilter.value === 'warm') {
    filtered = filtered.filter(l => {
      const hours = getHoursSinceContact(l.stats?.lastContactAt)
      return hours >= 24 && hours < 48
    })
  } else if (currentFilter.value === 'cold') {
    filtered = filtered.filter(l => getHoursSinceContact(l.stats?.lastContactAt) >= 48)
  } else if (currentFilter.value === 'hot') {
    filtered = filtered.filter(l => (l.leadScore || 0) >= 70)
  }
  
  return filtered
})

onMounted(loadPipeline)

async function loadPipeline() {
  loading.value = true
  try {
    const response = await api.get('/admin/customers?limit=200')
    leads.value = response.data.customers || []
  } catch (error) {
    console.error('Failed to load pipeline:', error)
  } finally {
    loading.value = false
  }
}

function getStageLeads(stageId) {
  return filteredLeads.value.filter(lead => lead.stage === stageId)
}

function getStageValue(stageId) {
  return getStageLeads(stageId).length * 2500
}

function handleDragStart(event, lead) {
  draggedLead.value = lead
  event.dataTransfer.effectAllowed = 'move'
}

async function handleDrop(event, stageId) {
  event.preventDefault()
  
  if (!draggedLead.value || draggedLead.value.stage === stageId) {
    draggedLead.value = null
    return
  }
  
  const leadId = draggedLead.value._id
  const oldStage = draggedLead.value.stage
  
  draggedLead.value.stage = stageId
  
  try {
    await api.patch(`/admin/customers/${leadId}`, { stage: stageId })
  } catch (error) {
    draggedLead.value.stage = oldStage
    console.error('Failed to update stage:', error)
  }
  
  draggedLead.value = null
}

function getHoursSinceContact(date) {
  if (!date) return 999
  return differenceInHours(new Date(), new Date(date))
}

function getInactivityClass(date) {
  const hours = getHoursSinceContact(date)
  if (hours < 24) return 'bg-emerald-500 animate-pulse' // Green - Active
  if (hours < 48) return 'bg-amber-500' // Yellow - Warm
  return 'bg-red-500' // Red - Cold
}

function getInactivityTooltip(date) {
  const hours = getHoursSinceContact(date)
  if (hours < 24) return 'Activo (últimas 24h)'
  if (hours < 48) return 'Tibio (24-48h)'
  return 'Frío (más de 48h)'
}

function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBarColor(score) {
  if (score >= 70) return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
  if (score >= 40) return 'bg-gradient-to-r from-amber-400 to-amber-500'
  return 'bg-gradient-to-r from-red-400 to-red-500'
}

function formatDate(date) {
  if (!date) return 'Sin contacto'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(value)
}

function openWhatsApp(lead) {
  if (lead.phone) {
    const phone = lead.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }
}
</script>
