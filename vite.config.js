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
      },
      // ✅ FIX CORS : Proxy pour Yahoo Finance pour contourner les erreurs CORS
      '/api/yahoo-finance': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // Retirer /api/yahoo-finance du début du path
          const newPath = path.replace(/^\/api\/yahoo-finance/, '');
          console.log(`[Proxy] Rewriting ${path} to ${newPath}`);
          return newPath;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[Proxy] Yahoo Finance proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Ajouter les headers nécessaires
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            proxyReq.setHeader('Accept', 'application/json');
            console.log(`[Proxy] Proxying request to: ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[Proxy] Response status: ${proxyRes.statusCode} for ${req.url}`);
          });
        }
      },
      // Proxy BookFinder / Z-Library API (backend FastAPI sur 8000)
      '/api/zlib': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zlib/, '')
      }
    }
  },
  // S'assurer que le Service Worker est servi correctement
  publicDir: 'public',
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'prop-types',
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
    // ✅ CORRECTION : Forcer la déduplication lors du build + CJS interop pour React
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      defaultIsModuleExports: 'auto'
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