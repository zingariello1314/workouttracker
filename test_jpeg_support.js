/**
 * Script de test pour vérifier le support JPEG
 * Exécuter dans la console du navigateur après avoir ouvert l'application
 */

console.log('🧪 Test du support JPEG - Début');

// Test 1: Vérifier que optimizeImage est disponible
async function testOptimizeImageExists() {
  console.log('\n📋 Test 1: Vérification de la fonction optimizeImage');
  
  try {
    // Créer un petit fichier image de test
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Dessiner quelque chose
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('TEST', 30, 55);
    
    // Convertir en blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'test.png', { type: 'image/png' });
    
    console.log('✅ Fichier de test créé:', file.name, file.type, file.size, 'bytes');
    
    // Importer la fonction
    const { optimizeImage } = await import('./src/services/profileCard/profileCardStorage.js');
    
    console.log('✅ Fonction optimizeImage importée avec succès');
    
    // Tester l'optimisation
    const startTime = performance.now();
    const dataUrl = await optimizeImage(file, 50, 50, 0.9);
    const endTime = performance.now();
    
    console.log('✅ Image optimisée en', Math.round(endTime - startTime), 'ms');
    console.log('✅ Data URL générée (longueur:', dataUrl.length, 'caractères)');
    console.log('✅ Format:', dataUrl.substring(0, 30) + '...');
    
    // Vérifier que c'est bien du JPEG
    if (dataUrl.startsWith('data:image/jpeg')) {
      console.log('✅ Format JPEG confirmé');
    } else {
      console.error('❌ Format incorrect:', dataUrl.substring(0, 30));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

// Test 2: Vérifier les formats acceptés
function testAcceptedFormats() {
  console.log('\n📋 Test 2: Vérification des formats acceptés');
  
  const avatarInput = document.querySelector('input[type="file"][accept*="jpeg"]');
  
  if (avatarInput) {
    console.log('✅ Input trouvé avec accept:', avatarInput.accept);
    
    const expectedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const acceptedFormats = avatarInput.accept.split(',').map(f => f.trim());
    
    const allPresent = expectedFormats.every(format => acceptedFormats.includes(format));
    
    if (allPresent) {
      console.log('✅ Tous les formats attendus sont présents');
    } else {
      console.error('❌ Formats manquants');
      console.log('Attendus:', expectedFormats);
      console.log('Trouvés:', acceptedFormats);
    }
    
    return allPresent;
  } else {
    console.error('❌ Input file non trouvé (ouvrez les paramètres de profil)');
    return false;
  }
}

// Test 3: Vérifier IndexedDB
async function testIndexedDB() {
  console.log('\n📋 Test 3: Vérification IndexedDB');
  
  try {
    const dbRequest = indexedDB.open('ProfileCardDB', 1);
    
    return new Promise((resolve) => {
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        console.log('✅ Base de données ouverte:', db.name, 'version', db.version);
        
        if (db.objectStoreNames.contains('profileCards')) {
          console.log('✅ Store "profileCards" existe');
          
          const transaction = db.transaction(['profileCards'], 'readonly');
          const store = transaction.objectStore('profileCards');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const profiles = getAllRequest.result;
            console.log('✅ Profils trouvés:', profiles.length);
            
            profiles.forEach(profile => {
              console.log('  - Utilisateur:', profile.username);
              console.log('    Avatars:', profile.avatars?.length || 0);
              console.log('    Avatar actif:', profile.activeAvatarIndex);
              console.log('    Image de carte:', profile.cardIconUrl ? 'Oui' : 'Non');
            });
            
            db.close();
            resolve(true);
          };
          
          getAllRequest.onerror = () => {
            console.error('❌ Erreur lecture profils');
            db.close();
            resolve(false);
          };
        } else {
          console.error('❌ Store "profileCards" n\'existe pas');
          db.close();
          resolve(false);
        }
      };
      
      dbRequest.onerror = () => {
        console.error('❌ Erreur ouverture base de données');
        resolve(false);
      };
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  const results = {
    optimizeImage: await testOptimizeImageExists(),
    acceptedFormats: testAcceptedFormats(),
    indexedDB: await testIndexedDB()
  };
  
  console.log('\n📊 Résultats des tests:');
  console.log('  optimizeImage:', results.optimizeImage ? '✅' : '❌');
  console.log('  acceptedFormats:', results.acceptedFormats ? '✅' : '❌');
  console.log('  indexedDB:', results.indexedDB ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés !');
  } else {
    console.log('\n⚠️ Certains tests ont échoué');
  }
  
  return results;
}

// Instructions
console.log(`
📖 Instructions:
1. Ouvrez l'application dans votre navigateur
2. Ouvrez la console développeur (F12)
3. Collez ce script et exécutez-le
4. Pour tester les formats acceptés, ouvrez d'abord les paramètres de profil
5. Exécutez: runAllTests()

💡 Commandes disponibles:
- runAllTests()           : Exécuter tous les tests
- testOptimizeImageExists() : Tester la fonction d'optimisation
- testAcceptedFormats()   : Tester les formats acceptés
- testIndexedDB()         : Tester IndexedDB
`);

// Auto-exécution si dans un environnement de test
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔄 Exécution automatique dans 2 secondes...');
  setTimeout(runAllTests, 2000);
}
