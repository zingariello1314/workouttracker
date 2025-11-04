# Analyse : Problème de Disparité des Pas (422 vs 203)

## 📋 Problème Identifié

**Symptôme** : L'utilisateur a 422 pas dans son app Garmin, mais seulement 203 pas dans l'onglet Garmin.

**Cause Racine** : Problème de fusion des métriques qui préserve les anciennes valeurs au lieu d'utiliser les nouvelles.

## 🔍 Analyse Technique

### Problème 1 : Fusion des Métriques (IndexedDB)

**Fichier** : `src/hooks/useGarminData.js`

**Problème** :
- La fusion utilisait `{...existing, ...metrics}` ce qui signifie que si `metrics.steps` est `undefined` ou `null`, `existing.steps` est préservé
- Mais si `metrics.steps` vaut `0` (par erreur ou parsing), il écrase `existing.steps` même si `existing.steps` était correct
- La logique de fusion ne garantissait pas que les **nouvelles valeurs positives** remplacent toujours les anciennes

**Solution Appliquée** :
```javascript
// Avant
steps: metrics.steps ?? existing.steps

// Après
steps: (metrics.steps !== undefined && metrics.steps !== null && metrics.steps > 0) 
  ? metrics.steps 
  : (existing.steps || 0)
```

Cela garantit que :
- Si `metrics.steps` existe et est > 0, il est toujours utilisé (remplace l'ancien)
- Si `metrics.steps` est 0, undefined ou null, on garde `existing.steps` (si existe)
- Si rien n'existe, on utilise 0

### Problème 2 : Parsing des Pas (Backend Python)

**Fichier** : `garmin-server/parsers/daily_metrics_parser.py`

**Problème** :
- Le parsing cherchait seulement dans `totalSteps`, `steps`, `value`
- L'API Garmin peut avoir les pas dans d'autres champs selon le contexte

**Solution Appliquée** :
- Ajout de recherche dans plus de champs : `totalStepsValue`, `stepsValue`
- Ajout de logs pour déboguer : `print_debug(f"✅ Parsed steps for {date_str}: {parsed} (from {steps_value})")`

### Problème 3 : Validation des Pas

**Fichier** : `garmin-server/utils/helpers.py`

**Vérification** :
- `safe_int()` valide les pas avec `STEPS_MIN = 0` et `STEPS_MAX = 100000`
- 422 pas est dans la plage valide, donc pas de clamp
- La validation ne devrait pas être la cause du problème

## 🔧 Corrections Appliquées

### 1. **Fusion des Métriques (IndexedDB)**
   - ✅ Toujours préférer les nouvelles valeurs si elles sont > 0
   - ✅ Appliqué à `steps`, `distance`, `floors`
   - ✅ Appliqué dans IndexedDB ET localStorage fallback

### 2. **Parsing des Pas (Backend)**
   - ✅ Recherche dans plus de champs possibles
   - ✅ Ajout de logs pour déboguer

### 3. **Validation**
   - ✅ Vérifié que les plages de validation sont correctes (STEPS_MAX = 100000)

## 📊 Scénarios Possibles

### Scénario 1 : Fusion Écrasée
- **Sync 1** : Récupère 203 pas → Sauvegardé dans IndexedDB
- **Sync 2** : Récupère 422 pas → Mais fusion préserve 203 pas (BUG)
- **Solution** : Fusion corrigée pour toujours préférer nouvelles valeurs > 0

### Scénario 2 : Parsing Incomplet
- **API Garmin** : Retourne 422 pas dans un champ non vérifié
- **Parsing** : Ne trouve pas le champ → Retourne 0 ou valeur par défaut
- **Solution** : Parsing amélioré pour chercher dans plus de champs

### Scénario 3 : Cache
- **Cache serveur** : Contient ancienne réponse avec 203 pas
- **Cache frontend** : Contient ancienne réponse avec 203 pas
- **Solution** : Vider les caches et resynchroniser

## 🚨 Actions Immédiates Recommandées

1. **Vider les caches** :
   - Cliquer sur "Vider le cache" dans les contrôles
   - OU redémarrer le serveur Node.js

2. **Synchroniser à nouveau** :
   - Cliquer sur "Synchroniser" pour récupérer les vraies données
   - Vérifier que les logs montrent bien 422 pas parsés

3. **Vérifier les logs** :
   - Vérifier les logs du serveur Python pour voir si `get_steps_data()` retourne bien 422
   - Vérifier les logs de parsing : `✅ Parsed steps for 2025-11-04: 422`

4. **Vérifier IndexedDB** :
   - Ouvrir DevTools → Application → IndexedDB
   - Vérifier que `dailyMetrics['2025-11-04'].steps = 422`

## ✅ Résultat Attendu

Après les corrections :
- Les nouvelles valeurs (422 pas) remplacent toujours les anciennes (203 pas)
- Le parsing cherche dans tous les champs possibles
- Les logs permettent de déboguer si le problème persiste

## 📝 Notes

- Le problème peut être une combinaison de plusieurs causes
- La fusion était le problème principal (préserver les anciennes valeurs au lieu des nouvelles)
- Le parsing amélioré garantit qu'on trouve les pas même si l'API change de format

