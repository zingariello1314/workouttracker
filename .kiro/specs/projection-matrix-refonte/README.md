# Refonte Bloc Projection Matrix

## Vue d'ensemble

Ce projet vise à transformer complètement le bloc Projection Matrix du dashboard en s'inspirant du design futuriste et interactif du fichier `projectionmatriceexemple.md`. L'objectif est de créer un bloc visuellement impressionnant avec des graphiques interactifs, des animations fluides et une expérience utilisateur immersive.

## Objectifs

1. **Traduire le code Vue.js en React** - Convertir l'implémentation Vue.js en composants React modernes
2. **Améliorer l'interface visuelle** - Implémenter le design cyberpunk/futuriste avec effets de glow et animations
3. **Ajouter des graphiques interactifs** - Intégrer des graphiques Canvas pour XP, activités et heatmap
4. **Implémenter le simulateur temps réel** - Permettre aux utilisateurs de simuler différents scénarios
5. **Optimiser les performances** - Assurer une expérience fluide même avec des animations complexes

## Structure du projet

```
.kiro/specs/projection-matrix-refonte/
├── README.md (ce fichier)
├── requirements.md (exigences détaillées)
├── design.md (architecture et design)
└── tasks.md (plan d'implémentation)
```

## Fonctionnalités principales

### 1. Stats principales
- Niveau actuel
- XP total
- Quêtes complétées
- Efficacité en temps réel

### 2. Simulateur temps réel
- Ajustement des quêtes journalières/hebdomadaires
- Calcul automatique des projections
- Modes IA (Sécurisé, Optimiste, Extrême)

### 3. Graphiques avancés
- Évolution XP sur 30 jours (Canvas)
- Répartition des activités par type (barres verticales)
- Matrice d'activité type GitHub (heatmap 20 semaines)

### 4. Effets visuels
- Bordures lumineuses animées
- Glow effects d'arrière-plan
- Transitions fluides
- Indicateurs de statut neural

## Technologies

- React 18+
- Canvas API pour les graphiques
- CSS moderne avec animations
- Hooks personnalisés pour la logique métier

## Prochaines étapes

1. ✅ Créer la structure de spec
2. ⏳ Définir les requirements détaillés
3. ⏳ Concevoir l'architecture
4. ⏳ Créer le plan d'implémentation
5. ⏳ Implémenter phase par phase
