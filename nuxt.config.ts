// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    public: {
      apiBase: '/api'
    }
  },

  css: [
    '@/assets/css/main.css'
  ],

  app: {
    head: {
      title: 'Phantom - Minimalist Blog',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A minimalist blogging platform for markdown lovers' }
      ]
    }
  }
})
