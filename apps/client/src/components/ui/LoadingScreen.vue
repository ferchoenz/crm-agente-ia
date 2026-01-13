<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-screen">
      <div class="text-center">
        <!-- Animated Logo -->
        <div class="relative mb-8">
          <div class="w-20 h-20 mx-auto relative">
            <!-- Outer ring -->
            <div class="absolute inset-0 rounded-full border-4 border-surface-200"></div>
            <!-- Spinning gradient ring -->
            <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-400 animate-spin"></div>
            <!-- Inner glow -->
            <div class="absolute inset-2 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 animate-pulse opacity-80"></div>
            <!-- Center icon -->
            <div class="absolute inset-0 flex items-center justify-center">
              <ZapIcon class="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <!-- Pulse rings -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-20 h-20 rounded-full border-2 border-primary-300 animate-ping opacity-20"></div>
          </div>
        </div>
        
        <!-- Brand text -->
        <div class="mb-4">
          <h1 class="text-2xl font-bold gradient-text">CRM Agente IA</h1>
        </div>
        
        <!-- Loading message -->
        <p class="text-sm text-surface-600 mb-6">{{ message }}</p>
        
        <!-- Progress bar -->
        <div class="w-48 mx-auto">
          <div class="progress-bar">
            <div 
              class="progress-bar-fill" 
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Zap as ZapIcon } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: true },
  message: { type: String, default: 'Cargando...' },
  duration: { type: Number, default: 1500 }
})

const emit = defineEmits(['complete'])

const progress = ref(0)

onMounted(() => {
  if (props.visible) {
    animateProgress()
  }
})

watch(() => props.visible, (val) => {
  if (val) {
    progress.value = 0
    animateProgress()
  }
})

function animateProgress() {
  const interval = props.duration / 100
  let current = 0
  
  const timer = setInterval(() => {
    current += 1
    // Ease-out effect
    progress.value = Math.min(100, current + Math.sin(current / 15) * 5)
    
    if (current >= 100) {
      clearInterval(timer)
      setTimeout(() => emit('complete'), 300)
    }
  }, interval)
}
</script>

<style scoped>
.loading-screen {
  background: linear-gradient(135deg, #f8f9fc 0%, #e8ebf4 100%);
}

.gradient-text {
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
