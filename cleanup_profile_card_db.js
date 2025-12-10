/**
 * Script de nettoyage de la base de données ProfileCard
 * Supprime toutes les références au logo et aux URLs invalides
 */

const DB_NAME = 'ProfileCardDB';
const STORE_NAME = 'profileCards';
const DB_VERSION = 1;

async function cleanupProfileCardDB() {
  return new Promise((resolve, reject) => {
    console.log('🧹 Nettoyage de la base de données ProfileCard...');
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('❌ Erreur lors de l\'ouverture de la DB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = async () => {
      const db = request.result;
      console.log('✅ DB ouverte');
      
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Récupérer tous les profils
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = async () => {
          const profiles = getAllRequest.result;
          console.log(`📊 ${profiles.length} profil(s) trouvé(s)`);
          
          let cleanedCount = 0;
          
          for (const profile of profiles) {
            let needsUpdate = false;
            const updates = [];
            
            // Nettoyer avatarUrl
            if (profile.avatarUrl === '/logo.png' || 
                (profile.avatarUrl && !profile.avatarUrl.startsWith('data:image/'))) {
              profile.avatarUrl = null;
              needsUpdate = true;
              updates.push('avatarUrl');
            }
            
            // Nettoyer cardIconUrl
            if (profile.cardIconUrl === '/logo.png' || 
                (profile.cardIconUrl && !profile.cardIconUrl.startsWith('data:image/'))) {
              profile.cardIconUrl = null;
              needsUpdate = true;
              updates.push('cardIconUrl');
            }
            
            // Nettoyer la galerie d'avatars
            if (profile.avatars && Array.isArray(profile.avatars)) {
              const originalLength = profile.avatars.length;
              profile.avatars = profile.avatars.filter(avatar => {
                return avatar.dataUrl && 
                       avatar.dataUrl !== '/logo.png' && 
                       avatar.dataUrl.startsWith('data:image/') &&
                       avatar.dataUrl.length > 50; // Data URL valide
              });
              
              if (profile.avatars.length !== originalLength) {
                needsUpdate = true;
                updates.push(`avatars (${originalLength} → ${profile.avatars.length})`);
                
                // Ajuster l'index actif si nécessaire
                if (profile.activeAvatarIndex >= profile.avatars.length) {
                  profile.activeAvatarIndex = Math.max(0, profile.avatars.length - 1);
                }
                
                // Mettre à jour avatarUrl si nécessaire
                if (profile.avatars.length > 0) {
                  profile.avatarUrl = profile.avatars[profile.activeAvatarIndex].dataUrl;
                } else {
                  profile.avatarUrl = null;
                }
              }
            }
            
            if (needsUpdate) {
              const updateRequest = store.put(profile);
              await new Promise((res, rej) => {
                updateRequest.onsuccess = () => res();
                updateRequest.onerror = () => rej(updateRequest.error);
              });
              
              cleanedCount++;
              console.log(`✨ Nettoyé: ${profile.username} - ${updates.join(', ')}`);
            }
          }
          
          db.close();
          
          if (cleanedCount > 0) {
            console.log(`\n✅ Nettoyage terminé! ${cleanedCount} profil(s) nettoyé(s)`);
            console.log('🔄 Rechargez la page pour voir les changements');
          } else {
            console.log('\n✅ Aucun nettoyage nécessaire - tout est propre!');
          }
          
          resolve({ cleaned: cleanedCount, total: profiles.length });
        };
        
        getAllRequest.onerror = () => {
          console.error('❌ Erreur lors de la récupération des profils:', getAllRequest.error);
          db.close();
          reject(getAllRequest.error);
        };
        
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        db.close();
        reject(error);
      }
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'username' });
      }
    };
  });
}

// Exécuter le nettoyage
cleanupProfileCardDB()
  .then(result => {
    console.log('\n📊 Résumé:');
    console.log(`   - Profils nettoyés: ${result.cleaned}`);
    console.log(`   - Total de profils: ${result.total}`);
  })
  .catch(error => {
    console.error('\n❌ Échec du nettoyage:', error);
  });
