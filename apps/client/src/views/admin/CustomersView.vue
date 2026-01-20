<template>
  <div class="space-y-4 md:space-y-6">
    <!-- Header - Responsive -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Clientes</h2>
        <p class="text-slate-500 text-sm">{{ totalCustomers }} clientes registrados</p>
      </div>
      <button @click="openCreateModal" class="btn-primary w-full sm:w-auto">
        <PlusIcon class="w-4 h-4 mr-2" />
        Nuevo Cliente
      </button>
    </div>

    <!-- Filters - Responsive -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          placeholder="Buscar por nombre o teléfono..."
          @input="debouncedSearch"
        />
      </div>
      <select v-model="stageFilter" class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" @change="loadCustomers">
        <option value="">Todas las etapas</option>
        <option value="new">Nuevos</option>
        <option value="contacted">Contactados</option>
        <option value="qualified">Calificados</option>
        <option value="proposal">Propuesta</option>
        <option value="negotiation">Negociación</option>
        <option value="won">Ganados</option>
        <option value="lost">Perdidos</option>
      </select>
    </div>
    
    <!-- Mobile Cards View -->
    <div class="md:hidden space-y-3">
      <div
        v-for="customer in customers"
        :key="customer._id"
        class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                 :class="customer.source?.channel === 'whatsapp' ? 'bg-emerald-500' : customer.source?.channel === 'messenger' ? 'bg-blue-500' : 'bg-primary-500'">
              {{ customer.name?.[0]?.toUpperCase() || '?' }}
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ customer.name || 'Sin nombre' }}</div>
              <div class="text-xs text-slate-500">{{ customer.phone || 'Sin teléfono' }}</div>
            </div>
          </div>
          <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getStageBadge(customer.stage)">
            {{ getStageLabel(customer.stage) }}
          </span>
        </div>
        
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Score:</span>
            <div class="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full"
                :class="getScoreColor(customer.leadScore?.score || customer.leadScore)"
                :style="{ width: `${customer.leadScore?.score || customer.leadScore || 0}%` }"
              ></div>
            </div>
            <span class="font-medium text-slate-700">{{ customer.leadScore?.score || customer.leadScore || 0 }}%</span>
          </div>
          
          <div class="flex items-center gap-1">
            <RouterLink :to="`/customers/${customer._id}`" class="p-2 hover:bg-slate-100 rounded-lg">
              <EyeIcon class="w-4 h-4 text-slate-500" />
            </RouterLink>
            <button @click="openEditModal(customer)" class="p-2 hover:bg-slate-100 rounded-lg">
              <EditIcon class="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="text-left px-6 py-4 text-slate-600 font-medium text-sm">Cliente</th>
              <th class="text-left px-6 py-4 text-slate-600 font-medium text-sm">Teléfono</th>
              <th class="text-left px-6 py-4 text-slate-600 font-medium text-sm">Canal</th>
              <th class="text-left px-6 py-4 text-slate-600 font-medium text-sm">Etapa</th>
              <th class="text-left px-6 py-4 text-slate-600 font-medium text-sm">Lead Score</th>
              <th class="text-left px-6 py-4 text-slate-600 font-medium text-sm">Último contacto</th>
              <th class="text-right px-6 py-4 text-slate-600 font-medium text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="customer in customers"
              :key="customer._id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                       :class="customer.source?.channel === 'whatsapp' ? 'bg-emerald-500' : customer.source?.channel === 'messenger' ? 'bg-blue-500' : 'bg-primary-500'">
                    {{ customer.name?.[0]?.toUpperCase() || '?' }}
                  </div>
                  <div>
                    <div class="font-medium text-slate-800">{{ customer.name || 'Sin nombre' }}</div>
                    <div class="text-xs text-slate-500">{{ customer.email || '' }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-700">{{ customer.phone }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="getChannelBadge(customer.source?.channel)">
                  {{ getChannelLabel(customer.source?.channel) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="getStageBadge(customer.stage)">
                  {{ getStageLabel(customer.stage) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all"
                      :class="getScoreColor(customer.leadScore?.score || customer.leadScore)"
                      :style="{ width: `${customer.leadScore?.score || customer.leadScore || 0}%` }"
                    ></div>
                  </div>
                  <span class="text-sm text-slate-700 font-medium">{{ customer.leadScore?.score || customer.leadScore || 0 }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-500 text-sm">
                {{ formatDate(customer.stats?.lastContactAt) }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink :to="`/inbox?customer=${customer._id}`" class="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Conversación">
                    <MessageIcon class="w-4 h-4 text-slate-500" />
                  </RouterLink>
                  <RouterLink :to="`/customers/${customer._id}`" class="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Ver detalle">
                    <EyeIcon class="w-4 h-4 text-slate-500" />
                  </RouterLink>
                  <button @click="openEditModal(customer)" class="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                    <EditIcon class="w-4 h-4 text-slate-500" />
                  </button>
                  <button @click="confirmDelete(customer)" class="p-2 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                    <TrashIcon class="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Empty -->
      <div v-if="customers.length === 0 && !loading" class="p-12 text-center">
        <UsersIcon class="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 class="text-lg font-semibold text-slate-800">No hay clientes</h3>
        <p class="text-slate-500 mb-4">Los clientes aparecerán aquí cuando te contacten</p>
        <button @click="openCreateModal" class="btn-primary">
          <PlusIcon class="w-4 h-4 mr-2" />
          Crear primer cliente
        </button>
      </div>
      
      <!-- Loading -->
      <div v-if="loading" class="p-12 text-center">
        <LoaderIcon class="w-8 h-8 mx-auto animate-spin text-primary-500" />
      </div>
    </div>

    <!-- Mobile Empty/Loading States -->
    <div v-if="customers.length === 0 && !loading" class="md:hidden p-8 text-center bg-white rounded-xl border border-slate-200">
      <UsersIcon class="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p class="text-slate-500">No hay clientes</p>
    </div>
    <div v-if="loading" class="md:hidden p-8 text-center">
      <LoaderIcon class="w-6 h-6 mx-auto animate-spin text-primary-500" />
    </div>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <div class="text-sm text-slate-500">
        Mostrando {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalCustomers) }} de {{ totalCustomers }}
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="currentPage--; loadCustomers()" 
          :disabled="currentPage === 1"
          class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span class="text-slate-700 font-medium">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage++; loadCustomers()" 
          :disabled="currentPage === totalPages"
          class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-primary-500 to-violet-500 px-6 py-4">
          <h3 class="text-lg font-semibold text-white">{{ editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
        </div>
        
        <form @submit.prevent="saveCustomer" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Nombre *</label>
              <input v-model="form.name" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Teléfono</label>
              <input v-model="form.phone" type="tel" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" placeholder="+52..." />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input v-model="form.email" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Etapa</label>
              <select v-model="form.stage" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="proposal">Propuesta</option>
                <option value="negotiation">Negociación</option>
                <option value="won">Ganado</option>
                <option value="lost">Perdido</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Tags</label>
              <input v-model="tagsInput" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" placeholder="tag1, tag2, tag3" />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Notas</label>
            <textarea v-model="form.notes" rows="3" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 resize-none"></textarea>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">
              Cancelar
            </button>
            <button type="submit" class="flex-1 btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDebounceFn } from '@vueuse/core'
import api from '@/services/api'
import {
  Search as SearchIcon,
  Users as UsersIcon,
  MessageSquare as MessageIcon,
  Eye as EyeIcon,
  Pencil as EditIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Loader2 as LoaderIcon
} from 'lucide-vue-next'

const loading = ref(true)
const saving = ref(false)
const customers = ref([])
const search = ref('')
const stageFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalCustomers = ref(0)
const showModal = ref(false)
const editingCustomer = ref(null)
const tagsInput = ref('')

const form = reactive({
  name: '',
  phone: '',
  email: '',
  stage: 'new',
  tags: [],
  notes: ''
})

const totalPages = computed(() => Math.ceil(totalCustomers.value / pageSize.value))

const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  loadCustomers()
}, 300)

onMounted(loadCustomers)

async function loadCustomers() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: pageSize.value
    })
    
    if (search.value) params.append('search', search.value)
    if (stageFilter.value) params.append('stage', stageFilter.value)
    
    const response = await api.get(`/admin/customers?${params}`)
    customers.value = response.data.customers || []
    totalCustomers.value = response.data.pagination?.total || customers.value.length
  } catch (error) {
    console.error('Failed to load customers:', error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingCustomer.value = null
  Object.assign(form, { name: '', phone: '', email: '', stage: 'new', tags: [], notes: '' })
  tagsInput.value = ''
  showModal.value = true
}

function openEditModal(customer) {
  editingCustomer.value = customer
  Object.assign(form, {
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    stage: customer.stage || 'new',
    tags: customer.tags || [],
    notes: customer.notes || ''
  })
  tagsInput.value = (customer.tags || []).join(', ')
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCustomer.value = null
}

async function saveCustomer() {
  saving.value = true
  form.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t)
  
  try {
    if (editingCustomer.value) {
      await api.put(`/admin/customers/${editingCustomer.value._id}`, form)
    } else {
      await api.post('/admin/customers', form)
    }
    closeModal()
    await loadCustomers()
  } catch (error) {
    alert('Error al guardar cliente')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(customer) {
  if (!confirm(`¿Eliminar a "${customer.name || 'este cliente'}"? Esta acción es irreversible y eliminará todas sus conversaciones.`)) return
  
  try {
    await api.delete(`/admin/customers/${customer._id}`)
    await loadCustomers()
  } catch (error) {
    alert('Error al eliminar cliente')
  }
}

function getChannelBadge(channel) {
  const badges = {
    whatsapp: 'bg-emerald-100 text-emerald-700',
    messenger: 'bg-blue-100 text-blue-700',
    manual: 'bg-slate-100 text-slate-700'
  }
  return badges[channel] || 'bg-slate-100 text-slate-700'
}

function getChannelLabel(channel) {
  const labels = {
    whatsapp: 'WhatsApp',
    messenger: 'Messenger',
    manual: 'Manual'
  }
  return labels[channel] || channel || 'Desconocido'
}

function getStageBadge(stage) {
  const badges = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-emerald-100 text-emerald-700',
    proposal: 'bg-violet-100 text-violet-700',
    negotiation: 'bg-pink-100 text-pink-700',
    won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-rose-100 text-rose-700'
  }
  return badges[stage] || 'bg-slate-100 text-slate-700'
}

function getStageLabel(stage) {
  const labels = {
    new: 'Nuevo',
    contacted: 'Contactado',
    qualified: 'Calificado',
    proposal: 'Propuesta',
    negotiation: 'Negociación',
    won: 'Ganado',
    lost: 'Perdido'
  }
  return labels[stage] || stage || 'Sin etapa'
}

function getScoreColor(score) {
  if (score >= 70) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
  if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-400'
  return 'bg-gradient-to-r from-rose-500 to-rose-400'
}

function formatDate(date) {
  if (!date) return 'Nunca'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
