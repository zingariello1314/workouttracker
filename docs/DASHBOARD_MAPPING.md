# 📊 Dashboard - Mapping des Consignes

## Vue d'Ensemble

Ce document mappe chaque fonctionnalité du Dashboard avec les sections correspondantes dans `dashboarddesignconsignes.md`.

**Fichier source**: `docs/finance/dashboarddesignconsignes.md` (3565 lignes)

---

## 🎯 Structure Globale

### Architecture (Lignes 1-548)
- **Lignes 1-50**: Introduction et répartition des 28 blocs par priorité
- **Lignes 51-100**: Glossaire des termes techniques
- **Lignes 101-548**: Requirements détaillés (28 blocs)

### Design & Implémentation (Lignes 549-3565)
- **Lignes 549-700**: Architecture modulaire et technologies
- **Lignes 701-1500**: Documentation détaillée des composants
- **Lignes 1501-3565**: Styles CSS, interactions et logique métier

---

## 📋 PRIORITY-MAX (4 Blocs Critiques)

### 1. Bloc Quête du Jour
**Requirements**: Lignes 101-120  
**Design**: Lignes 701-850  
**Fonctionnalités**:
- Affichage des quêtes quotidiennes avec icônes
- Progression XP (gagné/potentiel/restant)
- Toggle statut quête (complété/non-complété)
- Barre de progression visuelle
- Priorisation des quêtes (high/medium/low)

**Composant**: `QuestDailyBlock.js`  
**Événements**: `update-data` (toggle-quest)

---

### 2. Bloc Séance Sport Active
**Requirements**: Lignes 121-145  
**Design**: Lignes 851-1100  
**Fonctionnalités**:
- **Partie Gauche**: Formulaire de saisie exercices
  - Exercices maison: Pompes, Gainage, Curls
  - Exercices parc: Tractions, Dips, Tractions australiennes
  - Comparaison vs dernière valeur
  - Détection de records
- **Partie Droite**: Analytics détaillées
  - Stats 7 derniers jours (fréquence, volume)
  - Stats 30 derniers jours (progression mensuelle)
  - Métriques globales (streak, records battus)
- Animation confettis sur record battu
- Sauvegarde avec prévention doublons

**Composant**: `SportSessionBlock.js` (span 3 colonnes)  
**Événements**: `update-data` (update-exercise, save-session)

---

### 3. Bloc Patrimoine Temps Réel
**Requirements**: Lignes 146-165  
**Design**: Lignes 1101-1300  
**Fonctionnalités**:
- Valeur totale du patrimoine
- Performance du jour (€ et %)
- Répartition Or/Bourse/Cash avec **jauges circulaires SVG**
- Comparaison allocation actuelle vs cibles
- Statut de santé (good/warning/critical)
- Alertes de rééquilibrage
- Indicateur de connexion temps réel
- Actualisation automatique (5 min)

**Composant**: `PatrimonyLiveBlock.js`  
**Événements**: `update-data` (refresh), `navigate-to` (finance)  
**Technique**: Jauges SVG avec stroke-dasharray animé

---

### 4. Bloc Session de Lecture
**Requirements**: Lignes 166-190  
**Design**: Lignes 1301-1500  
**Fonctionnalités**:
- **Partie Gauche**: Ajout session
  - Sélecteur de livres actifs
  - Saisie durée (heures/minutes)
  - Saisie pages lues
  - Notes de session
  - Calcul temps estimé pour terminer
- **Partie Droite**: Analytics
  - Stats 7 jours (temps, sessions, genres)
  - Stats 30 jours (livres terminés, vitesse)
  - Métriques globales (régularité, genre favori)
- Alerte si livre non lu depuis 7 jours

**Composant**: `ReadingSessionBlock.js` (span 3 colonnes)  
**Événements**: `update-data` (save-session), `open-modal` (new-book)

---

## 🔥 PRIORITY-HIGH (8 Blocs Importants)

