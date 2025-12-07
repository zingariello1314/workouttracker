# Plan d'Implémentation - Refonte SurveillanceBlock

## 📋 Vue d'Ensemble

**Objectif** : Remplacer le SurveillanceBlock actuel par la version ultra-détaillée avec 13 modules avancés

**Fichier source** : `docs/finance/codepourleblocsurveilance.md` (Vue.js)  
**Fichier cible** : `src/components/dashboard/SurveillanceBlock.jsx` (React)  
**Lignes totales estimées** : ~3000 lignes  
**Complexité** : Très élevée

---

## 🎯 Stratégie d'Implémentation

### Approche : **Implémentation Progressive en 6 Phases**

Chaque phase ajoute des modules fonctionnels tout en gardant le bloc opérationnel.

---

## 📊 Phase 1 : Structure de Base & Core (PRIORITÉ MAX)

**Durée estimée** : 2-3h  
**Objectif** : Remplacer la structure actuelle par la base solide

### Tâches

#### 1.1 Setup Initial
- [ ] Créer backup du fichier actuel (`SurveillanceBlock.jsx.backup`)
- [ ] Initialiser la nouvelle structure React
- [ ] Configurer les imports (useState, useEffect, useMemo, useCallback)
- [ ] Définir les props et interfaces

#### 1.2 États de Base
- [ ] Implémenter `showModal` state (modal ajout action)
- [ ] Implémenter `showCustomAssetForm` state
- [ ] Implémenter `newStock` state (formulaire)
- [ ] Implémenter `logo` state (upload)
- [ ] Implémenter `selectedAssets` state (corrélations)
- [ ] Implémenter états d'expansion (crypto, stocks, commodities, economic)

#### 1.3 Données Mock Centralisées
- [ ] `stocks` (actions surveillées)
- [ ] `marketIndices` (indices de marché)
- [ ] `commoditiesAndCrypto` (matières premières + crypto)
- [ ] `newsItems` (actualités)
- [ ] `aiRecommendations` (recommandations IA)
- [ ] `topPerformers` / `worstPerformers`
- [ ] `correlationMatrix` (matrice de corrélations)
- [ ] `correlationAssets` (actifs pour corrélations)

#### 1.4 Module 1 : Header Premium
- [ ] Titre "SURVEILLANCE" avec icône œil
- [ ] Badge compteur d'actions surveillées
- [ ] Effets néon cyan

#### 1.5 Module 2 : Market Status Block
- [ ] Indices de marché (CAC 40, S&P 500, NASDAQ, etc.)
- [ ] Matières premières (Or, Pétrole, Argent)
- [ ] Cryptomonnaies (BTC, ETH, SOL)
- [ ] Indicateurs de variation (couleurs dynamiques)

#### 1.6 Module 3 : Stock Cards Block
- [ ] Cartes d'actions surveillées
- [ ] Logo uploadable
- [ ] Prix + variation
- [ ] Signal technique
- [ ] Bouton de suppression

#### 1.7 Tests Phase 1
- [ ] Vérifier que le bloc s'affiche sans erreur
- [ ] Tester l'ajout d'une action
- [ ] Vérifier les données mock
- [ ] Valider le responsive

**Livrable Phase 1** : Bloc fonctionnel avec header + market status + stock cards

---

## 📈 Phase 2 : Alertes & Actualités (PRIORITÉ HAUTE)

**Durée estimée** : 2-3h  
**Objectif** : Ajouter les systèmes d'alertes et de news

### Tâches

#### 2.1 Module 4 : Alerts Block
- [ ] Système d'alertes de prix
- [ ] Alertes de seuils
- [ ] Alertes de signaux techniques
- [ ] Gestion des alertes (ajout/suppression)

#### 2.2 Module 5 : News Block
- [ ] Fil d'actualités financières
- [ ] Filtrage par catégorie (bourse, crypto, économie, politique)
- [ ] Sentiment analysis (positif/négatif/neutre)
- [ ] Impact level (high/medium/low)
- [ ] Quality score
- [ ] Liens externes

