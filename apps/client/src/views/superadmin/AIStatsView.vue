<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Estadísticas de IA</h2>
        <p class="text-slate-500">Consumo de tokens, mensajes y costos por organización</p>
      </div>
      <div class="flex gap-2">
        <select v-model="dateRange" @change="loadStats" class="px-3 py-2 border border-slate-300 rounded-xl text-sm">
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
        <button @click="loadStats" class="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-200 transition-colors">
          <RefreshIcon class="w-4 h-4 inline mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Providers Status -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <h3 class="font-semibold text-slate-800 mb-3">Estado de Proveedores</h3>
      <div class="flex gap-4">
        <div v-for="(provider, level) in stats.providers" :key="level" class="flex items-center gap-2">
          <span :class="provider.available ? 'text-emerald-500' : 'text-slate-300'" class="text-lg">●</span>
          <span class="text-sm">
            <span class="font-medium">{{ level }}:</span> {{ provider.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Totals -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p class="text-slate-500 text-sm">Total Tokens</p>
        <p class="text-2xl font-bold text-slate-800">{{ formatNumber(stats.totals?.totalTokens) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p class="text-slate-500 text-sm">Requests</p>
        <p class="text-2xl font-bold text-slate-800">{{ formatNumber(stats.totals?.totalRequests) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p class="text-slate-500 text-sm">Msgs Recibidos</p>
        <p class="text-2xl font-bold text-emerald-600">{{ formatNumber(stats.totals?.totalMessagesReceived) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p class="text-slate-500 text-sm">Msgs Enviados</p>
        <p class="text-2xl font-bold text-blue-600">{{ formatNumber(stats.totals?.totalMessagesSent) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p class="text-slate-500 text-sm">Errores</p>
        <p class="text-2xl font-bold text-rose-600">{{ formatNumber(stats.totals?.totalErrors) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p class="text-slate-500 text-sm">Costo Estimado</p>
        <p class="text-2xl font-bold text-amber-600">${{ formatCost(stats.totals?.totalCost) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- By Provider -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-4">Por Proveedor</h3>
        <div class="space-y-3">
          <div v-for="provider in stats.byProvider" :key="provider._id" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="getProviderColor(provider._id)">
                <BotIcon class="w-4 h-4 text-white" />
              </div>
              <span class="font-medium capitalize">{{ provider._id }}</span>
            </div>
            <div class="text-right">
              <p class="font-semibold">{{ formatNumber(provider.requestCount) }} requests</p>
              <p class="text-sm text-slate-500">${{ formatCost(provider.estimatedCost) }}</p>
            </div>
          </div>
          <div v-if="!stats.byProvider?.length" class="text-center text-slate-400 py-4">
            Sin datos aún
          </div>
        </div>
      </div>

      <!-- By Level -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-4">Por Nivel de Complejidad</h3>
        <div class="space-y-3">
          <div v-for="level in stats.byLevel" :key="level._id" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="getLevelColor(level._id)">
                <span class="text-white font-bold text-xs">{{ level._id }}</span>
              </div>
              <span class="font-medium">{{ getLevelName(level._id) }}</span>
            </div>
            <div class="text-right">
              <p class="font-semibold">{{ formatNumber(level.requestCount) }} requests</p>
              <p class="text-sm text-slate-500">{{ formatNumber(level.totalTokens) }} tokens</p>
            </div>
          </div>
          <div v-if="!stats.byLevel?.length" class="text-center text-slate-400 py-4">
            Sin datos aún
          </div>
        </div>
      </div>
    </div>

    <!-- By Organization -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 class="font-semibold text-slate-800 mb-4">Consumo por Organización</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-slate-500 border-b border-slate-200">
              <th class="pb-3">Organización</th>
              <th class="pb-3">Proveedor</th>
              <th class="pb-3 text-right">Tokens</th>
              <th class="pb-3 text-right">Requests</th>
              <th class="pb-3 text-right">Msgs Recibidos</th>
              <th class="pb-3 text-right">Msgs Enviados</th>
              <th class="pb-3 text-right">Costo Est.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in stats.byOrganization" :key="idx" class="border-b border-slate-100 last:border-0">
              <td class="py-3">
                <span class="font-medium text-slate-800">{{ row.organization?.name || 'N/A' }}</span>
              </td>
              <td class="py-3">
                <span class="px-2 py-1 text-xs font-medium rounded-lg capitalize" :class="getProviderBadgeColor(row.provider)">
                  {{ row.provider }}
                </span>
              </td>
              <td class="py-3 text-right font-medium">{{ formatNumber(row.totalTokens) }}</td>
              <td class="py-3 text-right">{{ formatNumber(row.requestCount) }}</td>
              <td class="py-3 text-right text-emerald-600">{{ formatNumber(row.messagesReceived) }}</td>
              <td class="py-3 text-right text-blue-600">{{ formatNumber(row.messagesSent) }}</td>
              <td class="py-3 text-right font-semibold text-amber-600">${{ formatCost(row.estimatedCost) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!stats.byOrganization?.length" class="text-center text-slate-400 py-8">
          Sin datos de consumo aún. Los datos aparecerán cuando se procesen mensajes con IA.
        </div>
      </div>
    </div>

    <!-- Daily Trend -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 class="font-semibold text-slate-800 mb-4">Tendencia Diaria</h3>
      <div class="overflow-x-auto">
        <div class="flex gap-2 min-w-max">
          <div v-for="day in stats.dailyTrend" :key="day._id" class="flex flex-col items-center p-2 min-w-[80px]">
            <div class="text-xs text-slate-500">{{ formatDate(day._id) }}</div>
            <div class="text-sm font-semibold">{{ formatNumber(day.requestCount) }}</div>
            <div class="text-xs text-slate-400">requests</div>
            <div class="h-16 w-6 bg-slate-100 rounded-full mt-2 relative overflow-hidden">
              <div 
                class="absolute bottom-0 w-full bg-primary-500 rounded-full"
                :style="{ height: getBarHeight(day.requestCount) }"
              ></div>
            </div>
          </div>
        </div>
        <div v-if="!stats.dailyTrend?.length" class="text-center text-slate-400 py-8">
          Sin datos de tendencia aún
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  RefreshCw as RefreshIcon,
  Bot as BotIcon
} from 'lucide-vue-next'

const loading = ref(false)
const stats = ref({})
const dateRange = ref('30')

onMounted(() => {
  loadStats()
})

async function loadStats() {
  loading.value = true
  try {
    const days = parseInt(dateRange.value)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const res = await api.get('/superadmin/ai-stats', {
      params: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    })
    stats.value = res.data
  } catch (error) {
    console.error('Failed to load AI stats:', error)
  } finally {
    loading.value = false
  }
}

function formatNumber(num) {
  if (!num) return '0'
  return new Intl.NumberFormat().format(num)
}

function formatCost(cost) {
  if (!cost) return '0.00'
  return cost.toFixed(4)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd MMM', { locale: es })
}

function getProviderColor(provider) {
  const colors = {
    groq: 'bg-purple-500',
    gemini: 'bg-blue-500',
    deepseek: 'bg-emerald-500',
    openai: 'bg-slate-700'
  }
  return colors[provider] || 'bg-slate-400'
}

function getProviderBadgeColor(provider) {
  const colors = {
    groq: 'bg-purple-100 text-purple-700',
    gemini: 'bg-blue-100 text-blue-700',
    deepseek: 'bg-emerald-100 text-emerald-700',
    openai: 'bg-slate-100 text-slate-700'
  }
  return colors[provider] || 'bg-slate-100 text-slate-700'
}

function getLevelColor(level) {
  const colors = {
    L1: 'bg-emerald-500',
    L2: 'bg-amber-500',
    L3: 'bg-rose-500'
  }
  return colors[level] || 'bg-slate-400'
}

function getLevelName(level) {
  const names = {
    L1: 'Simple (Groq)',
    L2: 'Contextual (Gemini)',
    L3: 'Complejo (DeepSeek)'
  }
  return names[level] || level
}

const maxRequests = computed(() => {
  if (!stats.value.dailyTrend?.length) return 1
  return Math.max(...stats.value.dailyTrend.map(d => d.requestCount || 0), 1)
})

function getBarHeight(count) {
  return `${Math.min((count / maxRequests.value) * 100, 100)}%`
}
</script>
