# Diagnostic des Problèmes Garmin - Pourquoi les Données Manquent

## Date: 2025-01-27

## 🔍 PROBLÈMES IDENTIFIÉS

### 1. **Pas de Logs de Debug**
**Problème**: Impossible de voir ce que retourne réellement l'API `python-garminconnect`

**Solution implémentée**: ✅
- Ajout de logs de debug pour `get_activity()` - affiche la structure complète (2000 premiers caractères)
- Ajout de logs pour `get_stats()` - affiche les clés disponibles
- Ajout de logs pour `get_sleep_data()` - affiche les clés disponibles
- Ajout de logs pour Connect IQ - affiche les clés disponibles si pas de données trouvées

**Comment voir les logs**:
- Les logs apparaissent dans la console du serveur Node (dans `stderr`)
- Regarder la fenêtre où tourne `node garmin-server.js` ou `start-garmin-server.bat`

### 2. **Champs API Incorrects**
**Problème**: Les champs utilisés pour récupérer les données peuvent ne pas correspondre à la vraie structure de l'API

**Exemples**:
- Calories actives/repos peuvent être dans `activitySummaryDTO` au lieu de champs top-level
- Métriques natation peuvent être dans `activityDetailDTO`
- Connect IQ peut être dans une structure différente

**Solution implémentée**: ✅
- Recherche améliorée dans `activitySummaryDTO` et `activityDetailDTO`
- Plusieurs champs tentés pour chaque métrique
- Recherche dans `laps`/`splits` pour données Connect IQ

### 3. **Structure API Inconnue**
**Problème**: L'API `python-garminconnect` peut avoir une structure différente de celle supposée

**Solution implémentée**: ✅
- Logs de debug pour voir la structure réelle
- Recherche dans plusieurs structures (`activitySummaryDTO`, `activityDetailDTO`, `summaryDTO`, `detailDTO`)
- Essai de plusieurs noms de champs possibles

---

## 📋 ACTIONS NÉCESSAIRES

### Étape 1: Tester et Voir les Logs

1. **Lancer le serveur Garmin**:
   ```bash
   start-garmin-server.bat
   ```

2. **Faire une synchronisation** avec une date connue (ex: 2025-10-29)

3. **Regarder les logs dans la console du serveur**:
   - Tu devrais voir des lignes `[DEBUG] Activity ... - Full structure:`
   - Tu devrais voir `[DEBUG] Stats for ... keys:`
   - Tu devrais voir `[DEBUG] Sleep for ... keys:`

4. **Copier les logs** et me les partager pour que je puisse voir:
   - La vraie structure de `get_activity()`
   - Les vraies clés disponibles dans `stats` et `sleep`
   - Où sont réellement stockées les données Connect IQ

### Étape 2: Identifier les Vrais Champs

Avec les logs, on pourra identifier:
- ✅ Où sont vraiment les calories actives/repos
- ✅ Où sont les métriques natation détaillées
- ✅ Où sont les données Connect IQ
- ✅ Où est la respiration
- ✅ Où sont les intensité minutes

### Étape 3: Corriger le Code

Une fois les vrais champs identifiés, je corrigerai le code pour utiliser les bons chemins.

---

## 🔧 AMÉLIORATIONS APPORTÉES

### Recherche Améliorée des Données

1. **Calories Actives/Repos**:
   - ✅ Cherche dans `activitySummaryDTO.caloriesResting`, `activitySummaryDTO.caloriesActive`
   - ✅ Cherche dans champs top-level aussi
   - ✅ Calcul si `calories - caloriesResting` disponible

2. **Métriques Natation**:
   - ✅ Cherche dans `activityDetailDTO` pour toutes les métriques détaillées
   - ✅ Cherche dans champs top-level aussi
   - ✅ Conversion automatique des unités (m/s → km/h, millisecondes → secondes)

3. **Connect IQ**:
   - ✅ Cherche dans `activitySummaryDTO`, `activityDetailDTO`, `measurements`
   - ✅ Cherche dans `laps`/`splits` (parfois les données sont là)
   - ✅ Logs si pas trouvé (affiche les clés disponibles)

4. **Intensité Minutes**:
   - ✅ Cherche dans `activitySummaryDTO` d'abord
   - ✅ Cherche dans champs top-level
   - ✅ Cherche dans `stats` pour métriques quotidiennes

---

## 📊 EXEMPLE DE LOG ATTENDU

```
[DEBUG] Activity 1234567890 (cardio) - Full structure: {
  "activityId": 1234567890,
  "activityName": "Pessac JumpJump Pro",
  "activitySummaryDTO": {
    "calories": 139,
    "caloriesResting": 14,
    "caloriesActive": 125,
    ...
  },
  ...
}

[DEBUG] Stats for 2025-10-29 keys: ['totalSteps', 'totalDistance', 'activeKilocalories', ...]

[DEBUG] Sleep for 2025-10-29 keys: ['sleepTimeSeconds', 'deepSleepSeconds', ...]
```

---

## ⚠️ SI LES LOGS NE MONTRENT RIEN

Si les logs ne s'affichent pas:
1. Vérifier que le serveur Node affiche `stderr` dans la console
2. Vérifier que Python écrit bien dans `stderr` (test avec `print("TEST", file=sys.stderr)`)
3. Vérifier que le serveur ne cache pas les logs

Si `get_activity()` échoue:
- Le log `[DEBUG] Failed to get_activity(...)` s'affichera
- Cela peut indiquer un problème d'authentification ou d'ID activité

---

## 🎯 PROCHAINES ÉTAPES

1. **Tester maintenant** avec les logs activés
2. **Me partager les logs** pour que je voie la vraie structure
3. **Je corrigerai le code** selon la vraie structure de l'API

Les logs sont maintenant activés. Relance la synchronisation et regarde la console du serveur pour voir ce que retourne réellement l'API.

