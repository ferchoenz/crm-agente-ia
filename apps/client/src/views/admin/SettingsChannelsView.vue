<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Canales de Comunicación</h2>
        <p class="text-slate-500">Conecta WhatsApp y Facebook para recibir mensajes</p>
      </div>
    </div>
    
    <!-- WhatsApp Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
          <MessageCircleIcon class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-800">WhatsApp Business</h3>
          <p class="text-sm text-slate-500">Conecta tu número de WhatsApp Business</p>
        </div>
      </div>
      
      <!-- Connected channels -->
      <div v-if="whatsappChannels.length > 0" class="space-y-3 mb-4">
        <div 
          v-for="channel in whatsappChannels" 
          :key="channel._id"
          class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <PhoneIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ channel.name }}</div>
              <div class="text-sm text-slate-500">{{ channel.whatsapp?.phoneNumber }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="channel.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
              {{ channel.status === 'active' ? 'Conectado' : 'Desconectado' }}
            </span>
            <button @click="toggleChannelSettings(channel)" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <SettingsIcon class="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Connect button -->
      <button @click="connectWhatsApp" class="btn-primary" :disabled="connecting">
        <PlusIcon class="w-5 h-5 mr-2" />
        {{ connecting ? 'Conectando...' : 'Conectar WhatsApp' }}
      </button>
      
      <p class="text-xs text-slate-500 mt-3">
        Se abrirá una ventana de Meta para autorizar la conexión
      </p>
    </div>
    
    <!-- Google Calendar Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
          <CalendarIcon class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-800">Google Calendar</h3>
          <p class="text-sm text-slate-500">Permite al agente agendar citas automáticamente</p>
        </div>
      </div>
      
      <div v-if="calendarConnected" class="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div class="flex items-center gap-2 text-emerald-700">
          <CheckCircleIcon class="w-5 h-5" />
          <span class="font-medium">Google Calendar conectado</span>
        </div>
      </div>
      
      <button 
        @click="connectGoogleCalendar" 
        class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
        :disabled="calendarConnected || loadingCalendar"
      >
        <CalendarIcon class="w-5 h-5" />
        {{ calendarConnected ? 'Ya conectado' : 'Conectar Google Calendar' }}
      </button>
    </div>
    
    <!-- Facebook Messenger Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
          <FacebookIcon class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-800">Facebook Messenger</h3>
          <p class="text-sm text-slate-500">Conecta tu página de Facebook para recibir mensajes</p>
        </div>
      </div>
      
      <!-- Connected pages -->
      <div v-if="messengerChannels.length > 0" class="space-y-3 mb-4">
        <div 
          v-for="channel in messengerChannels" 
          :key="channel._id"
          class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <FacebookIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ channel.name }}</div>
              <div class="text-sm text-slate-500">{{ channel.messenger?.pageName || 'Página de Facebook' }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="channel.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
              {{ channel.status === 'active' ? 'Conectado' : 'Desconectado' }}
            </span>
            <button @click="toggleChannelSettings(channel)" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <SettingsIcon class="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Connect button -->
      <button @click="connectFacebook" class="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2" :disabled="connectingFacebook">
        <FacebookIcon class="w-5 h-5" />
        {{ connectingFacebook ? 'Conectando...' : 'Conectar Facebook' }}
      </button>
      
      <p class="text-xs text-slate-500 mt-3">
        Se abrirá una ventana para autorizar el acceso a tu página de Facebook
      </p>
    </div>
    
    <!-- Channel Settings Modal -->
    <div v-if="selectedChannel" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Configuración del Canal</h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div class="font-medium text-slate-800">IA Habilitada</div>
              <div class="text-sm text-slate-500">El agente responderá automáticamente</div>
            </div>
            <button 
              @click="channelSettings.aiEnabled = !channelSettings.aiEnabled"
              class="w-12 h-6 rounded-full transition-colors relative"
              :class="channelSettings.aiEnabled ? 'bg-primary-500' : 'bg-slate-300'"
            >
              <div 
                class="w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5"
                :class="channelSettings.aiEnabled ? 'translate-x-6' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div class="font-medium text-slate-800">Saludo Automático</div>
              <div class="text-sm text-slate-500">Enviar mensaje de bienvenida</div>
            </div>
            <button 
              @click="channelSettings.greetingEnabled = !channelSettings.greetingEnabled"
              class="w-12 h-6 rounded-full transition-colors relative"
              :class="channelSettings.greetingEnabled ? 'bg-primary-500' : 'bg-slate-300'"
            >
              <div 
                class="w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5"
                :class="channelSettings.greetingEnabled ? 'translate-x-6' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">Mensaje de saludo personalizado</label>
            <textarea 
              v-model="channelSettings.customGreeting"
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              rows="3"
              placeholder="¡Hola! 👋 Soy el asistente virtual..."
            ></textarea>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button @click="selectedChannel = null" class="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
            Cancelar
          </button>
          <button @click="saveChannelSettings" class="btn-primary flex-1" :disabled="savingSettings">
            {{ savingSettings ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import {
  MessageCircle as MessageCircleIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Facebook as FacebookIcon
} from 'lucide-vue-next'

const route = useRoute()

const whatsappChannels = ref([])
const messengerChannels = ref([])
const calendarConnected = ref(false)
const connecting = ref(false)
const connectingFacebook = ref(false)
const loadingCalendar = ref(false)
const selectedChannel = ref(null)
const savingSettings = ref(false)

const channelSettings = reactive({
  aiEnabled: true,
  autoReply: true,
  greetingEnabled: true,
  customGreeting: ''
})

onMounted(async () => {
  await loadChannels()
  await loadMessengerChannels()
  await checkCalendarStatus()
  
  if (route.query.calendar === 'connected') {
    calendarConnected.value = true
  }
})

async function loadChannels() {
  try {
    const response = await api.get('/integrations/whatsapp/channels')
    whatsappChannels.value = response.data.channels
  } catch (error) {
    console.error('Failed to load channels:', error)
  }
}

async function checkCalendarStatus() {
  try {
    const response = await api.get('/integrations/google/calendar/status')
    calendarConnected.value = response.data.connected
  } catch (error) {
    console.error('Failed to check calendar status:', error)
  }
}

async function connectWhatsApp() {
  connecting.value = true
  alert('Para conectar WhatsApp Business:\n\n1. Necesitas configurar el Embedded Signup de Meta\n2. Obtener acceso como Tech Provider\n3. Configurar el webhook URL en Meta Developer\n\nEsto se configurará cuando despliegues en producción.')
  connecting.value = false
}

async function connectGoogleCalendar() {
  loadingCalendar.value = true
  
  try {
    const response = await api.get('/integrations/google/calendar/auth-url')
    window.location.href = response.data.authUrl
  } catch (error) {
    console.error('Failed to get auth URL:', error)
    alert('Error al conectar con Google Calendar')
  } finally {
    loadingCalendar.value = false
  }
}

async function loadMessengerChannels() {
  try {
    const response = await api.get('/integrations/messenger/channels')
    messengerChannels.value = response.data.channels || []
  } catch (error) {
    console.error('Failed to load messenger channels:', error)
  }
}

async function connectFacebook() {
  connectingFacebook.value = true
  
  // Facebook Login SDK would be integrated here in production
  alert('Para conectar Facebook Messenger:\n\n1. Configura una App en Meta Developers\n2. Añade el producto "Messenger"\n3. Configura el webhook URL: /api/webhooks/facebook\n4. Obtén el Page Access Token\n\nEsto se configurará cuando despliegues en producción.')
  
  connectingFacebook.value = false
}

function toggleChannelSettings(channel) {
  selectedChannel.value = channel
  channelSettings.aiEnabled = channel.settings?.aiEnabled ?? true
  channelSettings.autoReply = channel.settings?.autoReply ?? true
  channelSettings.greetingEnabled = channel.settings?.greetingEnabled ?? true
  channelSettings.customGreeting = channel.settings?.customGreeting || ''
}

async function saveChannelSettings() {
  savingSettings.value = true
  
  try {
    await api.patch(`/integrations/whatsapp/channels/${selectedChannel.value._id}/settings`, channelSettings)
    
    const idx = whatsappChannels.value.findIndex(c => c._id === selectedChannel.value._id)
    if (idx >= 0) {
      whatsappChannels.value[idx].settings = { ...channelSettings }
    }
    
    selectedChannel.value = null
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('Error al guardar configuración')
  } finally {
    savingSettings.value = false
  }
}
</script>
