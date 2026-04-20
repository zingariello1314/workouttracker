# Calendrier sport : intensité par jour et coloration des cases

Ce document décrit **comment une journée obtient son niveau d’intensité (0–4)** et **comment la couleur affichée est choisie** dans l’application (composant `CalendarHeatmap.jsx` et utilitaires associés). Il reflète la logique du dépôt au moment de sa rédaction ; en cas d’écart avec le code, le code fait foi.

---

## 1. Vue d’ensemble du pipeline

Pour chaque date affichée :

1. **`getIntensityForDate(date)`** (dans `CalendarHeatmap.jsx`) agrège les données **programme / reps / endurance / Garmin / justifications** et produit un objet **`intensity`** (niveau, charges, métriques quotidiennes, contexte visuel, etc.).
2. **`computeCalendarDayVisualContext`** (`src/utils/calendarDayVisualModel.js`) calcule un **score composite** entre 0 et 1 (`composite01`) et des métadonnées (parts kcal, pas, charge, etc.) à partir de ce `intensity`.
3. **`getDayColorStyle(intensity, isToday)`** (dans `CalendarHeatmap.jsx`) choisit **classes Tailwind** et éventuellement un **fond HSL** inline à partir du niveau, du composite, des kcal, pas, minutes d’intensité, etc.
4. Les **chiffres du jour** : **blanc** sur toute case teintée (fond HSL, niveau 1–4, justification, signal « peinture ») ; **ardoise foncée** (`text-slate-800`) sur les **cases blanches** sans données, pour le contraste — **sans ombre portée** sur le texte.

---

## 2. Données prises en compte pour l’intensité (`getIntensityForDate`)

### 2.1 Liste des exercices « prévus » ce jour-là

- Exercices du **programme par défaut** (`workoutProgram`) pour le jour de la semaine (lundi… dimanche).
- Exercices des **programmes personnalisés** dont le planning contient ce jour.

Sans aucun exercice prévu **et** sans session d’endurance enregistrée pour la date, la fonction peut retourner tôt un **`level: 0`** avec peu de champs (jour vierge côté app).

### 2.2 Musculation / street (cases cochées + reps)

Pour chaque exercice de la liste :

- Clés de stockage des reps : `collectCalendarRepKeysForExercise` + `resolveBestRepsStorageKey` (gère variantes de date / programme).
- Un exercice **compte** seulement si **`checkedExercises[key]`** est vrai **et** **`reps > 0`**.
- **`totalReps`** cumule les reps (street + partie endurance textuelle décrite plus bas).
- **`strengthLoad`** : charge **pondérée** via `resolveExerciseIntensityCoeff` (coefficient par exercice, réglable utilisateur), **`computeStrengthCalendarContribution`** (reps × coeff × multiplicateur de charge externe si haltères / poids saisis : `exerciseUsesExternalLoad`, `computeExternalLoadMultiplier`, poids médian par exo).

Donc **deux personnes avec le même nombre de reps** peuvent différer si les **coefficients d’intensité** ou les **charges (kg)** diffèrent.

### 2.3 Endurance (onglet endurance / sessions)

- **`getEnduranceDataForDate`** agrège pour la date : durées, distances, sauts (corde), etc., à partir de `allData.enduranceData.sessions` (par type d’activité), en excluant les sessions mock (`isMockEnduranceSession`).
- Les **reps d’endurance** (hors corde à sauter pour certaines agrégations de debug) s’ajoutent à **`totalReps`**.
- **`getEnduranceLoadForDate(dateStr, allData)`** (`trainingLoadUtils.js`) produit **`enduranceLoadForCalendar`** : une **charge calendrier** dérivée des sessions (durée, type d’activité, allure, etc. via `enduranceSessionCalendarLoad`).

**Important (comportement produit)** : le commentaire dans le code indique que les **sessions d’endurance détaillées ne font pas monter le « nombre d’activités »** pour la règle « complémentaire cochée » comme une séance de plus ; en revanche la **charge endurance** et les **reps endurance** influencent le **niveau** quand la branche « charge / reps » est utilisée.

### 2.4 Activité complémentaire (programme du jour)

