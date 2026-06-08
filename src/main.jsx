import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

function shouldMountAnatomyPreviewCapture() {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(window.location.search)
  if (q.get('anatomyPreviewCapture') !== '1') return false
  if (import.meta.env.DEV) return true
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}
import './styles/sidebar-dashboard-offset.css'
import './styles/sidebar-module-themes.css'

// ✅ FIX MediaPipe: Intercepter erreurs globales (y compris WebAssembly)
// L'erreur "Module.arguments" vient du WebAssembly et n'est pas capturée par console.error
// On doit utiliser les event listeners globaux pour la filtrer
if (typeof window !== 'undefined') {
  // ✅ OPTIMISATION : Intercepter console.warn pour filtrer warnings TensorFlow.js et Three.js
  // Le warning "Platform browser has already been set" peut venir de installHook.js (Vite)
  // Doit être fait très tôt, avant tout chargement TensorFlow.js
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Convertir tous les arguments en string pour vérification
    const message = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg && typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
    
    // ✅ CORRECTION : Filtrer warning TensorFlow.js platform (plusieurs variantes)
    // Ce warning peut venir de installHook.js (Vite/React DevTools) ou directement de TensorFlow.js
    if (message.includes('Platform browser has already been set') ||
        message.includes('Overwriting the platform with browser') ||
        message.includes('platform browser has already been set') ||
        message.includes('Platform browser has already been set. Overwriting') ||
        (message.includes('Platform') && message.includes('browser') && message.includes('already been set')) ||
        (message.includes('Overwriting') && message.includes('platform') && message.includes('browser'))) {
      // Ne pas afficher ce warning (normal si TensorFlow.js est chargé plusieurs fois)
      // Peut venir de installHook.js (Vite) qui intercepte les appels TensorFlow.js
      return;
    }
    
    // ✅ CORRECTION : Filtrer warnings Three.js (multiple instances, version updates)
    // Ces warnings sont gérés par vite.config.js avec déduplication
    if (message.includes('Multiple instances of Three.js') ||
        message.includes('Multiple instances of Three.js being imported') ||
        message.includes('updating from') && message.includes('to') && (message.includes('114') || message.includes('121'))) {
      // Ne pas afficher ces warnings (gérés par la configuration Vite)
      return;
    }
    
    // Extensions navigateur (MetaMask, etc.) — contentscript.js, pas notre code
    if (message.includes('MaxListenersExceededWarning') ||
        message.includes('ObjectMultiplex') ||
        message.includes('orphaned data for stream') ||
        message.includes('malformed chunk without name')) {
      return;
    }

    // ✅ CORRECTION : Filtrer warnings Finance attendus (fallbacks normaux, cache stale)
    // Ces warnings sont normaux dans le fonctionnement du système
    if (message.includes('Alpha Vantage unexpected response structure') ||
        message.includes('Alpha Vantage API limitation') ||
        (message.includes('Finnhub API token invalid') && message.includes('trying Polygon fallback')) ||
        (message.includes('Polygon historical data delayed') && message.includes('may be available later')) ||
        (message.includes('Temporary error fetching historical data') && message.includes('DELAYED')) ||
        (message.includes('Using stale cache') && message.includes('age:'))) {
      // Ne pas afficher ces warnings (comportement normal du système avec fallbacks)
      return;
    }
    
    // Afficher les autres warnings normalement
    originalWarn.apply(console, args);
  };

  // ✅ FIX MediaPipe WASM: Intercepter erreurs WebAssembly (y compris RuntimeError)
  // Les erreurs WASM (ErrnoError, RuntimeError: Aborted, memory access out of bounds)
  // sont souvent non-bloquantes mais polluent la console
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || '';
    const errorSource = event.filename || '';
    const errorName = event.error?.name || '';
    
    // ✅ OPTIMISATION Phase 15.4 : Filtrer erreurs extensions Chrome (non-bloquantes)
    // L'erreur "A listener indicated an asynchronous response by returning true, but the message channel closed"
    // vient des extensions Chrome qui utilisent chrome.runtime.sendMessage() et ne répondent pas correctement
    if (errorMessage.includes('A listener indicated an asynchronous response by returning true') &&
        errorMessage.includes('but the message channel closed before a response was received')) {
      event.preventDefault();
      event.stopPropagation();
      return false; // Ignorer cette erreur (elle vient d'une extension tierce)
    }
    
    // ✅ Filtrer erreur MediaPipe Module.arguments (warning Emscripten non-bloquant)
    if (errorMessage.includes('Module.arguments has been replaced with plain arguments_') ||
        (errorMessage.includes('Aborted') && errorMessage.includes('arguments_'))) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // ✅ PHASE 1.7 : Filtrer logs WebGL MediaPipe (warnings informatifs)
    // Ces logs sont normaux et indiquent juste que MediaPipe a créé un contexte WebGL
    if (errorSource.includes('pose_solution_simd_wasm_bin.js') &&
        (errorMessage.includes('WebGL context') || 
         errorMessage.includes('GL version') ||
         errorMessage.includes('OpenGL error checking') ||
         errorMessage.includes('Successfully created a WebGL context') ||
         errorMessage.includes('I0000') || // Logs informatifs MediaPipe (I = Info)
         errorMessage.includes('W0000'))) { // Logs warnings MediaPipe (W = Warning)
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // ✅ OPTIMISATION : Filtrer warnings TensorFlow.js WebGL (non-bloquants)
    // Ces warnings sont normaux : TensorFlow.js essaie WebGL, échoue, puis utilise CPU
    if (errorSource.includes('@tensorflow') || 
        errorSource.includes('tensorflow') ||
        errorSource.includes('installHook.js')) { // Vite/React DevTools hook
      if (errorMessage.includes('Could not get context for WebGL') ||
          errorMessage.includes('WebGL is not supported') ||
          errorMessage.includes('Initialization of backend webgl failed') ||
          errorMessage.includes('Platform browser has already been set') ||
          errorMessage.includes('Overwriting the platform with browser')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
    
    // ✅ PHASE 1.7 : Filtrer erreurs WASM MediaPipe non-bloquantes
    // ErrnoError: No such file or directory (errno: 44) - MediaPipe essaie fichiers locaux inexistants
    // RuntimeError: Aborted - MediaPipe s'arrête mais peut continuer
    // RuntimeError: memory access out of bounds - Accès mémoire invalide (souvent récupérable)
    if (errorSource.includes('pose_solution_simd_wasm_bin.js') || 
        errorSource.includes('pose_solution_simd_wasm_bin.wasm')) {
      // Filtrer ErrnoError errno: 44 (No such file or directory)
      if (errorName === 'ErrnoError' && 
          (errorMessage.includes('No such file or directory') || 
           (event.error?.errno === 44))) {
        // Erreur non-bloquante : MediaPipe peut continuer sans ce fichier
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      // Filtrer RuntimeError: Aborted si non critique
      if (errorName === 'RuntimeError' && 
          errorMessage.includes('Aborted') &&
          !errorMessage.includes('critical')) {
        // Abort non-critique : MediaPipe peut réessayer
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      // Filtrer memory access out of bounds si récupérable
      if (errorName === 'RuntimeError' && 
          errorMessage.includes('memory access out of bounds')) {
        // Accès mémoire invalide : MediaPipe peut récupérer
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }, true); // Capture phase pour intercepter avant propagation

  // ✅ PHASE 1.7 : Intercepter rejections de promesses (pour RuntimeError: Aborted WASM)
  // ✅ OPTIMISATION : Filtrer aussi rejections TensorFlow.js WebGL
  // ✅ OPTIMISATION Phase 15.4 : Filtrer erreurs extensions Chrome (non-bloquantes)
  // L'erreur "A listener indicated an asynchronous response by returning true, but the message channel closed"
  // vient des extensions Chrome qui utilisent chrome.runtime.sendMessage() et ne répondent pas correctement
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || String(event.reason || '');
    const errorName = event.reason?.name || '';
    
    // ✅ OPTIMISATION Phase 15.4 : Filtrer erreur extensions Chrome (message channel closed)
    // Cette erreur est causée par des extensions tierces, pas par notre code
    if (errorMessage.includes('A listener indicated an asynchronous response by returning true') &&
        errorMessage.includes('but the message channel closed before a response was received')) {
      event.preventDefault();
      // Ne pas logger cette erreur (elle vient d'une extension tierce)
      return;
    }
    
    // ✅ OPTIMISATION : Filtrer rejections TensorFlow.js WebGL (non-bloquantes)
    if (errorName === 'Error' && errorMessage.includes('WebGL is not supported')) {
      event.preventDefault();
      return false;
    }
    const errorStack = event.reason?.stack || '';
    
    // Filtrer erreur MediaPipe Module.arguments dans les promesses
    if (errorMessage.includes('Module.arguments has been replaced with plain arguments_') ||
        (errorMessage.includes('Aborted') && errorMessage.includes('arguments_'))) {
      event.preventDefault();
      return false;
    }
    
    // ✅ Filtrer RuntimeError: Aborted depuis WASM MediaPipe
    if (errorName === 'RuntimeError' && 
        errorMessage.includes('Aborted') &&
        (errorStack.includes('pose_solution_simd_wasm_bin') ||
         errorStack.includes('wasm_bin.wasm'))) {
      // Abort WASM non-critique : MediaPipe peut réessayer
      event.preventDefault();
      return false;
    }
    
    // ✅ Filtrer memory access out of bounds depuis WASM
    if (errorName === 'RuntimeError' && 
        errorMessage.includes('memory access out of bounds') &&
        errorStack.includes('wasm_bin')) {
      // Accès mémoire invalide : MediaPipe peut récupérer
      event.preventDefault();
      return false;
    }
  });
}

const rootEl = document.getElementById('root')

if (shouldMountAnatomyPreviewCapture()) {
  import('./dev/AnatomyPreviewCaptureRoot.jsx').then(({ default: AnatomyPreviewCaptureRoot }) => {
    ReactDOM.createRoot(rootEl).render(<AnatomyPreviewCaptureRoot />)
  })
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}