console.log('🔄 FORÇAGE DU RECHARGEMENT COMPLET');
console.log('==================================');

// 1. Vider le cache du navigateur
async function clearBrowserCache() {
  console.log('🧹 Nettoyage du cache navigateur...');
  
  // Vider le cache des modules ES6
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('✅ Service Worker désenregistré');
    }
  }
  
  // Vider le localStorage et sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Storage local nettoyé');
}

// 2. Supprimer complètement IndexedDB
async function clearIndexedDB() {
  console.log('🗑️ Suppression complète d\'IndexedDB...');
  
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('WorkoutTrackerDB');
    
    deleteRequest.onsuccess = () => {
      console.log('✅ IndexedDB supprimée');
      resolve();
    };
    
    deleteRequest.onerror = () => {
      console.log('❌ Erreur suppression IndexedDB:', deleteRequest.error);
      resolve(); // Continue même en cas d'erreur
    };
    
    deleteRequest.onblocked = () => {
      console.log('⚠️ Suppression bloquée - continuons quand même');
      resolve();
    };
  });
}

// 3. Forcer le rechargement de tous les modules
function forceModuleReload() {
  console.log('🔄 Rechargement forcé des modules...');
  
  // Ajouter un timestamp pour forcer le rechargement
  const timestamp = Date.now();
  const url = new URL(window.location);
  url.searchParams.set('_t', timestamp);
  
  console.log('🚀 Rechargement avec timestamp:', timestamp);
  window.location.href = url.toString();
}

// 4. Fonction principale
async function forceCompleteReload() {
  try {
    console.log('🚀 Démarrage du rechargement forcé...');
    
    // Étape 1: Nettoyer le cache
    await clearBrowserCache();
    
    // Étape 2: Supprimer IndexedDB
    await clearIndexedDB();
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Étape 3: Recharger avec timestamp
    forceModuleReload();
    
  } catch (error) {
    console.log('❌ Erreur durant le rechargement:', error);
    // Forcer le rechargement quand même
    window.location.reload(true);
  }
}

// Exécuter le rechargement forcé
console.log('🔄 Lancement du rechargement forcé...');
forceCompleteReload();

console.log('📝 INSTRUCTIONS:');
console.log('1. Ce script va nettoyer tout le cache');
console.log('2. Supprimer IndexedDB');
console.log('3. Recharger la page avec un timestamp');
console.log('4. L\'application devrait redémarrer proprement');