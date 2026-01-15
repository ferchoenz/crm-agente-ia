<template>
  <div class="flex h-[calc(100vh-4rem)] -m-6 bg-slate-50">
    <!-- 1. LEFT SIDEBAR: Conversation List -->
    <div class="w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-white">
      <!-- Search & Filters -->
      <div class="p-4 border-b border-slate-100 space-y-3">
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar conversación..."
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
        </div>
        
        <div class="flex gap-2 text-xs font-medium overflow-x-auto pb-1 scrollbar-hide">
          <button 
            @click="filter = 'all'"
            class="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
            :class="filter === 'all' ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
          >
            Todos
          </button>
          <button 
            @click="filter = 'unread'"
            class="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
            :class="filter === 'unread' ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
          >
            No leídos
          </button>
          <button 
            @click="filter = 'handoff'"
            class="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5"
            :class="filter === 'handoff' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
          >
            <AlertCircleIcon class="w-3 h-3" />
            Handoff
          </button>
        </div>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="p-8 text-center text-slate-400">
          <LoaderIcon class="w-6 h-6 mx-auto animate-spin mb-2" />
          <p class="text-xs">Cargando...</p>
        </div>

        <div v-else-if="filteredConversations.length === 0" class="p-8 text-center text-slate-400">
          <InboxIcon class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No hay conversaciones</p>
        </div>

        <div v-else class="divide-y divide-slate-50">
          <div 
            v-for="conv in filteredConversations" 
            :key="conv._id"
            @click="selectConversation(conv)"
            class="p-4 hover:bg-slate-50 cursor-pointer transition-all border-l-4"
            :class="selectedId === conv._id ? 'bg-primary-50/30 border-primary-500' : 'border-transparent'"
          >
            <div class="flex gap-3">
              <div class="relative">
                <!-- Avatar -->
                <img 
                  :src="conv.customer?.avatar || `https://ui-avatars.com/api/?name=${conv.customer?.name}&background=random`" 
                  class="w-12 h-12 rounded-full object-cover shadow-sm bg-white"
                >
                <!-- Channel Icon Badge -->
                <div 
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                  :class="getChannelColor(conv.channel?.type)"
                >
                  <component :is="getChannelIcon(conv.channel?.type)" class="w-3 h-3 text-white" />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-0.5">
                  <h4 
                    class="font-semibold text-slate-900 truncate"
                    :class="{ 'font-bold': conv.unreadCount > 0 }"
                  >
                    {{ conv.customer?.name || 'Cliente Desconocido' }}
                  </h4>
                  <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {{ formatTime(conv.lastMessage?.sentAt) }}
                  </span>
                </div>
                
                <p 
                  class="text-sm text-slate-500 truncate"
                  :class="{ 'font-medium text-slate-800': conv.unreadCount > 0 }"
                >
                  <span v-if="conv.lastMessage?.senderType === 'agent'" class="text-slate-400">Tú: </span>
                  {{ conv.lastMessage?.content || 'Nueva conversación' }}
                </p>

                <!-- Badges -->
                <div class="flex gap-1.5 mt-2">
                  <span v-if="conv.unreadCount > 0" class="px-1.5 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold shadow-sm shadow-primary-500/30">
                    {{ conv.unreadCount }} new
                  </span>
                  <span v-if="conv.needsHandoff" class="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-medium flex items-center gap-1">
                    <AlertCircleIcon class="w-3 h-3" /> Humano
                  </span>
                  <span v-if="conv.assignedTo?._id === currentUserId" class="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                    Asignado a mí
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. CENTER: Chat Area -->
    <div v-if="selectedConversation" class="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <!-- Chat Header -->
      <div class="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm z-10">
        <div class="flex items-center gap-4">
          <div class="relative">
            <img 
              :src="selectedConversation.customer?.avatar || `https://ui-avatars.com/api/?name=${selectedConversation.customer?.name}&background=random`" 
              class="w-10 h-10 rounded-full object-cover"
            >
             <div 
              class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
              :class="getChannelColor(selectedConversation.channel?.type)"
            >
              <component :is="getChannelIcon(selectedConversation.channel?.type)" class="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h3 class="font-bold text-slate-900">{{ selectedConversation.customer?.name }}</h3>
            <div class="flex items-center gap-2 text-xs">
              <span class="w-2 h-2 rounded-full" :class="selectedConversation.aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'"></span>
              <span class="text-slate-500">{{ selectedConversation.aiEnabled ? 'IA Activa' : 'IA Pausada' }}</span>
              <span class="text-slate-300">|</span>
              <span class="text-slate-400 capitalize">{{ selectedConversation.channel?.type }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="toggleAI"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            :class="selectedConversation.aiEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
            title="Activar/Desactivar IA"
          >
            <BotIcon class="w-4 h-4 inline mr-1" />
            {{ selectedConversation.aiEnabled ? 'IA ON' : 'IA OFF' }}
          </button>
          <button class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <MoreVerticalIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div 
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div 
          v-for="(group, index) in messageGroups" 
          :key="index"
          class="space-y-4"
        >
          <!-- Date Divider -->
          <div class="flex justify-center">
            <span class="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {{ group.date }}
            </span>
          </div>

          <!-- Messages -->
          <div 
            v-for="msg in group.messages" 
            :key="msg._id"
            class="flex gap-3"
            :class="msg.senderType === 'customer' ? 'justify-start' : 'justify-end'"
          >
            <!-- Customer Avatar (only if customer) -->
            <img 
              v-if="msg.senderType === 'customer'"
              :src="selectedConversation.customer?.avatar || `https://ui-avatars.com/api/?name=${selectedConversation.customer?.name}`" 
              class="w-8 h-8 rounded-full self-end mb-1"
            >

            <!-- Message Bubble -->
            <div 
              class="max-w-[70%] space-y-1"
              :class="msg.senderType === 'customer' ? 'items-start' : 'items-end flex flex-col'"
            >
              <!-- Sender Name (small) -->
              <span v-if="msg.senderType === 'agent'" class="text-[10px] text-slate-400 px-1">
                {{ msg.sender?.name || 'Agente' }}
              </span>

              <!-- Bubble Box -->
              <div 
                class="px-4 py-3 rounded-2xl shadow-sm relative group"
                :class="[
                  msg.senderType === 'customer' 
                    ? 'bg-white text-slate-800 rounded-bl-none border border-slate-100' 
                    : (msg.senderType === 'ai' ? 'bg-gradient-to-br from-violet-500 to-primary-600 text-white rounded-br-none' : 'bg-primary-600 text-white rounded-br-none')
                ]"
              >
                <!-- AI Badge -->
                <div v-if="msg.senderType === 'ai'" class="flex items-center gap-1 mb-1 text-white/80 text-[10px]">
                  <SparklesIcon class="w-3 h-3" />
                  <span>IA Generativa</span>
                </div>

                <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ msg.content }}</p>
                
                <!-- Metadata: Time & Status -->
                <div 
                  class="flex items-center gap-1 justify-end mt-1"
                  :class="msg.senderType === 'customer' ? 'text-slate-400' : 'text-white/70'"
                >
                  <span class="text-[10px]">{{ formatTimeOnly(msg.sentAt) }}</span>
                  <component 
                    v-if="msg.senderType !== 'customer'"
                    :is="getStatusIcon(msg.status)" 
                    class="w-3 h-3"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="isTyping" class="flex items-center gap-2 text-slate-400 text-sm p-2">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
            <span class="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-100"></span>
            <span class="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-200"></span>
          </div>
          <span>Escribiendo...</span>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white border-t border-slate-200">
        <div v-if="!selectedConversation.aiEnabled" class="mb-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
          <AlertTriangleIcon class="w-3 h-3" />
          <span>La IA está desactivada. Estás respondiendo manualmente.</span>
        </div>

        <div class="flex items-end gap-3 max-w-4xl mx-auto">
          <button class="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <PaperclipIcon class="w-5 h-5" />
          </button>
          
          <div class="flex-1 relative">
            <textarea 
              v-model="newMessage"
              @keydown.enter.prevent="sendMessage"
              placeholder="Escribe un mensaje..."
              class="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none max-h-32 min-h-[50px] scrollbar-hide"
              rows="1"
            ></textarea>
            <button class="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600">
              <SmileIcon class="w-5 h-5" />
            </button>
          </div>

          <button 
            @click="sendMessage"
            class="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!newMessage.trim()"
          >
            <SendIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
      <div class="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
        <MessageSquareIcon class="w-10 h-10 text-slate-300" />
      </div>
      <h3 class="text-lg font-semibold text-slate-600">Selecciona una conversación</h3>
      <p class="text-sm mt-1">Elige un chat de la lista para ver los detalles</p>
    </div>

    <!-- 3. RIGHT SIDEBAR: Details Panel -->
    <div v-if="selectedConversation" class="w-80 bg-white border-l border-slate-200 overflow-y-auto hidden xl:block">
      <div class="p-6 text-center border-b border-slate-100">
        <img 
          :src="selectedConversation.customer?.avatar || `https://ui-avatars.com/api/?name=${selectedConversation.customer?.name}`" 
          class="w-20 h-20 rounded-full mx-auto mb-3 shadow-md"
        >
        <h3 class="font-bold text-slate-900 text-lg">{{ selectedConversation.customer?.name }}</h3>
        <p class="text-slate-500 text-sm">{{ selectedConversation.customer?.phone || selectedConversation.customer?.email }}</p>
        
        <div class="flex justify-center gap-2 mt-4">
          <button class="btn-secondary text-xs py-1.5 px-3">
            <UserIcon class="w-3.5 h-3.5 mr-1" />
            Perfil
          </button>
          <a :href="`tel:${selectedConversation.customer?.phone}`" class="btn-secondary text-xs py-1.5 px-3">
            <PhoneIcon class="w-3.5 h-3.5 mr-1" />
            Llamar
          </a>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Tags -->
        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Etiquetas</h4>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="tag in selectedConversation.customer?.tags" 
              :key="tag"
              class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
            >
              {{ tag }}
            </span>
            <button class="px-2 py-1 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs hover:border-primary-400 hover:text-primary-500 transition-colors">
              + Añadir
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Notas</h4>
            <button class="text-primary-600 hover:text-primary-700 text-xs font-medium">Editar</button>
          </div>
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-100 text-sm text-slate-600 leading-relaxed">
            {{ selectedConversation.customer?.notes || 'Sin notas agregadas.' }}
          </div>
        </div>

        <!-- Actions -->
        <div>
           <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Acciones</h4>
           <button class="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-700 mb-2">
             <span>Enviar a WhatsApp</span>
             <ExternalLinkIcon class="w-4 h-4 text-slate-400" />
           </button>
           <button class="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-700">
             <span>Crear pedido</span>
             <ShoppingBagIcon class="w-4 h-4 text-slate-400" />
           </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { 
  Search as SearchIcon, 
  Loader2 as LoaderIcon, 
  Inbox as InboxIcon,
  MessageSquare as MessageSquareIcon, 
  Send as SendIcon,
  Paperclip as PaperclipIcon,
  Smile as SmileIcon,
  MoreVertical as MoreVerticalIcon,
  Facebook as FacebookIcon,
  Smartphone as SmartphoneIcon,
  Sparkles as SparklesIcon,
  Bot as BotIcon,
  AlertCircle as AlertCircleIcon,
  Check as CheckIcon,
  CheckCheck as CheckCheckIcon,
  Clock as ClockIcon,
  User as UserIcon,
  Phone as PhoneIcon,
  ExternalLink as ExternalLinkIcon,
  ShoppingBag as ShoppingBagIcon,
  AlertTriangle as AlertTriangleIcon
} from 'lucide-vue-next'
import { onNewMessage, emitTyping, offEvent } from '@/services/socket'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const conversations = ref([])
const selectedId = ref(null)
const messages = ref([])
const newMessage = ref('')
const searchQuery = ref('')
const filter = ref('all')
const isTyping = ref(false)
const messagesContainer = ref(null)

