// === Configuración Vite del panel admin de Corriente ===
// SPA en JavaScript puro (JSX), sin TypeScript.

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Puerto de la API: variable de entorno o 8000 por defecto.
// dev.mjs lo inyecta automáticamente si el 8000 está ocupado.
const PUERTO_API = process.env.DEV_API_PORT || 8000

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // En producción nginx sirve el panel bajo /admin/; en dev queda en /
  base: mode === 'production' ? '/admin/' : '/',
  server: {
    port: 5173,
    // Proxy para desarrollo: las llamadas a /api van al backend FastAPI
    proxy: {
      '/api': {
        target: `http://localhost:${PUERTO_API}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
}))
