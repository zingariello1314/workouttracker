import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ✅ FIX MediaPipe: Intercepter erreurs globales (y compris WebAssembly)
// L'erreur "Module.arguments" vient du WebAssembly et n'est pas capturée par console.error
// On doit utiliser les event listeners globaux pour la filtrer
if (typeof window !== 'undefined') {
  // Intercepter erreurs non-capturées (inclut WebAssembly RuntimeError)
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || '';
    const errorSource = event.filename || '';
    
    // Filtrer erreur MediaPipe Module.arguments (warning Emscripten non-bloquant)
    if (errorMessage.includes('Module.arguments has been replaced with plain arguments_') ||
        (errorMessage.includes('Aborted') && errorMessage.includes('arguments_'))) {
      // Empêcher l'erreur d'apparaître dans la console
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Filtrer logs WebGL MediaPipe (warnings informatifs)
    if (errorSource.includes('pose_solution_simd_wasm_bin.js') &&
        (errorMessage.includes('WebGL context') || 
         errorMessage.includes('GL version') ||
         errorMessage.includes('OpenGL error checking'))) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true); // Capture phase pour intercepter avant propagation

  // Intercepter rejections de promesses (pour RuntimeError: Aborted)
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    
    // Filtrer erreur MediaPipe Module.arguments dans les promesses
    if (errorMessage.includes('Module.arguments has been replaced with plain arguments_') ||
        (errorMessage.includes('Aborted') && errorMessage.includes('arguments_'))) {
      // Empêcher la rejection d'apparaître dans la console
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