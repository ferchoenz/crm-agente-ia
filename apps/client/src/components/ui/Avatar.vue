<template>
  <div class="avatar" :class="[sizeClass, colorClass]">
    <img v-if="src" :src="src" :alt="name" class="w-full h-full object-cover rounded-full" />
    <span v-else>{{ initials }}</span>
    
    <!-- Status indicator -->
    <span 
      v-if="status" 
      class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
      :class="statusClass"
    ></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm, md, lg, xl
  color: { type: String, default: 'primary' }, // primary, teal, amber, rose, violet, gray
  status: { type: String, default: '' } // online, away, busy, offline
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  }
  return sizes[props.size] || sizes.md
})

const colorMap = {
  primary: 'bg-primary-500 text-white',
  teal: 'bg-teal-500 text-white',
  amber: 'bg-amber-500 text-white',
  rose: 'bg-rose-500 text-white',
  violet: 'bg-violet-500 text-white',
  gray: 'bg-gray-400 text-white'
}

const colorClass = computed(() => {
  if (props.src) return ''
  return colorMap[props.color] || colorMap.primary
})

const statusClass = computed(() => {
  const statuses = {
    online: 'status-online',
    away: 'status-away',
    busy: 'status-busy',
    offline: 'status-offline'
  }
  return statuses[props.status] || ''
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return props.name.slice(0, 2).toUpperCase()
})
</script>

<style scoped>
.avatar {
  position: relative;
}
</style>
