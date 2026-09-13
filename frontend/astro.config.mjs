// === Configuración Astro del periódico Corriente ===
// SSR con adaptador Node: cada request consulta la API de FastAPI, así los
// artículos publicados aparecen AL INSTANTE en el sitio (sin rebuilds).

import node from '@astrojs/node'
import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  // Dominio público (para canonical URLs y sitemap)
  site: process.env.PUBLIC_SITE_URL || 'https://corriente.com',
  output: 'server',   // SSR: datos siempre frescos desde la API
  integrations: [
    react(),   // Islands React (.jsx) solo para componentes interactivos
  ],
  adapter: node({
    mode: 'standalone',   // servidor node propio (nginx le hace proxy)
  }),
  vite: {
    // Dev: proxy del API para evitar problemas de CORS en desarrollo local
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  },
})
