# 🔍 ÉTAT DES LIEUX - PROBLÈMES GARMIN

**Date** : 2025-11-01  
**Statut** : Analyse complète des problèmes critiques

---

## ❌ PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **ERREURS RECHARTS - "Objects are not valid as a React child"**

**Symptôme** :
- Console: `Uncaught Error: Objects are not valid as a React child (found: object with keys {key, r, stroke, strokeWidth, name, fill, height, width, index, cx, cy, dataKey, value, payload, points})`

**Cause** :
- Le prop `dot` dans les composants `<Line>` et `<Area>` retourne un objet au lieu d'un composant React valide
- Code actuel :
```javascript
dot={(props) => {
  const isSelected = props.payload?.isSelected;
  return {
    ...props,
    fill: isSelected ? '#FCD34D' : (colors?.green || '#10B981'),
    // ...
  };
}}
```

**Solution** :
- Utiliser `true`, `false`, ou un composant React (comme `<circle>`) pour le prop `dot`
- Pour un dot personnalisé avec highlighting, utiliser un composant React fonctionnel

**Fichiers affectés** :
- ✅ `GarminHeartRateChart.jsx` (3 occurrences)
- ✅ `GarminBodyBatteryChart.jsx` (1 occurrence)
- ✅ `GarminStressChart.jsx` (1 occurrence)
- ✅ `GarminSleepChart.jsx` (1 occurrence)
- ✅ `GarminRespirationChart.jsx` (2 occurrences)
- ✅ `GarminCorrelationCharts.jsx` (4 occurrences)

---

### 2. **ERREURS RECHARTS - "width(-1) and height(-1)"**

**Symptôme** :
- Console: `The width(-1) and height(-1) of chart should be greater than 0`

**Cause** :
- `ResponsiveContainer` ne peut pas mesurer correctement le conteneur parent
- Le conteneur parent (`<div className="h-80">`) n'a peut-être pas de dimensions calculables au moment du render

**Solution** :
- S'assurer que le conteneur parent a une hauteur fixe ou minimale
- Ajouter `minHeight` au ResponsiveContainer ou utiliser `aspect` prop
- Vérifier que le parent n'a pas de `display: none` ou `visibility: hidden`

**Fichiers affectés** :
- ✅ Tous les graphiques utilisant `ResponsiveContainer`

---

### 3. **DONNÉES MANQUANTES - Activités n'apparaissent pas**

**Symptôme** :
- Onglet "Activités" vide même quand il y a des activités dans les données
- Filtrage par date ne fonctionne pas correctement

**Cause potentielle** :
1. `activities` n'est pas correctement passé à `GarminActivities`
2. Filtrage par `selectedDate` ne correspond pas au format de date dans les activités
3. Format de date différent (YYYY-MM-DD vs autre)

**Solution** :
- Vérifier le format de date dans les activités vs `selectedDate`
- Ajouter des logs de débogage pour voir ce qui est passé
- S'assurer que `activities` est bien structuré : `{ swimming: [], jumpRope: [], cardio: [] }`

**Fichiers affectés** :
- ✅ `GarminActivities.jsx`
- ✅ `GarminTab.jsx` (passage des props)

---

### 4. **CALORIES À 0 - Métriques quotidiennes incorrectes**

**Symptôme** :
- Calories totales à 0 dans le dashboard
- Calories actives/repos à 0

**Cause potentielle** :
1. Parsing des calories dans `daily_metrics_parser.py` incorrect
2. Structure de données `calories` n'est pas `{ total, active, resting }`
3. Données ne sont pas correctement stockées dans IndexedDB

**Solution** :
- Vérifier le parsing des calories dans `parsers/daily_metrics_parser.py`
- Vérifier la structure des données stockées dans IndexedDB
- S'assurer que `calories` est bien un objet avec `total`, `active`, `resting`

**Fichiers affectés** :
- ✅ `garmin-server/parsers/daily_metrics_parser.py`
- ✅ `GarminDashboard.jsx`
- ✅ `GarminDailyMetrics.jsx`

---

### 5. **PROBLÈMES DE FILTRAGE - Toutes les données semblent à 0**

**Symptôme** :
- Tous les onglets montrent 0 ou des données vides
- Les données ne sont pas correctement filtrées par date

**Cause potentielle** :
1. `selectedDate` n'est pas correctement initialisé
2. Format de date incompatible entre composants
3. `dailyMetrics` n'est pas correctement passé aux composants enfants

**Solution** :
- Vérifier l'initialisation de `selectedDate` dans `GarminTab.jsx`
- Vérifier le format de date utilisé partout (devrait être `YYYY-MM-DD`)
- Ajouter des logs pour déboguer le filtrage

**Fichiers affectés** :
- ✅ `GarminTab.jsx`
- ✅ Tous les composants recevant `selectedDate`

---

## 📋 PLAN DE CORRECTION

### Phase 1 : Corriger les erreurs Recharts (CRITIQUE)

1. ✅ **Corriger tous les `dot` props** pour retourner des composants React valides
   - Créer un composant `CustomDot` réutilisable
   - Utiliser `true`/`false` avec `activeDot` personnalisé si nécessaire
   - Ou utiliser directement un `<circle>` en JSX

2. ✅ **Corriger les dimensions de ResponsiveContainer**
   - Ajouter `minHeight` et `minWidth` au conteneur parent
   - S'assurer que le parent a une hauteur fixe avant le render

### Phase 2 : Corriger les données manquantes

3. ✅ **Vérifier le chargement des données depuis IndexedDB**
   - Ajouter des logs pour déboguer
   - Vérifier que `garminData` est bien structuré

4. ✅ **Corriger le filtrage par date**
   - Uniformiser le format de date partout
   - Vérifier que `selectedDate` est correctement initialisé

5. ✅ **Vérifier le parsing des calories**
   - Vérifier `parsers/daily_metrics_parser.py`
   - S'assurer que la structure `calories: { total, active, resting }` est correcte

---

## 🎯 PRIORITÉS

| Priorité | Problème | Impact | Fichiers |
|----------|----------|--------|----------|
| 🔴 **P0** | Erreur Recharts `dot` | Bloque le rendu des graphiques | Tous les graphiques |
| 🔴 **P0** | Dimensions ResponsiveContainer | Bloque le rendu des graphiques | Tous les graphiques |
| 🟠 **P1** | Données manquantes (activités) | Fonctionnalité principale cassée | `GarminActivities.jsx`, `GarminTab.jsx` |
| 🟠 **P1** | Calories à 0 | Métriques incorrectes | `daily_metrics_parser.py`, composants UI |
| 🟡 **P2** | Filtrage par date | UX dégradée | Tous les composants |

---

## ✅ PROCHAINES ÉTAPES

1. **Corriger tous les `dot` props** dans les graphiques
2. **Corriger les dimensions ResponsiveContainer**
3. **Vérifier et corriger le chargement des données**
4. **Corriger le filtrage par date**
5. **Vérifier le parsing des calories**

**Temps estimé** : 1-2 heures

