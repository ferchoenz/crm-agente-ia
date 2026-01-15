<template>
  <div class="h-[calc(100vh-7rem)] flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl">
    <!-- Conversations List -->
    <div class="w-96 border-r border-slate-200 flex flex-col bg-slate-50">
      <!-- Header -->
      <div class="p-4 border-b border-slate-200 bg-white">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-slate-800">Conversaciones</h2>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">{{ conversations.length }} chats</span>
            <button @click="loadConversations" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <RefreshCwIcon class="w-4 h-4 text-slate-400" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
        </div>
        
        <!-- Search -->
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="search"
            type="text"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="Buscar por nombre o teléfono..."
          />
        </div>
      </div>
      
      <!-- Channel Filters -->
      <div class="flex items-center gap-2 p-3 border-b border-slate-200 bg-white overflow-x-auto">
        <button
          v-for="channel in channelFilters"
          :key="channel.value"
          @click="currentChannel = channel.value"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
          :class="currentChannel === channel.value 
            ? `${channel.activeClass} shadow-sm` 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          <component :is="channel.icon" class="w-3.5 h-3.5" />
          {{ channel.label }}
          <span class="opacity-70">({{ channel.count }})</span>
        </button>
      </div>

      <!-- Status Filters -->
      <div class="flex gap-1 p-2 border-b border-slate-100">
        <button
          v-for="filter in statusFilters"
          :key="filter.value"
          @click="currentFilter = filter.value"
          class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
          :class="currentFilter === filter.value 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-500 hover:bg-slate-100'"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto">
        <TransitionGroup name="list">
          <div
            v-for="conv in filteredConversations"
            :key="conv._id"
            @click="selectConversation(conv)"
            class="relative group cursor-pointer transition-all duration-200"
            :class="[
              selectedId === conv._id 
                ? 'bg-primary-50 border-l-4 border-l-primary-500' 
                : 'hover:bg-slate-100 border-l-4 border-l-transparent',
              conv.priority === 'high' ? 'bg-amber-50/50' : ''
            ]"
          >
            <!-- Channel Indicator Strip -->
            <div 
              class="absolute top-0 right-0 w-1 h-full"
              :class="getChannelColor(conv.channel?.type)"
            ></div>

            <div class="flex items-start gap-3 p-4">
              <!-- Avatar with channel badge -->
              <div class="relative flex-shrink-0">
                <div 
                  class="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  :class="getAvatarGradient(conv.channel?.type)"
                >
                  {{ getInitials(conv.customer?.name) }}
                </div>
                
                <!-- Channel Badge -->
                <div 
                  class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                  :class="getChannelBadge(conv.channel?.type)"
                >
                  <component :is="getChannelIcon(conv.channel?.type)" class="w-2.5 h-2.5" />
                </div>

                <!-- Unread Badge -->
                <div v-if="conv.unreadCount > 0" 
                     class="absolute -top-1 -left-1 min-w-5 h-5 px-1.5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md animate-pulse">
                  {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <!-- Name & Time -->
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-slate-800 truncate">
                    {{ conv.customer?.name || conv.customer?.phone || 'Cliente sin nombre' }}
                  </span>
                  <span class="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                    {{ formatTime(conv.lastMessageAt) }}
                  </span>
                </div>

                <!-- Last Message -->
                <p class="text-sm text-slate-500 truncate mb-2">
                  <span v-if="conv.lastMessage?.senderType === 'ai'" class="text-violet-500">✨ </span>
                  <span v-else-if="conv.lastMessage?.senderType === 'agent'" class="text-primary-500">👤 </span>
                  {{ conv.lastMessage?.content || 'Nueva conversación' }}
                </p>

                <!-- Tags Row -->
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- AI Status -->
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    :class="conv.aiEnabled 
                      ? 'bg-violet-100 text-violet-700' 
                      : 'bg-amber-100 text-amber-700'"
                  >
                    <SparklesIcon v-if="conv.aiEnabled" class="w-2.5 h-2.5" />
                    <UserIcon v-else class="w-2.5 h-2.5" />
                    {{ conv.aiEnabled ? 'IA Activa' : 'Manual' }}
                  </span>

                  <!-- Priority -->
                  <span v-if="conv.priority === 'high'" 
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
                    <AlertCircleIcon class="w-2.5 h-2.5" />
                    Urgente
                  </span>

                  <!-- Status -->
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                    :class="getStatusBadge(conv.status)"
                  >
                    {{ getStatusLabel(conv.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <!-- Empty state -->
        <div v-if="filteredConversations.length === 0 && !loading" class="p-8 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <InboxIcon class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-slate-500 font-medium">No hay conversaciones</p>
          <p class="text-sm text-slate-400 mt-1">Los mensajes nuevos aparecerán aquí</p>
        </div>
        
        <!-- Loading -->
        <div v-if="loading" class="p-8 text-center">
          <LoaderIcon class="w-8 h-8 mx-auto animate-spin text-primary-500" />
          <p class="text-sm text-slate-400 mt-2">Cargando...</p>
        </div>
      </div>
    </div>
    
    <!-- Chat Area -->
    <div class="flex-1 flex flex-col bg-slate-50">
      <template v-if="selectedConversation">
        <!-- Chat Header -->
        <div class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="relative">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                :class="getAvatarGradient(selectedConversation.channel?.type)"
              >
                {{ getInitials(selectedConversation.customer?.name) }}
              </div>
              <div 
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                :class="getChannelBadge(selectedConversation.channel?.type)"
              >
                <component :is="getChannelIcon(selectedConversation.channel?.type)" class="w-2 h-2" />
              </div>
            </div>

            <!-- Info -->
            <div>
              <h3 class="font-semibold text-slate-800">
                {{ selectedConversation.customer?.name || selectedConversation.customer?.phone }}
              </h3>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>{{ selectedConversation.customer?.phone }}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span class="capitalize">{{ selectedConversation.channel?.type || 'Desconocido' }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- AI Toggle -->
            <button 
              @click="toggleAI"
              class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm"
              :class="selectedConversation.aiEnabled 
                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              <SparklesIcon class="w-4 h-4" />
              {{ selectedConversation.aiEnabled ? 'IA Activa' : 'IA Pausada' }}
            </button>

            <!-- Customer Profile -->
            <RouterLink 
              :to="`/customers/${selectedConversation.customer?._id}`"
              class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Ver perfil del cliente"
            >
              <UserIcon class="w-5 h-5" />
            </RouterLink>

            <!-- More Options -->
            <button class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <MoreVerticalIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4">
          <!-- Date Separator -->
          <div class="flex items-center justify-center">
            <span class="px-3 py-1 bg-white rounded-full text-xs text-slate-400 shadow-sm">
              {{ formatDateHeader(messages[0]?.sentAt) }}
            </span>
          </div>

          <div
            v-for="(msg, index) in messages"
            :key="msg._id"
            class="flex"
            :class="msg.senderType === 'customer' ? 'justify-start' : 'justify-end'"
          >
            <div 
              class="max-w-[70%] rounded-2xl px-4 py-3 shadow-sm"
              :class="getMessageClass(msg)"
            >
              <!-- Sender label -->
              <div v-if="msg.senderType !== 'customer'" class="text-[10px] opacity-70 mb-1 font-medium flex items-center gap-1">
                <SparklesIcon v-if="msg.senderType === 'ai'" class="w-3 h-3" />
                {{ msg.senderType === 'ai' ? 'Asistente IA' : msg.sender?.name || 'Agente' }}
              </div>
              
              <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
              
              <div class="flex items-center justify-end gap-1.5 mt-2">
                <span class="text-[10px] opacity-50">{{ formatMessageTime(msg.sentAt) }}</span>
                <span v-if="msg.senderType !== 'customer'" class="text-[10px]">
                  {{ getStatusIcon(msg.status) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Typing indicator -->
          <div v-if="typingUsers.length > 0" class="flex justify-start">
            <div class="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
                <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Message Input -->
        <div class="border-t border-slate-200 p-4 bg-white">
          <form @submit.prevent="sendMessage" class="flex items-end gap-3">
            <button type="button" class="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <PaperclipIcon class="w-5 h-5" />
            </button>
            
            <div class="flex-1 relative">
              <textarea
                ref="messageInput"
                v-model="newMessage"
                @keydown.enter.exact.prevent="sendMessage"
                @input="handleTyping"
                class="w-full px-4 py-3 bg-slate-100 border-0 rounded-xl text-sm resize-none focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
                rows="1"
                placeholder="Escribe un mensaje..."
                :disabled="sending"
              ></textarea>
            </div>

            <button type="button" class="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <SmileIcon class="w-5 h-5" />
            </button>
            
            <button 
              type="submit" 
              class="p-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!newMessage.trim() || sending"
            >
              <SendIcon v-if="!sending" class="w-5 h-5" />
              <LoaderIcon v-else class="w-5 h-5 animate-spin" />
            </button>
          </form>
        </div>
      </template>
      
      <!-- No conversation selected -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center">
            <MessageSquareIcon class="w-12 h-12 text-primary-400" />
          </div>
          <h3 class="text-xl font-semibold text-slate-800 mb-2">Selecciona una conversación</h3>
          <p class="text-slate-500">Elige una conversación para ver los mensajes</p>
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
import api from '@/services/api'
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
  Smile as SmileIcon,
  RefreshCw as RefreshCwIcon,
  MoreVertical as MoreVerticalIcon,
  AlertCircle as AlertCircleIcon,
  Instagram as InstagramIcon
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
const currentChannel = ref('all')
const typingUsers = ref([])
const messagesContainer = ref(null)
const messageInput = ref(null)

const channelFilters = computed(() => [
  { 
    label: 'Todos', 
    value: 'all', 
    icon: MessageSquareIcon,
    count: conversations.value.length,
    activeClass: 'bg-slate-800 text-white'
  },
  { 
    label: 'WhatsApp', 
    value: 'whatsapp', 
    icon: PhoneIcon,
    count: conversations.value.filter(c => c.channel?.type === 'whatsapp').length,
    activeClass: 'bg-emerald-500 text-white'
  },
  { 
    label: 'Messenger', 
    value: 'messenger', 
    icon: MessageCircleIcon,
    count: conversations.value.filter(c => c.channel?.type === 'messenger').length,
    activeClass: 'bg-blue-500 text-white'
  },
  { 
    label: 'Instagram', 
    value: 'instagram', 
    icon: InstagramIcon,
    count: conversations.value.filter(c => c.channel?.type === 'instagram').length,
    activeClass: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
  }
])

const statusFilters = [
  { label: 'Todos', value: 'all' },
  { label: 'Abiertos', value: 'open' },
  { label: 'Con IA', value: 'ai' },
  { label: 'Urgentes', value: 'high' }
]

const filteredConversations = computed(() => {
  let result = conversations.value

  // Search filter
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c => 
      c.customer?.name?.toLowerCase().includes(q) ||
      c.customer?.phone?.includes(q)
    )
  }

  // Channel filter
  if (currentChannel.value !== 'all') {
    result = result.filter(c => c.channel?.type === currentChannel.value)
  }

  // Status filter
  if (currentFilter.value !== 'all') {
    switch (currentFilter.value) {
      case 'open':
        result = result.filter(c => c.status === 'open')
        break
      case 'ai':
        result = result.filter(c => c.aiEnabled)
        break
      case 'high':
        result = result.filter(c => c.priority === 'high')
        break
    }
  }

  return result
})

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
    if (data.conversationId !== selectedId.value) {
      conversations.value[idx].unreadCount = (conversations.value[idx].unreadCount || 0) + 1
    }
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

// UI Helpers
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarGradient(type) {
  switch (type) {
    case 'whatsapp': return 'bg-gradient-to-br from-emerald-400 to-teal-600'
    case 'messenger': return 'bg-gradient-to-br from-blue-400 to-blue-600'
    case 'instagram': return 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
    default: return 'bg-gradient-to-br from-slate-400 to-slate-600'
  }
}

function getChannelColor(type) {
  switch (type) {
    case 'whatsapp': return 'bg-emerald-500'
    case 'messenger': return 'bg-blue-500'
    case 'instagram': return 'bg-gradient-to-b from-purple-500 to-pink-500'
    default: return 'bg-slate-400'
  }
}

function getChannelBadge(type) {
  switch (type) {
    case 'whatsapp': return 'bg-emerald-500 text-white'
    case 'messenger': return 'bg-blue-500 text-white'
    case 'instagram': return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
    default: return 'bg-slate-400 text-white'
  }
}

function getChannelIcon(type) {
  switch (type) {
    case 'whatsapp': return PhoneIcon
    case 'messenger': return MessageCircleIcon
    case 'instagram': return InstagramIcon
    default: return MessageSquareIcon
  }
}

function getMessageClass(msg) {
  switch (msg.senderType) {
    case 'customer':
      return 'bg-white text-slate-800 border border-slate-100'
    case 'ai':
      return 'bg-gradient-to-br from-violet-500 to-primary-500 text-white'
    case 'agent':
      return 'bg-primary-500 text-white'
    default:
      return 'bg-white text-slate-800'
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'open': return 'bg-emerald-100 text-emerald-700'
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'closed': return 'bg-slate-100 text-slate-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'open': return 'Abierto'
    case 'pending': return 'Pendiente'
    case 'closed': return 'Cerrado'
    default: return status
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

function formatDateHeader(date) {
  if (!date) return 'Hoy'
  return format(new Date(date), "d 'de' MMMM", { locale: es })
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
