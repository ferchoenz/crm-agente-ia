<template>
  <div>
    <!-- Embedded Signup Button -->
    <button 
      v-if="!loading && !channel"
      @click="launchEmbeddedSignup"
      class="btn-primary flex items-center gap-2"
      :disabled="!isReady"
    >
      <MessageCircleIcon class="w-5 h-5" />
      {{ isReady ? 'Conectar WhatsApp Business' : 'Cargando...' }}
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
      <span class="text-slate-600">{{ loadingMessage }}</span>
    </div>

    <!-- Success State -->
    <div v-if="channel" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div class="flex items-center gap-2 text-emerald-700 mb-2">
        <CheckCircleIcon class="w-5 h-5" />
        <span class="font-medium">WhatsApp conectado exitosamente</span>
      </div>
      <p class="text-sm text-emerald-600">
        {{ channel.phoneNumber }} - {{ channel.name }}
      </p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 bg-rose-50 border border-rose-200 rounded-xl">
      <div class="flex items-center gap-2 text-rose-700 mb-2">
        <AlertCircleIcon class="w-5 h-5" />
        <span class="font-medium">Error al conectar WhatsApp</span>
      </div>
      <p class="text-sm text-rose-600">{{ error }}</p>
      <button @click="retry" class="mt-3 text-sm text-rose-600 hover:text-rose-700 font-medium">
        Intentar nuevamente
      </button>
    </div>

    <!-- Phone Number Selection Modal -->
    <div v-if="showPhoneSelector" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Selecciona un número</h3>
        
        <div v-if="availablePhones.length === 0" class="text-center py-8">
          <div class="text-slate-400 mb-2">No se encontraron números</div>
          <p class="text-sm text-slate-500">Tu cuenta de WhatsApp Business no tiene números configurados.</p>
        </div>
        
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <button
            v-for="phone in availablePhones"
            :key="phone.id"
            @click="selectPhone(phone)"
            class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors text-left"
          >
            <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <PhoneIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <div class="font-medium text-slate-800">{{ phone.display_phone_number }}</div>
              <div class="text-sm text-slate-500">{{ phone.verified_name || 'Sin nombre verificado' }}</div>
            </div>
            <div v-if="phone.code_verification_status === 'VERIFIED'" class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
              Verificado
            </div>
          </button>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="cancelSelection" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import { 
  MessageCircle as MessageCircleIcon, 
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Phone as PhoneIcon
} from 'lucide-vue-next'

const emit = defineEmits(['success', 'error'])

// State
const isReady = ref(false)
const loading = ref(false)
const loadingMessage = ref('')
const error = ref(null)
const channel = ref(null)
const showPhoneSelector = ref(false)
const availablePhones = ref([])

// Embedded signup data
const config = ref({
  appId: null,
  configId: null
})
const pendingData = ref({
  code: null,
  wabaId: null,
  phoneNumberId: null,
  accessToken: null
})

onMounted(async () => {
  await loadConfig()
  await ensureFacebookSDK()
})

async function loadConfig() {
  try {
    const response = await api.get('/integrations/whatsapp/embedded-signup/config')
    config.value = response.data
    
    if (!config.value.configId) {
      error.value = 'Configuration ID no configurado. Contacta al administrador.'
    }
  } catch (err) {
    console.error('Failed to load config:', err)
    error.value = 'No se pudo cargar la configuración'
  }
}

async function ensureFacebookSDK() {
  return new Promise((resolve) => {
    if (typeof FB !== 'undefined') {
      isReady.value = true
      resolve()
      return
    }

    // Wait for SDK to load
    const checkSDK = setInterval(() => {
      if (typeof FB !== 'undefined' && window.__FB_INITIALIZED__) {
        isReady.value = true
        clearInterval(checkSDK)
        resolve()
      }
    }, 500)

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkSDK)
      if (!isReady.value) {
        error.value = 'Facebook SDK no se pudo cargar. Recarga la página.'
        resolve()
      }
    }, 10000)
  })
}

