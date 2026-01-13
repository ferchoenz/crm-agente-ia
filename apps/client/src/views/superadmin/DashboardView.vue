<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-500 text-sm">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">{{ stat.value }}</p>
          </div>
          <div :class="[stat.bgColor, 'p-3 rounded-xl']">
            <component :is="stat.icon" :class="[stat.iconColor, 'w-6 h-6']" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Plan Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Distribución por Plan</h3>
        <div class="space-y-3">
          <div v-for="(count, plan) in planDistribution" :key="plan" class="flex items-center gap-3">
            <div class="w-20 text-slate-600 capitalize">{{ plan }}</div>
            <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                :style="{ width: `${(count / totalOrgs) * 100}%` }"
              ></div>
            </div>
            <div class="w-12 text-right text-slate-800 font-medium">{{ count }}</div>
          </div>
        </div>
      </div>
      
      <!-- Recent Organizations -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Organizaciones Recientes</h3>
        <div class="space-y-3">
          <div 
            v-for="org in recentOrgs" 
            :key="org._id"
            class="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div>
              <div class="font-medium text-slate-800">{{ org.name }}</div>
              <div class="text-sm text-slate-500">{{ org.email }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span 
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="org.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
              >
                {{ org.active ? 'Activo' : 'Inactivo' }}
              </span>
              <span class="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium capitalize">
                {{ org.plan }}
              </span>
            </div>
          </div>
        </div>
        
        <RouterLink 
          to="/superadmin/organizations" 
          class="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todas las organizaciones →
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import {
  Building2 as OrgsIcon,
  Users as UsersIcon,
  Zap as ChannelsIcon,
  MessageSquare as ConversationsIcon
} from 'lucide-vue-next'

const stats = ref([
  { label: 'Organizaciones', value: '0', icon: OrgsIcon, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  { label: 'Organizaciones Activas', value: '0', icon: OrgsIcon, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { label: 'Total Usuarios', value: '0', icon: UsersIcon, bgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
  { label: 'Canales Activos', value: '0', icon: ChannelsIcon, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' }
])

const planDistribution = ref({})
const recentOrgs = ref([])

const totalOrgs = computed(() => {
  return Object.values(planDistribution.value).reduce((a, b) => a + b, 0)
})

onMounted(async () => {
  try {
    const response = await api.get('/superadmin/dashboard')
    const data = response.data
    
    stats.value[0].value = data.stats.totalOrganizations?.toLocaleString() || '0'
    stats.value[1].value = data.stats.activeOrganizations?.toLocaleString() || '0'
    stats.value[2].value = data.stats.totalUsers?.toLocaleString() || '0'
    stats.value[3].value = data.stats.activeChannels?.toLocaleString() || '0'
    
    planDistribution.value = data.planDistribution || {}
    recentOrgs.value = data.recentOrganizations || []
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
})
</script>
