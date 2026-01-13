<template>
  <div class="min-h-screen bg-dark-950">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

onMounted(async () => {
  // Try to restore session from localStorage
  await authStore.checkAuth()
})
</script>
