/**
 * Script de diagnostic pour ProfileCard
 * Affiche les données stockées dans IndexedDB
 */

const DB_NAME = 'ProfileCardDB';
const STORE_NAME = 'profileCards';

async function debugProfileCard() {
  console.log('=== DIAGNOSTIC PROFILECARD ===\n');

  try {
    // Ouvrir la DB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ DB ouverte: ${DB_NAME} (version ${db.version})`);

    // Lire toutes les données
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const allData = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log(`\n📊 Nombre d'utilisateurs: ${allData.length}\n`);

    allData.forEach((data, index) => {
      console.log(`\n--- Utilisateur ${index + 1}: ${data.username} ---`);
      console.log(`Handle: @${data.handle || 'N/A'}`);
      console.log(`Dernière modification: ${data.lastModified || 'N/A'}`);
      
      // Avatar actif
      console.log(`\n🖼️  Avatar actif (index ${data.activeAvatarIndex ?? 'N/A'}):`);
      if (data.avatarUrl) {
        console.log(`  Type: ${data.avatarUrl.substring(0, 30)}...`);
        console.log(`  Longueur: ${data.avatarUrl.length} caractères`);
        console.log(`  Valide: ${data.avatarUrl.startsWith('data:image/')}`);
      } else {
        console.log(`  ❌ Aucun avatar actif`);
      }

      // Galerie d'avatars
      console.log(`\n📸 Galerie d'avatars: ${data.avatars?.length || 0}`);
      if (data.avatars && data.avatars.length > 0) {
        data.avatars.forEach((avatar, i) => {
          console.log(`  Avatar ${i}:`);
          console.log(`    ID: ${avatar.id}`);
          console.log(`    Créé: ${avatar.createdAt}`);
          console.log(`    Type: ${avatar.dataUrl.substring(0, 30)}...`);
          console.log(`    Longueur: ${avatar.dataUrl.length} caractères`);
          console.log(`    Valide: ${avatar.dataUrl.startsWith('data:image/')}`);
        });
      }

      // Image de la carte
      console.log(`\n🎴 Image de la carte (cardIconUrl):`);
      if (data.cardIconUrl) {
        console.log(`  Type: ${data.cardIconUrl.substring(0, 30)}...`);
        console.log(`  Longueur: ${data.cardIconUrl.length} caractères`);
        console.log(`  Valide: ${data.cardIconUrl.startsWith('data:image/')}`);
        
        // Vérifier si c'est la même que l'avatar
        if (data.avatarUrl && data.cardIconUrl === data.avatarUrl) {
          console.log(`  ⚠️  PROBLÈME: cardIconUrl est identique à avatarUrl!`);
        }
      } else {
        console.log(`  ❌ Aucune image de carte`);
      }
    });

    db.close();
    console.log('\n=== FIN DU DIAGNOSTIC ===');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le diagnostic
debugProfileCard();
