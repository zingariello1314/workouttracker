# Tests d'Intégration - Suivi Corporel

**Date de création :** 2024-12-19  
**Version :** 1.0  
**Statut :** En cours

---

## 📋 Objectifs des Tests

Vérifier que tous les onglets fonctionnent correctement avec :
1. ✅ Données mixtes (ancien format `skeletalMuscle`/`visceralFat` + nouveau format `muscleMass`/`visceralFatIndex`)
2. ✅ Différentes combinaisons de sources de données (Garmin seul, Endurance seul, combiné)
3. ✅ Absence de doublons dans les calculs
4. ✅ Cohérence des résultats entre les onglets

---

## 🔍 Phase 4.1 : Tests Données Mixtes

### Scénario 1.1 : Données Ancien Format Seulement
**Objectif :** Vérifier que les fallbacks fonctionnent avec des données utilisant uniquement `skeletalMuscle` et `visceralFat`.

**Actions à effectuer :**
1. Créer une entrée d'impédance avec uniquement `skeletalMuscle` (pas de `muscleMass`)
2. Créer une entrée d'impédance avec uniquement `visceralFat` (pas de `visceralFatIndex`)
3. Vérifier dans chaque onglet que les données sont correctement affichées

**Onglets à vérifier :**
- [ ] **Récapitulatif** : Les valeurs doivent être affichées correctement
- [ ] **Corrélations** : Les corrélations impliquant masse musculaire/graisse viscérale doivent fonctionner
- [ ] **Prévisions** : Les prévisions pour masse musculaire/graisse viscérale doivent être générées
- [ ] **Stabilité** : L'analyse de stabilité doit inclure ces métriques
- [ ] **Analyses Intelligentes** : Les analyses doivent reconnaître ces données
- [ ] **Commentaires** : Les commentaires doivent mentionner ces métriques

**Résultat attendu :** ✅ Tous les onglets affichent correctement les données avec fallback

---

### Scénario 1.2 : Données Nouveau Format Seulement
**Objectif :** Vérifier que les nouveaux champs `muscleMass` et `visceralFatIndex` sont correctement utilisés.

**Actions à effectuer :**
1. Créer une entrée d'impédance avec uniquement `muscleMass` (pas de `skeletalMuscle`)
2. Créer une entrée d'impédance avec uniquement `visceralFatIndex` (pas de `visceralFat`)
3. Vérifier dans chaque onglet que les données sont correctement affichées

**Résultat attendu :** ✅ Tous les onglets utilisent les nouveaux champs en priorité

---

### Scénario 1.3 : Données Mixtes (Ancien + Nouveau)
**Objectif :** Vérifier que les données mixtes sont gérées correctement, avec priorité au nouveau format.

**Actions à effectuer :**
1. Créer une entrée avec `skeletalMuscle` = 40 kg et `muscleMass` = 41 kg
2. Créer une entrée avec uniquement `skeletalMuscle` = 40 kg
3. Vérifier que le système utilise `muscleMass` quand disponible, sinon `skeletalMuscle`

**Résultat attendu :** ✅ Priorité donnée au nouveau format, fallback vers ancien format

---

## 🔍 Phase 4.2 : Tests Combinaisons de Sources

### Scénario 2.1 : Garmin Seul (sans Endurance)
**Objectif :** Vérifier que les calculs fonctionnent avec uniquement les données Garmin.

**Actions à effectuer :**
1. S'assurer qu'il n'y a pas de données Endurance dans la période
2. Vérifier que les calories Garmin sont correctement utilisées
3. Vérifier l'absence d'erreurs dans les onglets

**Onglets à vérifier :**
- [ ] **Analyses Intelligentes** : Les calories doivent provenir uniquement de Garmin
- [ ] **Prévisions** : Les ajustements caloriques doivent utiliser uniquement Garmin
- [ ] **Commentaires** : Les commentaires doivent mentionner uniquement Garmin

**Résultat attendu :** ✅ Pas d'erreurs, calculs corrects avec Garmin seul

---

### Scénario 2.2 : Endurance Seul (sans Garmin)
**Objectif :** Vérifier que les calculs fonctionnent avec uniquement les données Endurance.

**Actions à effectuer :**
1. S'assurer qu'il n'y a pas de données Garmin dans la période
2. Vérifier que les calories Endurance sont correctement utilisées
3. Vérifier l'absence d'erreurs dans les onglets

**Résultat attendu :** ✅ Pas d'erreurs, calculs corrects avec Endurance seul

---

### Scénario 2.3 : Garmin + Endurance (avec déduplication)
**Objectif :** Vérifier que la déduplication fonctionne correctement.

**Actions à effectuer :**
1. Créer une session Endurance le même jour qu'une activité Garmin
2. Vérifier que les calories ne sont pas comptées deux fois
3. Vérifier que les corrélations utilisent les données dédupliquées

**Onglets à vérifier :**
- [ ] **Corrélations** : Les corrélations Endurance doivent exclure les dates avec Garmin
- [ ] **Analyses Intelligentes** : Les calories totales doivent être dédupliquées
- [ ] **Commentaires** : Les commentaires doivent mentionner la déduplication

