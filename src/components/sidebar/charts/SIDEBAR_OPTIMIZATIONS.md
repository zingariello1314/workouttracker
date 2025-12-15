# Optimisations d'affichage pour l'espace sidebar - Graphique FC

## Vue d'ensemble

Ce document décrit les optimisations implémentées pour adapter le graphique de fréquence cardiaque à l'espace restreint de la sidebar, conformément aux requirements 4.1, 4.2, 4.3, et 4.4.

## Optimisations implémentées

### 1. Contraintes de hauteur (Requirement 4.1)

- **Hauteur maximale stricte**: 300px maximum, appliquée via `Math.min(height, 300)`
- **Adaptation automatique**: Le graphique s'adapte à l'espace disponible sans débordement
- **Gestion responsive**: Réduction à 250px sur très petits écrans (< 320px)

```javascript
const constrainedHeight = Math.min(height, 300);
```

### 2. Priorité à la courbe FC principale (Requirement 4.2)

- **Mise en évidence des points importants**: Points réels et d'activité avec taille et couleur distinctes
- **Réduction intelligente des points**: Affichage sélectif en mode compact (skip interval adaptatif)
- **Courbe continue privilégiée**: Type "monotone" pour les données suffisantes

```javascript
// Points importants mis en évidence
const dotSize = {
  normal: isVeryNarrow ? 1.5 : 2,
  active: isVeryNarrow ? 2.5 : 3
};

// Skip interval adaptatif
const skipInterval = isVeryNarrow ? 8 : 5;
```

### 3. Tailles de police adaptées (Requirement 4.3)

- **Système de tailles adaptatif**: Calcul automatique basé sur la largeur du container
- **Trois niveaux de taille**: Normal (≥300px), étroit (<300px), très étroit (<250px)
- **Éléments optimisés**: Axes, tooltips, en-têtes, statistiques, légende

```javascript
const fontSize = {
  axis: isVeryNarrow ? 8 : isNarrow ? 9 : 10,
  tooltip: isVeryNarrow ? 10 : 11,
  header: isVeryNarrow ? 12 : 13,
  stats: isVeryNarrow ? 9 : 10,
  legend: isVeryNarrow ? 8 : 9
};
```

### 4. Légende compacte et responsivité (Requirement 4.4)

- **Légende intelligente**: Affichage des zones les plus significatives uniquement
- **Mode ultra-compact**: 2 zones max sur écrans très étroits, 3 zones normalement
- **Indicateurs visuels réduits**: Pastilles de couleur plus petites (6px vs 8px)
- **Texte abrégé**: Première lettre seulement en mode très étroit

```javascript
// Sélection des zones significatives
const significantZones = enrichedData.metadata.zoneThresholds
  .map(zone => ({ ...zone, percentage: calculatePercentage(zone) }))
  .filter(zone => zone.percentage > 0)
  .sort((a, b) => b.time - a.time)
  .slice(0, isVeryNarrow ? 2 : 3);
```

## Responsivité avancée

### Observer de redimensionnement

- **ResizeObserver**: Détection automatique des changements de taille
- **Mise à jour en temps réel**: Recalcul des optimisations lors du redimensionnement
- **Performance optimisée**: Cleanup automatique de l'observer

```javascript
useEffect(() => {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width } = entry.contentRect;
      setActualWidth(width);
    }
  });

  resizeObserver.observe(containerRef.current);
  return () => resizeObserver.disconnect();
}, []);
```

### Breakpoints adaptatifs

- **320px et moins**: Mode ultra-compact (hauteur 250px, police 8px)
- **250px et moins**: Mode très étroit (padding réduit, 2 zones max)
- **280px**: Mode sidebar normal
- **300px et plus**: Mode standard

## Optimisations CSS

### Classes responsives

```css
.chart-container.sidebar-optimized {
  max-height: 300px;
  overflow: hidden;
}

@media (max-width: 320px) {
  .chart-container.sidebar-optimized {
    max-height: 250px;
  }
}
```

### Tooltips adaptatifs

```css
.recharts-tooltip-wrapper .recharts-default-tooltip {
  max-width: 180px;
  font-size: 11px;
}

@media (max-width: 250px) {
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    max-width: 140px;
    font-size: 10px;
  }
}
```

## Performance

### Optimisations de rendu

- **Mémorisation**: `useMemo` pour les calculs coûteux
- **Callbacks optimisés**: `useCallback` pour éviter les re-rendus
- **Données réduites**: Downsampling plus agressif pour la sidebar (200 points max)

### Gestion mémoire

- **Cleanup automatique**: ResizeObserver correctement nettoyé
- **Cache intelligent**: Réutilisation des données transformées
- **Lazy rendering**: Points non-essentiels masqués en mode compact

## Tests de validation

Tous les requirements ont été validés par des tests automatisés :

- ✅ **4.1**: Contrainte de hauteur respectée (300px max)
- ✅ **4.2**: Courbe FC principale prioritaire (60%+ points importants)
- ✅ **4.3**: Tailles de police lisibles (8px min)
- ✅ **4.4**: Légende compacte et responsive (2-3 zones max)

## Utilisation

```jsx
<SidebarHeartRateChart
  garminData={garminData}
  selectedDate={selectedDate}
  height={280}
  compactMode={true}
  colors={{ red: '#EF4444' }}
  containerWidth={null} // Auto-détection
/>
```

Le composant s'adapte automatiquement à l'espace disponible et applique les optimisations appropriées selon la taille du container.