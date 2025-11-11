import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api/garmin': {
        target: 'http://localhost:3031',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // S'assurer que le Service Worker est servi correctement
  publicDir: 'public'
})