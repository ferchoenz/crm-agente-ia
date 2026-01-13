<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div 
          class="modal-content animate-in"
          :style="{ width: sizeMap[size] }"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="flex items-center justify-between p-6 border-b border-surface-200">
            <slot name="header">
              <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            </slot>
            <button 
              v-if="closable"
              @click="close" 
              class="btn-icon hover:bg-surface-100"
            >
              <XIcon class="w-5 h-5 text-surface-500" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6" :class="bodyClass">
            <slot></slot>
          </div>
          
          <!-- Footer -->
          <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-6 border-t border-surface-200 bg-surface-50 rounded-b-2xl">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { X as XIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm, md, lg, xl, full
  closable: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true },
  bodyClass: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'close'])

const sizeMap = {
  sm: '400px',
  md: '500px',
  lg: '640px',
  xl: '800px',
  full: '95vw'
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleEscape(e) {
  if (e.key === 'Escape' && props.closeOnEscape && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.animate-in {
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