**Résultat attendu :** ✅ Pas de doublons, priorité Garmin > Endurance

---

### Scénario 2.4 : History Seul (sans Garmin/Endurance)
**Objectif :** Vérifier que le volume d'entraînement est calculé correctement depuis History.

**Actions à effectuer :**
1. S'assurer qu'il n'y a pas de données Garmin/Endurance
2. Vérifier que les corrélations volume vs changements corporels fonctionnent
3. Vérifier que les prévisions utilisent le volume d'entraînement

**Résultat attendu :** ✅ Volume calculé correctement depuis History

---

## 🔍 Phase 4.3 : Vérification Absence de Doublons

### Test 3.1 : Calories
**Objectif :** Vérifier qu'aucune calorie n'est comptée deux fois.

**Méthode de vérification :**
1. Ouvrir la console du navigateur
2. Exécuter la fonction de validation (voir section "Fonctions de Validation" ci-dessous)
3. Vérifier que `totalCaloriesWithoutDuplicates` correspond à la somme attendue

**Résultat attendu :** ✅ Aucun doublon détecté

---

### Test 3.2 : Sessions Endurance
**Objectif :** Vérifier que les sessions Endurance ne sont pas comptées deux fois.

**Méthode de vérification :**
1. Vérifier que les sessions Endurance sur les mêmes dates que Garmin sont exclues
2. Vérifier que les commentaires mentionnent le bon nombre de sessions

**Résultat attendu :** ✅ Sessions dédupliquées correctement

---

### Test 3.3 : Corrélations
**Objectif :** Vérifier que les corrélations utilisent des données dédupliquées.

**Méthode de vérification :**
1. Vérifier que les corrélations volume vs poids utilisent uniquement les données History
2. Vérifier que les corrélations Endurance excluent les dates avec Garmin

**Résultat attendu :** ✅ Corrélations utilisent données dédupliquées

---

## 🔍 Phase 4.4 : Vérification Cohérence des Résultats

### Test 4.1 : Cohérence Prévisions
**Objectif :** Vérifier que les prévisions sont cohérentes avec les données historiques.

**Méthode de vérification :**
1. Vérifier que la prévision pour un mois est dans une plage raisonnable (basée sur la tendance)
2. Vérifier que les ajustements sont proportionnels (ex: volume élevé → ajustement positif pour muscleMass)
3. Vérifier que les intervalles de confiance sont cohérents

**Résultat attendu :** ✅ Prévisions cohérentes et raisonnables

---

### Test 4.2 : Cohérence Corrélations
**Objectif :** Vérifier que les corrélations sont dans des plages raisonnables (-1 à +1).

**Méthode de vérification :**
1. Vérifier que toutes les corrélations sont entre -1 et +1
2. Vérifier que les p-values sont cohérentes avec la force de corrélation
3. Vérifier que les descriptions de corrélation correspondent à la valeur

**Résultat attendu :** ✅ Corrélations valides et cohérentes

---

### Test 4.3 : Cohérence Recommandations
**Objectif :** Vérifier que les recommandations sont pertinentes.

**Méthode de vérification :**
1. Vérifier que les recommandations correspondent à l'analyse (ex: stabilité instable → recommandation régularité)
2. Vérifier que les recommandations ne sont pas contradictoires
3. Vérifier que les recommandations sont actionnables

**Résultat attendu :** ✅ Recommandations pertinentes et cohérentes

---

## 🛠️ Fonctions de Validation (Console)

Pour faciliter les tests, ces fonctions peuvent être exécutées dans la console du navigateur :

```javascript
// Vérifier absence de doublons calories
window.validateCalorieDeduplication = async function() {
  const { useWorkout } = await import('./src/context/WorkoutContext');
  const { useGarminData } = await import('./src/hooks/useGarminData');
  const { combineDailyCalories } = await import('./src/components/BodyTracking/utils/enduranceIntegration');
  
  // Logique de validation...
  console.log('Validation calories:', result);
};

// Vérifier cohérence données
window.validateDataConsistency = function() {
  // Logique de validation...
  console.log('Validation cohérence:', result);
};
```

---

## ✅ Checklist Finale

Avant de considérer les tests comme terminés, vérifier :

- [ ] Tous les scénarios Phase 4.1 passent (données mixtes)
- [ ] Tous les scénarios Phase 4.2 passent (combinaisons sources)
- [ ] Tous les tests Phase 4.3 passent (absence de doublons)
- [ ] Tous les tests Phase 4.4 passent (cohérence résultats)
- [ ] Aucune erreur dans la console du navigateur
- [ ] Tous les onglets s'affichent correctement
- [ ] Les performances sont acceptables (< 2s pour calculs)

---

## 📝 Notes de Test

**Date :** ___________  
**Testeur :** ___________  
**Version testée :** ___________  

**Problèmes rencontrés :**
- 

**Corrections apportées :**
- 

**Résultat global :** [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

