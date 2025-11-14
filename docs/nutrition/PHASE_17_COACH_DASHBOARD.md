# 📋 Phase 17 : Coach Dashboard (Vue Lecture Seule)

**Date** : 2025-01-15  
**Statut** : 🟡 En cours  
**Priorité** : 🟢 Optionnel (complète Phase 16)

---

## 🎯 Objectif

Créer un dashboard en lecture seule pour permettre au coach de visualiser les données nutrition partagées via :
- **Import JSON** : Le coach importe un fichier JSON exporté par l'utilisateur
- **Visualisation** : Affichage des données anonymisées selon scope (stats, charts, progress)
- **Lecture seule** : Pas de modification possible, vue uniquement

---

## 📊 Architecture

### Fonctionnement

1. **Export côté utilisateur** :
   - Utilisateur crée lien de partage dans `NutritionSharing.jsx`
   - Export JSON avec données anonymisées via `exportNutritionDataForShare()`
   - JSON contient : `{ type: 'nutrition_share', token, scope, data: { stats, charts, progress }, metadata }`

2. **Import côté coach** :
   - Coach importe JSON dans `CoachDashboard.jsx`
   - Validation du format JSON (type: 'nutrition_share')
   - Validation du token et expiration
   - Affichage des données selon scope

3. **Visualisation** :
   - **Stats** : Statistiques agrégées (moyennes 7j/30j/90j, conformité, etc.)
   - **Charts** : Graphiques évolution (calories, macros, conformité) - 30 derniers jours
   - **Progress** : Progression (streaks, badges, niveaux, tendances)

---

## 🏗️ Structure à Implémenter

### 1. Service : Import/Validation JSON

**Fichier** : `src/services/nutrition/nutritionSharing.js`

**Fonctions à ajouter** :
- `validateShareJson(jsonData)` : Valide format JSON partagé
- `parseShareJson(jsonData)` : Parse et valide token/expiration
- `loadShareDataFromJson(jsonData)` : Charge données depuis JSON

### 2. Hook : useCoachDashboard

**Fichier** : `src/hooks/useCoachDashboard.js`

**Fonctionnalités** :
- État : `shareData`, `loading`, `error`, `scope`
- Méthodes : `importJson(file)`, `validateJson(json)`, `clearData()`
- Constantes : `SHARE_SCOPES`, `PERMISSIONS`

### 3. Composant : CoachDashboard

**Fichier** : `src/components/tabs/nutrition/components/CoachDashboard.jsx`

**Fonctionnalités** :
- Import JSON (drag & drop ou bouton)
- Validation format JSON
- Affichage données selon scope :
  - **Stats** : Cards statistiques (moyennes, conformité, etc.)
  - **Charts** : Graphiques Recharts (timeline, macro distribution)
  - **Progress** : Progression (streaks, badges, niveaux, tendances)
- Lecture seule (pas de modification)
- Export PDF optionnel (rapport coach)

---

## 📝 Implémentation Détaillée

### Étape 17.1 : Service - Import/Validation JSON

**Fichier** : `src/services/nutrition/nutritionSharing.js`

**Fonctions à ajouter** :

```javascript
/**
 * Valide le format JSON partagé
 * 
 * @param {Object} jsonData - Données JSON à valider
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateShareJson(jsonData) {
  try {
    // Vérifier structure de base
    if (!jsonData || typeof jsonData !== 'object') {
      return { valid: false, error: 'Format JSON invalide' };
    }
    
    // Vérifier type
    if (jsonData.type !== 'nutrition_share') {
      return { valid: false, error: 'Type de fichier invalide (attendu: nutrition_share)' };
    }
    
    // Vérifier version
    if (!jsonData.version || jsonData.version !== '1.0') {
      return { valid: false, error: 'Version de fichier non supportée' };
    }
    
    // Vérifier token
    if (!jsonData.token || typeof jsonData.token !== 'string') {
      return { valid: false, error: 'Token manquant ou invalide' };
    }
    
    // Vérifier scope
    if (!jsonData.scope || !Object.values(SHARE_SCOPES).includes(jsonData.scope)) {
      return { valid: false, error: 'Scope invalide' };
    }
    
    // Vérifier données
    if (!jsonData.data || typeof jsonData.data !== 'object') {
      return { valid: false, error: 'Données manquantes' };
    }
    
    // Vérifier expiration
    if (jsonData.expiresAt && Date.now() > jsonData.expiresAt) {
      return { valid: false, error: 'Lien expiré' };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    log.error('[validateShareJson] Erreur validation JSON:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Parse et valide JSON partagé
 * 
 * @param {Object} jsonData - Données JSON à parser
 * @returns {Object} { token, scope, data, metadata, expiresAt }
 */
export function parseShareJson(jsonData) {
  try {
    // Valider format
    const validation = validateShareJson(jsonData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return {
      token: jsonData.token,
      scope: jsonData.scope,
      data: jsonData.data,
      metadata: jsonData.metadata || {},
      expiresAt: jsonData.expiresAt || null,
      shareDate: jsonData.shareDate || null
    };
  } catch (error) {
    log.error('[parseShareJson] Erreur parsing JSON:', error);
    throw error;
  }
}

/**
 * Charge données depuis JSON partagé
 * 
 * @param {Object} jsonData - Données JSON à charger
 * @returns {Object} Données formatées pour affichage
 */
export function loadShareDataFromJson(jsonData) {
  try {
    // Parser JSON
    const parsed = parseShareJson(jsonData);
    
    // Formater données pour affichage
    const formattedData = {
      token: parsed.token,
      scope: parsed.scope,
      expiresAt: parsed.expiresAt,
      shareDate: parsed.shareDate,
      metadata: parsed.metadata,
      stats: parsed.data.stats || null,
      charts: parsed.data.charts || null,
      progress: parsed.data.progress || null
    };
    
    log.debug('[loadShareDataFromJson] Données chargées', {
      scope: parsed.scope,
      hasStats: !!formattedData.stats,
      hasCharts: !!formattedData.charts,
      hasProgress: !!formattedData.progress
    });
    
    return formattedData;
  } catch (error) {
    log.error('[loadShareDataFromJson] Erreur chargement données:', error);
    throw error;
  }
}
```

