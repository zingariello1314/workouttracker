# Requirements Document - Refonte Allocation Salaire

## Introduction

Ce document décrit les exigences pour la modernisation du bloc "Allocation Salaire" du dashboard QuietQuest. L'objectif est d'appliquer une esthétique liquid glass moderne tout en améliorant l'expérience utilisateur et la cohérence visuelle avec les autres blocs du dashboard.

## Glossary

- **Liquid Glass**: Style de design utilisant la transparence, le backdrop-blur et des effets de profondeur pour créer un effet de verre liquide
- **Glassmorphism**: Technique de design utilisant des arrière-plans semi-transparents avec effet de flou
- **Backdrop-blur**: Effet CSS qui floute le contenu derrière un élément
- **Allocation**: Répartition du salaire mensuel en différentes catégories (épargne, investissement, dépenses, loisirs)
- **Recommandation**: Suggestion d'optimisation basée sur la comparaison entre allocation actuelle et cible
- **Dashboard**: Interface principale affichant l'ensemble des blocs d'information

## Requirements

### Requirement 1: Style Liquid Glass

**User Story:** En tant qu'utilisateur, je veux que le bloc Allocation Salaire utilise un design liquid glass moderne, afin d'avoir une interface visuellement cohérente et élégante.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL appliquer un effet glassmorphism avec `bg-white/5` et `backdrop-blur-2xl`
2. THE système SHALL utiliser des bordures subtiles avec `border-white/10` à `border-white/15`
3. THE système SHALL appliquer des ombres douces avec `shadow-2xl shadow-black/20`
4. WHEN l'utilisateur survole des éléments interactifs THEN le système SHALL augmenter l'effet de blur à `backdrop-blur-3xl`
5. THE système SHALL utiliser des transitions fluides de `duration-500` pour tous les effets
6. THE système SHALL maintenir une transparence cohérente entre `bg-white/3` et `bg-white/10` selon la hiérarchie
7. THE système SHALL appliquer un effet de glow subtil avec `shadow-white/20` au hover

### Requirement 2: Header Modernisé

**User Story:** En tant qu'utilisateur, je veux un header clair et moderne, afin d'identifier rapidement le bloc et le montant du salaire.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher une icône DollarSign dans un conteneur glassmorphism
2. THE système SHALL afficher le titre "Allocation Salaire" avec une typographie claire
3. THE système SHALL afficher le sous-titre "Répartition mensuelle optimisée" en texte secondaire
4. THE système SHALL afficher le salaire mensuel dans un badge glassmorphism avec effet de glow
5. THE système SHALL utiliser une couleur d'accent verte (`text-emerald-400`) pour les montants
6. THE système SHALL appliquer un effet de hover sur le badge salaire avec scale et glow
7. THE système SHALL organiser le header en flexbox avec justification space-between

### Requirement 3: Graphique d'Allocation Modernisé

**User Story:** En tant qu'utilisateur, je veux voir ma répartition actuelle dans un graphique moderne, afin de comprendre visuellement mon allocation.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher un graphique circulaire (donut chart)
2. THE système SHALL afficher le total au centre du graphique avec typographie grande et claire
3. THE système SHALL afficher chaque catégorie avec une couleur distinctive et un effet glassmorphism
4. THE système SHALL afficher pour chaque catégorie: nom, montant, pourcentage
5. WHEN l'utilisateur survole une catégorie THEN le système SHALL appliquer un effet de glow et scale
6. THE système SHALL utiliser des couleurs cohérentes: bleu (épargne), violet (investissement), vert (dépenses), orange (loisirs)
7. THE système SHALL afficher les barres de catégories avec backdrop-blur et bordures subtiles
8. THE système SHALL organiser le graphique et les catégories en grid responsive

### Requirement 4: Recommandations Optimisées

**User Story:** En tant qu'utilisateur, je veux voir des recommandations d'optimisation claires, afin d'améliorer mon allocation financière.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher une section "Recommandations d'optimisation"
2. THE système SHALL calculer l'écart entre allocation actuelle et recommandée pour chaque catégorie
3. WHEN l'allocation est optimale THEN le système SHALL afficher un badge "✓ Optimal" en vert
4. WHEN l'allocation nécessite amélioration THEN le système SHALL afficher un badge "⚠ À améliorer" en orange
5. THE système SHALL afficher pour chaque recommandation: catégorie, actuel, recommandé, écart
6. THE système SHALL utiliser un style glassmorphism pour les cartes de recommandation
7. WHEN l'utilisateur survole une recommandation THEN le système SHALL appliquer un effet de lift avec shadow
8. THE système SHALL afficher l'écart en pourcentage avec une couleur distinctive