### 5. Bloc Status Apprentissage
**Requirements**: Lignes 191-210  
**Design**: Lignes 1501-1600  
**Fonctionnalités**:
- Matière active du jour
- Sessions complétées vs planifiées
- Temps étudié vs objectif quotidien
- Bouton démarrage timer
- Streak de jours consécutifs
- Badge "ATTEINT" si objectif atteint
- Accès aux notes de la matière

**Composant**: `LearningStatusBlock.js`

---

### 6. Bloc Timer Actif
**Requirements**: Lignes 211-230  
**Design**: Lignes 1601-1700  
**Fonctionnalités**:
- Timer configurable (sessions, durée focus, durée pause)
- Décompte avec progression circulaire
- Son de notification en fin de session
- Pause avec affichage durée
- Extension de 5 minutes
- Numéro session actuelle/total
- Message félicitations fin de toutes les sessions

**Composant**: `ActiveTimerBlock.js`

---

### 7. Bloc Dernière Chance
**Requirements**: Lignes 231-250  
**Design**: Lignes 1701-1800  
**Fonctionnalités**:
- Compte à rebours jusqu'à minuit
- Liste des quêtes incomplètes avec XP
- Retrait animé des quêtes complétées
- Total quêtes restantes et XP disponible
- Clignotement si temps critique (< 3h)
- Bouton "Tout terminer" en un clic
- Niveau d'urgence (high/medium/low/normal)

**Composant**: `LastChanceBlock.js`

---

### 8. Bloc Régularité Quotidienne
**Requirements**: Lignes 251-270  
**Design**: Lignes 1801-1900  
**Fonctionnalités**:
- Nombre de jours consécutifs (streak)
- Compte à rebours urgent si minuit approche
- Historique 7 derniers jours avec statut
- Célébration confettis si record battu
- Flamme dont la taille varie selon streak
- Réinitialisation à zéro si streak rompu
- Pourcentage progression vers record

**Composant**: `DailyRegularityBlock.js`

---

### 9. Bloc Budget Mensuel
**Requirements**: Lignes 271-290  
**Design**: Lignes 1901-2000  
**Fonctionnalités**:
- Cercle de progression budget utilisé
- Revenus totaux, dépenses, restant
- Top 3 catégories remarquables (dépassement/économie)
- Alerte warning à 90%
- Alerte critique si dépassé
- Ajout rapide de dépense
- Intégration Smart Shopping (économies)
- Jours restants dans le mois
- Projections fin de mois

**Composant**: `MonthlyBudgetBlock.js`

---

### 10. Bloc Progression Livre Principal
**Requirements**: Lignes 291-310  
**Design**: Lignes 2001-2100  
**Fonctionnalités**:
- Couverture du livre actuel (upload personnalisé)
- Progression pages et pourcentage
- Graphique 7 derniers jours
- Temps estimé pour terminer
- Notifications jalons (25%, 50%, 75%, 90%)
- Célébration confettis si livre terminé
- Temps total investi
- Sauvegarde couverture dans localStorage

**Composant**: `MainBookProgressBlock.js`

---

### 11. Bloc Portfolio Bourse
**Requirements**: Lignes 311-335  
**Design**: Lignes 2101-2250  
**Fonctionnalités**:
- Top 3 meilleures positions
- Top 3 pires positions
- Logo entreprise si disponible
- Gain/perte en € et %
- Sélection période (1J, 1S, 1M, 6M, 1A)
- Valeur totale portfolio et variation quotidienne
- Actualisation manuelle
- Alerte si variation significative
- Auto-refresh 5 min pendant heures de marché

**Composant**: `StockPortfolioBlock.js`

---

### 12. Bloc Surveillance Marchés
**Requirements**: Lignes 336-370  
**Design**: Lignes 2251-2450  
**Fonctionnalités**:
- Statut marchés (ouverts/fermés)
- Actualités par catégories (Bourse, Crypto, Économie, Politique)
- Pour chaque news: titre, source, sentiment, impact, score qualité
- Filtres: impact, source, région, secteur
- Tri: récence, ancienneté, pertinence, sentiment
- Meilleurs/pires performers du jour
- Opportunités d'arbitrage
- Corrélations inattendues
- Calendrier économique
- Fear & Greed Index
- Intelligence prédictive (probabilités)
- Alertes volatilité
- Recommandations IA personnalisées
- Statut APIs (NewsAPI, Finnhub, Reddit)
- Adaptation weekend (marchés fermés)
- Statistiques globales

