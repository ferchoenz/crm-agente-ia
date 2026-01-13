import { io } from 'socket.io-client'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

let socket = null
const connected = ref(false)
const connecting = ref(false)

/**
 * Initialize socket connection
 */
export function initSocket() {
    if (socket?.connected) return socket

    const authStore = useAuthStore()

    if (!authStore.token) {
        console.warn('Cannot connect socket: no auth token')
        return null
    }

    connecting.value = true

    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
            token: authStore.token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    })

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id)
        connected.value = true
        connecting.value = false
    })

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        connected.value = false
    })

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        connecting.value = false
    })

    socket.on('error', (error) => {
        console.error('Socket error:', error)
    })

    return socket
}

/**
 * Get socket instance
 */
export function getSocket() {
    return socket
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
        connected.value = false
    }
}

/**
 * Check if connected
 */
export function useSocketStatus() {
    return {
        connected,
        connecting
    }
}

/**
 * Join a conversation room
 */
export function joinConversation(conversationId) {
    if (socket?.connected) {
        socket.emit('join:conversation', conversationId)
    }
}

/**
 * Leave a conversation room
 */
export function leaveConversation(conversationId) {
    if (socket?.connected) {
        socket.emit('leave:conversation', conversationId)
    }
}

/**
 * Send a message
 */
export function sendMessage(conversationId, content, type = 'text') {
    return new Promise((resolve, reject) => {
        if (!socket?.connected) {
            reject(new Error('Socket not connected'))
            return
        }

        socket.emit('message:send', { conversationId, content, type })

        // Wait for confirmation
        const timeout = setTimeout(() => {
            reject(new Error('Message send timeout'))
        }, 10000)

        socket.once('message:sent', (data) => {
            clearTimeout(timeout)
            resolve(data)
        })

        socket.once('error', (error) => {
            clearTimeout(timeout)
            reject(new Error(error.message))
        })
    })
}

/**
 * Send typing indicator
 */
export function sendTyping(conversationId, isTyping) {
    if (socket?.connected) {
        socket.emit(isTyping ? 'typing:start' : 'typing:stop', conversationId)
    }
}

/**
 * Toggle AI for conversation
 */
export function toggleAI(conversationId, enabled) {
    if (socket?.connected) {
        socket.emit('ai:toggle', { conversationId, enabled })
    }
}

/**
 * Assign conversation to user
 */
export function assignConversation(conversationId, userId) {
    if (socket?.connected) {
        socket.emit('conversation:assign', { conversationId, userId })
    }
}

/**
 * Listen for new messages
 */
export function onNewMessage(callback) {
    if (socket) {
        socket.on('message:new', callback)
    }
}

/**
 * Listen for conversation updates
 */
export function onConversationUpdated(callback) {
    if (socket) {
        socket.on('conversation:updated', callback)
    }
}

/**
 * Listen for typing updates
 */
export function onTypingUpdate(callback) {
    if (socket) {
        socket.on('typing:update', callback)
    }
}

/**
 * Listen for AI toggle
 */
export function onAIToggled(callback) {
    if (socket) {
        socket.on('ai:toggled', callback)
    }
}

/**
 * Listen for notifications
 */
export function onNotification(callback) {
    if (socket) {
        socket.on('notification', callback)
    }
}

/**
 * Remove listener
 */
export function offEvent(event, callback) {
    if (socket) {
        socket.off(event, callback)
    }
}
