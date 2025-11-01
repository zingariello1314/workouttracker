# 🔍 DIAGNOSTIC COMPLET - GARMIN DATA FETCHING

## Date : 2025-10-31
## Contexte : Analyse des logs et comparaison avec les spécifications `ongletgramintopo.md`

---

## ❌ PROBLÈMES CRITIQUES - CORDE À SAUTER (JUMPJUMP PRO)

### 1. **SAUTS NON TROUVÉS (jumps: null)**

**Statut** : ❌ **CRITIQUE**
- Les sauts sont **complètement absents** dans le JSON final : `"jumps": null`
- Les logs montrent : `[DEBUG] ❌ Final jump rope activity 20835807067 - NO JUMPS FOUND after all searches`
- Les candidats trouvés (500-5000) sont : `duration`, `elapsedDuration`, `minActivityLapDuration` - **ce sont des durées, PAS des sauts**

**Cause probable** :
- Les sauts ne sont **PAS dans summaryDTO** (les clés listées ne contiennent pas "jump", "saut", "count")
- Les sauts ne sont **PAS dans measurements** (aucun log `[DEBUG] Parsing X measurements`)
- Les sauts sont probablement dans une structure **Connect IQ spécifique** non explorée (peut-être `activityDetailDTO`, `laps`, `splits`, ou un champ custom dans les données FIT)

**Impact** : Les sauts sont l'une des métriques les plus importantes pour la corde à sauter - **IMPOSSIBLE d'analyser la performance sans cette donnée**

---

### 2. **VITESSE INCORRECTE**

**Statut** : ❌ **CRITIQUE**
- Vitesse trouvée : `0.041126251220703125` et `0.022775650024414062` sauts/min
- Vitesse attendue : ~95 sauts/min (d'après les screenshots utilisateur)
- Le code détecte que c'est absurde (`Found suspicious speed value`) mais **ne recalcule pas** car les sauts sont null

**Cause** :
- La vitesse dans l'API est probablement en **m/s** ou une autre unité, pas en sauts/min
- Le code tente de calculer depuis `jumps` et `duration` mais échoue car `jumps == 0`

**Impact** : La vitesse affichée est **totalement incorrecte** et inutilisable

---

### 3. **MÉTRIQUES MANQUANTES**

**Statut** : ❌ **CRITIQUE**

Les logs montrent **AUCUN parsing de measurements** pour les activités corde à sauter :
- ❌ Pas de log `[DEBUG] Parsing X measurements for activity...`
- ❌ Pas de log `[DEBUG] Measurement[X] '...' has value...`

**Métriques manquantes** :
- ❌ Interruptions : `null` au lieu d'un nombre (14 d'après les screenshots)
- ❌ Max continuous jumps : `null` au lieu d'un nombre (144 d'après les screenshots)
- ❌ Connect IQ duration (format mm:ss) : manquant
- ❌ Calories actives : `null` au lieu d'un nombre (125 d'après les screenshots)
- ❌ Transpiration (sweatLoss) : `null` au lieu d'un nombre (65 ml d'après les screenshots)
- ❌ Minutes intensives modérées : `null` pour activité 20826657046 (devrait être 1 min)
- ❌ Minutes intensives soutenues : `null` pour activité 20826657046 (devrait être 9 min)

**Cause probable** :
- Le code ne trouve **PAS** la structure `measurements` dans `activityDetailDTO`
- Ces données sont probablement dans une autre structure (Connect IQ data, laps, ou champs custom)

---

## ❌ PROBLÈMES CRITIQUES - NATATION

### 4. **TOUTES LES MÉTRIQUES DE NATATION SONT NULL**

**Statut** : ❌ **CRITIQUE**

Le JSON final montre :
```json
"swimmingMetrics": {
  "strokeCount": null,
  "avgStrokeRate": null,
  "avgSwolf": null,
  "avgMovementsPerLap": null,
  "avgPace": null,
  "avgPaceMovement": null,
  "bestPace": null,
  "avgSpeed": null,
  "avgSpeedMovement": null,
  "maxSpeed": null
}
```

**Toutes les métriques de natation sont absentes** alors qu'elles sont **OBLIGATOIRES** selon les spécifications.

**Métriques manquantes spécifiques** :
- ❌ Nombre de mouvements (stroke count)
- ❌ Fréquence de mouvement moyenne (strokes per minute)
- ❌ Nombre moyen de mouvements par longueur
- ❌ Allure moyenne (temps par 100m)
- ❌ Allure moyenne de déplacement
- ❌ Meilleure allure (best pace)
- ❌ Vitesse moyenne
- ❌ Vitesse moyenne de déplacement
- ❌ Vitesse maximale
- ❌ SWOLF moyen

