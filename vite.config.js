import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three')
    }
  },
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
  publicDir: 'public',
  optimizeDeps: {
    include: ['@hello-pangea/dnd', 'three', '@react-three/fiber'],
    force: true
  }
})