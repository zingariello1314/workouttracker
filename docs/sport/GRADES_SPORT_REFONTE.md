# Momentum — Refonte niveau + système de grades (spec validée)

Complète la vision initiale avec la **règle de déblocage révisée (§4)** : les sous-tiers **I / II / III** ne dépendent que du **niveau numérique** ; seul le **passage d’un grade au grade suivant** exige une preuve d’activité « méritée ».

Référence XP actuelle (inchangée à la source) : [XP_SPORT_SYSTEME.md](./XP_SPORT_SYSTEME.md).

---

## 0. Règle absolue (non négociable)

- **`calculateSportXP` reste intact** : mêmes sources, mêmes coefficients.
- `totalXP` et `breakdown.*` ne changent pas d’un chiffre.
- Niveau, score de maîtrise, grades et compteurs d’activité = **couche parallèle en lecture seule** sur les données existantes (+ agrégats dérivés documentés en §4.2).

---

## 1. Nouvelle courbe de niveau numérique

Remplace le palier fixe (1000 XP/niveau) :

```text
reqXP(L → L+1) = 500 + 30 × (L - 1)
cumulXP(L)     = 15 × (L - 1)² + 485 × (L - 1)     // XP total minimal pour être niveau L
```

- Profil **Modérée** (A = 500, B = 30).
- Niveaux étendus jusqu’à **150+**.
- Exemple : 48 216 XP sport → niveau **~44** (contre 49 en palier fixe).

**Code :** `sportLevelFromTotalXp(totalXP)`, `sportXpProgressInLevel(totalXP)` — remplace uniquement `floor(totalXP / 1000) + 1` dans `useSportXP` / `SportXPBar`.

---

## 2. Score de maîtrise (calcul parallèle)

Repondération des **XP déjà calculées** dans `breakdown` (pas les données brutes) :

| Poste | Mult. maîtrise |
|--------|----------------|
| `weightedRepsXp` | × 3 |
| `liftedVolumeKgXp` | × 2 |
| `caloriesXp` | × 0,1 |
| `stepsXp` | × 0,1 |
| `stretchesXp` | × 0,3 |
| Trophées (course, corde, gainage, pompes) | × 1 |
| `exercisesXp` | × 1 |
| `programCompletionBonusXp` | × 0 (exclu) |
| Défis, fractionné, circuits, GTG, nutrition, feedback | × 1 |

**Code :** `masteryScoreFromBreakdown(breakdown)` — pur, sans impact sur le cache `calculateSportXP`.

Seuils de maîtrise pour les **grades** : même échelle que la courbe de niveau — le seuil de maîtrise pour entrer dans un grade = **`cumulXP(L_entrée)`** du tableau §3 (appliqué au score de maîtrise, pas au `totalXP`).

Exemple référence (~48 216 XP sport, breakdown typique) : score de maîtrise ≈ **27 446**.

---

## 3. Table des grades — 10 grades × 3 sous-tiers

**30 paliers d’affichage** ; la **montée I → II → III** à l’intérieur d’un grade ne regarde **que le niveau** (§4.1).

| Grade | Tier | Niveaux | XP cumulé (seuil niveau L) |
|-------|------|---------|----------------------------:|
| Novice | I | 1–2 | 0 |
| Novice | II | 3–4 | 1 030 |
| Novice | III | 5–6 | 2 180 |
| Adepte | I | 7–9 | 3 450 |
| Adepte | II | 10–11 | 5 580 |
| Adepte | III | 12–14 | 7 150 |
| Disciple | I | 15–17 | 9 730 |
| Disciple | II | 18–20 | 12 580 |
| Disciple | III | 21–24 | 15 700 |
| Athlète | I | 25–28 | 20 280 |
| Athlète | II | 29–32 | 25 340 |
| Athlète | III | 33–36 | 30 880 |
| Champion | I | 37–41 | 36 900 |
| Champion | II | 42–45 | 45 100 |
| Champion | III | 46–50 | 52 200 |
| Élite | I | 51–56 | 61 750 |
| Élite | II | 57–61 | 74 200 |
| Élite | III | 62–66 | 85 400 |
| Maître | I | 67–72 | 97 350 |
| Maître | II | 73–78 | 112 680 |
| Maître | III | 79–84 | 129 090 |
| Grand Maître | I | 85–91 | 146 580 |
| Grand Maître | II | 92–97 | 168 350 |
| Grand Maître | III | 98–104 | 188 180 |
| Olympien | I | 105–112 | 212 680 |
| Olympien | II | 113–120 | 242 480 |
| Olympien | III | 121–128 | 274 200 |
| Parangon | I | 129–136 | 307 840 |
| Parangon | II | 137–143 | 343 400 |
| Parangon | III | 144–150+ | 376 090 → 405 280 (niv. 150) |

