<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Organizaciones</h2>
        <p class="text-slate-500">{{ pagination.total }} empresas registradas en el sistema</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        <PlusIcon class="w-5 h-5 mr-2" />
        Nueva Organización
      </button>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">Total</p>
            <p class="text-2xl font-bold text-slate-800">{{ pagination.total }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Building2Icon class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">Activas</p>
            <p class="text-2xl font-bold text-emerald-600">{{ activeCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">Plan Pro</p>
            <p class="text-2xl font-bold text-violet-600">{{ proCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <SparklesIcon class="w-6 h-6 text-violet-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">Este mes</p>
            <p class="text-2xl font-bold text-amber-600">{{ newThisMonth }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <TrendingUpIcon class="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="search"
            type="text"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            placeholder="Buscar por nombre, email..."
            @input="debouncedSearch"
          />
        </div>
        <select v-model="filterPlan" @change="loadOrganizations" class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
          <option value="">Todos los planes</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select v-model="filterActive" @change="loadOrganizations" class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>
    
    <!-- Organizations Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="org in organizations"
        :key="org._id"
        class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary-500/20">
              {{ org.name?.[0]?.toUpperCase() }}
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{{ org.name }}</h3>
              <p class="text-sm text-slate-500">{{ org.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <span 
              class="px-2.5 py-1 rounded-full text-xs font-medium"
              :class="org.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
            >
              {{ org.active ? 'Activo' : 'Suspendido' }}
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
          <div class="text-center">
            <div class="text-lg font-bold text-slate-800">{{ org.stats?.users || 0 }}</div>
            <div class="text-xs text-slate-500">Usuarios</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-slate-800">{{ org.stats?.conversations || 0 }}</div>
            <div class="text-xs text-slate-500">Chats</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-slate-800">{{ org.stats?.customers || 0 }}</div>
            <div class="text-xs text-slate-500">Clientes</div>
          </div>
        </div>
        
        <div class="flex items-center justify-between mt-4">
          <span 
            class="px-3 py-1 rounded-full text-xs font-medium capitalize"
            :class="getPlanBadge(org.plan)"
          >
            {{ org.plan }}
          </span>
          
          <div class="flex items-center gap-2">
            <button 
              @click="toggleActive(org)" 
              class="p-2 rounded-lg transition-colors"
              :class="org.active ? 'hover:bg-rose-50 text-rose-500' : 'hover:bg-emerald-50 text-emerald-500'"
            >
              <PowerIcon class="w-4 h-4" />
            </button>
            <RouterLink 
              :to="`/superadmin/organizations/${org._id}`" 
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <ExternalLinkIcon class="w-4 h-4" />
            </RouterLink>
          </div>
        </div>
        
        <div class="mt-3 text-xs text-slate-400">
          Creada {{ formatDate(org.createdAt) }}
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="!loading && organizations.length === 0" class="bg-white rounded-2xl border border-slate-200 text-center py-16 shadow-sm">
      <Building2Icon class="w-16 h-16 mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-semibold text-slate-800">No se encontraron organizaciones</h3>
      <p class="text-slate-500 mb-4">Intenta con otros filtros o crea una nueva</p>
      <button @click="showCreateModal = true" class="btn-primary">
        Nueva Organización
      </button>
    </div>
    
    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="flex items-center justify-center gap-2">
      <button 
        @click="goToPage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon class="w-5 h-5" />
      </button>
      <button 
        v-for="page in pagination.pages" 
        :key="page"
        @click="goToPage(page)"
        class="px-4 py-2 rounded-xl font-medium transition-colors"
        :class="page === pagination.page ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-slate-600 hover:bg-slate-100'"
      >
        {{ page }}
      </button>
      <button 
        @click="goToPage(pagination.page + 1)"
        :disabled="pagination.page === pagination.pages"
        class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon class="w-5 h-5" />
      </button>
    </div>
    
    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-primary-500 to-violet-500 px-6 py-4">
          <h3 class="text-lg font-semibold text-white">Nueva Organización</h3>
          <p class="text-primary-100 text-sm">Crea una nueva empresa y su administrador</p>
        </div>
        
        <form @submit.prevent="createOrganization" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Nombre de la empresa</label>
              <input v-model="newOrg.name" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Mi Empresa S.A." required />
            </div>
            
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Email de contacto</label>
              <input v-model="newOrg.email" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="contacto@empresa.com" required />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Nombre del admin</label>
              <input v-model="newOrg.adminName" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" required />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Email del admin</label>
              <input v-model="newOrg.adminEmail" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" required />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Contraseña inicial</label>
              <input v-model="newOrg.adminPassword" type="password" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" required minlength="6" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Plan</label>
              <select v-model="newOrg.plan" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="button" @click="showCreateModal = false" class="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" class="btn-primary flex-1" :disabled="creating">
              {{ creating ? 'Creando...' : 'Crear Organización' }}
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
  Plus as PlusIcon, 
  ExternalLink as ExternalLinkIcon, 
  Power as PowerIcon,
  Building2 as Building2Icon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Sparkles as SparklesIcon,
  TrendingUp as TrendingUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-vue-next'

const organizations = ref([])
const loading = ref(true)
const search = ref('')
const filterPlan = ref('')
const filterActive = ref('')
const pagination = ref({ page: 1, limit: 12, total: 0, pages: 0 })

const showCreateModal = ref(false)
const creating = ref(false)
const newOrg = reactive({
  name: '',
  email: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  plan: 'free'
})

const activeCount = computed(() => organizations.value.filter(o => o.active).length)
const proCount = computed(() => organizations.value.filter(o => o.plan === 'pro' || o.plan === 'enterprise').length)
const newThisMonth = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return organizations.value.filter(o => new Date(o.createdAt) >= startOfMonth).length
})

const debouncedSearch = useDebounceFn(() => {
  loadOrganizations()
}, 300)

async function loadOrganizations() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...(search.value && { search: search.value }),
      ...(filterPlan.value && { plan: filterPlan.value }),
      ...(filterActive.value && { active: filterActive.value })
    })
    
    const response = await api.get(`/superadmin/organizations?${params}`)
    organizations.value = response.data.organizations
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Failed to load organizations:', error)
  } finally {
    loading.value = false
  }
}

async function createOrganization() {
  creating.value = true
  try {
    await api.post('/superadmin/organizations', newOrg)
    showCreateModal.value = false
    Object.assign(newOrg, { name: '', email: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'free' })
    loadOrganizations()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al crear')
  } finally {
    creating.value = false
  }
}

async function toggleActive(org) {
  try {
    await api.patch(`/superadmin/organizations/${org._id}/toggle-active`)
    org.active = !org.active
  } catch (error) {
    console.error('Failed to toggle:', error)
  }
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pages) return
  pagination.value.page = page
  loadOrganizations()
}

function getPlanBadge(plan) {
  const badges = {
    free: 'bg-slate-100 text-slate-600',
    basic: 'bg-blue-100 text-blue-700',
    pro: 'bg-violet-100 text-violet-700',
    enterprise: 'bg-amber-100 text-amber-700'
  }
  return badges[plan] || badges.free
}

function formatDate(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

onMounted(loadOrganizations)
</script>
