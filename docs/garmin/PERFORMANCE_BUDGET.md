# Performance Budget - Onglet Garmin

> **Objectif** : Définir des métriques cibles et budgets de performance pour garantir une expérience utilisateur optimale.

---

## Métriques Core Web Vitals

### Time to Interactive (TTI)

**Cible** : < 3.5 secondes  
**Actuel** : ~4.2 secondes (mesuré sur Chrome DevTools)  
**Budget** : -20% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Lazy loading charts (déjà implémenté via `LazyChartWrapper`)
- ✅ Code splitting par section (déjà implémenté via `React.lazy`)
- ⏳ Préchargement critique (à implémenter Phase 9)
- ⏳ Optimisation bundle size (tree-shaking, compression)

### First Contentful Paint (FCP)

**Cible** : < 1.8 secondes  
**Actuel** : ~2.1 secondes  
**Budget** : -15% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Skeleton loaders (déjà implémenté via `SectionFallback`)
- ⏳ Inline CSS critique (à implémenter Phase 9)
- ⏳ Optimisation images (compression, formats modernes)

### Largest Contentful Paint (LCP)

**Cible** : < 2.5 secondes  
**Actuel** : ~3.0 secondes  
**Budget** : -17% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Lazy loading non-critique (déjà implémenté)
- ⏳ Préchargement ressources critiques (à implémenter Phase 9)
- ⏳ Optimisation rendu initial (réduction composants montés)

### Cumulative Layout Shift (CLS)

**Cible** : < 0.1  
**Actuel** : ~0.08 (excellent)  
**Budget** : Maintenir < 0.1

**Stratégies de maintien** :
- ✅ Dimensions fixes pour skeletons (déjà implémenté)
- ✅ Réserve d'espace pour charts (déjà implémenté)
- ⏳ Optimisation images (dimensions explicites)

---

## Bundle Size Budgets

### Bundle JavaScript Principal

**Cible** : < 500 KB (gzipped)  
**Actuel** : ~580 KB (gzipped)  
**Budget** : -14% d'ici Phase 9

**Répartition actuelle** :
- React + ReactDOM : ~130 KB
- Recharts : ~150 KB
- Garmin Tab code : ~200 KB
- Autres dépendances : ~100 KB

**Stratégies d'optimisation** :
- ✅ Code splitting par section (déjà implémenté)
- ⏳ Tree-shaking agressif (à implémenter Phase 9)
- ⏳ Remplacement dépendances lourdes (évaluer alternatives)

### Chunk Lazy (par section)

**Cible** : < 100 KB (gzipped) par chunk  
**Actuel** : ~120 KB (ChartsSection), ~80 KB (UtilitiesSection)  
**Budget** : -20% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Lazy loading sections (déjà implémenté)
- ⏳ Optimisation imports (à implémenter Phase 9)
- ⏳ Compression assets (à implémenter Phase 9)

### IndexedDB Storage

**Cible** : < 1 GB (total)  
**Actuel** : ~600 MB (moyenne utilisateur actif)  
**Budget** : Maintenir < 1 GB

**Stratégies de maintien** :
- ✅ TTL automatique (déjà implémenté via `IndexedDBMaintenanceService`)
- ✅ Nettoyage anciennes données (déjà implémenté)
- ⏳ Compression time series (à implémenter Phase 10)

---

## Métriques de Rendu

### Temps de Rendu Initial

**Cible** : < 200 ms  
**Actuel** : ~250 ms  
**Budget** : -20% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Mémoïsation composants (déjà implémenté via `React.memo`)
- ✅ Virtualisation listes longues (déjà implémenté via `VirtualizedActivityList`)
- ⏳ Optimisation sélecteurs (à implémenter Phase 9)

### Temps de Rendu Charts

**Cible** : < 100 ms par chart  
**Actuel** : ~120 ms (moyenne)  
**Budget** : -17% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Lazy loading charts (déjà implémenté)
- ✅ Mémoïsation données (déjà implémenté via `useChartData`)
- ⏳ Optimisation Recharts (à implémenter Phase 9)

### Temps de Rendu Activities List

**Cible** : < 150 ms (1000 activités)  
**Actuel** : ~180 ms (1000 activités)  
**Budget** : -17% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Virtualisation (déjà implémenté via `VirtualizedActivityList`)
- ✅ Mémoïsation items (déjà implémenté)
- ⏳ Optimisation calculs dérivés (à implémenter Phase 9)

---

## Métriques Réseau

### Latence API Sync

**Cible** : < 500 ms (p95)  
**Actuel** : ~650 ms (p95)  
**Budget** : -23% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Circuit breaker (déjà implémenté)
- ✅ Retry avec backoff (déjà implémenté)
- ⏳ Optimisation requêtes (à implémenter Phase 9)
- ⏳ Compression requêtes (à implémenter Phase 9)

### Taille Réponse API Sync

**Cible** : < 500 KB (gzipped)  
**Actuel** : ~600 KB (gzipped)  
**Budget** : -17% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Compression JSON (déjà implémenté côté export)
- ⏳ Compression requêtes (à implémenter Phase 9)
- ⏳ Pagination serveur (à implémenter Phase 9)

