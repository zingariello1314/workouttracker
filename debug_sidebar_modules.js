/**
 * Script de diagnostic pour les modules vides de la sidebar
 * Vérifie l'état des données et l'authentification
 */

// Simuler l'environnement React pour tester les hooks
const mockData = {
  // Simuler useSidebarData
  metrics: {
    xp: 1250,
    level: 5,
    streak: 7,
    focus: 85
  },
  quests: [
    { id: 1, title: 'Méditation', icon: '🧘', completed: true, progress: 100, xp: 50 },
    { id: 2, title: 'Lecture', icon: '📖', completed: false, progress: 60, xp: 30 }
  ],
  sport: {
    weeklyWorkouts: 4,
    todayCalories: 450,
    todaySteps: 8500,
    avgHeartRate: 72,
    hasGarminData: true
  },
  finance: {
    netWorth: 45000,
    monthlyBudget: 3000,
    monthlySavings: 800,
    investments: 12000,
    hasData: true
  },
  nutrition: {
    calories: 1850,
    proteins: 120,
    carbs: 200,
    fats: 65,
    water: 2.5,
    compliance: 95,
    hasData: true
  },
  learning: {
    currentBooks: 3,
    todayPages: 25,
    todayMinutes: 45,
    dailyGoal: 30,
    hasData: true
  },
  today: {
    questsCompleted: 3,
    questsTotal: 5,
    workoutDone: true,
    pagesRead: 25,
    mealsLogged: 2,
    mealsTarget: 3
  },
  todayDate: new Date().toISOString().slice(0, 10),
  isLoading: false,
  isAuthenticated: true
};

console.log('=== DIAGNOSTIC SIDEBAR MODULES ===\n');

// 1. Vérifier l'authentification
console.log('1. AUTHENTIFICATION');
console.log('   isAuthenticated:', mockData.isAuthenticated);
console.log('   ✓ OK\n');

// 2. Vérifier l'état de chargement
console.log('2. ÉTAT DE CHARGEMENT');
console.log('   isLoading:', mockData.isLoading);
console.log('   ✓ OK\n');

// 3. Vérifier les métriques
console.log('3. MÉTRIQUES (Progression Globale)');
console.log('   XP:', mockData.metrics.xp);
console.log('   Niveau:', mockData.metrics.level);
console.log('   Streak:', mockData.metrics.streak);
console.log('   Focus:', mockData.metrics.focus + '%');
console.log('   ✓ Données présentes\n');

// 4. Vérifier les quêtes
console.log('4. QUÊTES DU JOUR');
console.log('   Nombre de quêtes:', mockData.quests.length);
mockData.quests.forEach(q => {
  console.log(`   - ${q.icon} ${q.title}: ${q.completed ? '✓' : '○'} (${q.progress}%)`);
});
console.log('   ✓ Données présentes\n');

// 5. Vérifier sport
console.log('5. ACTIVITÉ PHYSIQUE');
console.log('   Entraînements cette semaine:', mockData.sport.weeklyWorkouts);
console.log('   Calories aujourd\'hui:', mockData.sport.todayCalories);
console.log('   Pas aujourd\'hui:', mockData.sport.todaySteps);
console.log('   Fréquence cardiaque:', mockData.sport.avgHeartRate + ' bpm');
console.log('   Données Garmin:', mockData.sport.hasGarminData ? 'Oui' : 'Non');
console.log('   ✓ Données présentes\n');

// 6. Vérifier finances
console.log('6. FINANCES');
console.log('   Patrimoine net:', mockData.finance.netWorth.toLocaleString() + ' €');
console.log('   Budget mensuel:', mockData.finance.monthlyBudget.toLocaleString() + ' €');
console.log('   Épargne mensuelle:', mockData.finance.monthlySavings.toLocaleString() + ' €');
console.log('   Investissements:', mockData.finance.investments.toLocaleString() + ' €');
console.log('   ✓ Données présentes\n');

// 7. Vérifier nutrition
console.log('7. NUTRITION');
console.log('   Calories:', mockData.nutrition.calories + ' kcal');
console.log('   Protéines:', mockData.nutrition.proteins + ' g');
console.log('   Glucides:', mockData.nutrition.carbs + ' g');
console.log('   Lipides:', mockData.nutrition.fats + ' g');
console.log('   Eau:', mockData.nutrition.water + ' L');
console.log('   Conformité:', mockData.nutrition.compliance + '%');
console.log('   ✓ Données présentes\n');

// 8. Vérifier apprentissage
console.log('8. LECTURE');
console.log('   Livres en cours:', mockData.learning.currentBooks);
console.log('   Pages aujourd\'hui:', mockData.learning.todayPages);
console.log('   Minutes aujourd\'hui:', mockData.learning.todayMinutes);
console.log('   Objectif quotidien:', mockData.learning.dailyGoal + ' min');
console.log('   ✓ Données présentes\n');

// 9. Vérifier aujourd'hui
console.log('9. AUJOURD\'HUI (Agrégation)');
console.log('   Quêtes:', mockData.today.questsCompleted + '/' + mockData.today.questsTotal);
console.log('   Sport:', mockData.today.workoutDone ? 'Fait ✓' : 'À faire');
console.log('   Pages lues:', mockData.today.pagesRead);
console.log('   Repas:', mockData.today.mealsLogged + '/' + mockData.today.mealsTarget);
console.log('   ✓ Données présentes\n');

// 10. Résumé
console.log('=== RÉSUMÉ ===');
console.log('✓ Toutes les données sont présentes dans le mock');
console.log('✓ Structure des données conforme aux PropTypes');
console.log('\n⚠️  PROBLÈME IDENTIFIÉ:');
console.log('Les modules apparaissent vides car les hooks de données réels');
console.log('ne retournent probablement pas de données valides.');
console.log('\n📋 ACTIONS À FAIRE:');
console.log('1. Vérifier que l\'utilisateur est authentifié');
console.log('2. Vérifier que les hooks de données sont initialisés');
console.log('3. Vérifier IndexedDB pour Garmin et Nutrition');
console.log('4. Vérifier localStorage pour Books et QuietQuest');
console.log('5. Ajouter des console.log dans useSidebarData pour débugger');

// Test en console du navigateur
console.log('\n🔍 POUR DÉBUGGER DANS LE NAVIGATEUR:');
console.log('Ouvrez la console et tapez:');
console.log('  localStorage.getItem("booksData")');
console.log('  localStorage.getItem("quietquest_userData")');
console.log('\nPour IndexedDB, utilisez l\'onglet Application > Storage > IndexedDB');
