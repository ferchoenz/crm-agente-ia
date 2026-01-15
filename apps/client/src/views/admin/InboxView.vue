<template>
  <div class="h-[calc(100vh-140px)] flex gap-4">
    <!-- Lista de Conversaciones -->
    <div class="w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
      <!-- Header -->
      <div class="p-4 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-800">Conversaciones</h2>
        
        <!-- Filtros -->
        <div class="mt-3 flex gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="currentFilter = filter.value"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            :class="currentFilter === filter.value 
              ? 'bg-primary-500 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="p-8 text-center">
          <LoaderIcon class="w-6 h-6 mx-auto animate-spin text-primary-500" />
        </div>

        <div v-else-if="filteredConversations.length === 0" class="p-8 text-center">
          <MessageSquareIcon class="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p class="text-slate-500 text-sm">No hay conversaciones</p>
        </div>

        <div v-else>
          <div
            v-for="conv in filteredConversations"
            :key="conv._id"
            @click="selectConversation(conv)"
            class="p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50"
            :class="{ 'bg-primary-50 border-l-4 border-l-primary-500': selectedConv?._id === conv._id }"
          >
            <div class="flex items-start gap-3">
              <!-- Avatar con Badge de Canal -->
              <div class="relative flex-shrink-0">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold">
                  {{ conv.customer?.name?.[0]?.toUpperCase() || '?' }}
                </div>
                <!-- Channel Badge -->
                <div 
                  class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  :class="getChannelBadgeClass(conv.channel?.type)"
                >
                  <component :is="getChannelIcon(conv.channel?.type)" class="w-3 h-3 text-white" />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="font-medium text-slate-800 truncate">
                    {{ conv.customer?.name || 'Sin nombre' }}
                  </h4>
                  <span class="text-xs text-slate-400 flex-shrink-0 ml-2">
                    {{ formatTime(conv.lastMessage?.sentAt) }}
                  </span>
                </div>

                <p class="text-sm text-slate-500 truncate mb-1">
                  {{ conv.lastMessage?.content || 'Sin mensajes' }}
                </p>

                <div class="flex items-center gap-2">
                  <!-- AI Status -->
                  <span 
                    v-if="conv.aiEnabled"
                    class="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700"
                  >
                    🤖 IA activa
                  </span>
                  <span 
                    v-else
                    class="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
                  >
                    👤 Modo manual
                  </span>

                  <!-- Unread Badge -->
                  <span v-if="conv.unreadCount > 0" class="ml-auto px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-medium">
                    {{ conv.unreadCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
      <!-- Chat Header -->
      <div v-if="selectedConv" class="p-4 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold">
            {{ selectedConv.customer?.name?.[0]?.toUpperCase() || '?' }}
          </div>
          <div>
            <h3 class="font-semibold text-slate-800">{{ selectedConv.customer?.name || 'Sin nombre' }}</h3>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <component :is="getChannelIcon(selectedConv.channel?.type)" class="w-3 h-3" />
              <span>{{ getChannelName(selectedConv.channel?.type) }}</span>
              <span v-if="selectedConv.customer?.phone">• {{ selectedConv.customer.phone }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Toggle AI -->
          <button
            @click="toggleAI"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            :class="selectedConv.aiEnabled 
              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            {{ selectedConv.aiEnabled ? '🤖 Pausar IA' : '▶️ Activar IA' }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="selectedConv" ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        <div v-if="loadingMessages" class="flex items-center justify-center h-full">
          <LoaderIcon class="w-6 h-6 animate-spin text-primary-500" />
        </div>

        <div v-else-if="messages.length === 0" class="flex items-center justify-center h-full">
          <p class="text-slate-400">No hay mensajes aún</p>
        </div>

        <div v-else v-for="msg in messages" :key="msg._id">
          <!-- Message Bubble -->
          <div :class="msg.senderType === 'customer' ? 'flex justify-start' : 'flex justify-end'">
            <div 
              class="max-w-[70%] rounded-2xl px-4 py-2"
              :class="msg.senderType === 'customer' 
                ? 'bg-white border border-slate-200' 
                : msg.senderType === 'ai'
                ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white'
                : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'"
            >
              <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span 
                  class="text-xs"
                  :class="msg.senderType === 'customer' ? 'text-slate-400' : 'text-white/70'"
                >
                  {{ formatTime(msg.sentAt) }}
                </span>
                <span v-if="msg.senderType === 'ai'" class="text-xs text-white/70">• IA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 flex items-center justify-center bg-slate-50">
        <div class="text-center">
          <MessageSquareIcon class="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 class="text-lg font-medium text-slate-600">Selecciona una conversación</h3>
          <p class="text-sm text-slate-400 mt-1">Elige una conversación para ver los mensajes</p>
        </div>
      </div>

      <!-- Input Area -->
      <div v-if="selectedConv" class="p-4 border-t border-slate-200">
        <div class="flex gap-2">
          <input
            v-model="newMessage"
            @keypress.enter="sendMessage"
            type="text"
            placeholder="Escribe un mensaje..."
            class="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          <button
            @click="sendMessage"
            :disabled="!newMessage.trim() || sending"
            class="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <SendIcon v-if="!sending" class="w-5 h-5" />
            <LoaderIcon v-else class="w-5 h-5 animate-spin" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import socket from '@/services/socket'
import {
  MessageSquare as MessageSquareIcon,
  Loader2 as LoaderIcon,
  Send as SendIcon,
  MessageCircle as WhatsAppIcon,
  Send as MessengerIcon,
  Instagram as InstagramIcon
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const conversations = ref([])
const messages = ref([])
const selectedConv = ref(null)
const newMessage = ref('')
const currentFilter = ref('all')
const messagesContainer = ref(null)

const filters = [
  { label: 'Todas', value: 'all' },
  { label: 'No leídas', value: 'unread' },
  { label: 'IA activa', value: 'ai' },
  { label: 'Manual', value: 'manual' }
]

const filteredConversations = computed(() => {
  let filtered = conversations.value

  if (currentFilter.value === 'unread') {
    filtered = filtered.filter(c => c.unreadCount > 0)
  } else if (currentFilter.value === 'ai') {
    filtered = filtered.filter(c => c.aiEnabled)
  } else if (currentFilter.value === 'manual') {
    filtered = filtered.filter(c => !c.aiEnabled)
  }

  return filtered
})

onMounted(async () => {
  await loadConversations()
  
  // Si hay ID en ruta, seleccionar esa conversación
  if (route.params.id) {
    const conv = conversations.value.find(c => c._id === route.params.id)
    if (conv) {
      await selectConversation(conv)
    }
  }

  // Listen for socket events
  socket.on('message:new', handleNewMessage)
  socket.on('conversation:updated', handleConversationUpdate)
})

async function loadConversations() {
  loading.value = true
  try {
    const response = await api.get('/admin/conversations', {
      params: { limit: 100, status: 'open,pending' }
    })
    conversations.value = response.data.conversations
  } catch (error) {
    console.error('Error loading conversations:', error)
  } finally {
    loading.value = false
  }
}

async function selectConversation(conv) {
  selectedConv.value = conv
  router.push(`/inbox/${conv._id}`)
  
  await loadMessages(conv._id)
  
  // Join conversation room
  socket.emit('join:conversation', conv._id)
}

async function loadMessages(conversationId) {
  loadingMessages.value = true
  try {
    const response = await api.get(`/admin/conversations/${conversationId}`)
    messages.value = response.data.messages
    
    // Scroll to bottom
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  } catch (error) {
    console.error('Error loading messages:', error)
  } finally {
    loadingMessages.value = false
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedConv.value) return

  sending.value = true
  try {
    socket.emit('message:send', {
      conversationId: selectedConv.value._id,
      content: newMessage.value.trim()
    })
    
    newMessage.value = ''
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    sending.value = false
  }
}

async function toggleAI() {
  if (!selectedConv.value) return

  try {
    socket.emit('ai:toggle', {
      conversationId: selectedConv.value._id,
      enabled: !selectedConv.value.aiEnabled
    })
    
    selectedConv.value.aiEnabled = !selectedConv.value.aiEnabled
  } catch (error) {
    console.error('Error toggling AI:', error)
  }
}

function handleNewMessage(data) {
  if (selectedConv.value?._id === data.conversationId) {
    messages.value.push(data.message)
    
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }

  // Update conversation in list
  const conv = conversations.value.find(c => c._id === data.conversationId)
  if (conv) {
    conv.lastMessage = data.message
  }
}

function handleConversationUpdate(data) {
  const conv = conversations.value.find(c => c._id === data.conversationId)
  if (conv && data.lastMessage) {
    conv.lastMessage = data.lastMessage
  }
}

function getChannelIcon(type) {
  switch (type) {
    case 'whatsapp': return WhatsAppIcon
    case 'messenger': return MessengerIcon
    case 'instagram': return InstagramIcon
    default: return MessageSquareIcon
  }
}

function getChannelName(type) {
  switch (type) {
    case 'whatsapp': return 'WhatsApp'
    case 'messenger': return 'Messenger'
    case 'instagram': return 'Instagram'
    default: return 'Desconocido'
  }
}

function getChannelBadgeClass(type) {
  switch (type) {
    case 'whatsapp': return 'bg-emerald-500'
    case 'messenger': return 'bg-blue-500'
    case 'instagram': return 'bg-gradient-to-br from-purple-500 to-pink-500'
    default: return 'bg-slate-400'
  }
}

function formatTime(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
