<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Equipo</h2>
        <p class="text-slate-500">Gestiona los usuarios de tu organización</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        <UserPlusIcon class="w-5 h-5 mr-2" />
        Añadir Usuario
      </button>
    </div>
    
    <!-- Team Members Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="member in members"
        :key="member._id"
        class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all"
      >
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold"
               :class="getRoleColor(member.role)">
            {{ member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() }}
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-slate-800">{{ member.name || 'Sin nombre' }}</h3>
              <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="getRoleBadge(member.role)">
                {{ getRoleLabel(member.role) }}
              </span>
            </div>
            <p class="text-sm text-slate-500">{{ member.email }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span v-if="member.lastLoginAt">
                <ClockIcon class="w-3 h-3 inline mr-1" />
                {{ formatDate(member.lastLoginAt) }}
              </span>
              <span :class="member.active ? 'text-emerald-600' : 'text-rose-500'">
                {{ member.active ? '● Activo' : '● Inactivo' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button @click="editMember(member)" class="flex-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1">
            <EditIcon class="w-4 h-4" />
            Editar
          </button>
          <button 
            v-if="member._id !== currentUserId"
            @click="toggleActive(member)" 
            class="flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
            :class="member.active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'"
          >
            <BanIcon v-if="member.active" class="w-4 h-4" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ member.active ? 'Desactivar' : 'Activar' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="members.length === 0 && !loading" class="bg-white rounded-2xl border border-slate-200 text-center py-12">
      <UsersIcon class="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <h3 class="text-lg font-semibold text-slate-800">No hay miembros del equipo</h3>
      <p class="text-slate-500 mb-4">Añade usuarios para que puedan acceder a la plataforma</p>
      <button @click="showAddModal = true" class="btn-primary">
        Añadir primer usuario
      </button>
    </div>
    
    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || editingMember" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingMember ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h3>
        
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
            <input v-model="form.name" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Nombre completo" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input v-model="form.email" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="email@ejemplo.com" required />
          </div>
          
          <div v-if="!editingMember">
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Contraseña</label>
            <input v-model="form.password" type="password" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Mínimo 6 caracteres" required minlength="6" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Rol</label>
            <select v-model="form.role" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="admin">Administrador</option>
              <option value="agent">Agente</option>
              <option value="viewer">Solo lectura</option>
            </select>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" class="btn-primary flex-1" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'
import {
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
  Pencil as EditIcon,
  Ban as BanIcon,
  Check as CheckIcon,
  Clock as ClockIcon
} from 'lucide-vue-next'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?._id)

const loading = ref(true)
const saving = ref(false)
const members = ref([])
const showAddModal = ref(false)
const editingMember = ref(null)

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'agent'
})

onMounted(loadMembers)

async function loadMembers() {
  loading.value = true
  try {
    const response = await api.get('/admin/team')
    members.value = response.data.users
  } catch (error) {
    console.error('Failed to load team:', error)
  } finally {
    loading.value = false
  }
}

function editMember(member) {
  editingMember.value = member
  form.name = member.name || ''
  form.email = member.email
  form.role = member.role
  form.password = ''
}

function closeModal() {
  showAddModal.value = false
  editingMember.value = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'agent'
}

async function saveUser() {
  saving.value = true
  
  try {
    if (editingMember.value) {
      await api.put(`/admin/team/${editingMember.value._id}`, {
        name: form.name,
        email: form.email,
        role: form.role
      })
    } else {
      await api.post('/admin/team', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      })
    }
    
    await loadMembers()
    closeModal()
  } catch (error) {
    console.error('Failed to save user:', error)
    alert(error.response?.data?.error || 'Error al guardar usuario')
  } finally {
    saving.value = false
  }
}

async function toggleActive(member) {
  try {
    await api.patch(`/admin/team/${member._id}`, { active: !member.active })
    member.active = !member.active
  } catch (error) {
    console.error('Failed to toggle user:', error)
    alert('Error al cambiar estado del usuario')
  }
}

function getRoleColor(role) {
  switch (role) {
    case 'admin': return 'bg-violet-500'
    case 'agent': return 'bg-primary-500'
    case 'viewer': return 'bg-slate-400'
    default: return 'bg-slate-400'
  }
}

function getRoleBadge(role) {
  switch (role) {
    case 'admin': return 'bg-violet-100 text-violet-700'
    case 'agent': return 'bg-primary-100 text-primary-700'
    case 'viewer': return 'bg-slate-100 text-slate-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'admin': return 'Admin'
    case 'agent': return 'Agente'
    case 'viewer': return 'Lectura'
    default: return role
  }
}

function formatDate(date) {
  if (!date) return 'Nunca'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