// Computed
const currentUserId = computed(() => authStore.user?._id)

const selectedConversation = computed(() => 
  conversations.value.find(c => c._id === selectedId.value)
)

const filteredConversations = computed(() => {
  let list = conversations.value

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => 
      c.customer?.name?.toLowerCase().includes(q) ||
      c.lastMessage?.content?.toLowerCase().includes(q)
    )
  }

  // Filters
  if (filter.value === 'unread') {
    list = list.filter(c => c.unreadCount > 0)
  } else if (filter.value === 'handoff') {
    list = list.filter(c => c.needsHandoff)
  }

  return list
})

const messageGroups = computed(() => {
  const groups = []
  let currentDate = null
  let currentGroup = null

  messages.value.forEach(msg => {
    const date = format(new Date(msg.sentAt), 'yyyy-MM-dd')
    
    if (date !== currentDate) {
      currentDate = date
      let label = format(new Date(date), 'EEEE d MMMM', { locale: es })
      if (isToday(new Date(date))) label = 'Hoy'
      if (isYesterday(new Date(date))) label = 'Ayer'
      
      currentGroup = { date: label, messages: [] }
      groups.push(currentGroup)
    }
    
    currentGroup.messages.push(msg)
  })

  return groups
})

// Lifecycle
onMounted(async () => {
  await loadConversations()
  
  // Real-time updates
  onNewMessage((data) => {
    handleNewMessage(data)
  })

  if (route.params.id) {
    selectConversation({ _id: route.params.id })
  }
})

