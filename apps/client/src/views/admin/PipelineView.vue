<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Pipeline de Ventas</h2>
        <p class="text-slate-500">Arrastra los leads entre las etapas</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-500">{{ totalLeads }} leads</span>
        <button @click="loadPipeline" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshIcon class="w-5 h-5 text-slate-500" />
        </button>
      </div>
    </div>
    
    <!-- Kanban Board -->
    <div class="flex gap-4 overflow-x-auto pb-4" style="min-height: calc(100vh - 14rem);">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="flex-shrink-0 w-72 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-sm"
        @dragover.prevent
        @drop="handleDrop($event, stage.id)"
      >
        <!-- Stage Header -->
        <div class="p-4 border-b border-slate-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :class="stage.color"></div>
              <h3 class="font-semibold text-slate-800">{{ stage.label }}</h3>
            </div>
            <span class="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
              {{ getStageLeads(stage.id).length }}
            </span>
          </div>
          <div class="text-sm text-slate-500 mt-1">
            {{ formatCurrency(getStageValue(stage.id)) }}
          </div>
        </div>
        
        <!-- Cards Container -->
        <div class="flex-1 p-3 space-y-3 overflow-y-auto bg-slate-50/50">
          <div
            v-for="lead in getStageLeads(stage.id)"
            :key="lead._id"
            draggable="true"
            @dragstart="handleDragStart($event, lead)"
            class="bg-white rounded-xl p-4 cursor-grab active:cursor-grabbing border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
          >
            <!-- Lead Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                     :class="lead.source?.channel === 'whatsapp' ? 'bg-emerald-500' : 'bg-primary-500'">
                  {{ lead.name?.[0]?.toUpperCase() || '?' }}
                </div>
                <div>
                  <div class="font-medium text-slate-800 text-sm">{{ lead.name || 'Sin nombre' }}</div>
                  <div class="text-xs text-slate-500">{{ lead.phone }}</div>
                </div>
              </div>
              <RouterLink :to="`/customers/${lead._id}`" class="text-slate-400 hover:text-primary-500 transition-colors">
                <ExternalLinkIcon class="w-4 h-4" />
              </RouterLink>
            </div>
            
            <!-- Lead Score -->
            <div class="mb-3">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-slate-500">Lead Score</span>
                <span class="font-semibold" :class="getScoreColor(lead.leadScore)">{{ lead.leadScore }}%</span>
              </div>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="getScoreBarColor(lead.leadScore)"
                  :style="{ width: `${lead.leadScore}%` }"
                ></div>
              </div>
            </div>
            
            <!-- Tags -->
            <div v-if="lead.tags?.length" class="flex flex-wrap gap-1 mb-3">
              <span 
                v-for="tag in lead.tags.slice(0, 3)" 
                :key="tag" 
                class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full"
              >
                {{ tag }}
              </span>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>{{ formatDate(lead.stats?.lastContactAt) }}</span>
              <div class="flex items-center gap-1">
                <MessageIcon class="w-3 h-3" />
                <span>{{ lead.stats?.totalMessages || 0 }}</span>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="getStageLeads(stage.id).length === 0" 
               class="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm bg-white">
            Arrastra leads aquí
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  RefreshCw as RefreshIcon,
  ExternalLink as ExternalLinkIcon,
  MessageSquare as MessageIcon
} from 'lucide-vue-next'

const loading = ref(true)
const leads = ref([])
const draggedLead = ref(null)

const stages = [
  { id: 'new', label: 'Nuevos', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contactados', color: 'bg-yellow-500' },
  { id: 'qualified', label: 'Calificados', color: 'bg-orange-500' },
  { id: 'proposal', label: 'Propuesta', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negociación', color: 'bg-pink-500' },
  { id: 'won', label: 'Ganados', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Perdidos', color: 'bg-rose-500' }
]

const totalLeads = computed(() => leads.value.length)

onMounted(loadPipeline)

async function loadPipeline() {
  loading.value = true
  try {
    const response = await api.get('/admin/customers?limit=100')
    leads.value = response.data.customers || []
  } catch (error) {
    console.error('Failed to load pipeline:', error)
  } finally {
    loading.value = false
  }
}

function getStageLeads(stageId) {
  return leads.value.filter(lead => lead.stage === stageId)
}

function getStageValue(stageId) {
  return getStageLeads(stageId).length * 1000
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

function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

function getScoreBarColor(score) {
  if (score >= 70) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
  if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-400'
  return 'bg-gradient-to-r from-rose-500 to-rose-400'
}

function formatDate(date) {
  if (!date) return 'Sin contacto'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}
</script>
