/**
 * Script de correction pour ProfileCard
 * Sépare correctement avatarUrl et cardIconUrl
 */

const DB_NAME = 'ProfileCardDB';
const STORE_NAME = 'profileCards';

async function fixProfileCardImages() {
  console.log('=== CORRECTION PROFILECARD IMAGES ===\n');

  try {
    // Ouvrir la DB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ DB ouverte: ${DB_NAME}\n`);

    // Lire toutes les données
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const allData = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log(`📊 Utilisateurs trouvés: ${allData.length}\n`);

    for (const data of allData) {
      console.log(`\n--- Traitement: ${data.username} ---`);
      
      let modified = false;
      const updates = { ...data };

      // Vérifier si cardIconUrl est identique à avatarUrl
      if (data.cardIconUrl && data.avatarUrl && data.cardIconUrl === data.avatarUrl) {
        console.log(`⚠️  Problème détecté: cardIconUrl = avatarUrl`);
        console.log(`🔧 Suppression de cardIconUrl (sera null)`);
        updates.cardIconUrl = null;
        modified = true;
      }

      // Vérifier si cardIconUrl pointe vers le logo
      if (data.cardIconUrl && data.cardIconUrl.includes('/logo.png')) {
        console.log(`⚠️  Problème détecté: cardIconUrl pointe vers logo.png`);
        console.log(`🔧 Suppression de cardIconUrl`);
        updates.cardIconUrl = null;
        modified = true;
      }

      // Vérifier si avatarUrl pointe vers le logo
      if (data.avatarUrl && data.avatarUrl.includes('/logo.png')) {
        console.log(`⚠️  Problème détecté: avatarUrl pointe vers logo.png`);
        console.log(`🔧 Suppression de avatarUrl`);
        updates.avatarUrl = null;
        modified = true;
      }

      // Vérifier la validité des data URLs
      if (data.avatarUrl && !data.avatarUrl.startsWith('data:image/')) {
        console.log(`⚠️  avatarUrl invalide (ne commence pas par data:image/)`);
        console.log(`🔧 Suppression de avatarUrl`);
        updates.avatarUrl = null;
        modified = true;
      }

      if (data.cardIconUrl && !data.cardIconUrl.startsWith('data:image/')) {
        console.log(`⚠️  cardIconUrl invalide (ne commence pas par data:image/)`);
        console.log(`🔧 Suppression de cardIconUrl`);
        updates.cardIconUrl = null;
        modified = true;
      }

      // Sauvegarder si modifié
      if (modified) {
        updates.lastModified = new Date().toISOString();
        
        await new Promise((resolve, reject) => {
          const request = store.put(updates);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        console.log(`✅ Données corrigées pour ${data.username}`);
      } else {
        console.log(`✓ Aucune correction nécessaire`);
      }
    }

    db.close();
    console.log('\n=== CORRECTION TERMINÉE ===');
    console.log('\n💡 Rechargez la page pour voir les changements');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la correction
fixProfileCardImages();