**Code affichage tier (intra-grade) :** `sportTierFromLevel(level)` → `{ grade, tier }` en prenant le **plus haut** tier dont le seuil `cumulXP` est ≤ `cumulXP(level)` **sans** appliquer la gate grade (§4).

**Code grade « mérité » :** `meritedGradeFromActivity(...)` (§4.3).

---

## 4. Règles de déblocage (révision)

### 4.1 Sous-tiers I / II / III — **niveau uniquement**

- Tant que l’utilisateur reste dans le **même grade** (ex. Athlète), passer de **II à III** demande seulement d’atteindre le **niveau numérique** du tier suivant (table §3).
- **Aucune** condition de score de maîtrise, reps, séances ou kcal pour les sous-tiers.
- Le **grade affiché comme titre** peut rester « Athlète » pendant toute la montée I→II→III ; seul le suffixe **I / II / III** change avec le niveau.

Conséquence : avec 48 216 XP et niveau ~44, l’utilisateur peut être **Champion II** en progression pure (niveau), même si le grade **mérité** reste plus bas (§4.3).

### 4.2 Passage **d’un grade au grade suivant** — double exigence

Pour **quitter** un grade G et **entrer** dans le grade G+1 (ex. Novice → Adepte, Athlète → Champion), **les deux** blocs suivants sont requis :

1. **Niveau** : `level ≥ L_entrée(G+1)` (premier tier du grade supérieur, colonne « Niveaux » §3).
2. **Preuve d’activité** : **au moins une** des voies **A–E** ci-dessous satisfaite pour **cette frontière** (seuils du tableau §4.4).

Tant que (2) n’est pas rempli, le **grade mérité** affiché reste **G** (tier le plus élevé autorisé par le niveau **à l’intérieur** de G). Le niveau et la barre XP continuent d’augmenter normalement.

#### Voies de preuve (OU logique — une seule suffit)

| Voie | Signification |
|------|----------------|
| **A — Maîtrise** | `masteryScore ≥ masteryThreshold(G+1)` (= `cumulXP(L_entrée)` du grade G+1) |
| **B — Séances qualifiées** | `qualifiedSessions ≥ sessionsMin` **et** chaque séance comptée dure **`≥ minutesMin`** minutes |
| **C — Volume reps** | `lifetimeReps ≥ repsMin` (reps cochées cumulées, même base que `breakdown.reps`) |
| **D — Énergie** | `lifetimeActiveKcal ≥ kcalMin` (calories actives Garmin cumulées, même base que `breakdown.calories`) |
| **E — Polyvalence** | **Simultanément** : maîtrise ≥ **70 %** du seuil A, **et** séances ≥ **70 %** de B, **et** reps ≥ **70 %** de C, **et** kcal ≥ **70 %** de D (pour les profils « un peu de tout » sans excès sur une seule voie) |

La voie **E** est volontairement exigeante sur **tous** les axes à 70 % : elle ne remplace pas une voie A très forte, elle récompense la régularité mixte.

#### Agrégats « séance qualifiée » (lifetime, lecture seule)

Nouveau module **`sportActivityAggregates(workoutData, garminData, enduranceData)`** — ne modifie pas l’XP :

