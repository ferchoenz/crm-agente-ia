<template>
  <div class="space-y-6">
    <!-- Header with back button -->
    <div class="flex items-center gap-4">
      <button @click="$router.back()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors">
        <ArrowLeftIcon class="w-5 h-5 text-slate-600" />
      </button>
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-slate-800">{{ customer?.name || 'Cliente' }}</h2>
        <p class="text-slate-500">{{ customer?.phone }}</p>
      </div>
      <button @click="editMode = true" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2">
        <EditIcon class="w-4 h-4" />
        Editar
      </button>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Contact Card -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Información de Contacto</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-slate-500">Teléfono</div>
              <div class="text-slate-800 font-medium">{{ customer?.phone || '-' }}</div>
            </div>
            <div>
              <div class="text-sm text-slate-500">Email</div>
              <div class="text-slate-800 font-medium">{{ customer?.email || '-' }}</div>
            </div>
            <div>
              <div class="text-sm text-slate-500">Canal de origen</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="customer?.source?.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700'">
                  {{ customer?.source?.channel || 'Desconocido' }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-sm text-slate-500">Etapa</div>
              <select v-model="customer.stage" @change="updateStage" class="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="proposal">Propuesta</option>
                <option value="negotiation">Negociación</option>
                <option value="won">Ganado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Lead Score -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Lead Score</h3>
          <div class="flex items-center gap-6">
            <div class="relative w-24 h-24">
              <svg class="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e2e8f0" stroke-width="8" fill="none"/>
                <circle 
                  cx="48" cy="48" r="40" 
                  :stroke="getScoreColor(customer?.leadScore)" 
                  stroke-width="8" 
                  fill="none"
                  :stroke-dasharray="251.2"
                  :stroke-dashoffset="251.2 - (251.2 * (customer?.leadScore || 0) / 100)"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-slate-800">{{ customer?.leadScore || 0 }}</span>
              </div>
            </div>
            <div>
              <div class="text-lg font-medium text-slate-800">
                {{ getScoreLabel(customer?.leadScore) }}
              </div>
              <div class="text-sm text-slate-500 mt-1">
                Basado en la interacción con el cliente
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI Insights -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Insights de IA</h3>
          <div class="space-y-3">
            <div v-if="customer?.insights?.summary" class="p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div class="text-sm text-violet-600 mb-1 font-medium">Resumen</div>
              <div class="text-slate-700">{{ customer?.insights?.summary }}</div>
            </div>
            <div v-if="customer?.insights?.intents?.length" class="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div class="text-sm text-primary-600 mb-2 font-medium">Intenciones detectadas</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="intent in customer?.insights?.intents" :key="intent" class="px-2.5 py-1 bg-white text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                  {{ intent }}
                </span>
              </div>
            </div>
            <div v-if="!customer?.insights?.summary && !customer?.insights?.intents?.length" class="text-slate-400 text-center py-6">
              Aún no hay suficientes datos para generar insights
            </div>
          </div>
        </div>
        
        <!-- Recent Conversations -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Conversaciones Recientes</h3>
          <div v-if="conversations.length" class="space-y-3">
            <RouterLink
              v-for="conv in conversations"
              :key="conv._id"
              :to="`/inbox/${conv._id}`"
              class="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <MessageIcon class="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div class="text-sm text-slate-700">{{ conv.lastMessage?.content || 'Sin mensajes' }}</div>
                  <div class="text-xs text-slate-500">{{ formatDate(conv.lastMessageAt) }}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="conv.aiEnabled ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'">
                {{ conv.aiEnabled ? '✨ IA' : '👤 Manual' }}
              </span>
            </RouterLink>
          </div>
          <div v-else class="text-center py-8 text-slate-400">
            No hay conversaciones
          </div>
        </div>
      </div>
      
      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Stats -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Estadísticas</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Total mensajes</span>
              <span class="text-slate-800 font-medium">{{ customer?.stats?.totalMessages || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Conversaciones</span>
              <span class="text-slate-800 font-medium">{{ customer?.stats?.totalConversations || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Primer contacto</span>
              <span class="text-slate-700">{{ formatDate(customer?.stats?.firstContactAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Último contacto</span>
              <span class="text-slate-700">{{ formatDate(customer?.stats?.lastContactAt) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Tags -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Etiquetas</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <span 
              v-for="tag in customer?.tags" 
              :key="tag" 
              class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm cursor-pointer hover:bg-rose-100 hover:text-rose-700 transition-colors"
              @click="removeTag(tag)"
            >
              {{ tag }} ×
            </span>
          </div>
          <div class="flex gap-2">
            <input 
              v-model="newTag" 
              type="text" 
              class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
              placeholder="Nueva etiqueta"
              @keydown.enter="addTag"
            />
            <button @click="addTag" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">+</button>
          </div>
        </div>
        
        <!-- Notes -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-800 mb-4">Notas</h3>
          <textarea 
            v-model="notes"
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            rows="4"
            placeholder="Añadir notas sobre este cliente..."
            @blur="saveNotes"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  ArrowLeft as ArrowLeftIcon,
  Pencil as EditIcon,
  MessageSquare as MessageIcon
} from 'lucide-vue-next'

const route = useRoute()

const customer = ref({})
const conversations = ref([])
const editMode = ref(false)
const newTag = ref('')
const notes = ref('')

onMounted(async () => {
  await loadCustomer()
})

async function loadCustomer() {
  try {
    const response = await api.get(`/admin/customers/${route.params.id}`)
    customer.value = response.data.customer
    conversations.value = response.data.conversations || []
    notes.value = customer.value.notes || ''
  } catch (error) {
    console.error('Failed to load customer:', error)
  }
}

async function updateStage() {
  try {
    await api.patch(`/admin/customers/${customer.value._id}`, { stage: customer.value.stage })
  } catch (error) {
    console.error('Failed to update stage:', error)
  }
}

async function addTag() {
  if (!newTag.value.trim()) return
  
  const tag = newTag.value.trim()
  if (!customer.value.tags) customer.value.tags = []
  if (customer.value.tags.includes(tag)) return
  
  customer.value.tags.push(tag)
  newTag.value = ''
  
  try {
    await api.patch(`/admin/customers/${customer.value._id}`, { tags: customer.value.tags })
  } catch (error) {
    console.error('Failed to add tag:', error)
  }
}

async function removeTag(tag) {
  customer.value.tags = customer.value.tags.filter(t => t !== tag)
  
  try {
    await api.patch(`/admin/customers/${customer.value._id}`, { tags: customer.value.tags })
  } catch (error) {
    console.error('Failed to remove tag:', error)
  }
}

async function saveNotes() {
  try {
    await api.patch(`/admin/customers/${customer.value._id}`, { notes: notes.value })
  } catch (error) {
    console.error('Failed to save notes:', error)
  }
}

function getScoreColor(score) {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

function getScoreLabel(score) {
  if (score >= 70) return 'Lead Caliente 🔥'
  if (score >= 40) return 'Lead Tibio ☀️'
  return 'Lead Frío ❄️'
}

function formatDate(date) {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
