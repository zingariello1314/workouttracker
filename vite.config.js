import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function bankMediaPlugin() {
  const root = path.resolve(__dirname, 'dossiergifs')
  const mount = (server) => {
    server.middlewares.use((req, res, next) => {
      const raw = req.url || ''
      if (!raw.startsWith('/bank-media/')) return next()
      let rel = raw.slice('/bank-media/'.length).split('?')[0]
      try { rel = decodeURIComponent(rel) } catch { return next() }
      const file = path.resolve(root, rel)
      const fromRoot = path.relative(root, file)
      if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) return next()
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
      const stat = fs.statSync(file)
      const ext = path.extname(file).toLowerCase()
      const types = { '.gif': 'image/gif', '.mp4': 'video/mp4', '.webp': 'image/webp' }
      const type = types[ext] || 'application/octet-stream'
      const range = req.headers.range
      if (range) {
        const [startText, endText] = range.replace(/bytes=/, '').split('-')
        const start = Number.parseInt(startText, 10)
        const end = endText ? Number.parseInt(endText, 10) : stat.size - 1
        if (Number.isNaN(start) || Number.isNaN(end) || start > end) return next()
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': type
        })
        fs.createReadStream(file, { start, end }).pipe(res)
        return
      }
      res.setHeader('Content-Type', type)
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Content-Length', stat.size)
      fs.createReadStream(file).pipe(res)
    })
  }
  return {
    name: 'bank-media',
    configureServer: mount,
    configurePreviewServer: mount
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), bankMediaPlugin()],
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
    // Spotify OAuth exige http://127.0.0.1:PORT/... ; sans ça, Vite peut n’écouter que sur ::1 / « localhost »
    // et le navigateur refuse la connexion sur 127.0.0.1 (ERR_CONNECTION_REFUSED).
    host: '0.0.0.0',
    open: true,
    allowedHosts: [
      'unadventuring-recognizably-felecia.ngrok-free.dev'
    ],
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
      },
      '/api/app-lock': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/app-lock/, '/app-lock')
      },
      // GitHub OAuth + GraphQL (FastAPI zlib_server — même port 8000)
      '/api/github': {
        target: 'http://localhost:8000',
        changeOrigin: true
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