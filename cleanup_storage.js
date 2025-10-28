// SCRIPT DE NETTOYAGE INTELLIGENT
// Copier-coller dans la console pour nettoyer l'espace de stockage

console.log('🧹 NETTOYAGE INTELLIGENT DU STOCKAGE');
console.log('===================================');

function nettoyerStockage() {
  console.log('🔍 Analyse de l\'utilisation du stockage...');
  
  // Calculer l'espace utilisé
  let localStorageSize = 0;
  let sessionStorageSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      localStorageSize += localStorage[key].length;
    }
  }
  
  for (let key in sessionStorage) {
    if (sessionStorage.hasOwnProperty(key)) {
      sessionStorageSize += sessionStorage[key].length;
    }
  }
  
  console.log(`📊 localStorage: ${Math.round(localStorageSize / 1024 / 1024 * 100) / 100} MB`);
  console.log(`📊 sessionStorage: ${Math.round(sessionStorageSize / 1024 / 1024 * 100) / 100} MB`);
  
  // Nettoyer les anciennes clés problématiques
  const keysToClean = [
    'homepage_images_fallback',
    'homepage_images_emergency',
    'homepage_images_sync_emergency',
    'homepage_images_primary',
    'homepage_images_backup',
    'homepage_backgroundImages_backup',
    'homepage_bannerImages_backup',
    'homepage_images_backup_old',
    'workoutData_backup'
  ];
  
  console.log('🗑️ Nettoyage des anciennes clés...');
  
  let cleanedCount = 0;
  let freedSpace = 0;
  
  keysToClean.forEach(key => {
    try {
      const data = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (data) {
        freedSpace += data.length;
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        cleanedCount++;
        console.log(`✅ ${key} supprimé`);
      }
    } catch (error) {
      console.warn(`⚠️ Erreur suppression ${key}:`, error);
    }
  });
  
  console.log(`🎉 Nettoyage terminé:`);
  console.log(`   - ${cleanedCount} clés supprimées`);
  console.log(`   - ${Math.round(freedSpace / 1024 / 1024 * 100) / 100} MB libérés`);
  
  // Vérifier l'espace restant
  let newLocalStorageSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      newLocalStorageSize += localStorage[key].length;
    }
  }
  
  console.log(`📊 localStorage après nettoyage: ${Math.round(newLocalStorageSize / 1024 / 1024 * 100) / 100} MB`);
  
  // Garder seulement les métadonnées essentielles
  const essentialKeys = [
    'homepage_images_metadata',
    'homepage_images_sync_metadata'
  ];
  
  console.log('💾 Conservation des métadonnées essentielles...');
  essentialKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      console.log(`✅ ${key} conservé (${Math.round(data.length / 1024 * 100) / 100} KB)`);
    }
  });
  
  console.log('✅ Nettoyage terminé avec succès !');
  console.log('🔄 Rechargez la page pour tester le nouveau système');
}

// Lancer le nettoyage
nettoyerStockage();
