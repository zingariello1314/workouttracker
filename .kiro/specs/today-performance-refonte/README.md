# Refonte Today Performance Block

## Vue d'Ensemble

**Projet**: Refonte complète du bloc "Performance Aujourd'hui"  
**Composant**: TodayPerformanceBlock.jsx  
**Priorité**: MODERATE  
**Status**: 📋 Spécification en cours  

## Contexte

Le bloc "Today Performance" actuel est fonctionnel mais limité. La nouvelle version proposée dans `todayperformanceexemple.md` apporte des fonctionnalités avancées et une expérience utilisateur considérablement améliorée.

## Objectifs

### Objectif Principal
Remplacer l'implémentation actuelle par une version enrichie qui offre:
- Visualisation détaillée des performances quotidiennes
- Comparaisons intelligentes avec les jours précédents
- Recommandations IA personnalisées
- Historique personnel avec graphiques
- Système de missions hebdomadaires interactif
- Gestion dynamique des groupes musculaires

### Objectifs Secondaires
- Maintenir la cohérence visuelle avec le thème cyberpunk
- Optimiser les performances avec des données temps réel
- Assurer la persistance des données dans IndexedDB
- Créer des composants réutilisables pour d'autres blocs

## Analyse Comparative

### Version Actuelle (TodayPerformanceBlock.jsx)
**Lignes**: ~250  
**Fonctionnalités**:
- Sélecteur de muscles basique
- Volume par groupe musculaire
- Records de la semaine
- Missions hebdomadaires (lecture seule)
- Performance live simple
- Comparaison vs hier (4 métriques)
- Accomplissements du jour
- Recommandations IA (liste simple)

### Version Proposée (todayperformanceexemple.md)
**Lignes**: ~2800  
**Nouvelles Fonctionnalités**:
- ✨ Sélecteur de muscles interactif avec sauvegarde
- ✨ Grille visuelle des groupes musculaires avec images
- ✨ Formulaire de création de nouveaux muscles/exercices
- ✨ Upload d'images pour les muscles
- ✨ Records hebdomadaires avec célébration animée
- ✨ Missions hebdomadaires éditables avec ajout dynamique
- ✨ Graphique de progression sur 7 jours
- ✨ Comparaisons détaillées (8+ métriques)
- ✨ Bloc accomplissements enrichi avec stats
- ✨ Recommandations IA avec rotation et priorités
- ✨ Historique personnel avec 3 périodes (mois/trimestre/année)
- ✨ Graphiques historiques interactifs
- ✨ Tooltips informatifs
- ✨ Animations et effets visuels avancés

## Différences Clés

| Aspect | Actuel | Proposé | Amélioration |
|--------|--------|---------|--------------|
| Interactivité | Faible | Élevée | +400% |
| Visualisations | Basiques | Avancées | +500% |
| Données affichées | 15 points | 50+ points | +233% |
| Formulaires | 0 | 2 | Nouveau |
| Graphiques | 0 | 3 | Nouveau |
| Animations | Minimales | Riches | +300% |
| Persistance | Partielle | Complète | +100% |

## Architecture Proposée

### Composants Principaux
1. **TodayPerformanceBlock** (composant principal)
2. **MuscleGroupGrid** (grille visuelle des muscles)
3. **MuscleCreateForm** (formulaire création muscle)
4. **MissionWeeklyGrid** (grille missions hebdomadaires)
5. **MissionAddForm** (formulaire ajout mission)
6. **ProgressionChart** (graphique 7 jours)
7. **ComparisonMetrics** (métriques comparatives)
8. **AchievementsPanel** (panneau accomplissements)
9. **AIRecommendations** (recommandations IA avec rotation)
10. **PersonalHistory** (historique avec graphiques)

### Nouveaux Hooks
- `useMuscleGroups()` - Gestion des groupes musculaires
- `useWeeklyMissions()` - Gestion des missions
- `usePerformanceComparison()` - Calculs de comparaison
- `usePersonalHistory()` - Données historiques
- `useAIRecommendations()` - Rotation des recommandations

### Storage Extensions
```javascript
// Nouvelles APIs dans dashboardStorage.js
muscleGroupsAPI: {
  getAll, create, update, delete, uploadImage
}

missionsAPI: {
  getWeekly, create, toggle, delete
}

performanceHistoryAPI: {
  get, getByPeriod, calculateTrends
}

aiRecommendationsAPI: {
  get, rotate, markApplied
}
```

## Bénéfices Attendus

### Pour l'Utilisateur
- 📊 Vision complète de ses performances
- 🎯 Objectifs clairs et mesurables
- 🤖 Conseils personnalisés et actionnables
- 📈 Suivi de progression à long terme
- 🎮 Gamification avec missions et accomplissements
- ✨ Expérience visuelle immersive

### Pour le Développement
- 🧩 Composants réutilisables
- 📦 Architecture modulaire
- 🔄 Code maintenable
- 🚀 Performance optimisée
- 📝 Documentation complète

## Prochaines Étapes

1. ✅ Créer la spec (ce document)
2. 📋 Définir les requirements détaillés
3. 🎨 Créer le design document
4. 📝 Établir le plan d'implémentation
5. 💻 Implémenter par phases
6. ✅ Tests et validation
7. 🚀 Déploiement

## Estimation

**Complexité**: Élevée  
**Durée estimée**: 8-12 heures  
**Phases**: 4 phases d'implémentation  
**Lignes de code**: ~3500 lignes (composant + hooks + storage)

---

**Créé**: 2024-12-07  
**Status**: 📋 En spécification  
**Priorité**: MODERATE
