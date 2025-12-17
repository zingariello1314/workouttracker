/**
 * Script de diagnostic spécifique pour le problème de synchronisation
 * entre les sessions de lecture et les statistiques
 * À exécuter dans la console du navigateur (F12)
 */

console.log('=== DIAGNOSTIC SYNCHRONISATION SESSIONS ↔ STATISTIQUES ===');

async function diagnoseSyncIssue() {
  try {
    console.log('🔍 Ouverture de la base de données...');
    
    const request = indexedDB.open('QuietQuestDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // Vérifier les object stores disponibles
      console.log('📋 Object stores disponibles:', Array.from(db.objectStoreNames));
      
      const transaction = db.transaction(['books'], 'readonly');
      const store = transaction.objectStore('books');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const books = getAllRequest.result;
        console.log(`📚 Nombre total de livres: ${books.length}`);
        
        if (books.length === 0) {
          console.log('❌ PROBLÈME: Aucun livre dans la base de données');
          console.log('💡 Les sessions de lecture doivent être attachées à des livres');
          return;
        }
        
        // Analyser chaque livre et ses sessions
        let totalSessions = 0;
        let validSessions = 0;
        let invalidSessions = 0;
        
        books.forEach((book, index) => {
          console.log(`\n📖 Livre ${index + 1}: "${book.title}"`);
          console.log(`   ID: ${book.id}`);
          console.log(`   Statut: ${book.status}`);
          
          const sessions = book.readingSessions || [];
          totalSessions += sessions.length;
          
          console.log(`   Sessions: ${sessions.length}`);
          
          if (sessions.length > 0) {
            sessions.forEach((session, sessionIndex) => {
              console.log(`     📝 Session ${sessionIndex + 1}:`);
              console.log(`        Date: ${session.date}`);
              console.log(`        Pages: ${session.pagesRead}`);
              console.log(`        Durée: ${session.durationMinutes} min`);
              console.log(`        Note: ${session.note || 'Aucune'}`);
              
              // Vérifier la validité de la session
              const isValid = session.date && 
                             (session.pagesRead > 0 || session.durationMinutes > 0);
              
              if (isValid) {
                validSessions++;
                console.log(`        ✅ Session valide`);
              } else {
                invalidSessions++;
                console.log(`        ❌ Session invalide (manque date ou données)`);
              }
            });
          } else {
            console.log(`     ⚠️ Aucune session pour ce livre`);
          }
        });
        
        console.log(`\n📊 RÉSUMÉ DES SESSIONS:`);
        console.log(`   Total sessions: ${totalSessions}`);
        console.log(`   Sessions valides: ${validSessions}`);
        console.log(`   Sessions invalides: ${invalidSessions}`);
        
        // Tester les services de statistiques
        testStatisticsCalculation(books);
        
        // Proposer des solutions
        if (validSessions === 0) {
          console.log('\n❌ PROBLÈME IDENTIFIÉ: Aucune session valide');
          console.log('💡 SOLUTIONS POSSIBLES:');
          console.log('   1. Vérifier que les sessions ont une date valide');
          console.log('   2. Vérifier que les sessions ont des pages lues > 0 OU durée > 0');
          console.log('   3. Vérifier la structure des données dans IndexedDB');
        } else {
          console.log('\n✅ Sessions valides trouvées, problème probablement dans le calcul des statistiques');
          console.log('💡 Vérifiez les services SessionAggregator et MetricsCalculator');
        }
      };
      
      getAllRequest.onerror = function() {
        console.error('❌ Erreur lors de la lecture des livres');
      };
    };
    
    request.onerror = function() {
      console.error('❌ Erreur lors de l\'ouverture de la base de données');
    };
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

function testStatisticsCalculation(books) {
  console.log('\n🧪 TEST DES CALCULS DE STATISTIQUES');
  
  try {
    // Simuler le calcul des statistiques comme le fait le composant
    const allSessions = [];
    
    books.forEach(book => {
      if (book.readingSessions) {
        book.readingSessions.forEach(session => {
          allSessions.push({
            ...session,
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookGenre: book.genre
          });
        });
      }
    });
    
    console.log(`📝 Sessions extraites: ${allSessions.length}`);
    
    if (allSessions.length > 0) {
      console.log('🔍 Première session extraite:');
      console.log(JSON.stringify(allSessions[0], null, 2));
      
      // Calculer des métriques de base
      const totalPages = allSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      const totalMinutes = allSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const uniqueDates = new Set(allSessions.map(s => s.date)).size;
      
      console.log(`📊 MÉTRIQUES CALCULÉES:`);
      console.log(`   Total pages lues: ${totalPages}`);
      console.log(`   Total minutes: ${totalMinutes}`);
      console.log(`   Jours de lecture: ${uniqueDates}`);
      
      if (totalPages > 0 || totalMinutes > 0) {
        console.log('✅ Les données permettent de calculer des statistiques');
      } else {
        console.log('❌ Aucune donnée quantifiable pour les statistiques');
      }
    } else {
      console.log('❌ Aucune session trouvée pour les calculs');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de calcul:', error);
  }
}

// Fonction pour corriger les données si nécessaire
function fixDataStructure() {
  console.log('\n🔧 TENTATIVE DE CORRECTION DES DONNÉES');
  
  const request = indexedDB.open('QuietQuestDB', 1);
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['books'], 'readwrite');
    const store = transaction.objectStore('books');
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = function() {
      const books = getAllRequest.result;
      let fixed = 0;
      
      books.forEach(book => {
        if (book.readingSessions) {
          let bookFixed = false;
          
          book.readingSessions.forEach(session => {
            // Corriger les types de données si nécessaire
            if (session.pagesRead && typeof session.pagesRead === 'string') {
              session.pagesRead = parseInt(session.pagesRead, 10);
              bookFixed = true;
            }
            if (session.durationMinutes && typeof session.durationMinutes === 'string') {
              session.durationMinutes = parseInt(session.durationMinutes, 10);
              bookFixed = true;
            }
            
            // Ajouter un ID si manquant
            if (!session.id) {
              session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              bookFixed = true;
            }
          });
          
          if (bookFixed) {
            store.put(book);
            fixed++;
            console.log(`🔧 Livre "${book.title}" corrigé`);
          }
        }
      });
      
      console.log(`✅ ${fixed} livres corrigés`);
      
      transaction.oncomplete = function() {
        console.log('💾 Corrections sauvegardées');
        console.log('🔄 Rechargez la page pour voir les changements');
      };
    };
  };
}

// Exécuter le diagnostic
console.log('🚀 Démarrage du diagnostic de synchronisation...');
diagnoseSyncIssue();

console.log('\n📋 COMMANDES DISPONIBLES:');
console.log('• fixDataStructure() - Tenter de corriger la structure des données');
console.log('• diagnoseSyncIssue() - Relancer le diagnostic');

// Rendre les fonctions disponibles globalement
window.fixDataStructure = fixDataStructure;
window.diagnoseSyncIssue = diagnoseSyncIssue;