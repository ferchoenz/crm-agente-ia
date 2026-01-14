<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Canales de Comunicación</h2>
        <p class="text-slate-500">Conecta WhatsApp, Facebook e Instagram para recibir mensajes</p>
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
            <button @click="toggleChannelSettings(channel, 'whatsapp')" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <SettingsIcon class="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Connect button -->
      <button @click="connectWhatsApp" class="btn-primary" :disabled="connectingWhatsApp">
        <PlusIcon class="w-5 h-5 mr-2" />
        {{ connectingWhatsApp ? 'Conectando...' : 'Conectar WhatsApp' }}
      </button>
      
      <p class="text-xs text-slate-500 mt-3">
        Se abrirá el flujo de Meta Business para vincular tu número
      </p>
    </div>
    
    <!-- Facebook Messenger Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
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
            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
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
            <button @click="toggleChannelSettings(channel, 'messenger')" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <SettingsIcon class="w-4 h-4 text-slate-500" />
            </button>
            <button @click="disconnectChannel(channel._id, 'messenger')" class="p-2 hover:bg-rose-100 rounded-lg transition-colors">
              <XIcon class="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Connect button -->
      <button @click="connectFacebook" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2" :disabled="connectingFacebook">
        <FacebookIcon class="w-5 h-5" />
        {{ connectingFacebook ? 'Conectando...' : 'Conectar Facebook' }}
      </button>
      
      <p class="text-xs text-slate-500 mt-3">
        Se abrirá una ventana de Facebook para autorizar el acceso a tu página
      </p>
    </div>
    
    <!-- Instagram Section -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
          <InstagramIcon class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-800">Instagram Direct</h3>
          <p class="text-sm text-slate-500">Conecta tu cuenta de Instagram Business</p>
        </div>
      </div>
      
      <!-- Connected accounts -->
      <div v-if="instagramChannels.length > 0" class="space-y-3 mb-4">
        <div 
          v-for="channel in instagramChannels" 
          :key="channel._id"
          class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center">
              <InstagramIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ channel.name }}</div>
              <div class="text-sm text-slate-500">@{{ channel.instagram?.username }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="channel.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
              {{ channel.status === 'active' ? 'Conectado' : 'Desconectado' }}
            </span>
            <button @click="toggleChannelSettings(channel, 'instagram')" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <SettingsIcon class="w-4 h-4 text-slate-500" />
            </button>
            <button @click="disconnectChannel(channel._id, 'instagram')" class="p-2 hover:bg-rose-100 rounded-lg transition-colors">
              <XIcon class="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Connect button -->
      <button @click="connectInstagram" class="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white rounded-xl font-medium transition-all flex items-center gap-2" :disabled="connectingInstagram">
        <InstagramIcon class="w-5 h-5" />
        {{ connectingInstagram ? 'Conectando...' : 'Conectar Instagram' }}
      </button>
      
      <p class="text-xs text-slate-500 mt-3">
        Tu Instagram debe estar vinculado a una página de Facebook
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
    
    <!-- Page Selection Modal -->
    <div v-if="showPageSelector" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Selecciona una página</h3>
        
        <div v-if="availablePages.length === 0" class="text-center py-8">
          <div class="text-slate-400 mb-2">No se encontraron páginas</div>
          <p class="text-sm text-slate-500">Asegúrate de tener rol de administrador en al menos una página de Facebook.</p>
        </div>
        
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <button
            v-for="page in availablePages"
            :key="page.id"
            @click="selectPage(page)"
            class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors text-left"
          >
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FacebookIcon class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ page.name }}</div>
              <div class="text-sm text-slate-500">ID: {{ page.id }}</div>
            </div>
          </button>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showPageSelector = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Instagram Account Selection Modal -->
    <div v-if="showInstagramSelector" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Selecciona cuenta de Instagram</h3>
        
        <div v-if="availableInstagramAccounts.length === 0" class="text-center py-8">
          <div class="text-slate-400 mb-2">No se encontraron cuentas</div>
          <p class="text-sm text-slate-500">Asegúrate de tener una cuenta de Instagram Business vinculada a tu página de Facebook.</p>
        </div>
        
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <button
            v-for="account in availableInstagramAccounts"
            :key="account.id"
            @click="selectInstagramAccount(account)"
            class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors text-left"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center">
              <InstagramIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-slate-800">@{{ account.username }}</div>
              <div class="text-sm text-slate-500">{{ account.name }}</div>
            </div>
          </button>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showInstagramSelector = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
    
    <!-- WhatsApp Manual Connect Modal -->
    <div v-if="showWhatsAppModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Conectar WhatsApp Business</h3>
        
        <div class="space-y-4">
          <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p class="text-sm text-emerald-800">
              <strong>Requisitos:</strong> Necesitas una cuenta de WhatsApp Business API configurada en Meta Developer.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nombre para identificar</label>
            <input v-model="waForm.displayName" type="text" class="input" placeholder="Ej: WhatsApp Principal" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Phone Number ID</label>
            <input v-model="waForm.phoneNumberId" type="text" class="input" placeholder="Ej: 123456789012345" />
            <p class="text-xs text-slate-500 mt-1">Lo encuentras en Meta Developer → WhatsApp → API Setup</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
            <input v-model="waForm.wabaId" type="text" class="input" placeholder="Ej: 123456789012345" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Número de teléfono</label>
            <input v-model="waForm.phoneNumber" type="text" class="input" placeholder="Ej: +52 1 55 1234 5678" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Access Token (Permanente)</label>
            <input v-model="waForm.accessToken" type="password" class="input" placeholder="Token de acceso" />
            <p class="text-xs text-slate-500 mt-1">Genera un token permanente en Meta Developer → System Users</p>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showWhatsAppModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button @click="saveWhatsAppConnection" class="btn-primary" :disabled="!canSaveWhatsApp || savingWhatsApp">
            {{ savingWhatsApp ? 'Guardando...' : 'Conectar' }}
          </button>
        </div>
      </div>
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
              class="w-12 h-6 rounded-full transition-colors"
              :class="channelSettings.aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'"
            >
              <div class="w-5 h-5 bg-white rounded-full shadow transform transition-transform" :class="channelSettings.aiEnabled ? 'translate-x-6' : 'translate-x-0.5'"></div>
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div class="font-medium text-slate-800">Auto-respuesta</div>
              <div class="text-sm text-slate-500">Responder incluso fuera de horario</div>
            </div>
            <button 
              @click="channelSettings.autoReply = !channelSettings.autoReply"
              class="w-12 h-6 rounded-full transition-colors"
              :class="channelSettings.autoReply ? 'bg-emerald-500' : 'bg-slate-300'"
            >
              <div class="w-5 h-5 bg-white rounded-full shadow transform transition-transform" :class="channelSettings.autoReply ? 'translate-x-6' : 'translate-x-0.5'"></div>
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div class="font-medium text-slate-800">Saludo inicial</div>
              <div class="text-sm text-slate-500">Mensaje de bienvenida automático</div>
            </div>
            <button 
              @click="channelSettings.greetingEnabled = !channelSettings.greetingEnabled"
              class="w-12 h-6 rounded-full transition-colors"
              :class="channelSettings.greetingEnabled ? 'bg-emerald-500' : 'bg-slate-300'"
            >
              <div class="w-5 h-5 bg-white rounded-full shadow transform transition-transform" :class="channelSettings.greetingEnabled ? 'translate-x-6' : 'translate-x-0.5'"></div>
            </button>
          </div>
          
          <div v-if="channelSettings.greetingEnabled">
            <label class="block text-sm font-medium text-slate-700 mb-1">Mensaje de saludo</label>
            <textarea 
              v-model="channelSettings.customGreeting" 
              class="input" 
              rows="3"
              placeholder="¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?"
            ></textarea>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="selectedChannel = null" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button @click="saveChannelSettings" class="btn-primary" :disabled="savingSettings">
            {{ savingSettings ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import {
  MessageCircle as MessageCircleIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  X as XIcon
} from 'lucide-vue-next'

const route = useRoute()

// Channels
const whatsappChannels = ref([])
const messengerChannels = ref([])
const instagramChannels = ref([])
const calendarConnected = ref(false)

// Loading states
const connectingWhatsApp = ref(false)
const connectingFacebook = ref(false)
const connectingInstagram = ref(false)
const loadingCalendar = ref(false)
const savingSettings = ref(false)
const savingWhatsApp = ref(false)

// Modals
const showPageSelector = ref(false)
const showInstagramSelector = ref(false)
const showWhatsAppModal = ref(false)
const selectedChannel = ref(null)
const selectedChannelType = ref(null)

// Facebook pages
const availablePages = ref([])
const availableInstagramAccounts = ref([])
const pendingAccessToken = ref('')

// WhatsApp form
const waForm = reactive({
  displayName: '',
  phoneNumberId: '',
  wabaId: '',
  phoneNumber: '',
  accessToken: ''
})

const canSaveWhatsApp = computed(() => {
  return waForm.phoneNumberId && waForm.accessToken && waForm.displayName
})

// Channel settings
const channelSettings = reactive({
  aiEnabled: true,
  autoReply: true,
  greetingEnabled: true,
  customGreeting: ''
})

onMounted(async () => {
  // Set Facebook App ID for SDK
  try {
    const configResponse = await api.get('/config/public')
    const appId = configResponse.data.facebookAppId
    window.__FACEBOOK_APP_ID__ = appId
    
    // Initialize Facebook SDK - wait for it to load
    const initFB = () => {
      if (typeof FB !== 'undefined' && window.initFacebookSDK) {
        window.initFacebookSDK(appId)
      } else {
        // SDK not loaded yet, retry in 500ms
        setTimeout(initFB, 500)
      }
    }
    initFB()
  } catch (e) {
    console.error('Could not load public config:', e)
  }
  
  await loadAllChannels()
  await checkCalendarStatus()
  
  if (route.query.calendar === 'connected') {
    calendarConnected.value = true
  }
})

async function loadAllChannels() {
  await Promise.all([
    loadWhatsAppChannels(),
    loadMessengerChannels(),
    loadInstagramChannels()
  ])
}

async function loadWhatsAppChannels() {
  try {
    const response = await api.get('/integrations/whatsapp/channels')
    whatsappChannels.value = response.data.channels || []
  } catch (error) {
    console.error('Failed to load WhatsApp channels:', error)
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

async function loadInstagramChannels() {
  try {
    const response = await api.get('/integrations/instagram/channels')
    instagramChannels.value = response.data.channels || []
  } catch (error) {
    console.error('Failed to load Instagram channels:', error)
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

// ============ WHATSAPP ============
function connectWhatsApp() {
  showWhatsAppModal.value = true
}

async function saveWhatsAppConnection() {
  if (!canSaveWhatsApp.value) return
  
  savingWhatsApp.value = true
  
  try {
    await api.post('/integrations/whatsapp/connect', {
      phoneNumberId: waForm.phoneNumberId,
      wabaId: waForm.wabaId,
      phoneNumber: waForm.phoneNumber,
      displayName: waForm.displayName,
      accessToken: waForm.accessToken
    })
    
    showWhatsAppModal.value = false
    waForm.displayName = ''
    waForm.phoneNumberId = ''
    waForm.wabaId = ''
    waForm.phoneNumber = ''
    waForm.accessToken = ''
    
    await loadWhatsAppChannels()
  } catch (error) {
    console.error('Failed to connect WhatsApp:', error)
    alert('Error al conectar WhatsApp: ' + (error.response?.data?.error || error.message))
  } finally {
    savingWhatsApp.value = false
  }
}

// ============ FACEBOOK ============
async function connectFacebook() {
  connectingFacebook.value = true
  
  try {
    // Check if FB SDK is loaded and initialized
    if (typeof FB === 'undefined' || !window.__FB_INITIALIZED__) {
      alert('Facebook SDK no está listo. Espera un momento y vuelve a intentar.')
      connectingFacebook.value = false
      return
    }
    
    FB.login(function(response) {
      if (response.authResponse) {
        pendingAccessToken.value = response.authResponse.accessToken
        
        // Get list of pages
        FB.api('/me/accounts', { access_token: response.authResponse.accessToken }, function(pagesResponse) {
          if (pagesResponse.data && pagesResponse.data.length > 0) {
            availablePages.value = pagesResponse.data
            showPageSelector.value = true
          } else {
            alert('No se encontraron páginas de Facebook. Asegúrate de ser administrador de al menos una página.')
          }
          connectingFacebook.value = false
        })
      } else {
        connectingFacebook.value = false
      }
    }, {
      scope: 'pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement'
    })
  } catch (error) {
    console.error('Facebook login error:', error)
    alert('Error al conectar con Facebook')
    connectingFacebook.value = false
  }
}

async function selectPage(page) {
  try {
    // Get long-lived page access token
    const pageAccessToken = page.access_token
    
    await api.post('/integrations/messenger/connect', {
      pageId: page.id,
      pageName: page.name,
      accessToken: pageAccessToken
    })
    
    showPageSelector.value = false
    availablePages.value = []
    
    await loadMessengerChannels()
  } catch (error) {
    console.error('Failed to connect page:', error)
    alert('Error al conectar la página: ' + (error.response?.data?.error || error.message))
  }
}

// ============ INSTAGRAM ============
async function connectInstagram() {
  connectingInstagram.value = true
  
  try {
    if (typeof FB === 'undefined' || !window.__FB_INITIALIZED__) {
      alert('Facebook SDK no está listo. Espera un momento y vuelve a intentar.')
      connectingInstagram.value = false
      return
    }
    
    FB.login(function(response) {
      if (response.authResponse) {
        const userAccessToken = response.authResponse.accessToken
        
        // Get pages with Instagram accounts
        FB.api('/me/accounts', { 
          fields: 'id,name,access_token,instagram_business_account{id,username,name}',
          access_token: userAccessToken 
        }, function(pagesResponse) {
          if (pagesResponse.data) {
            const accountsWithInstagram = pagesResponse.data
              .filter(page => page.instagram_business_account)
              .map(page => ({
                ...page.instagram_business_account,
                pageId: page.id,
                pageName: page.name,
                pageAccessToken: page.access_token
              }))
            
            if (accountsWithInstagram.length > 0) {
              availableInstagramAccounts.value = accountsWithInstagram
              showInstagramSelector.value = true
            } else {
              alert('No se encontraron cuentas de Instagram Business vinculadas a tus páginas de Facebook.')
            }
          }
          connectingInstagram.value = false
        })
      } else {
        connectingInstagram.value = false
      }
    }, {
      scope: 'instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging'
    })
  } catch (error) {
    console.error('Instagram login error:', error)
    alert('Error al conectar con Instagram')
    connectingInstagram.value = false
  }
}

async function selectInstagramAccount(account) {
  try {
    await api.post('/integrations/instagram/connect', {
      instagramAccountId: account.id,
      username: account.username,
      name: account.name,
      pageId: account.pageId,
      accessToken: account.pageAccessToken
    })
    
    showInstagramSelector.value = false
    availableInstagramAccounts.value = []
    
    await loadInstagramChannels()
  } catch (error) {
    console.error('Failed to connect Instagram:', error)
    alert('Error al conectar Instagram: ' + (error.response?.data?.error || error.message))
  }
}

// ============ GOOGLE CALENDAR ============
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

// ============ CHANNEL SETTINGS ============
function toggleChannelSettings(channel, type) {
  selectedChannel.value = channel
  selectedChannelType.value = type
  channelSettings.aiEnabled = channel.settings?.aiEnabled ?? true
  channelSettings.autoReply = channel.settings?.autoReply ?? true
  channelSettings.greetingEnabled = channel.settings?.greetingEnabled ?? true
  channelSettings.customGreeting = channel.settings?.customGreeting || ''
}

async function saveChannelSettings() {
  savingSettings.value = true
  
  try {
    const endpoint = `/integrations/${selectedChannelType.value}/channels/${selectedChannel.value._id}/settings`
    await api.patch(endpoint, channelSettings)
    
    // Update local state
    const channelList = selectedChannelType.value === 'whatsapp' 
      ? whatsappChannels.value 
      : selectedChannelType.value === 'messenger'
        ? messengerChannels.value
        : instagramChannels.value
    
    const idx = channelList.findIndex(c => c._id === selectedChannel.value._id)
    if (idx >= 0) {
      channelList[idx].settings = { ...channelSettings }
    }
    
    selectedChannel.value = null
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('Error al guardar configuración')
  } finally {
    savingSettings.value = false
  }
}

async function disconnectChannel(channelId, type) {
  if (!confirm('¿Estás seguro de desconectar este canal?')) return
  
  try {
    await api.delete(`/integrations/${type}/channels/${channelId}`)
    await loadAllChannels()
  } catch (error) {
    console.error('Failed to disconnect channel:', error)
    alert('Error al desconectar canal')
  }
}
</script>