function launchEmbeddedSignup() {
  if (!isReady.value || !config.value.configId) {
    error.value = 'La configuración no está lista'
    return
  }

  loading.value = true
  loadingMessage.value = 'Abriendo Meta Business...'
  error.value = null

  // Set up message listener BEFORE launching FB.login to capture session info
  const sessionInfoListener = (event) => {
    // Log ALL postMessage events for debugging (you can remove this later)
    console.log('PostMessage event received:', {
      origin: event.origin,
      data: event.data
    })
    
    // Only process messages from Facebook domains
    if (!event.origin.includes('facebook.com')) {
      return
    }
    
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      
      console.log('Facebook postMessage data:', data)
      
      // Check multiple possible formats for WhatsApp session info
      // Format 1: WA_EMBEDDED_SIGNUP type
      if (data.type === 'WA_EMBEDDED_SIGNUP' && data.data) {
        console.log('WA_EMBEDDED_SIGNUP event received:', data.data)
        if (data.data.waba_id) pendingData.value.wabaId = data.data.waba_id
        if (data.data.phone_number_id) pendingData.value.phoneNumberId = data.data.phone_number_id
      }
      
      // Format 2: Direct waba_id/phone_number_id in data
      if (data.waba_id) {
        console.log('WABA ID found directly in event:', data.waba_id)
        pendingData.value.wabaId = data.waba_id
      }
      if (data.phone_number_id) {
        console.log('Phone Number ID found directly in event:', data.phone_number_id)
        pendingData.value.phoneNumberId = data.phone_number_id
      }
      
      // Format 3: event property contains the data
      if (data.event === 'FINISH' || data.event === 'SUBMIT') {
        console.log('WhatsApp signup FINISH/SUBMIT event:', data)
        if (data.waba_id) pendingData.value.wabaId = data.waba_id
        if (data.phone_number_id) pendingData.value.phoneNumberId = data.phone_number_id
        if (data.data?.waba_id) pendingData.value.wabaId = data.data.waba_id
        if (data.data?.phone_number_id) pendingData.value.phoneNumberId = data.data.phone_number_id
      }
      
      console.log('Current pendingData after processing:', {
        wabaId: pendingData.value.wabaId,
        phoneNumberId: pendingData.value.phoneNumberId
      })
      
    } catch (e) {
      // Not JSON, might be a string message
      if (typeof event.data === 'string' && event.data.includes('waba')) {
        console.log('String message containing waba:', event.data)
      }
    }
  }
  
  // Add listener for session info
  window.addEventListener('message', sessionInfoListener)

  // Launch Facebook Login with embedded signup
  FB.login(function(response) {
    // Remove listener after login completes
    window.removeEventListener('message', sessionInfoListener)
    
    if (response.authResponse) {
      const authResponse = response.authResponse
      
      // Log for debugging - when using config_id, grantedScopes may not be populated
      console.log('FB.login authResponse:', authResponse)
      
      // Note: When using config_id, permissions are pre-configured in the Configuration
      // grantedScopes may be empty or undefined, but the token will have the permissions

      loadingMessage.value = 'Procesando datos de WhatsApp...'

      // Store the authorization code
      pendingData.value.code = authResponse.code
      pendingData.value.accessToken = authResponse.accessToken

      // Process the signup response with session data
      handleSignupResponse(authResponse)
    } else {
      loading.value = false
      loadingMessage.value = ''
      // User cancelled
    }
  }, {
    config_id: config.value.configId,
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      setup: {
        // No solutionID needed for standalone Tech Provider
      },
      featureType: '',
      sessionInfoVersion: '3'  // Required to receive WABA ID and Phone Number ID
    }
  })
}

