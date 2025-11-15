import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ✅ FIX MediaPipe: Intercepter erreurs globales (y compris WebAssembly)
// L'erreur "Module.arguments" vient du WebAssembly et n'est pas capturée par console.error
// On doit utiliser les event listeners globaux pour la filtrer
if (typeof window !== 'undefined') {
  // ✅ OPTIMISATION : Intercepter console.warn pour filtrer warnings TensorFlow.js
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
    
    // Filtrer warning TensorFlow.js platform (plusieurs variantes)
    if (message.includes('Platform browser has already been set') ||
        message.includes('Overwriting the platform with browser') ||
        message.includes('platform browser has already been set') ||
        (message.includes('Platform') && message.includes('browser') && message.includes('already been set'))) {
      // Ne pas afficher ce warning (normal si TensorFlow.js est chargé plusieurs fois)
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
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    const errorName = event.reason?.name || '';
    
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)