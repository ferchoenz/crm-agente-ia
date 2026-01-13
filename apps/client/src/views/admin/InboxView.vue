<template>
  <div class="h-[calc(100vh-7rem)] flex rounded-2xl overflow-hidden border border-surface-200 bg-white">
    <!-- Conversations List -->
    <div class="w-80 border-r border-surface-200 flex flex-col bg-surface-50">
      <!-- Search -->
      <div class="p-4 border-b border-surface-200">
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            v-model="search"
            type="text"
            class="input pl-10 bg-white"
            placeholder="Buscar conversaciones..."
            @input="debouncedSearch"
          />
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex gap-1 p-3 border-b border-surface-200">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="currentFilter = filter.value"
          class="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
          :class="currentFilter === filter.value 
            ? 'bg-primary-500 text-white shadow-sm' 
            : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'"
        >
          {{ filter.label }}
          <span v-if="filter.count" class="ml-1 opacity-80">({{ filter.count }})</span>
        </button>
      </div>
      
      <!-- Conversations -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="conv in filteredConversations"
          :key="conv._id"
          @click="selectConversation(conv)"
          class="flex items-start gap-3 p-4 border-b border-surface-100 cursor-pointer transition-all"
          :class="selectedId === conv._id 
            ? 'bg-primary-50 border-l-4 border-l-primary-500' 
            : 'hover:bg-surface-100'"
        >
          <div class="relative flex-shrink-0">
            <Avatar :name="conv.customer?.name" :color="conv.channel?.type === 'whatsapp' ? 'teal' : 'primary'" />
            <div v-if="conv.unreadCount > 0" 
                 class="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
              {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-900 truncate">
                {{ conv.customer?.name || conv.customer?.phone || 'Sin nombre' }}
              </span>
              <span class="text-xs text-surface-400">{{ formatTime(conv.lastMessageAt) }}</span>
            </div>
            <p class="text-sm text-surface-500 truncate mt-0.5">
              {{ conv.lastMessage?.content || 'Sin mensajes' }}
            </p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="badge text-[10px]" :class="conv.aiEnabled ? 'badge-info' : 'badge-warning'">
                {{ conv.aiEnabled ? '✨ IA' : '👤 Manual' }}
              </span>
              <span class="text-[10px] text-surface-400 flex items-center gap-1">
                <component :is="conv.channel?.type === 'whatsapp' ? PhoneIcon : MessageCircleIcon" class="w-3 h-3" />
                {{ conv.channel?.type === 'whatsapp' ? 'WhatsApp' : 'Messenger' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="conversations.length === 0 && !loading" class="p-8 text-center">
          <InboxIcon class="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <p class="text-surface-500">No hay conversaciones</p>
        </div>
        
        <!-- Loading -->
        <div v-if="loading" class="p-8 text-center">
          <LoaderIcon class="w-8 h-8 mx-auto animate-spin text-primary-500" />
        </div>
      </div>
    </div>
    
    <!-- Chat Area -->
    <div class="flex-1 flex flex-col bg-white">
      <template v-if="selectedConversation">
        <!-- Chat Header -->
        <div class="h-16 border-b border-surface-200 flex items-center justify-between px-6">
          <div class="flex items-center gap-3">
            <Avatar 
              :name="selectedConversation.customer?.name" 
              :color="selectedConversation.channel?.type === 'whatsapp' ? 'teal' : 'primary'" 
              size="md"
            />
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ selectedConversation.customer?.name || selectedConversation.customer?.phone }}
              </h3>
              <p class="text-xs text-surface-500">{{ selectedConversation.customer?.phone }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              @click="toggleAI"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
              :class="selectedConversation.aiEnabled 
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'"
            >
              <SparklesIcon class="w-4 h-4" />
              <span class="text-sm font-medium">{{ selectedConversation.aiEnabled ? 'IA Activa' : 'IA Pausada' }}</span>
            </button>
            
            <RouterLink 
              :to="`/customers/${selectedConversation.customer?._id}`"
              class="btn-icon btn-ghost"
            >
              <UserIcon class="w-5 h-5" />
            </RouterLink>
          </div>
        </div>
        
        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-surface-50 to-white">
          <div
            v-for="msg in messages"
            :key="msg._id"
            class="flex"
            :class="msg.senderType === 'customer' ? 'justify-start' : 'justify-end'"
          >
            <div 
              class="max-w-[70%] rounded-2xl px-4 py-3 shadow-sm"
              :class="getMessageClass(msg)"
            >
              <div v-if="msg.senderType !== 'customer'" class="text-[10px] opacity-60 mb-1 font-medium">
                {{ msg.senderType === 'ai' ? '✨ Asistente IA' : msg.sender?.name || 'Agente' }}
              </div>
              
              <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
              
              <div class="flex items-center justify-end gap-1.5 mt-1.5">
                <span class="text-[10px] opacity-50">{{ formatMessageTime(msg.sentAt) }}</span>
                <span v-if="msg.senderType !== 'customer'" class="text-[10px]">
                  {{ getStatusIcon(msg.status) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Typing indicator -->
          <div v-if="typingUsers.length > 0" class="flex justify-start">
            <div class="bg-surface-100 rounded-2xl px-4 py-3 shadow-sm">
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 bg-surface-400 rounded-full animate-bounce"></span>
                <span class="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
                <span class="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Message Input -->
        <div class="border-t border-surface-200 p-4 bg-white">
          <form @submit.prevent="sendMessage" class="flex items-end gap-3">
            <button type="button" class="btn-icon btn-ghost">
              <PaperclipIcon class="w-5 h-5" />
            </button>
            <div class="flex-1 relative">
              <textarea
                ref="messageInput"
                v-model="newMessage"
                @keydown.enter.exact.prevent="sendMessage"
                @input="handleTyping"
                class="input resize-none pr-12"
                rows="1"
                placeholder="Escribe un mensaje..."
                :disabled="sending"
              ></textarea>
              <button type="button" class="absolute right-3 bottom-3 text-surface-400 hover:text-surface-600">
                <SmileIcon class="w-5 h-5" />
              </button>
            </div>
            <button 
              type="submit" 
              class="btn-primary"
              :disabled="!newMessage.trim() || sending"
            >
              <SendIcon v-if="!sending" class="w-5 h-5" />
              <LoaderIcon v-else class="w-5 h-5 animate-spin" />
            </button>
          </form>
        </div>
      </template>
      
      <!-- No conversation selected -->
      <div v-else class="flex-1 flex items-center justify-center bg-gradient-to-b from-surface-50 to-white">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-100 flex items-center justify-center">
            <MessageSquareIcon class="w-10 h-10 text-surface-300" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Selecciona una conversación</h3>
          <p class="text-surface-500">O espera a que lleguen nuevos mensajes</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDebounceFn } from '@vueuse/core'
import api from '@/services/api'
import Avatar from '@/components/ui/Avatar.vue'
import {
  initSocket,
  joinConversation,
  leaveConversation,
  sendMessage as socketSendMessage,
  sendTyping,
  toggleAI as socketToggleAI,
  onNewMessage,
  onConversationUpdated,
  onTypingUpdate,
  onAIToggled,
  offEvent
} from '@/services/socket'
import {
  Search as SearchIcon,
  Inbox as InboxIcon,
  MessageSquare as MessageSquareIcon,
  Send as SendIcon,
  Sparkles as SparklesIcon,
  User as UserIcon,
  Loader2 as LoaderIcon,
  Phone as PhoneIcon,
  MessageCircle as MessageCircleIcon,
  Paperclip as PaperclipIcon,
  Smile as SmileIcon
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const sending = ref(false)
const conversations = ref([])
const selectedId = ref(null)
const selectedConversation = ref(null)
const messages = ref([])
const newMessage = ref('')
const search = ref('')
const currentFilter = ref('all')
const typingUsers = ref([])
const messagesContainer = ref(null)
const messageInput = ref(null)

const filters = computed(() => [
  { label: 'Todos', value: 'all', count: conversations.value.length },
  { label: 'Abiertos', value: 'open', count: conversations.value.filter(c => c.status === 'open').length },
  { label: 'IA', value: 'ai', count: conversations.value.filter(c => c.aiEnabled).length }
])

const filteredConversations = computed(() => {
  let result = conversations.value

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c => 
      c.customer?.name?.toLowerCase().includes(q) ||
      c.customer?.phone?.includes(q)
    )
  }

  if (currentFilter.value !== 'all') {
    switch (currentFilter.value) {
      case 'open':
        result = result.filter(c => c.status === 'open')
        break
      case 'ai':
        result = result.filter(c => c.aiEnabled)
        break
    }
  }

  return result
})

const debouncedSearch = useDebounceFn(() => {}, 300)

onMounted(async () => {
  initSocket()
  await loadConversations()

  onNewMessage(handleNewMessage)
  onConversationUpdated(handleConversationUpdated)
  onTypingUpdate(handleTypingUpdate)
  onAIToggled(handleAIToggled)

  if (route.params.id) {
    selectedId.value = route.params.id
    await loadMessages(route.params.id)
  }
})

onUnmounted(() => {
  if (selectedId.value) {
    leaveConversation(selectedId.value)
  }
  offEvent('message:new', handleNewMessage)
  offEvent('conversation:updated', handleConversationUpdated)
  offEvent('typing:update', handleTypingUpdate)
  offEvent('ai:toggled', handleAIToggled)
})

async function loadConversations() {
  loading.value = true
  try {
    const response = await api.get('/admin/conversations?limit=50')
    conversations.value = response.data.conversations
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loading.value = false
  }
}

async function selectConversation(conv) {
  if (selectedId.value) {
    leaveConversation(selectedId.value)
  }

  selectedId.value = conv._id
  selectedConversation.value = conv
  
  joinConversation(conv._id)
  await loadMessages(conv._id)
  
  router.replace(`/inbox/${conv._id}`)
  
  nextTick(() => {
    scrollToBottom()
    messageInput.value?.focus()
  })
}

async function loadMessages(conversationId) {
  try {
    const response = await api.get(`/admin/conversations/${conversationId}`)
    selectedConversation.value = response.data.conversation
    messages.value = response.data.messages
    nextTick(scrollToBottom)
  } catch (error) {
    console.error('Failed to load messages:', error)
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return

  sending.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''

  try {
    await socketSendMessage(selectedId.value, content)
  } catch (error) {
    console.error('Failed to send message:', error)
    newMessage.value = content
  } finally {
    sending.value = false
  }
}

let typingTimeout = null
function handleTyping() {
  sendTyping(selectedId.value, true)
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    sendTyping(selectedId.value, false)
  }, 2000)
}

async function toggleAI() {
  if (!selectedConversation.value) return
  const newState = !selectedConversation.value.aiEnabled
  socketToggleAI(selectedId.value, newState)
  selectedConversation.value.aiEnabled = newState
}

function handleNewMessage(data) {
  if (data.conversationId === selectedId.value) {
    messages.value.push(data.message)
    nextTick(scrollToBottom)
  }

  const idx = conversations.value.findIndex(c => c._id === data.conversationId)
  if (idx >= 0) {
    conversations.value[idx].lastMessage = data.message
    conversations.value[idx].lastMessageAt = new Date()
    const conv = conversations.value.splice(idx, 1)[0]
    conversations.value.unshift(conv)
  }
}

function handleConversationUpdated(data) {
  const idx = conversations.value.findIndex(c => c._id === data.conversationId)
  if (idx >= 0) {
    conversations.value[idx].lastMessage = data.lastMessage
    conversations.value[idx].lastMessageAt = new Date()
  }
}

function handleTypingUpdate(data) {
  if (data.conversationId !== selectedId.value) return
  
  if (data.isTyping) {
    if (!typingUsers.value.find(u => u.id === data.user.id)) {
      typingUsers.value.push(data.user)
    }
  } else {
    typingUsers.value = typingUsers.value.filter(u => u.id !== data.user.id)
  }
}

function handleAIToggled(data) {
  if (data.conversationId === selectedId.value) {
    selectedConversation.value.aiEnabled = data.enabled
  }
  
  const idx = conversations.value.findIndex(c => c._id === data.conversationId)
  if (idx >= 0) {
    conversations.value[idx].aiEnabled = data.enabled
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function getMessageClass(msg) {
  switch (msg.senderType) {
    case 'customer':
      return 'bg-surface-100 text-gray-900'
    case 'ai':
      return 'bg-gradient-to-br from-violet-500 to-primary-500 text-white'
    case 'agent':
      return 'bg-primary-500 text-white'
    default:
      return 'bg-surface-100 text-gray-900'
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'sent': return '✓'
    case 'delivered': return '✓✓'
    case 'read': return '✓✓'
    case 'failed': return '⚠️'
    default: return '⏳'
  }
}

function formatTime(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

function formatMessageTime(date) {
  if (!date) return ''
  return format(new Date(date), 'HH:mm')
}
</script>
