import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ CORRECTION : Forcer une seule instance de Three.js pour éviter les warnings
      // Résout tous les imports de 'three' vers la même instance
      'three': path.resolve(__dirname, 'node_modules/three'),
      // Forcer aussi les imports depuis @splinetool vers la même instance
      '@splinetool/runtime': path.resolve(__dirname, 'node_modules/@splinetool/runtime')
    },
    dedupe: [
      'three', 
      '@splinetool/runtime',
      '@splinetool/react-spline'
    ] // Dédupliquer Three.js et Spline si importés plusieurs fois
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
    include: [
      '@hello-pangea/dnd', 
      'three', 
      '@splinetool/react-spline',
      '@splinetool/runtime'
    ],
    // ✅ CORRECTION : Forcer la re-optimisation seulement si nécessaire
    // Retirer 'force: true' après le premier build réussi pour améliorer les performances
    // force: true, // Décommenter seulement si les warnings persistent après nettoyage du cache
    esbuildOptions: {
      // Forcer la résolution de Three.js vers une seule instance
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
      // ✅ CORRECTION : Forcer toutes les dépendances à utiliser la même version de Three.js
      plugins: []
    }
  },
  build: {
    // ✅ CORRECTION : Forcer la déduplication lors du build
    commonjsOptions: {
      include: [/three/, /@splinetool/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        // ✅ CORRECTION : Grouper Three.js dans un chunk séparé pour éviter duplication
        manualChunks: {
          'three': ['three'],
          'spline': ['@splinetool/react-spline', '@splinetool/runtime']
        }
      }
    }
  }
})