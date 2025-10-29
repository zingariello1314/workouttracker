// Analyse du graphique "Objectifs"
console.log('🔍 Analyse du graphique "Objectifs"');

// Simuler des données réalistes
const testData = {
  workoutHistory: [
    { date: '2025-01-28', totalReps: 200 },
    { date: '2025-01-25', totalReps: 180 },
    { date: '2025-01-22', totalReps: 150 },
    { date: '2025-01-20', totalReps: 120 },
    { date: '2025-01-18', totalReps: 160 },
    { date: '2025-01-15', totalReps: 140 },
    { date: '2025-01-12', totalReps: 130 },
    { date: '2025-01-10', totalReps: 110 }
  ],
  data: {
    progressEntries: [
      {
        type: 'metrics',
        date: '2025-01-28',
        weight: 65,
        measurements: { waist: 77 }
      },
      {
        type: 'metrics',
        date: '2025-01-15',
        weight: 67,
        measurements: { waist: 79 }
      },
      {
        type: 'metrics',
        date: '2025-01-01',
        weight: 70,
        measurements: { waist: 82 }
      }
    ]
  }
};

// Calcul actuel (problématique)
const calculateCurrentObjectives = (data) => {
  const workoutHistory = data.workoutHistory || [];
  const progressEntries = data.data?.progressEntries || [];
  
  // Calculer les répétitions totales pour la période
  const totalReps = workoutHistory.reduce((sum, session) => sum + (session.totalReps || 0), 0);
  
  // Calculer l'objectif reps/semaine basé sur la fréquence réelle
  const totalSessions = workoutHistory.length;
  const weeks = Math.max(1, Math.ceil(totalSessions / 3)); // Approximation des semaines
  const currentRepsPerWeek = weeks > 0 ? totalReps / weeks : 0;
  
  // Objectif réaliste basé sur la performance actuelle + 20%
  const targetRepsPerWeek = Math.max(800, Math.round(currentRepsPerWeek * 1.2));
  
  // Récupérer les dernières métriques
  const latestMetrics = progressEntries
    .filter(entry => entry.type === 'metrics')
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  
  // Récupérer les premières métriques pour calculer les objectifs
  const firstMetrics = progressEntries
    .filter(entry => entry.type === 'metrics')
    .sort((a, b) => new Date(a.date) - new Date(a.date))[0];
  
  const currentWeight = latestMetrics?.weight || 65;
  const currentWaist = latestMetrics?.measurements?.waist || 77;
  
  // Objectifs réalistes basés sur les données actuelles
  const targetWeight = firstMetrics?.weight ? Math.max(60, firstMetrics.weight - 5) : 65;
  const targetWaist = firstMetrics?.measurements?.waist ? Math.max(70, firstMetrics.measurements.waist - 7) : 77;
  
  return {
    reps: {
      current: Math.round(currentRepsPerWeek),
      target: targetRepsPerWeek,
      weeks: weeks,
      totalReps: totalReps
    },
    weight: {
      current: currentWeight,
      target: targetWeight,
      firstWeight: firstMetrics?.weight
    },
    waist: {
      current: currentWaist,
      target: targetWaist,
      firstWaist: firstMetrics?.measurements?.waist
    }
  };
};

// Calcul corrigé
const calculateCorrectedObjectives = (data) => {
  const workoutHistory = data.workoutHistory || [];
  const progressEntries = data.data?.progressEntries || [];
  
  // 1. REPS/SEMAINE - Calcul correct basé sur les vraies semaines
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(now.getDate() - 28);
  
  // Calculer les reps des 4 dernières semaines
  const recentSessions = workoutHistory.filter(session => 
    new Date(session.date) >= fourWeeksAgo
  );
  
  const totalReps = recentSessions.reduce((sum, session) => sum + (session.totalReps || 0), 0);
  const actualWeeks = Math.max(1, Math.ceil((now - fourWeeksAgo) / (7 * 24 * 60 * 60 * 1000)));
  const currentRepsPerWeek = totalReps / actualWeeks;
  
  // Objectif basé sur la performance récente + 20%
  const targetRepsPerWeek = Math.max(800, Math.round(currentRepsPerWeek * 1.2));
  
  // 2. POIDS - Utiliser les vraies données de progression
  const latestMetrics = progressEntries
    .filter(entry => entry.type === 'metrics')
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  
  const firstMetrics = progressEntries
    .filter(entry => entry.type === 'metrics')
    .sort((a, b) => new Date(a.date) - new Date(a.date))
    .slice(-1)[0]; // Première entrée (la plus ancienne)
  
  const currentWeight = latestMetrics?.weight || 65;
  const firstWeight = firstMetrics?.weight || currentWeight;
  
  // Objectif de perte de poids réaliste (5% du poids initial)
  const targetWeight = Math.max(60, Math.round(firstWeight * 0.95));
  
  // 3. TOUR DE TAILLE - Utiliser les vraies données de progression
  const currentWaist = latestMetrics?.measurements?.waist || 77;
  const firstWaist = firstMetrics?.measurements?.waist || currentWaist;
  
  // Objectif de réduction réaliste (5% du tour de taille initial)
  const targetWaist = Math.max(70, Math.round(firstWaist * 0.95));
  
  return {
    reps: {
      current: Math.round(currentRepsPerWeek),
      target: targetRepsPerWeek,
      actualWeeks: actualWeeks,
      totalReps: totalReps,
      recentSessions: recentSessions.length
    },
    weight: {
      current: currentWeight,
      target: targetWeight,
      firstWeight: firstWeight,
      progress: Math.max(0, Math.min(100, ((firstWeight - currentWeight) / (firstWeight - targetWeight)) * 100))
    },
    waist: {
      current: currentWaist,
      target: targetWaist,
      firstWaist: firstWaist,
      progress: Math.max(0, Math.min(100, ((firstWaist - currentWaist) / (firstWaist - targetWaist)) * 100))
    }
  };
};