---

## Métriques Mémoire

### Utilisation Mémoire (Heap)

**Cible** : < 100 MB (onglet actif)  
**Actuel** : ~120 MB (onglet actif)  
**Budget** : -17% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Cleanup automatique (déjà implémenté)
- ✅ TTL cache mémoire (déjà implémenté)
- ⏳ Optimisation sérialisation (à implémenter Phase 9)

### Utilisation IndexedDB

**Cible** : < 1 GB (total)  
**Actuel** : ~600 MB (moyenne)  
**Budget** : Maintenir < 1 GB

**Stratégies de maintien** :
- ✅ TTL automatique (déjà implémenté)
- ✅ Nettoyage anciennes données (déjà implémenté)
- ⏳ Compression time series (à implémenter Phase 10)

---

## Métriques Cache

### Taux de Hit Cache

**Cible** : > 80% (cache mémoire + IndexedDB)  
**Actuel** : ~75%  
**Budget** : +7% d'ici Phase 9

**Stratégies d'optimisation** :
- ✅ Cache multi-niveaux (déjà implémenté)
- ✅ TTL optimisé (déjà implémenté)
- ⏳ Préchargement intelligent (à implémenter Phase 9)

### Temps Accès Cache

**Cible** : < 10 ms (cache mémoire), < 50 ms (IndexedDB)  
**Actuel** : ~8 ms (mémoire), ~45 ms (IndexedDB)  
**Budget** : Maintenir cibles

**Stratégies de maintien** :
- ✅ Indexes optimisés (déjà implémenté)
- ✅ Requêtes batch (déjà implémenté)
- ⏳ Optimisation indexes (à implémenter Phase 9)

---

## Métriques Accessibilité

### Temps Navigation Clavier

**Cible** : < 100 ms (délai entre actions)  
**Actuel** : ~80 ms (excellent)  
**Budget** : Maintenir < 100 ms

**Stratégies de maintien** :
- ✅ Focus trap (déjà implémenté)
- ✅ Raccourcis clavier (déjà implémenté)
- ⏳ Optimisation focus management (à implémenter Phase 9)

### Temps Annonces Screen Reader

**Cible** : < 200 ms (délai annonce)  
**Actuel** : ~150 ms (excellent)  
**Budget** : Maintenir < 200 ms

**Stratégies de maintien** :
- ✅ `aria-live` optimisé (déjà implémenté)
- ✅ Descriptions sr-only (déjà implémenté)
- ⏳ Optimisation annonces (à implémenter Phase 9)

---

## Métriques Observabilité

### Temps Collecte Télémétrie

**Cible** : < 5 ms (overhead par événement)  
**Actuel** : ~4 ms  
**Budget** : Maintenir < 5 ms

**Stratégies de maintien** :
- ✅ Collecte asynchrone (déjà implémenté)
- ✅ Throttling événements (déjà implémenté)
- ⏳ Optimisation sérialisation (à implémenter Phase 9)

### Taille Payload Télémétrie

**Cible** : < 50 KB (par snapshot)  
**Actuel** : ~45 KB  
**Budget** : Maintenir < 50 KB

**Stratégies de maintien** :
- ✅ Limite historique (déjà implémenté)
- ✅ Sérialisation optimisée (déjà implémenté)
- ⏳ Compression payload (à implémenter Phase 9)

---

## Plan d'Action Phase 9

### Priorité Haute

1. **Optimisation Bundle Size**
   - Tree-shaking agressif
   - Remplacement dépendances lourdes
   - Compression assets

2. **Optimisation Rendu**
   - Préchargement critique
   - Optimisation sélecteurs
   - Réduction composants montés

3. **Optimisation Réseau**
   - Compression requêtes
   - Pagination serveur
   - Optimisation requêtes

### Priorité Moyenne

4. **Optimisation Mémoire**
   - Optimisation sérialisation
   - Cleanup agressif
   - Réduction allocations

5. **Optimisation Cache**
   - Préchargement intelligent
   - Optimisation indexes
   - TTL dynamique

### Priorité Basse

6. **Optimisation Accessibilité**
   - Optimisation focus management
   - Optimisation annonces
   - Tests screen reader

---

## Monitoring & Alertes

### Alertes Critiques

- **TTI > 5 secondes** : Alerte immédiate
- **Bundle > 700 KB** : Alerte warning
- **Mémoire > 150 MB** : Alerte warning
- **Cache hit < 60%** : Alerte warning

### Alertes Informatives

- **TTI > 4 secondes** : Monitoring
- **Bundle > 600 KB** : Monitoring
- **Mémoire > 120 MB** : Monitoring
- **Cache hit < 70%** : Monitoring

### Dashboard Performance

- Métriques temps réel dans DebugPanel
- Historique métriques (7 jours)
- Comparaison avec budgets
- Alertes automatiques

---

## Changelog

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2024-02-25 | Équipe Garmin | Création initiale avec budgets Phase 9 |

---

## Références

- [Web Vitals](https://web.dev/vitals/)
- [Bundle Size Budgets](https://web.dev/performance-budgets-101/)
- [React Performance](https://react.dev/learn/render-and-commit)


