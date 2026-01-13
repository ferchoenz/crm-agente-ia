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
    
    <!-- Personality Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">Personalidad</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Prompt del Sistema</label>
          <textarea 
            v-model="settings.systemPrompt"
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 resize-none"
            rows="4"
            placeholder="Eres un asistente de ventas amable y profesional..."
          ></textarea>
          <p class="text-xs text-slate-500 mt-1.5">
            Este es el contexto inicial que recibe la IA. Define su personalidad y comportamiento.
          </p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Tono de Comunicación</label>
            <select v-model="settings.personality.tone" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800">
              <option value="friendly">Amigable (tú)</option>
              <option value="formal">Formal (usted)</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Estilo de Respuesta</label>
            <select v-model="settings.personality.responseStyle" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800">
              <option value="concise">Conciso</option>
              <option value="detailed">Detallado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Behavior Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">Comportamiento</h3>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <div class="font-medium text-slate-800">Respuesta Automática</div>
            <div class="text-sm text-slate-500">La IA responde automáticamente a los mensajes</div>
          </div>
          <button 
            @click="settings.autoReply = !settings.autoReply"
            class="w-12 h-6 rounded-full transition-colors relative"
            :class="settings.autoReply ? 'bg-primary-500' : 'bg-slate-300'"
          >
            <div 
              class="w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5"
              :class="settings.autoReply ? 'translate-x-6' : 'translate-x-0.5'"
            ></div>
          </button>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje de Bienvenida</label>
          <textarea 
            v-model="settings.greetingMessage"
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 resize-none"
            rows="2"
            placeholder="¡Hola! 👋 Soy el asistente virtual..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Palabras Clave para Transferir a Humano</label>
          <input 
            v-model="humanHandoffKeywordsStr"
            type="text"
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800"
            placeholder="hablar con humano, agente, persona"
          />
          <p class="text-xs text-slate-500 mt-1.5">
            Separadas por comas. Si el cliente usa estas palabras, se desactiva la IA.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Model Settings -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">Modelo de IA</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Modelo</label>
          <select v-model="settings.model" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800">
            <option value="gpt-4o-mini">GPT-4o Mini (Rápido, económico)</option>
            <option value="gpt-4o">GPT-4o (Más inteligente)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Temperatura: {{ settings.temperature }}</label>
          <input 
            v-model.number="settings.temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>Más predecible</span>
            <span>Más creativo</span>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1.5">Máximo de Tokens</label>
          <input 
            v-model.number="settings.maxTokens"
            type="number"
            min="100"
            max="2000"
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800"
          />
          <p class="text-xs text-slate-500 mt-1">Longitud máxima de respuesta</p>
        </div>
      </div>
    </div>
    
    <!-- API Key (optional) -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-800 mb-2">API Key de OpenAI (Opcional)</h3>
      <p class="text-slate-500 text-sm mb-4">
        Si tienes tu propia API key, puedes usarla aquí. Si no, se usará la del sistema.
      </p>
      
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-1.5">OpenAI API Key</label>
        <input 
          v-model="openaiApiKey"
          type="password"
          class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800"
          placeholder="sk-..."
        />
        <p class="text-xs text-slate-500 mt-1.5">
          Tu API key se guarda encriptada y solo se usa para tu organización.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'

const saving = ref(false)
const openaiApiKey = ref('')

const settings = reactive({
  enabled: true,
  provider: 'openai',
  model: 'gpt-4o-mini',
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
      provider: aiConfig.provider || 'openai',
      model: aiConfig.model || 'gpt-4o-mini',
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
})

async function saveSettings() {
  saving.value = true
  
  try {
    await api.put('/admin/settings', {
      aiConfig: settings
    })
    
    // If API key provided, save it separately
    if (openaiApiKey.value) {
      await api.post('/admin/settings/api-key', {
        provider: 'openai',
        apiKey: openaiApiKey.value
      })
      openaiApiKey.value = '' // Clear after saving
    }
    
    alert('Configuración guardada correctamente')
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('Error al guardar: ' + (error.response?.data?.error || error.message))
  } finally {
    saving.value = false
  }
}
</script>