**Composant**: `SurveillanceBlock.js` (bloc le plus complexe)

---

## 📊 PRIORITY-MODERATE (3 Blocs)

### 13. Bloc Progression Hebdomadaire
**Requirements**: Lignes 371-395  
**Design**: Lignes 2451-2600  
**Fonctionnalités**:
- Numéro de semaine et année
- Score global /5
- Temps total, sessions, jours complétés
- Streak actuel et record
- Progression par matière
- Achievements débloqués
- Graphique circulaire répartition temps
- Heatmap performance par créneau horaire
- Tendances sur 4 semaines
- Objectifs hebdomadaires avec statut

**Composant**: `WeeklyProgressBlock.js`

---

### 14. Bloc Performance Aujourd'hui
**Requirements**: Lignes 396-420  
**Design**: Lignes 2601-2750  
**Fonctionnalités**:
- Muscles ciblés aujourd'hui
- Sélection muscle pour session
- Intensité session actuelle
- Volume total avec progression par groupe musculaire
- Records battus cette semaine avec célébration
- Missions de la semaine par jour (checkboxes)
- Performance live par exercice (barres progression)
- Comparaison vs hier (volume, intensité, temps repos, durée)
- Accomplissements du jour avec récompenses
- Recommandations IA personnalisées
- Historique personnel (records, tendances)

**Composant**: `TodayPerformanceBlock.js`

---

### 15. Bloc Rythme de Lecture
**Requirements**: Lignes 421-445  
**Design**: Lignes 2751-2900  
**Fonctionnalités**:
- Streak de lecture en jours
- Cercle de progression avec paliers visuels
- Stats: aujourd'hui, semaine, session moyenne, vitesse
- Objectif quotidien avec barre progression
- Prédictions fin de livre (scénarios multiples)
- Leviers d'optimisation (vitesse, sessions, météo, weekend)
- Plan optimisé par IA
- Timer de session (start/stop)
- Compte à rebours jusqu'à minuit
- Prochain jalon avec progression
- Motivateurs dynamiques

**Composant**: `ReadingRhythmBlock.js`

---

## 🔧 PRIORITY-LOW (13 Blocs)

### 16. Bloc Objectifs DCA
**Requirements**: Lignes 446-465  
**Fonctionnalités**: Suivi investissements DCA, achats programmés, écarts plan vs réalisé

### 17. Bloc Smart Progression
**Requirements**: Lignes 466-475  
**Fonctionnalités**: Métriques progression, tendances, suggestions IA

### 18. Bloc Quick Stats
**Requirements**: Lignes 476-485  
**Fonctionnalités**: Statistiques rapides du jour, métriques compactes

### 19. Bloc Performance de Lecture
**Requirements**: Lignes 486-495  
**Fonctionnalités**: Métriques détaillées, vitesse par genre, tendances

### 20. Bloc Allocation Salaire
**Requirements**: Lignes 496-505  
**Fonctionnalités**: Répartition salaire (épargne, investissement, dépenses, loisirs)

### 21. Bloc Comparaisons Sport
**Requirements**: Lignes 506-515  
**Fonctionnalités**: Comparaisons par exercice, tendances, progression/régression

### 22. Bloc Comparaisons Lecture
**Requirements**: Lignes 516-525  
**Fonctionnalités**: Comparaisons par période, tendances par genre

### 23. Bloc Matrice de Projection
**Requirements**: Lignes 526-535  
**Fonctionnalités**: Projections futures, scénarios multiples

### 24. Bloc Quête Express
**Requirements**: Lignes 536-550  
**Fonctionnalités**: Création rapide quête, récurrente ou exceptionnelle, calcul XP

### 25. Bloc Théorie vs Réalité
**Requirements**: Lignes 551-560  
**Fonctionnalités**: Comparaison objectifs vs réalisations, écarts, recommandations

