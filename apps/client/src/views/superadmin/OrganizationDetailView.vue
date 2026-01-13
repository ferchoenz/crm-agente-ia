<template>
  <div class="space-y-6">
    <!-- Back button and title -->
    <div class="flex items-center gap-4">
      <button @click="$router.back()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors">
        <ArrowLeftIcon class="w-5 h-5 text-slate-600" />
      </button>
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-slate-800">{{ organization?.name }}</h2>
        <p class="text-slate-500">{{ organization?.email }}</p>
      </div>
      <div class="flex items-center gap-2">
        <span 
          class="px-3 py-1.5 rounded-full text-sm font-medium"
          :class="organization?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
        >
          {{ organization?.active ? 'Activo' : 'Suspendido' }}
        </span>
        <span 
          class="px-3 py-1.5 rounded-full text-sm font-medium capitalize"
          :class="getPlanBadge(organization?.plan)"
        >
          {{ organization?.plan }}
        </span>
      </div>
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
        <!-- General Info Tab -->
        <div v-if="activeTab === 'general'" class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
              <input v-model="editForm.name" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input v-model="editForm.email" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Plan</label>
              <select v-model="editForm.plan" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Estado</label>
              <select v-model="editForm.active" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                <option :value="true">Activo</option>
                <option :value="false">Suspendido</option>
              </select>
            </div>
          </div>
          <button @click="saveOrganization" class="btn-primary" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-slate-800">Usuarios ({{ users.length }})</h3>
            <button @click="showResetModal = true" class="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 transition-colors">
              <KeyIcon class="w-4 h-4 inline mr-1" />
              Resetear Contraseña Admin
            </button>
          </div>
          
          <div class="space-y-2">
            <div 
              v-for="user in users" 
              :key="user._id"
              class="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  {{ user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() }}
                </div>
                <div>
                  <div class="font-medium text-slate-800">{{ user.name || 'Sin nombre' }}</div>
                  <div class="text-sm text-slate-500">{{ user.email }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="getRoleBadge(user.role)">
                  {{ user.role }}
                </span>
                <span :class="user.active ? 'text-emerald-500' : 'text-rose-500'" class="text-xs">
                  {{ user.active ? '● Activo' : '● Inactivo' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Billing Tab -->
        <div v-if="activeTab === 'billing'" class="space-y-6">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p class="text-slate-500 text-sm">Plan Actual</p>
              <p class="text-xl font-bold text-slate-800 capitalize">{{ organization?.plan }}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p class="text-slate-500 text-sm">Balance</p>
              <p class="text-xl font-bold" :class="billing.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'">
                {{ formatCurrency(billing.currentBalance || 0) }}
              </p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p class="text-slate-500 text-sm">Próximo Cobro</p>
              <p class="text-xl font-bold text-slate-800">{{ billing.nextBillingDate ? formatDate(billing.nextBillingDate) : '-' }}</p>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-slate-800">Historial de Pagos</h3>
            <button @click="showBillingModal = true" class="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-200 transition-colors">
              + Agregar Registro
            </button>
          </div>

          <div v-if="billing.payments?.length" class="space-y-2">
            <div 
              v-for="payment in billing.payments" 
              :key="payment._id"
              class="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
            >
              <div>
                <div class="font-medium text-slate-800">{{ payment.description }}</div>
                <div class="text-sm text-slate-500">{{ formatDate(payment.date) }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold" :class="payment.type === 'charge' ? 'text-rose-600' : 'text-emerald-600'">
                  {{ payment.type === 'charge' ? '+' : '-' }}{{ formatCurrency(payment.amount) }}
                </div>
                <div class="text-xs text-slate-500 capitalize">{{ payment.status }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-slate-400">
            No hay registros de facturación
          </div>
        </div>

        <!-- Stats Tab -->
        <div v-if="activeTab === 'stats'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <p class="text-3xl font-bold text-slate-800">{{ stats.users || 0 }}</p>
            <p class="text-slate-500 text-sm">Usuarios</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <p class="text-3xl font-bold text-slate-800">{{ stats.channels || 0 }}</p>
            <p class="text-slate-500 text-sm">Canales</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <p class="text-3xl font-bold text-slate-800">{{ stats.customersCount || 0 }}</p>
            <p class="text-slate-500 text-sm">Clientes</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <p class="text-3xl font-bold text-slate-800">{{ stats.conversationsCount || 0 }}</p>
            <p class="text-slate-500 text-sm">Conversaciones</p>
          </div>
        </div>

        <!-- Actions Tab -->
        <div v-if="activeTab === 'actions'" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 class="font-semibold text-blue-800 mb-2">Impersonar Administrador</h4>
            <p class="text-sm text-blue-600 mb-3">Inicia sesión como el administrador de esta organización para soporte.</p>
            <button @click="impersonate" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <UserIcon class="w-4 h-4 inline mr-1" />
              Impersonar
            </button>
          </div>
          
          <div class="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <h4 class="font-semibold text-rose-800 mb-2">Eliminar Organización</h4>
            <p class="text-sm text-rose-600 mb-3">Esta acción es irreversible. Se eliminarán todos los datos asociados.</p>
            <button @click="confirmDelete" class="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors">
              <TrashIcon class="w-4 h-4 inline mr-1" />
              Eliminar Organización
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Resetear Contraseña de Admin</h3>
        
        <div v-if="!newPassword">
          <p class="text-slate-600 mb-4">Se generará una nueva contraseña temporal para el administrador de esta organización.</p>
          <div class="flex gap-3">
            <button @click="showResetModal = false" class="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">Cancelar</button>
            <button @click="resetPassword" class="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium" :disabled="resetting">
              {{ resetting ? 'Generando...' : 'Resetear' }}
            </button>
          </div>
        </div>
        
        <div v-else>
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <p class="text-sm text-emerald-600 mb-2">Nueva contraseña generada:</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 p-3 bg-white rounded-lg font-mono text-lg text-slate-800">{{ newPassword }}</code>
              <button @click="copyPassword" class="p-2 hover:bg-emerald-100 rounded-lg">
                <CopyIcon class="w-5 h-5 text-emerald-600" />
              </button>
            </div>
          </div>
          <p class="text-sm text-slate-500 mb-4">Esta contraseña solo se muestra una vez. Anótala y comunícasela al usuario.</p>
          <button @click="showResetModal = false; newPassword = ''" class="w-full px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Billing Modal -->
    <div v-if="showBillingModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Agregar Registro de Facturación</h3>
        <form @submit.prevent="addBillingRecord" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Tipo</label>
            <select v-model="billingForm.type" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
              <option value="payment">Pago Recibido</option>
              <option value="charge">Cargo</option>
              <option value="refund">Reembolso</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Monto</label>
            <input v-model.number="billingForm.amount" type="number" step="0.01" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Descripción</label>
            <input v-model="billingForm.description" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
          </div>
          <div class="flex gap-3">
            <button type="button" @click="showBillingModal = false" class="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">Cancelar</button>
            <button type="submit" class="flex-1 btn-primary">Agregar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  ArrowLeft as ArrowLeftIcon,
  Key as KeyIcon,
  User as UserIcon,
  Trash2 as TrashIcon,
  Copy as CopyIcon
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const organization = ref(null)
const users = ref([])
const stats = ref({})
const billing = ref({ payments: [], currentBalance: 0 })
const activeTab = ref('general')
const saving = ref(false)
const resetting = ref(false)
const newPassword = ref('')
const showResetModal = ref(false)
const showBillingModal = ref(false)

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'users', label: 'Usuarios' },
  { id: 'billing', label: 'Facturación' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'actions', label: 'Acciones' }
]

const editForm = reactive({
  name: '',
  email: '',
  plan: 'free',
  active: true
})

const billingForm = reactive({
  type: 'payment',
  amount: 0,
  description: ''
})

onMounted(loadOrganization)

async function loadOrganization() {
  try {
    const response = await api.get(`/superadmin/organizations/${route.params.id}`)
    organization.value = response.data.organization
    stats.value = response.data.stats || {}
    users.value = response.data.stats?.users || []
    
    editForm.name = organization.value.name
    editForm.email = organization.value.email
    editForm.plan = organization.value.plan
    editForm.active = organization.value.active
    
    const billingRes = await api.get(`/superadmin/organizations/${route.params.id}/billing`)
    billing.value = billingRes.data.billing || { payments: [], currentBalance: 0 }
  } catch (error) {
    console.error('Failed to load organization:', error)
  }
}

async function saveOrganization() {
  saving.value = true
  try {
    await api.put(`/superadmin/organizations/${route.params.id}`, editForm)
    organization.value = { ...organization.value, ...editForm }
    alert('Organización actualizada')
  } catch (error) {
    alert('Error al guardar')
  } finally {
    saving.value = false
  }
}

async function resetPassword() {
  resetting.value = true
  try {
    const response = await api.post(`/superadmin/organizations/${route.params.id}/reset-password`)
    newPassword.value = response.data.temporaryPassword
  } catch (error) {
    alert('Error al resetear contraseña')
  } finally {
    resetting.value = false
  }
}

async function impersonate() {
  try {
    const response = await api.post(`/superadmin/organizations/${route.params.id}/impersonate`)
    localStorage.setItem('impersonation_token', response.data.token)
    alert(`Token de impersonación generado. Usa este token para acceder como ${response.data.user.email}:\n\n${response.data.token}`)
  } catch (error) {
    alert('Error al impersonar')
  }
}

async function confirmDelete() {
  if (!confirm(`¿Estás SEGURO de eliminar "${organization.value.name}"? Esta acción es IRREVERSIBLE.`)) return
  if (!confirm('Esta es tu última oportunidad. ¿Confirmar eliminación?')) return
  
  try {
    await api.delete(`/superadmin/organizations/${route.params.id}`)
    router.push('/superadmin/organizations')
  } catch (error) {
    alert('Error al eliminar')
  }
}

async function addBillingRecord() {
  try {
    await api.post(`/superadmin/organizations/${route.params.id}/billing`, billingForm)
    await loadOrganization()
    showBillingModal.value = false
    billingForm.type = 'payment'
    billingForm.amount = 0
    billingForm.description = ''
  } catch (error) {
    alert('Error al agregar registro')
  }
}

function copyPassword() {
  navigator.clipboard.writeText(newPassword.value)
  alert('Contraseña copiada')
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

function getRoleBadge(role) {
  const badges = {
    admin: 'bg-violet-100 text-violet-700',
    agent: 'bg-blue-100 text-blue-700',
    viewer: 'bg-slate-100 text-slate-600'
  }
  return badges[role] || badges.viewer
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

function formatDate(date) {
  return format(new Date(date), 'dd MMM yyyy', { locale: es })
}
</script>