- Si le workout du jour (actif ou défaut) définit une **`complementaryActivity`**, une case dédiée peut être cochée (`checkedExercises[..._complementary_...]`).
- Elle augmente **`totalActivities`** pour le **taux de complétion** et peut fournir une **durée** (`..._minutes` ou durée du programme) utilisée dans la branche **temps** si aucune charge/reps n’alimente le niveau.

### 2.5 Calcul du niveau 0–4 (échelle discrète)

Deux familles de seuils **dynamiques** (recalculés avec `useMemo` sur l’historique) :

| Source | Utilisation |
|--------|-------------|
| **`dynamicLoadThresholds`** | Basé sur `buildDailyTrainingLoadByDate` : distribution des **charges journalières** ; seuils min / +33% / +66% / max du range. |
| **`dynamicTimeThresholds`** | Durées issues des **complémentaires cochées** + durées des **sessions d’endurance** (hors mock) ; quartiles min, +25%, +50%, +75%. |

Logique principale (`totalActivities > 0`) :

1. Si **`totalReps > 0`** ou **`strengthLoad > 0`** ou **`enduranceLoadForCalendar > 0`** →  
   `intensityLevel = calculateIntensityLevel(strengthLoad + enduranceLoadForCalendar, dynamicLoadThresholds.thresholds)`  
   (`calendarUtils.js` : 0 = rien, 1–4 = quartiles sur les seuils).
2. Sinon → **`calculateTimeIntensityLevel(realDuration, dynamicTimeThresholds.thresholds)`** (durée réelle estimée : Garmin cardio, complémentaire, programme, etc. selon `calculateRealDuration`).

Si **`totalActivities === 0`** :

- **`detectRealGarminActivity`** peut attribuer un niveau à partir **uniquement Garmin** : activités natation/corde/cardio ≥ 10 min, ou calories actives anormalement hautes vs moyenne 7 j, ou minutes d’intensité ≥ 20, ou `activeTime` (avec atténuation si la journée est surtout de la **marche**).

### 2.6 Ajustements Garmin et ressenti

- Si **`garminData`** est présent et **`intensityLevel > 0`**, **`calculateDayIntensityWithGarmin`** (`garminCalendarUtils.js`) peut **modifier le niveau** (temps réel vs prévu, records natation/corde, calories, etc. — voir le fichier pour le détail).
- Ensuite, si un **feedback de difficulté** (1–5) existe pour la date, un **petit bump** entier est appliqué sur le niveau (borné 0–4).

### 2.7 Score annexe `intensityScore`

Formule indicative dans le code :  
`completionRate * 100 + totalReps * 0.1 + (complémentaire cochée ? 50 : 0)`  
— sert surtout d’**indicateur** / affichages, pas comme unique source de la couleur HSL.

### 2.8 Justifications de jour sans entraînement

- **`getDayJustification`** (`dayJustificationUtils.js`) peut attacher une **justification** (maladie, flemme, etc.).
- Si présente, **`getDayColorStyle`** applique une **couleur fixe** par type (`JUSTIFICATION_COLORS`), en priorité sur le reste.

---

## 3. Contexte visuel et composite (`calendarDayVisualModel.js`)

`computeCalendarDayVisualContext` fusionne plusieurs **normalisations** (souvent entre 0 et 1) :

- **`levelNorm`** : niveau 0–4 ramené à 0–1.
- **`kcalNorm`** : kcal actives vs médiane de référence ou gros paliers absolus.
- **`stepsNorm`** : pas « marginaux » au-dessus d’un plancher lié à ta médiane de pas.
- **`intMinNorm`** : si Garmin fournit **modéré** + **soutenu**, on forme des **minutes équivalentes** = `soutenu × 1 + modéré × poids` (`poids` ≈ **0,38** ou **0,12** si journée « marche »), puis on divise par `INTENSITY_MIN_FULL` (**96**). Sinon on utilise le **total** avec la même division, puis facteur **×0,38** si `walkHeavy` / `walkOnlyDay`.
- **`loadNorm`** : `(strengthLoad + enduranceLoad) / LOAD_UNITS_FULL`.
- **`repHintNorm`** : `totalReps / RAW_REPS_FULL`.

**Poids du blend (somme = 1)** — contrôle ce qui tire la teinte vers « chargé » :