**Cause probable** :
- Le code cherche dans `activityDetailDTO` mais ne trouve rien
- Ces métriques sont probablement dans :
  - `summaryDTO` avec des noms différents
  - `laps` data (chaque longueur a ses métriques)
  - Champs custom de natation spécifiques à Garmin

---

### 5. **MÉTRIQUES TEMPORELLES INCOMPLÈTES**

**Statut** : ❌ **MAJEUR**

```json
"timeMetrics": {
  "totalTime": 117,
  "activeTime": null,  // ❌ MANQUANT
  "elapsedTime": 117
}
```

- ❌ `activeTime` est toujours `null`
- Selon les spécifications, `activeTime` (temps de déplacement actif) est **OBLIGATOIRE**

**Cause probable** :
- Le code cherche `activeTime` / `activeDuration` mais ne trouve pas
- Peut-être dans `movingDuration` de `summaryDTO` ?

---

### 6. **CALORIES ACTIVES NULL**

**Statut** : ❌ **MAJEUR**

```json
"calories": {
  "total": 30,
  "resting": 2,
  "active": null  // ❌ MANQUANT
}
```

- Les calories actives sont **OBLIGATOIRES** selon les spécifications
- Le code devrait calculer : `active = total - resting` si non trouvé directement

**Cause** : Le code cherche dans plusieurs endroits mais ne trouve rien, et **ne calcule pas** depuis `total - resting`

---

### 7. **TRANSPIRATION NULL**

**Statut** : ❌ **MAJEUR**

- `sweatLoss: null` pour toutes les activités natation
- Selon les spécifications, c'est une métrique importante

---

## ❌ PROBLÈMES - ACTIVITÉS CARDIO

### 8. **CALORIES ACTIVES NULL**

**Statut** : ❌ **MAJEUR**

Même problème que natation :
```json
"calories": {
  "total": 448,
  "resting": 67,
  "active": null  // ❌ MANQUANT
}
```

- Devrait être calculé : `active = 448 - 67 = 381`
- Le code ne fait **PAS** ce calcul

---

### 9. **TRANSPIRATION NULL**

**Statut** : ❌ **MAJEUR**

- `sweatLoss: null` pour toutes les activités cardio
- Pourtant les screenshots montrent que Garmin Connect affiche cette métrique

---

## ❌ PROBLÈMES - MÉTRIQUES QUOTIDIENNES

### 10. **DISTANCE PARFOIS NULL DANS LES LOGS**

**Statut** : ⚠️ **MODÉRÉ**

Les logs montrent :
```
[DEBUG] Stats values - distance: None, calories: 2556.0, active: 578.0, resting: 1978.0
```

Mais le JSON final a `"distance": 4.64` - donc c'est récupéré ailleurs, mais les logs ne montrent pas où.

**Cause** : Le code cherche `totalDistanceMeters` / `wellnessDistanceMeters` dans `stats`, mais les logs montrent `distance: None`. Il faut vérifier où la distance est finalement récupérée.

---

### 11. **MINUTES INTENSIVES NULL POUR CERTAINS JOURS**

**Statut** : ⚠️ **MODÉRÉ**

```json
"2025-10-27": {
  "intensityMinutes": null  // ❌ DEVRAIT ÊTRE RÉCUPÉRÉ
}
```

Mais le 27 octobre a une activité cardio avec `"intensityMinutes": {"moderate": 28, "vigorous": 28, "total": 56}` - donc les données existent, mais ne sont pas agrégées dans les métriques quotidiennes.

**Cause** : Le code ne récupère pas les minutes intensives depuis `stats` ou `intensity_data` pour tous les jours.

---

### 12. **RESPIRATION NULL POUR CERTAINS JOURS**

**Statut** : ⚠️ **MODÉRÉ**

```json
"2025-10-27": {
  "respiration": null  // ❌ MAIS LES LOGS MONTRENT avgWakingRespirationValue found: 13.0
}
```

Les logs montrent que les données de respiration **SONT TROUVÉES** :
```
[DEBUG] avgWakingRespirationValue found: 13.0 (type: float)
[DEBUG] resp_awake_avg_raw = 13.0 (type: float), parsed = 13.0
```

Mais le JSON final montre `respiration: null`.

**Cause** : Le code parse les données mais ne les sauvegarde **PAS** dans la structure `dailyMetrics` pour certains jours.

---

## ❌ PROBLÈMES DE CODE / ARCHITECTURE

### 13. **AUCUN LOG POUR MEASUREMENTS**

**Statut** : ❌ **CRITIQUE**

Pour les activités corde à sauter, **AUCUN log** n'apparaît pour `measurements` :
- Pas de `[DEBUG] Found X measurements`
- Pas de `[DEBUG] Parsing X measurements`
- Pas de `[DEBUG] Measurement[X] '...'`