1. **Sessions endurance** : chaque entrée dans `enduranceData.sessions.*` (course, pompes, corde, gainage, natation, boxe…) avec durée dérivée ≥ `minutesMin` (champ `duration`, `durationSec`, ou équivalent normalisé comme ailleurs dans l’app).
2. **Séances musculation / street** : chaque **jour** où il existe au moins une paire (date × exercice) cochée avec reps > 0 **et** soit une entrée `sessionFeedbacks[date]`, soit une durée séance enregistrée si disponible, compte comme **1** séance qualifiée si la durée du jour ≥ `minutesMin` ; à défaut de durée, règle de repli : **≥ 1 exercice coché avec ≥ 30 reps ce jour** compte comme séance de **20 min** équivalent (proxy conservateur, documenté dans le code).
3. **Étirements** : une coche d’étirement avec XP comptabilisable (même règle que les étirements dans `calculateSportXP`) ne compte **pas** seule ; elle peut **compléter** une séance du même jour déjà ouverte (durée +10 min plafonnée) pour le quota minutes, sans créer une séance à part entière avant le grade Disciple.

`qualifiedSessions` = nombre de séances 1–2 distinctes (une session endurance = 1 ; un jour workout qualifié = 1).

`lifetimeReps` = `breakdown.reps` (ou recomptage identique à `collectDedupedCheckedVolumeKeys`).

`lifetimeActiveKcal` = `breakdown.calories` (somme calories **actives** Garmin).

### 4.3 Grade affiché « mérité » vs progression

- **Progression :** `{ grade, tier }` from level only → ex. « Champion II · Niveau 44 ».
- **Grade mérité :** plus haut grade G tel que **toutes** les frontières Novice→…→G ont leurs gates (§4.2) validées ; tier mérité = max tier de G autorisé par le niveau (§4.1).

Exemple révisé (~48 216 XP, niveau 44, maîtrise ~27 446) :

- Progression : **Champion II** (niveau 42–45).
- Frontière **Athlète → Champion** (L 37, maîtrise 36 900) : maîtrise OK (27 446 < 36 900) → voies B/C/D/E à vérifier ; si une voie passe → grade mérité **Champion I** minimum ; sinon grade mérité reste **Athlète** avec tier III si niveau ≥ 33.
- Les sous-tiers Champion I/II restent accessibles par le **seul niveau** une fois la gate Athlète→Champion franchie.

### 4.4 Seuils par frontière de grade (Novice → … → Parangon)

`masteryThreshold` = `cumulXP(L_entrée)` du **premier tier** du grade cible (colonne XP §3).

| Frontière | Niv. min | Maîtrise (A) | Séances (B) | Min / séance | Reps (C) | kcal actives (D) |
|-----------|---------:|-------------:|------------:|-------------:|---------:|-----------------:|
| **Novice → Adepte** | 7 | 3 450 | 12 | 15 min | 2 500 | 1 500 |
| **Adepte → Disciple** | 15 | 9 730 | 28 | 18 min | 8 000 | 4 000 |
| **Disciple → Athlète** | 25 | 20 280 | 50 | 20 min | 18 000 | 8 000 |
| **Athlète → Champion** | 37 | 36 900 | 75 | 22 min | 35 000 | 14 000 |
| **Champion → Élite** | 51 | 61 750 | 105 | 25 min | 55 000 | 22 000 |
| **Élite → Maître** | 67 | 97 350 | 140 | 28 min | 80 000 | 32 000 |
| **Maître → Grand Maître** | 85 | 146 580 | 185 | 30 min | 110 000 | 45 000 |
| **Grand Maître → Olympien** | 105 | 212 680 | 230 | 35 min | 145 000 | 60 000 |
| **Olympien → Parangon** | 129 | 307 840 | 280 | 40 min | 185 000 | 78 000 |

**Calibration (profil ~48k XP sport)** :

- Niveau ~44, maîtrise ~27k → gate **Athlète→Champion** : A non ; typiquement **B** (75 séances × 22 min) ou **C** (35k reps) atteignables pour un pratiquant régulier ; **D** (14k kcal Garmin) plausible avec montre.
- Quelqu’un très « marche + complétion programme » sans force : niveau monte vite, grade mérité **bloqué** sous Champion jusqu’à reps/trophées/séances — comportement voulu.

Les seuils **B/C/D** montent plus vite que la maîtrise pure sur les grades bas (accessibles tôt via volume) et se resserrent relativement aux paliers **Élite+** où **A** ou **E** deviennent le chemin naturel des profils complets.

### 4.5 Algorithme (pseudo-code)