async function handleSignupResponse(authResponse) {
  try {
    // The embedded signup with sessionInfoVersion: 3 may return WABA and Phone info via message event
    // But sometimes it doesn't, so we need to discover WABAs using the access token
    let wabaId = pendingData.value.wabaId || authResponse.wabaId || authResponse.waba_id
    let phoneNumberId = pendingData.value.phoneNumberId
    
    console.log('Processing signup response:', { wabaId, phoneNumberId, authResponse })
    
    // If we don't have WABA ID from session, we need to discover it
    if (!wabaId) {
      console.log('WABA ID not in session, discovering via API...')
      loadingMessage.value = 'Descubriendo cuentas de WhatsApp...'
      
      try {
        // Call backend to discover WABAs using the access token
        const discoverResponse = await api.post('/integrations/whatsapp/discover-wabas', {
          accessToken: authResponse.accessToken
        })
        
        const wabas = discoverResponse.data.wabas || []
        console.log('Discovered WABAs:', wabas)
        
        if (wabas.length === 0) {
          error.value = 'No se encontraron cuentas de WhatsApp Business. Asegúrate de completar el registro en Meta.'
          loading.value = false
          return
        }
        
        // Use the first WABA (or show selector if multiple)
        wabaId = wabas[0].id
        pendingData.value.wabaId = wabaId
        
        console.log('Using WABA:', wabaId)
      } catch (discoverError) {
        console.error('WABA discovery failed:', discoverError)
        error.value = discoverError.response?.data?.error || 'Error al descubrir cuentas de WhatsApp'
        loading.value = false
        return
      }
    } else {
      pendingData.value.wabaId = wabaId
    }

    // If we already have the phone number ID from session, use it directly
    if (phoneNumberId) {
      console.log('Phone Number ID from session:', phoneNumberId)
      loadingMessage.value = 'Conectando número de WhatsApp...'
      
      // Complete signup directly with the phone number from session
      await completeSignup(phoneNumberId)
      return
    }

    // Fetch available phone numbers for this WABA
    loadingMessage.value = 'Obteniendo números de teléfono...'
    const phonesResponse = await api.post('/integrations/whatsapp/waba/phone-numbers', {
      wabaId: wabaId,
      accessToken: authResponse.accessToken
    })

    availablePhones.value = phonesResponse.data.phoneNumbers || []

    if (availablePhones.value.length === 0) {
      error.value = 'No se encontraron números de teléfono en esta cuenta'
      loading.value = false
      return
    }

    if (availablePhones.value.length === 1) {
      // Auto-select if only one phone
      await selectPhone(availablePhones.value[0])
    } else {
      // Show selector if multiple phones
      loading.value = false
      showPhoneSelector.value = true
    }

  } catch (err) {
    console.error('Signup response handling failed:', err)
    error.value = err.response?.data?.error || 'Error al procesar la respuesta de WhatsApp'
    loading.value = false
  }
}

async function completeSignup(phoneNumberId) {
  try {
    const response = await api.post('/integrations/whatsapp/embedded-signup/callback', {
      code: pendingData.value.code,
      wabaId: pendingData.value.wabaId,
      phoneNumberId: phoneNumberId
    })

    channel.value = response.data.channel
    loading.value = false
    loadingMessage.value = ''

    emit('success', channel.value)
  } catch (err) {
    console.error('Failed to complete signup:', err)
    error.value = err.response?.data?.error || 'Error al conectar el número de WhatsApp'
    loading.value = false
  }
}

async function selectPhone(phone) {
  showPhoneSelector.value = false
  loading.value = true
  loadingMessage.value = 'Conectando número de WhatsApp...'

  try {
    const response = await api.post('/integrations/whatsapp/embedded-signup/callback', {
      code: pendingData.value.code,
      wabaId: pendingData.value.wabaId,
      phoneNumberId: phone.id
    })

    channel.value = response.data.channel
    loading.value = false
    loadingMessage.value = ''

    emit('success', channel.value)
  } catch (err) {
    console.error('Failed to complete signup:', err)
    error.value = err.response?.data?.error || 'Error al conectar el número de WhatsApp'
    loading.value = false
  }
}

function cancelSelection() {
  showPhoneSelector.value = false
  availablePhones.value = []
  pendingData.value = {
    code: null,
    wabaId: null,
    phoneNumberId: null,
    accessToken: null
  }
}

function retry() {
  error.value = null
  channel.value = null
  launchEmbeddedSignup()
}
</script>