watch(() => route.params.id, (newId) => {
  if (newId && newId !== selectedId.value) {
    selectConversation({ _id: newId })
  }
})

// Methods
async function loadConversations() {
  loading.value = true
  try {
    const response = await api.get('/admin/conversations?limit=50')
    conversations.value = response.data.conversations
  } catch (error) {
    console.error('Error loading conversations:', error)
  } finally {
    loading.value = false
  }
}

async function selectConversation(conv) {
  if (!conv) return
  
  // Optimistic update
  selectedId.value = conv._id
  
  // Update URL without reload
  router.push(`/inbox/${conv._id}`)
  
  // Mark as read locally
  const index = conversations.value.findIndex(c => c._id === conv._id)
  if (index !== -1) {
    conversations.value[index].unreadCount = 0
  }

  try {
    // Load full details and messages
    const response = await api.get(`/admin/conversations/${conv._id}`)
    messages.value = response.data.messages
    
    // Update conversation details
    if (index !== -1) {
      conversations.value[index] = { ...conversations.value[index], ...response.data.conversation }
    }
    
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error loading conversation details:', error)
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedId.value) return

  const content = newMessage.value.trim()
  newMessage.value = ''
  
  // Optimistic add
  const optimisticMsg = {
    _id: Date.now(),
    content,
    senderType: 'agent',
    sender: { name: 'Tú' },
    sentAt: new Date(),
    status: 'sending'
  }
  messages.value.push(optimisticMsg)
  scrollToBottom()

  try {
    const response = await api.post(`/admin/conversations/${selectedId.value}/messages`, {
      content,
      type: 'text'
    })
    
    // Replace optimistic
    const index = messages.value.findIndex(m => m._id === optimisticMsg._id)
    if (index !== -1) {
      messages.value[index] = response.data.message
    }
  } catch (error) {
    console.error('Error sending message:', error)
    // Show error state on message
  }
}

