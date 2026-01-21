<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SparklesIcon class="w-5 h-5" />
          <span class="font-semibold">Asistente IA</span>
        </div>
        <button @click="$emit('close')" class="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <XIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <LoaderIcon class="w-6 h-6 mx-auto animate-spin text-violet-500 mb-2" />
        <p class="text-sm text-slate-500">Analizando conversación...</p>
      </div>

      <!-- Analysis -->
      <div v-else-if="suggestions">
        <!-- Intent & Sentiment -->
        <div class="bg-slate-50 rounded-xl p-3 space-y-2">
          <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Análisis</div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
              {{ getIntentLabel(suggestions.analysis?.intent) }}
            </span>
            <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getSentimentClass(suggestions.analysis?.sentiment)">
              {{ getSentimentEmoji(suggestions.analysis?.sentiment) }} {{ getSentimentLabel(suggestions.analysis?.sentiment) }}
            </span>
            <span v-if="suggestions.analysis?.urgency === 'high'" class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              🔥 Urgente
            </span>
          </div>
        </div>

        <!-- Suggested Responses -->
        <div v-if="suggestions.suggestedResponses?.length">
          <div class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Respuestas sugeridas</div>
          <div class="space-y-2">
            <div 
              v-for="(response, idx) in suggestions.suggestedResponses" 
              :key="idx"
              class="bg-white border border-slate-200 rounded-xl p-3 hover:border-violet-300 transition-colors group"
            >
              <p class="text-sm text-slate-700 mb-2">{{ response }}</p>
              <div class="flex gap-2">
                <button 
                  @click="$emit('useResponse', response)"
                  class="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Usar
                </button>
                <button 
                  @click="$emit('editResponse', response)"
                  class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Suggested Actions -->
        <div v-if="suggestions.suggestedActions?.length">
          <div class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Acciones sugeridas</div>
          <div class="space-y-2">
            <div 
              v-for="(action, idx) in suggestions.suggestedActions" 
              :key="idx"
              class="bg-amber-50 border border-amber-200 rounded-xl p-3"
            >
              <div class="flex items-start gap-2">
                <component :is="getActionIcon(action.type)" class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-amber-800">{{ getActionLabel(action) }}</p>
                  <p class="text-xs text-amber-600 mt-0.5">{{ action.reason }}</p>
                </div>
              </div>
              <button 
                @click="$emit('applyAction', action)"
                class="mt-2 w-full px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        <!-- No suggestions -->
        <div v-if="!suggestions.suggestedResponses?.length && !suggestions.suggestedActions?.length" class="text-center py-4">
          <CheckIcon class="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p class="text-sm text-slate-500">Sin sugerencias adicionales</p>
        </div>

        <!-- Refresh -->
        <button 
          @click="$emit('refresh')"
          class="w-full mt-2 px-3 py-2 text-sm text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RefreshIcon class="w-4 h-4" />
          Actualizar sugerencias
        </button>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-4">
        <AlertCircleIcon class="w-8 h-8 mx-auto text-red-400 mb-2" />
        <p class="text-sm text-slate-500">{{ error }}</p>
        <button @click="$emit('refresh')" class="mt-2 text-sm text-violet-600 hover:underline">
          Reintentar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Sparkles as SparklesIcon,
  X as XIcon,
  Loader2 as LoaderIcon,
  RefreshCw as RefreshIcon,
  Check as CheckIcon,
  AlertCircle as AlertCircleIcon,
  ArrowRightCircle as StageIcon,
  Calendar as CalendarIcon,
  Send as SendIcon
} from 'lucide-vue-next'

defineProps({
  suggestions: Object,
  loading: Boolean,
  error: String
})

defineEmits(['close', 'useResponse', 'editResponse', 'applyAction', 'refresh'])

function getIntentLabel(intent) {
  const labels = {
    greeting: '👋 Saludo',
    inquiry: '❓ Consulta',
    purchase: '🛒 Compra',
    objection: '🤔 Objeción',
    appointment: '📅 Cita',
    support: '🛠️ Soporte',
    conversation: '💬 Conversación'
  }
  return labels[intent] || '💬 Conversación'
}

function getSentimentEmoji(sentiment) {
  const emojis = { positive: '😊', neutral: '😐', negative: '😟' }
  return emojis[sentiment] || '😐'
}

function getSentimentLabel(sentiment) {
  const labels = { positive: 'Positivo', neutral: 'Neutral', negative: 'Negativo' }
  return labels[sentiment] || 'Neutral'
}

function getSentimentClass(sentiment) {
  const classes = {
    positive: 'bg-emerald-100 text-emerald-700',
    neutral: 'bg-slate-100 text-slate-700',
    negative: 'bg-red-100 text-red-700'
  }
  return classes[sentiment] || 'bg-slate-100 text-slate-700'
}

function getActionIcon(type) {
  const icons = {
    change_stage: StageIcon,
    schedule_appointment: CalendarIcon,
    send_proposal: SendIcon
  }
  return icons[type] || StageIcon
}

function getActionLabel(action) {
  if (action.type === 'change_stage') {
    const stages = {
      contacted: 'Mover a Contactado',
      qualified: 'Mover a Calificado',
      proposal: 'Mover a Propuesta',
      negotiation: 'Mover a Negociación',
      won: 'Marcar como Ganado'
    }
    return stages[action.value] || `Cambiar etapa a ${action.value}`
  }
  if (action.type === 'schedule_appointment') return 'Sugerir agendar cita'
  if (action.type === 'send_proposal') return 'Enviar propuesta'
  return action.type
}
</script>
