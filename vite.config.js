import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  base: './', // Important pour Capacitor
  server: {
    host: '0.0.0.0', // Pour permettre l'accès depuis le téléphone
    port: 5173
  },
  // Configuration PWA optimisée
  define: {
    'process.env': {},
    '__SW_ENABLED__': true
  },
  // Headers pour PWA
  preview: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/'
    }
  }
})
