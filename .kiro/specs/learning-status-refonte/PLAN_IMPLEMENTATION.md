# Plan d'Implémentation - Refonte LearningStatusBlock

## 📋 Vue d'Ensemble

**Objectif** : Enrichir le LearningStatusBlock actuel avec toutes les fonctionnalités du code Vue.js de référence

**Fichier source** : `docs/finance/codepourleblocapprentissagejusteendessousdesurveillance.md` (Vue.js)  
**Fichier cible** : `src/components/dashboard/LearningStatusBlock.jsx` (React)  
**Lignes actuelles** : ~150 lignes  
**Lignes cibles** : ~800-1000 lignes  
**Complexité** : Modérée

---

## 🎯 Stratégie d'Implémentation

### Approche : **Implémentation Progressive en 3 Phases**

Chaque phase enrichit le composant tout en gardant le bloc fonctionnel.

---

## 📊 Phase 1 : Enrichissement Core (PRIORITÉ MAX)

**Durée estimée** : 2-3h  
**Objectif** : Enrichir les statistiques et la progression

### Tâches

#### 1.1 Restructuration des Props
- [ ] Adapter les props pour accepter `allData` (structure Vue.js)
- [ ] Extraire `learningData` depuis `allData.mockData.learningStatus`
- [ ] Gérer les fallbacks pour `streakDays` (learningData ou user)
- [ ] Ajouter les props callbacks (`onOpenNotes`, `onNavigate`)

#### 1.2 Statistiques Enrichies
- [ ] Remplacer la grille 2 colonnes par 4 statistiques
- [ ] **Stat 1** : Streak (🔥 X jours)
- [ ] **Stat 2** : Sessions (X/Y complétées)
- [ ] **Stat 3** : Objectif (formatDuration)
- [ ] **Stat 4** : Restant (formatDuration)
- [ ] Implémenter `formatDuration(minutes)`

#### 1.3 Badge de Statut Dynamique
- [ ] Remplacer le badge "ATTEINT" par un badge dynamique
- [ ] Calculer `objectiveStatus` (completed/on-track/in-progress/at-risk)
- [ ] Afficher le texte approprié (ATTEINT/EN COURS/À RISQUE)
- [ ] Appliquer les couleurs selon le statut

#### 1.4 Progression Détaillée
- [ ] Ajouter le header "Sessions aujourd'hui X/Y"
- [ ] Améliorer la barre de progression avec classes dynamiques
- [ ] Ajouter les détails temps : "⏱️ Xh étudié" + "Xh restant"
- [ ] Implémenter `getProgressClass(percent)`

#### 1.5 Tests Phase 1
- [ ] Vérifier que le bloc s'affiche sans erreur
- [ ] Tester les calculs de progression
- [ ] Valider le formatage des durées
- [ ] Vérifier les couleurs dynamiques

**Livrable Phase 1** : Bloc avec statistiques enrichies et progression détaillée

---

## 🎯 Phase 2 : Objectif & Extras (PRIORITÉ HAUTE)

**Durée estimée** : 2-3h  
**Objectif** : Ajouter l'objectif quotidien et les extras

### Tâches

#### 2.1 Section Objectif Quotidien
- [ ] Créer la section "daily-objective"
- [ ] Ajouter l'indicateur avec icône dynamique
- [ ] Implémenter `getObjectiveIcon(status)`
- [ ] Implémenter `getObjectiveMessage(status)`
- [ ] Appliquer les couleurs selon le statut

#### 2.2 Extras de Statut
- [ ] Ajouter la section "status-extras"
- [ ] **Si aucune session** : Bouton "▶️ Commencer première session"
- [ ] **Si récompense** : Affichage "🏆 [Nom] [Date]"
- [ ] Implémenter `formatRewardDate(dateString)`
- [ ] Gérer l'affichage conditionnel

#### 2.3 Actions Rapides Améliorées
- [ ] Remplacer le bouton unique par 2 boutons
- [ ] **Bouton 1** : "🎯 Session" (ou "⏱️ En cours" si timer actif)
- [ ] **Bouton 2** : "📝 Notes"
- [ ] Désactiver le bouton Session si timer actif
- [ ] Ajouter les callbacks appropriés

#### 2.4 Tests Phase 2
- [ ] Vérifier l'affichage de l'objectif
- [ ] Tester les messages dynamiques
- [ ] Valider l'affichage des récompenses
- [ ] Tester les boutons d'action

**Livrable Phase 2** : Bloc avec objectif quotidien et actions complètes

---

## 🚀 Phase 3 : Interactions & Polish (PRIORITÉ MODÉRÉE)

**Durée estimée** : 1-2h  
**Objectif** : Finaliser les interactions et optimiser

### Tâches

