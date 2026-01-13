<template>
  <div 
    class="stat-card group cursor-pointer"
    :class="{ 'hover:border-primary-200': clickable }"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="stat-label mb-1">{{ label }}</p>
        <div class="flex items-baseline gap-2">
          <span class="stat-value">{{ formattedValue }}</span>
          <span v-if="suffix" class="text-sm text-surface-500">{{ suffix }}</span>
        </div>
        
        <!-- Trend indicator -->
        <div v-if="trend !== undefined" class="flex items-center gap-1 mt-2">
          <component 
            :is="trend >= 0 ? TrendingUpIcon : TrendingDownIcon"
            class="w-4 h-4"
            :class="trend >= 0 ? 'text-emerald-500' : 'text-rose-500'"
          />
          <span 
            class="text-xs font-medium"
            :class="trend >= 0 ? 'text-emerald-600' : 'text-rose-600'"
          >
            {{ trend >= 0 ? '+' : '' }}{{ trend }}%
          </span>
          <span class="text-xs text-surface-500">vs anterior</span>
        </div>
      </div>
      
      <!-- Icon -->
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
        :class="iconBgClass"
      >
        <component :is="icon" class="w-6 h-6" :class="iconClass" />
      </div>
    </div>
    
    <!-- Decorative gradient -->
    <div 
      class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none"
      :style="{ background: decorativeGradient }"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from 'lucide-vue-next'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  suffix: { type: String, default: '' },
  trend: { type: Number, default: undefined },
  icon: { type: [Object, Function], required: true },
  color: { type: String, default: 'primary' }, // primary, teal, amber, rose, violet
  format: { type: String, default: 'number' }, // number, currency, percent
  clickable: { type: Boolean, default: false }
})

defineEmits(['click'])

const colorMap = {
  primary: {
    bg: 'bg-primary-100',
    icon: 'text-primary-600',
    gradient: 'radial-gradient(circle, rgba(91, 124, 250, 0.3) 0%, transparent 70%)'
  },
  teal: {
    bg: 'bg-teal-100',
    icon: 'text-teal-600',
    gradient: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%)'
  },
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    gradient: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
  },
  rose: {
    bg: 'bg-rose-100',
    icon: 'text-rose-600',
    gradient: 'radial-gradient(circle, rgba(244, 63, 94, 0.3) 0%, transparent 70%)'
  },
  violet: {
    bg: 'bg-violet-100',
    icon: 'text-violet-600',
    gradient: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)'
  }
}

const iconBgClass = computed(() => colorMap[props.color]?.bg || colorMap.primary.bg)
const iconClass = computed(() => colorMap[props.color]?.icon || colorMap.primary.icon)
const decorativeGradient = computed(() => colorMap[props.color]?.gradient || colorMap.primary.gradient)

const formattedValue = computed(() => {
  const val = Number(props.value)
  
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val)
    case 'percent':
      return `${val}%`
    case 'compact':
      return new Intl.NumberFormat('es-MX', { notation: 'compact' }).format(val)
    default:
      return new Intl.NumberFormat('es-MX').format(val)
  }
})
</script>
