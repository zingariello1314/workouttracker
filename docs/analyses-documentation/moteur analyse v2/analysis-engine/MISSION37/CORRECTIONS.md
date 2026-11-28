# Corrections M37 — phénomène → cause → preuve → correction → test

## 1. Volume↑ / contenu↓

| | |
|---|---|
| **Phénomène** | Total reps ↑ alors que reps/journée ↓ |
| **Cause** | Branche contraste absente pour volPct>0 & contentPct<-5 ; chute dans `freqLed` |
| **Preuve v35** | +1427 / −588 ; titre « surtout fréquentielle » |
| **Correction** | `phenomenonComposition.js` — driver + titre dédiés |
| **Test** | `mission37… contraste volume↑ / contenu↓` |
| **Amélioration** | Titre : « Plus de volume total, mais moins de reps par journée active » ; refuse progression de capacité |

## 2. Concentration relative hors scope

| | |
|---|---|
| **Phénomène** | 3 mouvements surreprésentés |
| **Cause** | Implication générique + prose « volume général » |
| **Preuve** | Corps v35 termine sur « Ces 7 jours pèsent… » |
| **Correction** | `composeRelativeConcentrationReading` + scope dans `recapPeriodDetectDiscoveries` |
| **Test** | concentration relative bornée |
| **Amélioration** | Lecture limitée aux mouvements nommés |

## 3. Sommeil « plus sensible »

| | |
|---|---|
| **Phénomène** | Écart de rétention poussée/tirage |
| **Cause** | Producteur + seuil smallSample asymétrique (9 et 33) |
| **Preuve** | Titre/corps v35 |
| **Correction** | Titre association ; `associationOnly` ; kinship soften |
| **Test** | kinship + revue manuelle prose |
| **Amélioration** | Plus de propriété physiologique implicite |

## 4. Familles structurelles ×3 priorités

| | |
|---|---|
| **Phénomène** | Même connaissance utile répétée |
| **Cause** | `shortHorizon` incluait month |
| **Correction** | `priorityHorizon = today \| week` ; month = `structural_recall` |
| **Test** | familles structurelles mission37 |
| **Amélioration** | 30j libère une place de priorité pour B020/B022 |

## 5. Convergence parallèle proportionnée

| | |
|---|---|
| **Phénomène** | Homonymes à volumes proches ≠ identiques |
| **Cause** | Seuil 15 % verbalisé « convergent » |
| **Correction** | ≤5 % convergent ; ≤15 % fourchette |
| **Test** | 66/72 vs 192/192 |
| **Amélioration** | B024-like proportionné ; B015 inchangé si égal |

**Édition :** `editorial=p6-sovereign-v36`