**Cause** : Le code cherche `measurements` dans :
```python
measurements = detail_dto_conn.get('measurements', []) or act_details.get('measurements', []) or []
```

Mais cette structure n'existe probablement pas. Les données Connect IQ sont peut-être ailleurs.

---

### 14. **SAUTS CHERCHÉS DANS MAUVAISE PLAGE**

**Statut** : ❌ **CRITIQUE**

Le code cherche les sauts entre **500-5000**, mais trouve seulement des durées (652.791 secondes).

**Problème** : Si les sauts sont dans une autre unité ou structure, cette recherche ne fonctionnera jamais.

**Solution nécessaire** :
1. Chercher dans **TOUTES** les structures possibles (laps, splits, Connect IQ data)
2. Afficher **TOUS** les champs numériques de `act_details` pour identifier où sont les sauts
3. Peut-être les sauts sont dans un champ nommé différemment (pas "jump" mais "count", "total", etc.)

---

### 15. **VITESSE NON RECALCULÉE**

**Statut** : ❌ **CRITIQUE**

Le code détecte que la vitesse est absurde (< 1 sauts/min) mais ne la recalcule pas :
```python
if val < 1 and val > 0:  # Probablement en m/s ou fraction
    # Ne pas l'utiliser directement, mais noter
    print(f"[DEBUG] Found suspicious speed value...")
```

Mais ensuite, si `jumps == 0`, le calcul `speed = jumps / (duration / 60)` ne fonctionne pas.

**Solution** : Il faut chercher la vitesse ailleurs ou utiliser une autre méthode de calcul.

---

## 📋 RÉSUMÉ DES PROBLÈMES PAR PRIORITÉ

### 🔴 PRIORITÉ CRITIQUE (Bloquant)

1. **Sauts non trouvés** pour corde à sauter (jumps: null)
2. **Vitesse incorrecte** pour corde à sauter (0.04 au lieu de ~95 sauts/min)
3. **Toutes les métriques de natation sont null** (strokeCount, avgStrokeRate, SWOLF, etc.)
4. **Aucun parsing de measurements** - structure introuvable
5. **Calories actives null** pour toutes les activités (devrait être calculé : total - resting)

### 🟠 PRIORITÉ MAJEURE (Impact important)

6. **activeTime null** pour natation (temps de déplacement actif)
7. **Transpiration null** pour toutes les activités
8. **Interruptions null** pour corde à sauter
9. **Max continuous jumps null** pour corde à sauter
10. **Minutes intensives null** pour certains jours (2025-10-27, 2025-10-31)
11. **Respiration null** pour certains jours malgré des données trouvées

### 🟡 PRIORITÉ MODÉRÉE (Améliorations)

12. **Distance logs** - les logs montrent `distance: None` mais le JSON final a la distance (trouver d'où elle vient)
13. **Améliorer logs** - afficher TOUS les champs numériques pour identifier où sont les données
14. **Recherche exhaustive** - chercher dans toutes les structures possibles (laps, splits, Connect IQ fields)

---

## 🎯 ACTIONS REQUISES

### Action 1 : Identifier où sont les sauts
- Dumper **COMPLÈTEMENT** `act_details` pour une activité corde à sauter (sans troncature)
- Chercher récursivement dans **TOUTES** les structures
- Afficher **TOUS** les champs numériques > 0 pour identifier les sauts

### Action 2 : Récupérer toutes les métriques de natation
- Chercher dans `laps` data (chaque longueur contient des métriques)
- Chercher dans `summaryDTO` avec des noms de champs natation spécifiques
- Chercher dans des structures custom Garmin pour natation

### Action 3 : Calculer les valeurs manquantes
- **Calories actives** : `active = total - resting` si non trouvé
- **Vitesse corde à sauter** : Recalculer depuis sauts et durée si disponible

### Action 4 : Récupérer measurements Connect IQ
- Identifier la vraie structure des données Connect IQ
- Peut-être dans `activityDetailDTO.fieldDataDTOList` ou une structure similaire
- Parser récursivement TOUTES les structures pour trouver "jumps", "interruptions", etc.

### Action 5 : Corriger le parsing respiration
- Le code trouve les données mais ne les sauvegarde pas pour certains jours
- Vérifier la logique de sauvegarde dans `dailyMetrics`

---

## 📝 NOTES

Les logs montrent que certaines données **SONT TROUVÉES** mais ne sont **PAS SAUVEGARDÉES** dans le JSON final. Cela indique un problème dans la structure de données retournée ou dans la logique de parsing.

Il faut probablement :
1. Utiliser `get_activity_details()` ou une méthode similaire pour récupérer les détails complets
2. Dumper les structures complètes (sans troncature) pour identifier où sont les données
3. Parser récursivement TOUTES les structures, pas seulement `summaryDTO` et `measurements`