### Requirement 5: Actions Rapides Modernisées

**User Story:** En tant qu'utilisateur, je veux des boutons d'action modernes, afin d'optimiser ou personnaliser mon allocation facilement.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher deux boutons d'action
2. THE système SHALL afficher un bouton "Optimiser automatiquement" avec style glassmorphism et gradient vert
3. THE système SHALL afficher un bouton "Personnaliser" avec style glassmorphism neutre
4. WHEN l'utilisateur survole un bouton THEN le système SHALL appliquer scale, glow et backdrop-blur-3xl
5. WHEN l'utilisateur clique sur "Optimiser" THEN le système SHALL émettre un événement avec action 'optimize'
6. WHEN l'utilisateur clique sur "Personnaliser" THEN le système SHALL émettre un événement avec action 'custom'
7. THE système SHALL utiliser des transitions fluides de 500ms pour tous les effets de hover
8. THE système SHALL organiser les boutons en flexbox avec gap approprié

### Requirement 6: Animations et Transitions

**User Story:** En tant qu'utilisateur, je veux des animations fluides, afin d'avoir une expérience interactive agréable.

#### Acceptance Criteria

1. WHEN un élément devient visible THEN le système SHALL appliquer une animation de fade-in
2. WHEN l'utilisateur survole un élément interactif THEN le système SHALL appliquer une transition de 500ms
3. THE système SHALL utiliser des transformations GPU (transform, opacity) pour les performances
4. WHEN l'utilisateur survole une carte THEN le système SHALL appliquer translateY(-2px) et scale(1.02)
5. THE système SHALL utiliser ease-in-out pour toutes les transitions
6. WHEN l'utilisateur survole le badge salaire THEN le système SHALL appliquer scale(1.05) et glow
7. THE système SHALL maintenir 60fps pour toutes les animations

### Requirement 7: Responsive et Accessibilité

**User Story:** En tant qu'utilisateur, je veux que le bloc soit responsive et accessible, afin de l'utiliser sur tous les appareils.

#### Acceptance Criteria

1. WHEN l'écran est petit THEN le système SHALL adapter le layout en colonne unique
2. THE système SHALL maintenir la lisibilité sur tous les breakpoints
3. THE système SHALL utiliser des tailles de police adaptatives (text-sm, text-base, text-xl)
4. THE système SHALL maintenir des contrastes suffisants pour l'accessibilité (WCAG AA)
5. THE système SHALL supporter la navigation au clavier
6. THE système SHALL fournir des labels ARIA appropriés
7. WHEN le bloc est en loading THEN le système SHALL afficher un skeleton glassmorphism

### Requirement 8: État de Chargement

**User Story:** En tant qu'utilisateur, je veux voir un état de chargement élégant, afin de comprendre que les données sont en cours de récupération.

#### Acceptance Criteria

1. WHEN les données ne sont pas disponibles THEN le système SHALL afficher un skeleton glassmorphism
2. THE système SHALL afficher une animation de pulse pour le skeleton
3. THE système SHALL maintenir la structure du layout pendant le chargement
4. THE système SHALL utiliser le même style glassmorphism que le contenu final
5. THE système SHALL afficher un message "Chargement de l'allocation..." avec style approprié
6. THE système SHALL centrer le contenu de chargement verticalement et horizontalement
7. WHEN les données arrivent THEN le système SHALL faire une transition fluide vers le contenu

### Requirement 9: Cohérence avec le Dashboard

**User Story:** En tant qu'utilisateur, je veux que le bloc soit cohérent avec les autres blocs modernisés, afin d'avoir une expérience unifiée.

#### Acceptance Criteria

1. THE système SHALL utiliser les mêmes valeurs de backdrop-blur que les autres blocs modernisés
2. THE système SHALL utiliser la même palette de couleurs (emerald pour finance)
3. THE système SHALL utiliser les mêmes espacements (p-6, gap-6, space-y-4)
4. THE système SHALL utiliser les mêmes bordures arrondies (rounded-2xl)
5. THE système SHALL utiliser les mêmes effets de hover (scale, glow, blur)
6. THE système SHALL utiliser les mêmes transitions (duration-500, ease-in-out)
7. THE système SHALL maintenir la même hiérarchie typographique
8. THE système SHALL utiliser les mêmes icônes Lucide React avec tailles cohérentes
