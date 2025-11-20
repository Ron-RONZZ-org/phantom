<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Check if custom theme exists and load it
onMounted(async () => {
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

  const loadSiteSettings = async () => {
    try {
      const response = await fetch('/api/settings/site')
      if (response.ok) {
        const data = await response.json()
        const settings = data.settings

        // Update page title
        if (settings.siteTitle) {
          document.title = settings.siteTitle
        }

        // Update favicon
        if (settings.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = settings.faviconUrl
        }

        // Inject header HTML
        if (settings.headerHtml) {
          const headerDiv = document.createElement('div')
          headerDiv.innerHTML = settings.headerHtml
          const scripts = headerDiv.querySelectorAll('script')
          scripts.forEach(script => {
            const newScript = document.createElement('script')
            if (script.src) {
              newScript.src = script.src
            } else {
              newScript.textContent = script.textContent
            }
            document.head.appendChild(newScript)
          })
          const links = headerDiv.querySelectorAll('link')
          links.forEach(link => {
            document.head.appendChild(link.cloneNode(true))
          })
        }

        // Inject footer HTML
        if (settings.footerHtml) {
          const footerDiv = document.createElement('div')
          footerDiv.innerHTML = settings.footerHtml
          document.body.insertAdjacentHTML('beforeend', settings.footerHtml)
        }
      }
    } catch (error) {
      console.error('Error loading site settings:', error)
    }
  }

  await checkCustomTheme()
  await loadSiteSettings()
})
</script>