---

### Étape 17.2 : Hook - useCoachDashboard

**Fichier** : `src/hooks/useCoachDashboard.js`

**Fonctionnalités** :
- État : `shareData`, `loading`, `error`, `scope`
- Méthodes : `importJson(file)`, `validateJson(json)`, `clearData()`
- Validation : Format JSON, token, expiration
- Constantes : `SHARE_SCOPES`, `PERMISSIONS`

---

### Étape 17.3 : Composant - CoachDashboard

**Fichier** : `src/components/tabs/nutrition/components/CoachDashboard.jsx`

**Fonctionnalités** :
- Import JSON (drag & drop ou bouton)
- Validation format JSON
- Affichage données selon scope :
  - **Stats** : Cards statistiques (moyennes, conformité, etc.)
  - **Charts** : Graphiques Recharts (timeline, macro distribution)
  - **Progress** : Progression (streaks, badges, niveaux, tendances)
- Lecture seule (pas de modification)
- Export PDF optionnel (rapport coach)

---

## 🎨 UI/UX

### Interface

1. **Zone d'import** :
   - Drag & drop JSON
   - Bouton "Importer JSON"
   - Validation visuelle (succès/erreur)

2. **Affichage données** :
   - Tabs selon scope (Stats, Charts, Progress)
   - Cards statistiques
   - Graphiques Recharts
   - Badges et progression

3. **Actions** :
   - Export PDF (rapport coach)
   - Réinitialiser (nouveau import)
   - Informations (scope, expiration)

---

## 🔒 Sécurité & Privacy

### Anonymisation

- ✅ Pas de dates exactes (index au lieu de dates)
- ✅ Pas de noms d'aliments (agrégation)
- ✅ Pas de données personnelles identifiables
- ✅ Stats agrégées uniquement

### Validation

- ✅ Validation format JSON
- ✅ Validation token
- ✅ Validation expiration
- ✅ Validation scope

---

## 📊 Données Affichées

### Scope: stats

- Moyennes calories (7j/30j/90j)
- Moyennes macros (protéines, glucides, lipides)
- Conformité programme (moyenne)
- Total jours/repas
- Programme actif (nom, objectif)

### Scope: charts

- Timeline calories (30 derniers jours)
- Timeline macros (30 derniers jours)
- Timeline conformité (30 derniers jours)
- Distribution macros (pourcentages)
- Graphiques Recharts interactifs

### Scope: progress

- Streak nutrition (jours consécutifs)
- Niveau (XP, level)
- Badges débloqués (nombre)
- Tendances (7j/30j)
- Évolution conformité

---

## 🚀 Prochaines Étapes

1. ✅ Analyser architecture actuelle
2. ⏸️ Implémenter service import/validation JSON
3. ⏸️ Implémenter hook useCoachDashboard
4. ⏸️ Implémenter composant CoachDashboard
5. ⏸️ Intégrer dans NutritionTab (section optionnelle)
6. ⏸️ Tester import JSON
7. ⏸️ Tester affichage données
8. ⏸️ Documenter dans SUIVI_IMPLEMENTATION_NUTRITION.md

---

**Dernière mise à jour** : 2025-01-15

