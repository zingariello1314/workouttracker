import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Forcer une seule instance de Three.js pour éviter les warnings
      three: path.resolve('./node_modules/three')
    },
    dedupe: ['three'] // Dédupliquer Three.js si importé plusieurs fois
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
    include: ['@hello-pangea/dnd', 'three', '@react-three/fiber', '@splinetool/react-spline'],
    exclude: [], // Ne pas exclure three pour forcer la déduplication
    esbuildOptions: {
      // Forcer la résolution de Three.js vers une seule instance
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx']
    }
  }
})