#### 2.3 Module 6 : AI Recommendations Block
- [ ] Recommandations IA personnalisées
- [ ] Actions suggérées (ACHAT/VENTE/CONSERVER)
- [ ] Niveau de confiance
- [ ] Justification de la recommandation
- [ ] Horizon temporel

#### 2.4 Tests Phase 2
- [ ] Vérifier les alertes
- [ ] Tester le filtrage des news
- [ ] Valider les recommandations IA

**Livrable Phase 2** : Système d'alertes + news + recommandations IA

---

## 📅 Phase 3 : Calendrier & Performers (PRIORITÉ HAUTE)

**Durée estimée** : 2-3h  
**Objectif** : Ajouter le calendrier économique et les performers

### Tâches

#### 3.1 Module 7 : Economic Calendar Block
- [ ] Événements crypto (expansible)
- [ ] Événements actions (expansible)
- [ ] Événements matières premières (expansible)
- [ ] Événements économiques (expansible)
- [ ] Indicateurs d'impact
- [ ] Dates et heures
- [ ] Système d'expansion/collapse

#### 3.2 Module 8 : Performers Block
- [ ] Top performers (meilleures performances)
- [ ] Worst performers (pires performances)
- [ ] Variation en pourcentage
- [ ] Symboles + noms
- [ ] Couleurs dynamiques (vert/rouge)

