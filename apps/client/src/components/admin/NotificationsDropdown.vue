<template>
  <div class="relative">
    <button 
      class="relative p-2 hover:bg-slate-100 rounded-xl transition-colors"
      :class="{ 'bg-slate-100': isOpen }"
      @click="toggleDropdown"
    >
      <BellIcon class="w-5 h-5 text-slate-600" />
      <span v-if="unreadCount > 0" class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-semibold text-slate-800">Notificaciones</h3>
          <button 
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Marcar leídas
          </button>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <div v-if="notifications.length === 0" class="p-8 text-center text-slate-500">
            <BellOffIcon class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p class="text-xs">No tienes notificaciones</p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              :class="{ 'bg-primary-50/50': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" :class="getTypeColor(notification.type)">
                  <component :is="getTypeIcon(notification.type)" class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-800">{{ notification.title }}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">{{ notification.message }}</p>
                  <p class="text-[10px] text-slate-400 mt-2">{{ formatTime(notification.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Backdrop to close -->
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-transparent" @click="isOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Bell as BellIcon, 
  BellOff as BellOffIcon,
  MessageCircle as MessageIcon,
  UserPlus as UserIcon,
  AlertCircle as AlertIcon
} from 'lucide-vue-next'
import { onNotification } from '@/services/socket'

const router = useRouter()
const isOpen = ref(false)
const notifications = ref([])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

onMounted(() => {
  // Listen for real notifications
  onNotification((notification) => {
    notifications.value.unshift({
      id: Date.now(),
      ...notification,
      read: false,
      createdAt: new Date()
    })
  })
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function markAllAsRead() {
  notifications.value.forEach(n => n.read = true)
}

function handleNotificationClick(notification) {
  notification.read = true
  isOpen.value = false
  
  if (notification.data?.conversationId) {
    router.push(`/inbox/${notification.data.conversationId}`)
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'handoff': return AlertIcon
    case 'assignment': return MessageIcon
    default: return BellIcon
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'handoff': return 'bg-rose-100 text-rose-600'
    case 'assignment': return 'bg-blue-100 text-blue-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

function formatTime(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
</script>
