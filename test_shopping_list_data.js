/**
 * Script de test pour ajouter des données de listes de courses
 * Pour tester le module ShoppingListModule
 */

// Fonction pour créer des données de test
function createTestShoppingData() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const testData = {
    budget: {
      mensuel: 400,
      depenseCeMois: 120,
      restant: 280
    },
    listes: [
      {
        id: 'liste-1',
        nom: 'Courses du weekend',
        type: 'power-shopping',
        budget: 80,
        statut: 'prete',
        scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30).toISOString(),
        articles: [
          {
            id: 'art-1',
            nom: 'Lait',
            quantite: 2,
            prixEstime: 1.20,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Frigo'
          },
          {
            id: 'art-2',
            nom: 'Pain',
            quantite: 1,
            prixEstime: 1.50,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Boulangerie'
          },
          {
            id: 'art-3',
            nom: 'Pommes',
            quantite: 1,
            prixEstime: 2.50,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Fruits'
          },
          {
            id: 'art-4',
            nom: 'Yaourts',
            quantite: 8,
            prixEstime: 3.20,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Frigo'
          },
          {
            id: 'art-5',
            nom: 'Pâtes',
            quantite: 2,
            prixEstime: 2.80,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Épicerie'
          }
        ],
        dateCreation: now.getTime() - 3600000, // Il y a 1 heure
        dateModification: now.getTime() - 1800000, // Il y a 30 minutes
        dateCompletion: null
      },
      {
        id: 'liste-2',
        nom: 'Courses express',
        type: 'quick-run',
        budget: 25,
        statut: 'en-cours',
        scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
        articles: [
          {
            id: 'art-6',
            nom: 'Baguette',
            quantite: 1,
            prixEstime: 1.10,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Boulangerie'
          },
          {
            id: 'art-7',
            nom: 'Fromage',
            quantite: 1,
            prixEstime: 4.50,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Frigo'
          }
        ],
        dateCreation: now.getTime() - 7200000, // Il y a 2 heures
        dateModification: now.getTime() - 900000, // Il y a 15 minutes
        dateCompletion: null
      },
      {
        id: 'liste-3',
        nom: 'Courses de demain',
        type: 'power-shopping',
        budget: 60,
        statut: 'prete',
        scheduledTime: tomorrow.toISOString(),
        articles: [
          {
            id: 'art-8',
            nom: 'Légumes',
            quantite: 1,
            prixEstime: 8.50,
            prixReel: null,
            statut: 'a-acheter',
            categorie: 'Légumes'
          }
        ],
        dateCreation: now.getTime() - 14400000, // Il y a 4 heures
        dateModification: now.getTime() - 3600000, // Il y a 1 heure
        dateCompletion: null
      }
    ],
    inventaire: {
      articles: []
    },
    promos: {
      sures: [],
      potentielles: [],
      nonCiblees: []
    },
    profilMarques: {},
    historiquePrix: {}
  };

  return testData;
}

// Fonction pour sauvegarder les données de test
function saveTestData() {
  try {
    const testData = createTestShoppingData();
    localStorage.setItem('smartShopping', JSON.stringify(testData));
    console.log('✅ Données de test Smart Shopping sauvegardées');
    console.log('📊 Données créées:', testData);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    return false;
  }
}

// Fonction pour vérifier les données
function verifyTestData() {
  try {
    const stored = localStorage.getItem('smartShopping');
    if (!stored) {
      console.log('❌ Aucune donnée trouvée');
      return false;
    }

    const data = JSON.parse(stored);
    console.log('✅ Données Smart Shopping trouvées');
    console.log('📋 Nombre de listes:', data.listes?.length || 0);
    
    if (data.listes && data.listes.length > 0) {
      data.listes.forEach((liste, index) => {
        console.log(`📝 Liste ${index + 1}: ${liste.nom} (${liste.statut}) - ${liste.articles?.length || 0} articles`);
        if (liste.scheduledTime) {
          console.log(`   ⏰ Programmée pour: ${new Date(liste.scheduledTime).toLocaleString('fr-FR')}`);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }
}

// Fonction pour nettoyer les données de test
function clearTestData() {
  try {
    localStorage.removeItem('smartShopping');
    console.log('🧹 Données de test supprimées');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return false;
  }
}

// Exporter les fonctions pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testShoppingData = {
    save: saveTestData,
    verify: verifyTestData,
    clear: clearTestData,
    create: createTestShoppingData
  };
  
  console.log('🛒 Fonctions de test Smart Shopping disponibles:');
  console.log('   testShoppingData.save() - Créer des données de test');
  console.log('   testShoppingData.verify() - Vérifier les données');
  console.log('   testShoppingData.clear() - Supprimer les données');
}

// Auto-exécution si appelé directement
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🚀 Création des données de test...');
  saveTestData();
  verifyTestData();
}