#### 3.3 Computed Values
- [ ] `watchedStocksCount` (nombre d'actions)
- [ ] Filtrage des événements par catégorie
- [ ] Tri des performers

#### 3.4 Tests Phase 3
- [ ] Vérifier le calendrier économique
- [ ] Tester l'expansion des sections
- [ ] Valider les performers

**Livrable Phase 3** : Calendrier économique + performers

---

## 🧠 Phase 4 : Analyse Comportementale (PRIORITÉ MODÉRÉE)

**Durée estimée** : 2-3h  
**Objectif** : Ajouter l'analyse comportementale du trading

### Tâches

#### 4.1 Module 9 : Behavioral Block
- [ ] Données comportementales (trades gagnants/perdants)
- [ ] Meilleur créneau de trading (heure + performance)
- [ ] Pire créneau de trading (heure + performance)
- [ ] Biais détectés (liste des biais comportementaux)
- [ ] Recommandations pour améliorer
- [ ] Visualisation des patterns

#### 4.2 Données Comportementales
- [ ] `behavioralData` (statistiques de trading)
- [ ] `bestTradingTime` (meilleur moment)
- [ ] `worstTradingTime` (pire moment)
- [ ] `detectedBiases` (biais identifiés)

#### 4.3 Tests Phase 4
- [ ] Vérifier les statistiques comportementales
- [ ] Tester les recommandations
- [ ] Valider les biais détectés

**Livrable Phase 4** : Analyse comportementale complète

---

## 🔬 Phase 5 : Laboratoire de Corrélations (PRIORITÉ HAUTE)

**Durée estimée** : 3-4h  
**Objectif** : Ajouter le système avancé de corrélations

### Tâches

#### 5.1 Module 10 : Correlation Lab Block
- [ ] Matrice de corrélations interactive
- [ ] Sélection d'actifs (multi-select)
- [ ] Création d'actifs personnalisés
- [ ] Visualisation heatmap
- [ ] Calcul des corrélations en temps réel
- [ ] Filtrage des actifs
- [ ] Reset/Select All

#### 5.2 Module 11 : Unexpected Correlations Block
- [ ] Corrélations inattendues détectées
- [ ] Paires d'actifs surprenantes
- [ ] Force de corrélation
- [ ] Explication des corrélations

#### 5.3 Module 12 : Arbitrage Opportunities Block
- [ ] Opportunités d'arbitrage détectées
- [ ] Écarts de prix
- [ ] Potentiel de profit
- [ ] Niveau de risque
- [ ] Fenêtre temporelle

#### 5.4 Computed Values pour Corrélations
- [ ] `strongPositiveCorrelations` (corrélations > 0.7)
- [ ] `strongNegativeCorrelations` (corrélations < -0.5)
- [ ] `averageCorrelation` (moyenne)
- [ ] `cryptoCorrelationRisk` (risque crypto)
- [ ] `techCorrelationRisk` (risque tech)
- [ ] `filteredCorrelationAssets` (actifs filtrés)
- [ ] `availableAssets` (actifs disponibles)

#### 5.5 Méthodes pour Corrélations
- [ ] `getCorrelationValue(asset1, asset2)`
- [ ] `formatCorrelationValue(value)`
- [ ] `getCorrelationStrength(value)`
- [ ] `getCorrelationCellClass(value)`
- [ ] `resetSelection()`
- [ ] `selectAllAssets()`
- [ ] `removeFromSelection(symbol)`
- [ ] `createCustomAsset(assetData)`

#### 5.6 Tests Phase 5
- [ ] Tester la matrice de corrélations
- [ ] Vérifier la sélection d'actifs
- [ ] Tester la création d'actifs personnalisés
- [ ] Valider les calculs de corrélations

**Livrable Phase 5** : Laboratoire de corrélations complet

---

## 🔮 Phase 6 : Sentiment & Intelligence Prédictive (PRIORITÉ HAUTE)

**Durée estimée** : 2-3h  
**Objectif** : Finaliser avec sentiment multi-source et prédictions

### Tâches

#### 6.1 Module 13 : Sentiment Multi-Source Block
- [ ] Sentiment composite (agrégé)
- [ ] Sources de sentiment (Twitter, Reddit, News, Analysts)
- [ ] Divergences de sentiment
- [ ] Visualisation du consensus
- [ ] Alertes de divergence

#### 6.2 Module 14 : Predictive Intelligence Block
- [ ] Prédictions court terme (24h-72h)
- [ ] Scénarios hebdomadaires (optimiste/réaliste/pessimiste)
- [ ] Signaux de trading (ACHAT/VENTE/ATTENTE)
- [ ] Niveau de confiance
- [ ] Facteurs influents

#### 6.3 Données pour Sentiment & Prédictions
- [ ] `compositeSentiment` (sentiment global)
- [ ] `sentimentSources` (sources individuelles)
- [ ] `sentimentDivergences` (divergences détectées)
- [ ] `shortTermPredictions` (prédictions 24-72h)
- [ ] `weeklyScenarios` (scénarios hebdomadaires)
- [ ] `tradingSignals` (signaux de trading)

#### 6.4 Méthodes pour Prédictions
- [ ] `getPredictionClass(direction)`
- [ ] `getPredictionDirectionClass(direction)`
- [ ] `getConfidenceClass(confidence)`

#### 6.5 Tests Phase 6
- [ ] Vérifier le sentiment multi-source
- [ ] Tester les prédictions
- [ ] Valider les signaux de trading

**Livrable Phase 6** : Sentiment + Intelligence prédictive complets

---

## 🔧 Phase 7 : Finalisation & Polish (PRIORITÉ BASSE)

**Durée estimée** : 1-2h  
**Objectif** : Peaufiner et optimiser

### Tâches

#### 7.1 Optimisations
- [ ] Vérifier tous les useMemo
- [ ] Vérifier tous les useCallback
- [ ] Optimiser les re-renders
- [ ] Nettoyer les console.log

#### 7.2 Modals & Interactions
- [ ] Modal ajout d'action (formulaire complet)
- [ ] Modal création d'actif personnalisé
- [ ] Upload de logo (FileReader)
- [ ] Validation des formulaires

#### 7.3 Persistance LocalStorage
- [ ] Sauvegarder les actions surveillées
- [ ] Sauvegarder les actifs sélectionnés
- [ ] Sauvegarder les alertes
- [ ] Charger au montage

#### 7.4 Mises à Jour Périodiques
- [ ] Mise à jour des corrélations (30s)
- [ ] Mise à jour du sentiment (45s)
- [ ] Mise à jour des prédictions (60s)
- [ ] Cleanup des intervals

#### 7.5 Accessibilité
- [ ] Ajouter les aria-labels
- [ ] Vérifier le contraste des couleurs
- [ ] Tester la navigation au clavier
- [ ] Valider les tooltips

#### 7.6 Documentation
- [ ] Commenter les sections complexes
- [ ] Documenter les computed values
- [ ] Ajouter des exemples de données
- [ ] PropTypes complets

#### 7.7 Tests Finaux
- [ ] Test complet de bout en bout
- [ ] Vérifier la persistance localStorage
- [ ] Tester tous les modals
- [ ] Valider tous les calculs

**Livrable Phase 7** : Bloc 100% fonctionnel, optimisé et documenté

---

## 📦 Livrables par Phase

| Phase | Modules Ajoutés | Fonctionnalités | Lignes Estimées | Statut |
|-------|----------------|-----------------|-----------------|--------|
| 1 | 1-3 | Header + Market Status + Stock Cards | ~500 lignes | 🔄 EN ATTENTE |
| 2 | 4-6 | Alertes + News + AI Recommendations | ~500 lignes | 🔄 EN ATTENTE |
| 3 | 7-8 | Calendrier + Performers | ~400 lignes | 🔄 EN ATTENTE |
| 4 | 9 | Analyse Comportementale | ~300 lignes | 🔄 EN ATTENTE |
| 5 | 10-12 | Corrélations + Arbitrage | ~800 lignes | 🔄 EN ATTENTE |
| 6 | 13-14 | Sentiment + Prédictions | ~400 lignes | 🔄 EN ATTENTE |
| 7 | - | Polish + Tests + Modals | ~100 lignes | 🔄 EN ATTENTE |
| **TOTAL** | **14 modules** | **Complet** | **~3000 lignes** | **0/14 modules** |

---

## ⚠️ Points d'Attention

### Conversion Vue.js → React

1. **Template → JSX**
   - `v-for` → `.map()`
   - `v-if` → `{condition && ...}`
   - `:class` → `className={...}`
   - `:style` → `style={{...}}`
   - `@click` → `onClick`

2. **Data → State**
   - `data()` → `useState()`
   - `computed` → `useMemo()`
   - `methods` → `useCallback()` ou fonctions

3. **Components**
   - Créer des sous-composants pour chaque module
   - Ou intégrer directement dans le composant principal

### Performance

- Utiliser `useMemo` pour tous les calculs lourds (corrélations, sentiment)
- Utiliser `useCallback` pour les fonctions passées en props
- Éviter les re-renders inutiles
- Optimiser les mises à jour périodiques

### LocalStorage

- Gérer les erreurs de quota
- Valider les données chargées
- Nettoyer les anciennes données

### Modals

- Gérer l'état d'ouverture/fermeture
- Validation des formulaires
- Upload de fichiers (FileReader API)
- Reset après soumission

---

## 🎯 Ordre d'Exécution Recommandé

1. **Phase 1** (OBLIGATOIRE) - Base fonctionnelle
2. **Phase 2** (HAUTE PRIORITÉ) - Alertes & News
3. **Phase 3** (HAUTE PRIORITÉ) - Calendrier & Performers
4. **Phase 5** (HAUTE PRIORITÉ) - Corrélations (module clé)
5. **Phase 6** (HAUTE PRIORITÉ) - Sentiment & Prédictions
6. **Phase 4** (MODÉRÉE) - Analyse Comportementale
7. **Phase 7** (POLISH) - Finalisation

---

## 📊 Métriques de Succès

- [ ] 0 erreur de compilation
- [ ] 0 warning React
- [ ] Tous les modals fonctionnent
- [ ] Toutes les corrélations calculées
- [ ] LocalStorage fonctionne
- [ ] Responsive sur tous les écrans
- [ ] Performance > 60 FPS
- [ ] Code documenté

---

## 🚀 Prêt à Démarrer

**Prochaine étape** : Commencer la Phase 1 - Structure de Base & Core

Voulez-vous que je commence l'implémentation de la Phase 1 ?

