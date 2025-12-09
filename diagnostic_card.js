/**
 * Script de diagnostic pour identifier le problème du logo
 * 
 * INSTRUCTIONS:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script
 * 3. Appuyer sur Entrée
 * 4. Envoyer-moi les résultats
 */

(async function diagnosticProfileCard() {
  console.log('🔍 DIAGNOSTIC DE LA CARTE DE PROFIL');
  console.log('=====================================\n');
  
  // 1. Vérifier IndexedDB
  console.log('📦 1. VÉRIFICATION INDEXEDDB');
  try {
    const dbRequest = indexedDB.open('ProfileCardDB', 1);
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['profiles'], 'readonly');
      const store = transaction.objectStore('profiles');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const profiles = getAllRequest.result;
        console.log('✅ Profils trouvés:', profiles.length);
        profiles.forEach((profile, index) => {
          console.log(`\n  Profil ${index + 1}:`, {
            username: profile.username,
            handle: profile.handle,
            hasCardIcon: !!profile.cardIconUrl,
            cardIconLength: profile.cardIconUrl ? profile.cardIconUrl.length : 0,
            cardIconPreview: profile.cardIconUrl ? profile.cardIconUrl.substring(0, 50) + '...' : 'null',
            avatarsCount: profile.avatars?.length || 0
          });
        });
      };
    };
  } catch (error) {
    console.error('❌ Erreur IndexedDB:', error);
  }
  
  // 2. Vérifier le DOM
  console.log('\n🎨 2. VÉRIFICATION DU DOM');
  const cardIcon = document.querySelector('.pc-card-icon');
  if (cardIcon) {
    console.log('✅ Élément .pc-card-icon trouvé');
    console.log('  - Display:', window.getComputedStyle(cardIcon).display);
    console.log('  - Z-index:', window.getComputedStyle(cardIcon).zIndex);
    console.log('  - Opacity:', window.getComputedStyle(cardIcon).opacity);
    
    const img = cardIcon.querySelector('img');
    if (img) {
      console.log('  - Image trouvée:');
      console.log('    - src:', img.src);
      console.log('    - alt:', img.alt);
      console.log('    - naturalWidth:', img.naturalWidth);
      console.log('    - naturalHeight:', img.naturalHeight);
      console.log('    - display:', window.getComputedStyle(img).display);
    } else {
      console.log('  ❌ Aucune image trouvée dans .pc-card-icon');
    }
  } else {
    console.log('❌ Élément .pc-card-icon NON trouvé');
  }
  
  // 3. Vérifier toutes les images dans la carte
  console.log('\n🖼️ 3. TOUTES LES IMAGES DANS LA CARTE');
  const allImages = document.querySelectorAll('.pc-card img, .pc-card-wrapper img');
  console.log(`Nombre total d'images: ${allImages.length}`);
  allImages.forEach((img, index) => {
    console.log(`\n  Image ${index + 1}:`);
    console.log('    - src:', img.src);
    console.log('    - alt:', img.alt);
    console.log('    - className:', img.className);
    console.log('    - parent className:', img.parentElement?.className);
    console.log('    - display:', window.getComputedStyle(img).display);
    console.log('    - opacity:', window.getComputedStyle(img).opacity);
    console.log('    - z-index:', window.getComputedStyle(img.parentElement).zIndex);
  });
  
  // 4. Vérifier les variables CSS
  console.log('\n🎨 4. VARIABLES CSS');
  const wrapper = document.querySelector('.pc-card-wrapper');
  if (wrapper) {
    const styles = window.getComputedStyle(wrapper);
    console.log('  --icon:', styles.getPropertyValue('--icon'));
    console.log('  --grain:', styles.getPropertyValue('--grain'));
    console.log('  --inner-gradient:', styles.getPropertyValue('--inner-gradient'));
  }
  
  // 5. Vérifier le cache
  console.log('\n💾 5. CACHE DU NAVIGATEUR');
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('Caches trouvés:', cacheNames);
  }
  
  console.log('\n=====================================');
  console.log('✅ DIAGNOSTIC TERMINÉ');
  console.log('Envoyez-moi ces résultats pour que je puisse identifier le problème!');
})();