async function toggleAI() {
  if (!selectedConversation.value) return
  
  const newState = !selectedConversation.value.aiEnabled
  
  try {
    await api.patch(`/admin/conversations/${selectedId.value}/ai`, {
      enabled: newState
    })
    
    // Update local state
    const conv = conversations.value.find(c => c._id === selectedId.value)
    if (conv) conv.aiEnabled = newState
    
  } catch (error) {
    console.error('Error toggling AI:', error)
  }
}

function handleNewMessage(data) {
  const { message, conversationId } = data
  
  // Update conversation list item
  const convIndex = conversations.value.findIndex(c => c._id === conversationId)
  if (convIndex !== -1) {
    const conv = conversations.value[convIndex]
    conv.lastMessage = message
    conv.lastMessageAt = message.sentAt
    
    // Increment unread if not currently selected
    if (selectedId.value !== conversationId) {
      conv.unreadCount = (conv.unreadCount || 0) + 1
    }
    
    // Move to top
    conversations.value.splice(convIndex, 1)
    conversations.value.unshift(conv)
  }
  
  // If actively viewing this conversation, add to messages list
  if (selectedId.value === conversationId) {
    messages.value.push(message)
    nextTick(() => scrollToBottom())
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Helpers
function getChannelIcon(type) {
  if (type === 'whatsapp') return SmartphoneIcon
  return FacebookIcon
}

function getChannelColor(type) {
  if (type === 'whatsapp') return 'bg-emerald-500'
  return 'bg-blue-600'
}

function getStatusIcon(status) {
  if (status === 'seen') return CheckCheckIcon
  if (status === 'delivered') return CheckIcon
  return ClockIcon
}

function formatTime(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

function formatTimeOnly(date) {
  if (!date) return ''
  return format(new Date(date), 'HH:mm')
}
</script>