```text
function meritedGradeLevel(level, masteryScore, aggregates):
  gradeOrder = [Novice, Adepte, …, Parangon]
  meritedIndex = 0
  for i in 1..gradeOrder.length-1:
    gate = THRESHOLDS[gradeOrder[i]]  // ligne frontière vers grade i
    if level < gate.levelMin: break
    if gatePassed(gate, masteryScore, aggregates):
      meritedIndex = i
    else:
      break
  grade = gradeOrder[meritedIndex]
  tier = sportTierFromLevelWithinGrade(level, grade)  // I/II/III par niveau seul
  return { grade, tier, nextGate: THRESHOLDS[gradeOrder[meritedIndex+1]]? }

function gatePassed(gate, mastery, agg):
  if mastery >= gate.masteryMin: return true
  if agg.qualifiedSessions >= gate.sessionsMin
     && agg.minDurationOk(gate.minutesMin): return true
  if agg.lifetimeReps >= gate.repsMin: return true
  if agg.lifetimeActiveKcal >= gate.kcalMin: return true
  if mastery >= 0.7*gate.masteryMin
     && agg.qualifiedSessions >= 0.7*gate.sessionsMin
     && agg.lifetimeReps >= 0.7*gate.repsMin
     && agg.lifetimeActiveKcal >= 0.7*gate.kcalMin: return true
  return false
```

---

## 5. Affichage UI (implémenté)

- **Barre XP Sport** (`SportXPBar.jsx`, en-tête de l’onglet Sport) : emblème + nom + **Palier I/II/III** pour la **progression** (niveau seul) et le **grade mérité** (gates), puis barre XP courbe §1.
- **Récap → sous-onglet Grades** (`RecapGradesView.jsx`) : même identité en cartes, bloc XP/maîtrise, prochaine frontière (voies A–D + hint E), historique des gates, échelle des paliers.
- **En-tête shell Récap** : grade mérité compact (`RecapTab` → `gradeHeader`).
- Composants : `SportGradeEmblem`, `SportGradeIdentity` ; hook `useSportGrade` (wrap `useSportXP` + agrégats + résolution).
- Illustrations : fichiers PNG dans `public/sport-grades/` + entrée dans `SPORT_GRADE_ART` (`sportGradeCatalog.js`). Layouts UI : `bar` (bandeau XP), `recap` (cartes), `chip` (listes).

Terminologie UI : **Palier** (I, II, III), pas « division ».

---

## 6. Fichiers (implémentation)

| Fichier | Rôle |
|---------|------|
| `src/services/xp/sportLevelCurve.js` | `cumulXpForLevel`, `levelFromTotalXp`, `sportXpProgressInLevel` |
| `src/services/xp/sportMasteryScore.js` | `masteryScoreFromBreakdown` |
| `src/services/xp/sportGradeCatalog.js` | Table §3 + frontières §4.4 + emblèmes |
| `src/services/xp/sportActivityAggregates.js` | Séances qualifiées, reps, kcal |
| `src/services/xp/sportGradeResolution.js` | `resolveSportGrades`, `gatePassed`, `nextGateProgress` |
| `src/hooks/useSportGrade.js` | XP + maîtrise + agrégats + grades |
| `useSportXP.js` | Barre niveau via `sportXpProgressInLevel` (XP source inchangée) |
| `SportXPBar.jsx` | Double identité + barre XP |
| `RecapGradesView.jsx` | Vue détail grades |
| `recapViewConfig.js` | Entrée nav `GRADES` |

**Ne pas modifier** `xpCalculations.js` (`calculateSportXP`).

---

## 7. Synthèse des changements par rapport à la spec initiale

| Sujet | Avant | Après |
|--------|--------|--------|
| Sous-tiers I/II/III | Niveau **et** maîtrise | **Niveau seul** |
| Gate maîtrise | Chaque tier | **Uniquement** changement de **grade** |
| Autres preuves | — | Séances min, reps, kcal, ou polyvalence 70 % (§4.2) |
| `totalXP` / `breakdown` | Intouchables | Intouchables |

---

*Spec produit — implémentation UI + services en place ; seuils §4.4 ajustables après replay export réel.*