### 26. Bloc Loisirs Planifiés
**Requirements**: Lignes 561-580  
**Fonctionnalités**: Objectifs loisirs, upload images, faisabilité, timeline, historique

### 27. Bloc Échéances à Venir
**Requirements**: Lignes 581-595  
**Fonctionnalités**: Échéances futures triées, jours restants, alertes

### 28. Bloc News
**Requirements**: Lignes 596-620  
**Fonctionnalités**: Actualités financières par onglets, filtres, tri, statut APIs

---

## 🎨 Design & Styles (Lignes 2901-3565)

### Thème Cyberpunk
**Lignes 2901-3000**: Variables CSS, couleurs néon, effets glow

### Animations
**Lignes 3001-3100**: Keyframes, transitions, effets de pulsation

### Jauges Circulaires SVG
**Lignes 3101-3200**: Calculs stroke-dasharray, filtres SVG, animations

### Responsive Design
**Lignes 3201-3300**: Media queries, grilles adaptatives

### Interactions
**Lignes 3301-3400**: Hover effects, click handlers, drag & drop

### Performance
**Lignes 3401-3500**: Lazy loading, code splitting, optimisations

### Accessibilité
**Lignes 3501-3565**: ARIA labels, keyboard navigation, screen readers

---

## 🔑 Points Clés Techniques

### Architecture Modulaire
- **Registre centralisé**: `BlocksRegistry.js` gère tous les blocs
- **Chargement progressif**: Par priorité (MAX → HIGH → MODERATE → LOW)
- **Communication**: Événements Vue (`update-data`, `navigate-to`, `open-modal`)

### Technologies
- **Framework**: Vue 3 (CDN)
- **Graphiques**: Chart.js
- **3D**: Three.js
- **Styling**: Tailwind CSS + CSS personnalisé
- **Fonts**: Orbitron, Rajdhani, JetBrains Mono

### Persistance
- **localStorage**: Images uploadées, sessions enregistrées
- **Pas de backend**: Données mockées dans `ModularDashboardMockData.js`

### Événements Globaux
- `$root.$emit` pour communication inter-blocs
- Confettis via `canvas-confetti`
- Notifications système

---

## 📝 Notes d'Implémentation

### Ordre de Développement Recommandé

1. **Phase 1**: PRIORITY-MAX (4 blocs critiques)
   - Quête du Jour
   - Séance Sport
   - Patrimoine Temps Réel
   - Session de Lecture

2. **Phase 2**: PRIORITY-HIGH (8 blocs importants)
   - Apprentissage, Timer, Dernière Chance
   - Régularité, Budget, Livre Principal
   - Portfolio, Surveillance

3. **Phase 3**: PRIORITY-MODERATE (3 blocs analytics)
   - Progression Hebdomadaire
   - Performance Aujourd'hui
   - Rythme de Lecture

4. **Phase 4**: PRIORITY-LOW (13 blocs complémentaires)
   - Selon besoins utilisateur

### Composants Réutilisables à Créer

- `CircularGauge.vue`: Jauges circulaires SVG
- `ProgressBar.vue`: Barres de progression
- `StatCard.vue`: Cartes de statistiques
- `ChartWrapper.vue`: Wrapper Chart.js
- `TimerDisplay.vue`: Affichage timer
- `QuestItem.vue`: Item de quête
- `ExerciseInput.vue`: Input exercice
- `BookSelector.vue`: Sélecteur de livre
- `NewsCard.vue`: Carte actualité
- `AlertBanner.vue`: Bannière d'alerte

---

## 🚀 Prochaines Étapes

1. Lire en détail les sections spécifiques selon les blocs à implémenter
2. Créer les composants réutilisables de base
3. Implémenter les blocs PRIORITY-MAX en premier
4. Tester l'intégration et la communication inter-blocs
5. Ajouter les animations et effets visuels
6. Optimiser les performances
7. Valider l'accessibilité

---

**Document créé le**: 2024-12-06  
**Basé sur**: `docs/finance/dashboarddesignconsignes.md` (3565 lignes)  
**Version**: 1.0
