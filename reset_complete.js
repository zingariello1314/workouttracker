/**
 * Script de réinitialisation COMPLÈTE de la carte de profil
 * 
 * INSTRUCTIONS:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script
 * 3. Appuyer sur Entrée
 * 4. Recharger la page (F5)
 * 5. Re-uploader ton image via les paramètres
 */

(async function resetProfileCard() {
  console.log('🔄 RÉINITIALISATION COMPLÈTE');
  console.log('=====================================\n');
  
  try {
    // 1. Supprimer ProfileCardDB
    console.log('📦 Suppression de ProfileCardDB...');
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('ProfileCardDB');
      request.onsuccess = () => {
        console.log('✅ ProfileCardDB supprimée');
        resolve();
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('⚠️ Fermez tous les onglets de l\'application');
        reject(new Error('Blocked'));
      };
    });

    // 2. Nettoyer localStorage
    console.log('\n🗄️ Nettoyage du localStorage...');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('profile') || key.includes('card')) {
        localStorage.removeItem(key);
        console.log(`  - Supprimé: ${key}`);
      }
    });

    // 3. Nettoyer sessionStorage
    console.log('\n📝 Nettoyage du sessionStorage...');
    sessionStorage.clear();

    // 4. Nettoyer les caches
    if ('caches' in window) {
      console.log('\n💾 Suppression des caches...');
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`✅ ${cacheNames.length} caches supprimés`);
    }

    console.log('\n=====================================');
    console.log('✅ RÉINITIALISATION TERMINÉE');
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Recharger la page (F5)');
    console.log('2. Cliquer sur "Profil" dans la carte');
    console.log('3. Aller dans l\'onglet "Image de la carte"');
    console.log('4. Uploader ton image');
    console.log('5. Fermer les paramètres');
    console.log('\nTon image devrait maintenant s\'afficher!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error.message === 'Blocked') {
      console.log('\n⚠️ FERMEZ TOUS LES ONGLETS et réessayez!');
    }
  }
})();