| Part | Poids (après calage réalisme) |
|------|--------|
| niveau | 0,32 |
| charge (street + endurance) | 0,27 |
| kcal | 0,17 |
| minutes intensité | 0,08 |
| indice reps | 0,09 |
| pas | 0,07 |

Modulations :

- **Marche dominante** : `walkHeavy` / `walkOnlyDay` appliquent un **`walkDampen`** sur le brut **et** une **atténuation** sur la part « minutes d’intensité » (la montre gonfle souvent le modéré pendant une marche).
- **Bonus** si **`strengthLoad`** ou **`enduranceLoad`** : multiplicateur **modéré** sur le brut (évite le double comptage avec la charge déjà présente dans le blend) ; **synergy** si **street + endurance** le même jour (récompense la variété).
- **Feedback difficulté** : léger `feedbackShift`.

Résultat exposé notamment comme **`composite01`** (0–1) et **`visualScore100`** (arrondi 0–100).

---

## 4. Comment la couleur de la case est choisie (`getDayColorStyle`)

Ordre de décision :

1. **Justification** → couleur d’étiquette (pas de dégradé HSL).
2. **« Jour vide »** (niveau 0, pas de justification, composite / Garmin / charge très bas selon les seuils du code, pas de « signal Garmin discret » `hasQuietGarmin`) → **fond blanc** + bord (`getIntensityColor(0)`).
3. **Sinon**, si le **contexte visuel** existe et que les seuils déclenchent **`useCompositeHsl`** (niveau > 0, ou kcal/pas/minutes/charge significatifs, ou signal faible mais réel, etc.) :
   - **`composite01`** est éventuellement **relevé** pour les jours « calmes » mais avec un peu de Garmin (marche / kcal).
   - Puis **re-calé** sur la plage **min/max du mois ou de l’année affichée** (`personalTintBounds`) pour que le **vert ↔ rouge** utilise toute la plage sur *ta* période.
   - Couleur = **HSL** : teinte de **vert** (faible charge) vers **rouge** (forte charge), avec **saturation et luminance** élevées pour un rendu **vif** (valeurs dans le composant).
4. **Branche kcal** : si kcal actives élevées par rapport à la médiane de référence (`kcal > 85 && kref > 55`), un HSL similaire mélange niveau et ratio kcal.
5. **Sinon** → couleurs **discrètes par niveau 1–4** (vert → jaune → orange → rouge) via **`getIntensityColor(level)`**.

La fonction **`calendarDayHasPaintSignal`** (`calendarDayVisualModel.js`) sert à savoir si la case doit être traitée comme « ayant déjà un signal » (ouvrir le panneau détail vs justification), en combinant niveau, reps, kcal, pas, load, icônes Garmin, seuil sur `composite01`, etc.

---

## 5. Fichiers clés (référence développeur)

| Fichier | Rôle |
|---------|------|
| `src/components/CalendarHeatmap.jsx` | `getIntensityForDate`, `getDayColorStyle`, grilles mois/année, seuils dynamiques, détection Garmin. |
| `src/utils/calendarUtils.js` | `calculateIntensityLevel`, `calculateTimeIntensityLevel`, parsing durées. |
| `src/utils/calendarDayVisualModel.js` | `computeCalendarDayVisualContext`, `calendarDayHasPaintSignal`, constantes visuelles. |
| `src/utils/garminCalendarUtils.js` | `calculateDayIntensityWithGarmin`, icônes activités. |
| `src/utils/trainingLoadUtils.js` | Charge street/endurance, `getEnduranceLoadForDate`, `buildDailyTrainingLoadByDate`, coefficients d’exercice côté charge. |
| `src/utils/dayJustificationUtils.js` | Justifications et couleurs associées. |

---

## 6. Synthèse « métier » en une phrase

**Le niveau 0–4** résume surtout **ce que tu as validé ce jour** (reps cochées, charge muscu + endurance, ou temps / Garmin) **par rapport à tes propres habitudes récentes** ; **la teinte fine** de la case mélange en plus **kcal, pas, minutes d’intensité, charge et ressenti** pour visualiser une **journée complète**, avec des garde-fous pour les journées **uniquement marche**.
