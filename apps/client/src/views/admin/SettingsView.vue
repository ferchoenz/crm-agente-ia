<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-800">Configuración</h2>
      <p class="text-slate-500 mt-1">Personaliza tu espacio de trabajo</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  </div>
</template>

<script setup>
import { Brain as BrainIcon, MessageSquare as MessageSquareIcon, Users as UsersIcon } from 'lucide-vue-next'
</script>
