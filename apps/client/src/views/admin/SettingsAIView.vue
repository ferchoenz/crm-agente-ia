<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Configuración del Agente IA</h2>
        <p class="text-slate-500">Personaliza el comportamiento de tu asistente virtual</p>
      </div>
      <button @click="saveSettings" class="btn-primary" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>

    <!-- AI Status Banner -->
    <div class="rounded-2xl p-4 border" :class="settings.autoReply ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="settings.autoReply ? 'bg-emerald-500' : 'bg-slate-400'">
            <BotIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-semibold" :class="settings.autoReply ? 'text-emerald-800' : 'text-slate-600'">
              {{ settings.autoReply ? 'Agente IA Activo' : 'Agente IA Inactivo' }}
            </h3>
            <p class="text-sm" :class="settings.autoReply ? 'text-emerald-600' : 'text-slate-500'">
              {{ settings.autoReply ? 'Respondiendo automáticamente a los mensajes' : 'Los mensajes no se responderán automáticamente' }}
            </p>
          </div>
        </div>
        <button 
          @click="settings.autoReply = !settings.autoReply"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="settings.autoReply ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-600 text-white hover:bg-slate-700'"
        >
          {{ settings.autoReply ? 'Desactivar' : 'Activar' }}
        </button>
      </div>
    </div>

    <!-- Providers Status -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <ServerIcon class="w-5 h-5 text-primary-500" />
          <h3 class="text-lg font-semibold text-slate-800">Estado de Proveedores IA</h3>
        </div>
        <button @click="loadAIStatus" class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
          <RefreshCwIcon class="w-4 h-4" />
          Actualizar
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          v-for="(level, key) in aiProviders" 
          :key="key"
          class="p-4 rounded-xl border-2 transition-all"
          :class="level.available ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'"
        >
          <div class="flex items-center gap-3 mb-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="level.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"
            ></div>
            <span class="text-sm font-bold" :class="getLevelColor(key)">{{ key }}</span>
          </div>
          <div class="text-sm font-medium text-slate-800">{{ level.name }}</div>
          <div class="text-xs text-slate-500 mt-1">
            {{ level.available ? '✓ Operativo' : '✗ No configurado' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Personality Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <SparklesIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Personalidad</h3>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Prompt del Sistema</label>
          <textarea 
            v-model="settings.systemPrompt"
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 resize-none"
            rows="5"
            placeholder="Eres un asistente de ventas amable y profesional para [NOMBRE DEL NEGOCIO]. Tu objetivo es ayudar a los clientes con información sobre productos, precios y disponibilidad..."
          ></textarea>
          <p class="text-xs text-slate-500 mt-1.5">
            Define la personalidad, contexto y comportamiento del agente. Incluye información específica de tu negocio.
          </p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Tono de Comunicación</label>
            <select v-model="settings.personality.tone" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800">
              <option value="friendly">Amigable (tú)</option>
              <option value="formal">Formal (usted)</option>
              <option value="casual">Casual</option>
              <option value="professional">Profesional</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Estilo de Respuesta</label>
            <select v-model="settings.personality.responseStyle" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800">
              <option value="concise">Conciso (respuestas cortas)</option>
              <option value="detailed">Detallado (respuestas completas)</option>
              <option value="balanced">Balanceado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Behavior Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <MessageSquareIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Mensajes Automáticos</h3>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje de Bienvenida</label>
          <textarea 
            v-model="settings.greetingMessage"
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 resize-none"
            rows="2"
            placeholder="¡Hola! 👋 Soy el asistente virtual de [NEGOCIO]. ¿En qué puedo ayudarte?"
          ></textarea>
          <p class="text-xs text-slate-500 mt-1">Se envía cuando un cliente inicia una nueva conversación</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Palabras Clave para Transferir a Humano</label>
          <input 
            v-model="humanHandoffKeywordsStr"
            type="text"
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800"
            placeholder="hablar con humano, agente, persona, asesor"
          />
          <p class="text-xs text-slate-500 mt-1.5">
            Separadas por comas. Si el cliente usa estas palabras, la IA se desactiva y se notifica al equipo.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Model Settings -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <CpuIcon class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-slate-800">Configuración del Modelo</h3>
      </div>
      
      <div class="space-y-6">
        <!-- Routing Mode -->
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-2">Modo de Enrutamiento</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              @click="settings.routingMode = 'auto'"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="settings.routingMode === 'auto' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <ZapIcon class="w-4 h-4 text-white" />
                </div>
                <div>
                  <div class="font-semibold text-slate-800">Automático (Recomendado)</div>
                  <div class="text-xs text-slate-500">El sistema elige el mejor modelo según la complejidad</div>
                </div>
              </div>
            </button>
            
            <button
              @click="settings.routingMode = 'fixed'"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="settings.routingMode === 'fixed' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center">
                  <SettingsIcon class="w-4 h-4 text-white" />
                </div>
                <div>
                  <div class="font-semibold text-slate-800">Modelo Fijo</div>
                  <div class="text-xs text-slate-500">Usar siempre el mismo modelo</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Fixed Model Selection (only if fixed mode) -->
        <div v-if="settings.routingMode === 'fixed'">
          <label class="block text-sm font-medium text-slate-600 mb-2">Modelo Preferido</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              @click="settings.preferredLevel = 'L1'"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="settings.preferredLevel === 'L1' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="text-emerald-600 font-bold text-sm mb-1">L1 - Rápido</div>
              <div class="text-xs text-slate-600">Groq (Llama 3.1)</div>
              <div class="text-xs text-slate-400 mt-1">Ultra-rápido, ideal para respuestas simples</div>
            </button>
            
            <button
              @click="settings.preferredLevel = 'L2'"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="settings.preferredLevel === 'L2' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="text-amber-600 font-bold text-sm mb-1">L2 - Contextual</div>
              <div class="text-xs text-slate-600">Gemini 2.0 Flash</div>
              <div class="text-xs text-slate-400 mt-1">Balance ideal de calidad y costo</div>
            </button>
            
            <button
              @click="settings.preferredLevel = 'L3'"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="settings.preferredLevel === 'L3' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="text-rose-600 font-bold text-sm mb-1">L3 - Avanzado</div>
              <div class="text-xs text-slate-600">DeepSeek V3</div>
              <div class="text-xs text-slate-400 mt-1">Razonamiento complejo, negociación</div>
            </button>
          </div>
        </div>

        <!-- Temperature and Max Tokens -->
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">
              Creatividad: <span class="text-primary-600 font-semibold">{{ settings.temperature }}</span>
            </label>
            <input 
              v-model.number="settings.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>Conservador</span>
              <span>Creativo</span>
            </div>
            <p class="text-xs text-slate-400 mt-2">
              Valores bajos = respuestas más predecibles. Valores altos = más variedad.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">Longitud Máxima de Respuesta</label>
            <select v-model="settings.maxTokens" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
              <option :value="200">Corta (~50 palabras)</option>
              <option :value="500">Media (~125 palabras)</option>
              <option :value="800">Larga (~200 palabras)</option>
              <option :value="1200">Muy larga (~300 palabras)</option>
            </select>
            <p class="text-xs text-slate-400 mt-2">
              Respuestas más largas consumen más tokens.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Info -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
          <InfoIcon class="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h4 class="font-semibold text-slate-800 mb-1">Sistema Multi-Modelo Inteligente</h4>
          <p class="text-sm text-slate-600">
            Tu agente usa un sistema de enrutamiento inteligente que selecciona automáticamente el mejor modelo de IA 
            según la complejidad de cada mensaje. Esto optimiza costos y velocidad de respuesta.
          </p>
          <div class="flex gap-4 mt-3 text-xs">
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-slate-600">L1: Respuestas simples</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-slate-600">L2: Contexto largo</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-slate-600">L3: Razonamiento complejo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'
import {
  Bot as BotIcon,
  Sparkles as SparklesIcon,
  MessageSquare as MessageSquareIcon,
  Cpu as CpuIcon,
  Zap as ZapIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Server as ServerIcon,
  RefreshCw as RefreshCwIcon
} from 'lucide-vue-next'

const saving = ref(false)

const aiProviders = ref({
  L1: { available: false, name: 'Groq (Llama 3.1)' },
  L2: { available: false, name: 'Gemini 2.0 Flash' },
  L3: { available: false, name: 'DeepSeek V3' }
})

const settings = reactive({
  enabled: true,
  routingMode: 'auto',
  preferredLevel: 'L1',
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: '',
  personality: {
    tone: 'friendly',
    responseStyle: 'concise'
  },
  autoReply: true,
  humanHandoffKeywords: [],
  greetingMessage: ''
})

const humanHandoffKeywordsStr = computed({
  get: () => settings.humanHandoffKeywords?.join(', ') || '',
  set: (val) => {
    settings.humanHandoffKeywords = val.split(',').map(s => s.trim()).filter(Boolean)
  }
})

onMounted(async () => {
  try {
    const response = await api.get('/admin/settings')
    const aiConfig = response.data.aiConfig || {}
    
    Object.assign(settings, {
      enabled: aiConfig.enabled ?? true,
      routingMode: aiConfig.routingMode || 'auto',
      preferredLevel: aiConfig.preferredLevel || 'L1',
      temperature: aiConfig.temperature ?? 0.7,
      maxTokens: aiConfig.maxTokens || 500,
      systemPrompt: aiConfig.systemPrompt || '',
      personality: aiConfig.personality || { tone: 'friendly', responseStyle: 'concise' },
      autoReply: aiConfig.autoReply ?? true,
      humanHandoffKeywords: aiConfig.humanHandoffKeywords || [],
      greetingMessage: aiConfig.greetingMessage || ''
    })
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  
  // Load AI provider status
  await loadAIStatus()
})

async function loadAIStatus() {
  try {
    const response = await api.get('/admin/ai/status')
    if (response.data.providers) {
      aiProviders.value = response.data.providers
    }
  } catch (error) {
    console.error('Failed to load AI status:', error)
  }
}

function getLevelColor(level) {
  const colors = {
    L1: 'text-emerald-600',
    L2: 'text-amber-600',
    L3: 'text-rose-600'
  }
  return colors[level] || 'text-slate-600'
}

async function saveSettings() {
  saving.value = true
  
  try {
    await api.put('/admin/settings', {
      aiConfig: settings
    })
    
    alert('Configuración guardada correctamente')
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('Error al guardar: ' + (error.response?.data?.error || error.message))
  } finally {
    saving.value = false
  }
}
</script>