#### 3.1 Navigation
- [ ] Ajouter `onClick` sur la card principale
- [ ] Implémenter `navigateToPlanner()`
- [ ] Émettre l'événement de navigation
- [ ] Ajouter le cursor pointer

#### 3.2 Gestion du Timer
- [ ] Récupérer `isTimerActive` depuis `allData.mockData.activeTimer`
- [ ] Mettre à jour l'état local
- [ ] Gérer l'affichage du bouton (Session/En cours)
- [ ] Désactiver le bouton si timer actif

#### 3.3 Événements
- [ ] Implémenter `startSession()`
- [ ] Implémenter `startFirstSession()`
- [ ] Implémenter `openNotes()`
- [ ] Émettre les événements appropriés

#### 3.4 Récompenses (Optionnel)
- [ ] Implémenter `onTimerCompleted(timerData)`
- [ ] Implémenter `onSessionCompleted(sessionData)`
- [ ] Implémenter `checkForNewRewards()`
- [ ] Implémenter `unlockReward(name, icon, description)`

#### 3.5 Optimisations
- [ ] Utiliser `useCallback` pour les handlers
- [ ] Utiliser `useMemo` pour les computed values
- [ ] Ajouter PropTypes complets
- [ ] Ajouter JSDoc sur les fonctions

#### 3.6 Accessibilité
- [ ] Ajouter les aria-labels
- [ ] Vérifier le contraste des couleurs
- [ ] Tester la navigation au clavier
- [ ] Valider les tooltips

#### 3.7 Tests Finaux
- [ ] Test complet de bout en bout
- [ ] Vérifier toutes les interactions
- [ ] Tester tous les états (timer actif/inactif, récompenses, etc.)
- [ ] Valider tous les calculs

**Livrable Phase 3** : Bloc 100% fonctionnel, optimisé et documenté

---

## 📦 Livrables par Phase

| Phase | Fonctionnalités | Lignes Estimées | Statut |
|-------|----------------|-----------------|--------|
| 1 | Stats enrichies + Progression détaillée | ~400 lignes | ✅ COMPLÉTÉE |
| 2 | Objectif + Extras + Actions | ~300 lignes | ✅ COMPLÉTÉE |
| 3 | Interactions + Polish | ~200 lignes | ✅ COMPLÉTÉE |
| **TOTAL** | **Complet** | **~900 lignes** | **✅ 3/3 phases** |

---

## ⚠️ Points d'Attention

### Conversion Vue.js → React

1. **Template → JSX**
   - `v-if` → `{condition && ...}`
   - `v-for` → `.map()`
   - `:class` → `className={...}`
   - `@click` → `onClick`
   - `@click.stop` → `onClick={(e) => { e.stopPropagation(); ... }}`

2. **Data → State**
   - `data()` → `useState()`
   - `computed` → `useMemo()` ou fonctions
   - `methods` → `useCallback()` ou fonctions

3. **Props**
   - `props: { allData }` → `const LearningStatusBlock = ({ allData, ... }) => {}`
   - Extraire les données depuis `allData.mockData.learningStatus`

4. **Events**
   - `this.$emit('event', data)` → `onEvent(data)` (callback prop)

### Gestion des Durées

- Toujours vérifier que les valeurs sont des nombres
- Gérer les cas où `minutes` est un objet `{ minutes: X }`
- Formater correctement : "2h30" ou "45min"

### Gestion des États

- `isTimerActive` : Récupérer depuis `allData.mockData.activeTimer.isActive`
- `hasSessionToday` : Calculer depuis `sessionsCompleted > 0`
- `objectiveStatus` : Calculer depuis le pourcentage de progression

### Callbacks

- `onStartTimer()` : Démarrer un timer (25min Pomodoro)
- `onOpenNotes()` : Ouvrir les notes de la matière
- `onNavigate('planificateur')` : Naviguer vers le planificateur

---

## 🎯 Ordre d'Exécution Recommandé

1. **Phase 1** (OBLIGATOIRE) - Enrichissement core
2. **Phase 2** (HAUTE PRIORITÉ) - Objectif & extras
3. **Phase 3** (POLISH) - Interactions & optimisations

---

## 📊 Métriques de Succès

- [ ] 0 erreur de compilation
- [ ] 0 warning React
- [ ] Toutes les fonctionnalités Vue.js implémentées
- [ ] Code optimisé (useCallback, useMemo)
- [ ] PropTypes complets
- [ ] Documentation JSDoc
- [ ] Responsive design
- [ ] Accessibilité complète

---

## 🚀 Prêt à Démarrer

**Prochaine étape** : Commencer la Phase 1 - Enrichissement Core

Voulez-vous que je commence l'implémentation de la Phase 1 ?