// Analyser les résultats
const analyzeResults = () => {
  console.log('\n📊 Données de test:');
  console.log(`  - Sessions: ${testData.workoutHistory.length}`);
  console.log(`  - Total reps: ${testData.workoutHistory.reduce((sum, s) => sum + s.totalReps, 0)}`);
  console.log(`  - Entrées de progression: ${testData.data.progressEntries.length}`);
  
  console.log('\n🔍 Calcul actuel (problématique):');
  const currentResult = calculateCurrentObjectives(testData);
  console.log('  REPS/SEMAINE:');
  console.log(`    - Actuel: ${currentResult.reps.current} reps/semaine`);
  console.log(`    - Objectif: ${currentResult.reps.target} reps/semaine`);
  console.log(`    - Semaines calculées: ${currentResult.reps.weeks} (approximation incorrecte)`);
  console.log('  POIDS:');
  console.log(`    - Actuel: ${currentResult.weight.current} kg`);
  console.log(`    - Objectif: ${currentResult.weight.target} kg`);
  console.log(`    - Premier poids: ${currentResult.weight.firstWeight} kg`);
  console.log('  TOUR DE TAILLE:');
  console.log(`    - Actuel: ${currentResult.waist.current} cm`);
  console.log(`    - Objectif: ${currentResult.waist.target} cm`);
  
  console.log('\n✅ Calcul corrigé:');
  const correctedResult = calculateCorrectedObjectives(testData);
  console.log('  REPS/SEMAINE:');
  console.log(`    - Actuel: ${correctedResult.reps.current} reps/semaine`);
  console.log(`    - Objectif: ${correctedResult.reps.target} reps/semaine`);
  console.log(`    - Vraies semaines: ${correctedResult.reps.actualWeeks}`);
  console.log(`    - Sessions récentes: ${correctedResult.reps.recentSessions}`);
  console.log('  POIDS:');
  console.log(`    - Actuel: ${correctedResult.weight.current} kg`);
  console.log(`    - Objectif: ${correctedResult.weight.target} kg`);
  console.log(`    - Premier poids: ${correctedResult.weight.firstWeight} kg`);
  console.log(`    - Progression: ${correctedResult.weight.progress.toFixed(1)}%`);
  console.log('  TOUR DE TAILLE:');
  console.log(`    - Actuel: ${correctedResult.waist.current} cm`);
  console.log(`    - Objectif: ${correctedResult.waist.target} cm`);
  console.log(`    - Premier tour: ${correctedResult.waist.firstWaist} cm`);
  console.log(`    - Progression: ${correctedResult.waist.progress.toFixed(1)}%`);
  
  console.log('\n🚨 Problèmes identifiés:');
  console.log('  1. Calcul des semaines incorrect (sessions/3 au lieu de vraies semaines)');
  console.log('  2. Objectifs de poids/taille basés sur les données actuelles au lieu des premières');
  console.log('  3. Pas de calcul de progression réelle');
  console.log('  4. Logique de "première métrique" incorrecte');
  
  console.log('\n✅ Corrections apportées:');
  console.log('  1. Calcul des semaines basé sur les 4 dernières semaines réelles');
  console.log('  2. Objectifs basés sur les premières données (début de suivi)');
  console.log('  3. Calcul de progression réelle pour poids/taille');
  console.log('  4. Logique de récupération des métriques corrigée');
  
  return { currentResult, correctedResult };
};

// Exécuter l'analyse
const result = analyzeResults();
