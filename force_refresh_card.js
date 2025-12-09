/**
 * Script de nettoyage complet pour forcer le rafraîchissement de la carte de profil
 * 
 * INSTRUCTIONS:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script complet
 * 3. Appuyer sur Entrée
 * 4. Fermer tous les onglets de l'application
 * 5. Vider le cache du navigateur (Ctrl+Shift+Delete)
 * 6. Rouvrir l'application
 */

(async function forceRefreshProfileCard() {
  console.log('🧹 Début du nettoyage complet...');
  
  try {
    // 1. Supprimer toutes les données IndexedDB
    console.log('📦 Suppression de ProfileCardDB...');
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('ProfileCardDB');
      request.onsuccess = () => {
        console.log('✅ ProfileCardDB supprimée');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Erreur lors de la suppression de ProfileCardDB');
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('⚠️ Suppression bloquée - fermez tous les onglets de l\'application');
        reject(new Error('Database deletion blocked'));
      };
    });

    // 2. Nettoyer le localStorage
    console.log('🗄️ Nettoyage du localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('profile')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✅ ${keysToRemove.length} clés supprimées du localStorage`);

    // 3. Nettoyer le sessionStorage
    console.log('📝 Nettoyage du sessionStorage...');
    sessionStorage.clear();
    console.log('✅ sessionStorage nettoyé');

    // 4. Vider tous les caches
    if ('caches' in window) {
      console.log('💾 Suppression des caches...');
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`✅ ${cacheNames.length} caches supprimés`);
    }

    console.log('');
    console.log('✨ NETTOYAGE TERMINÉ ✨');
    console.log('');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('1. Fermez TOUS les onglets de l\'application');
    console.log('2. Videz le cache du navigateur:');
    console.log('   - Chrome/Edge: Ctrl+Shift+Delete > Cocher "Images et fichiers en cache" > Effacer');
    console.log('   - Firefox: Ctrl+Shift+Delete > Cocher "Cache" > Effacer maintenant');
    console.log('3. Redémarrez le navigateur (recommandé)');
    console.log('4. Rouvrez l\'application');
    console.log('');
    console.log('Le logo ne devrait plus apparaître!');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    console.log('');
    console.log('⚠️ Si l\'erreur indique "blocked", fermez tous les onglets et réessayez');
  }
})();
