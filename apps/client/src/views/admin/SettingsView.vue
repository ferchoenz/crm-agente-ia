<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-800">Configuración</h2>
      <p class="text-slate-500 mt-1">Personaliza tu espacio de trabajo</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <RouterLink 
        to="/settings/ai" 
        class="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-300"
      >
        <div class="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <BrainIcon class="w-6 h-6 text-violet-600" />
        </div>
        <h3 class="font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">Agente IA</h3>
        <p class="text-sm text-slate-500 mt-1">Personalidad, prompts, comportamiento</p>
      </RouterLink>

      <RouterLink 
        to="/settings/knowledge" 
        class="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-300"
      >
        <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <BookOpenIcon class="w-6 h-6 text-primary-600" />
        </div>
        <h3 class="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">Base de Conocimiento</h3>
        <p class="text-sm text-slate-500 mt-1">Documentos e información de tu empresa</p>
      </RouterLink>
      
      <RouterLink 
        to="/settings/channels" 
        class="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
      >
        <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <MessageSquareIcon class="w-6 h-6 text-emerald-600" />
        </div>
        <h3 class="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">Canales</h3>
        <p class="text-sm text-slate-500 mt-1">WhatsApp, Facebook, Instagram</p>
      </RouterLink>
      
      <RouterLink 
        to="/settings/team" 
        class="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-300"
      >
        <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UsersIcon class="w-6 h-6 text-amber-600" />
        </div>
        <h3 class="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">Equipo</h3>
        <p class="text-sm text-slate-500 mt-1">Invitar agentes, permisos</p>
      </RouterLink>
    </div>

    <!-- Password Change Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
          <KeyIcon class="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h3 class="font-semibold text-slate-800">Cambiar Contraseña</h3>
          <p class="text-sm text-slate-500">Actualiza tu contraseña de acceso</p>
        </div>
      </div>

      <form @submit.prevent="changePassword" class="max-w-md space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña Actual</label>
          <input
            v-model="passwordForm.current"
            type="password"
            required
            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
          <input
            v-model="passwordForm.new"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
          <input
            v-model="passwordForm.confirm"
            type="password"
            required
            class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="••••••••"
          />
        </div>

        <div v-if="passwordError" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {{ passwordError }}
        </div>

        <div v-if="passwordSuccess" class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          {{ passwordSuccess }}
        </div>

        <button
          type="submit"
          :disabled="changingPassword"
          class="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          <span v-if="changingPassword">Guardando...</span>
          <span v-else>Cambiar Contraseña</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { 
  Brain as BrainIcon, 
  MessageSquare as MessageSquareIcon, 
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  Key as KeyIcon
} from 'lucide-vue-next'

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const changingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }

  if (passwordForm.value.new.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  changingPassword.value = true

  try {
    await api.put('/admin/profile/password', {
      currentPassword: passwordForm.value.current,
      newPassword: passwordForm.value.new
    })

    passwordSuccess.value = 'Contraseña actualizada correctamente'
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (error) {
    passwordError.value = error.response?.data?.error || 'Error al cambiar contraseña'
  } finally {
    changingPassword.value = false
  }
}
</script>
