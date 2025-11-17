<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Check if custom theme exists and load it
onMounted(() => {
  const checkCustomTheme = async () => {
    try {
      const response = await fetch('/custom-theme.css')
      if (response.ok) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = '/custom-theme.css'
        document.head.appendChild(link)
      }
    } catch {
      // No custom theme, use default
    }
  }
  checkCustomTheme()
})
</script>
