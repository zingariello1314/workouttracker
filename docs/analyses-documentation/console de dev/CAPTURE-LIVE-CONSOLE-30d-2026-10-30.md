# Console diagnostic — dump exhaustif (run live)

**Date de capture :** 30 octobre 2026
**generatedAt :** `2026-10-30T03:25:26.228Z`
**Période :** `30d` · fenêtre `2026-10-01 → 2026-10-30`
**Mode :** diagnostic · samePipeline=true · sideEffectsSuppressed=true
**Note affichage :** shown = pack final de CE run diagnostic uniquement (pas l’historique d’affichages passés).

Source : objet rapport réel de la console (`buildAnalysisEngineDiagnosticReport`), extrait depuis la page ouverte `#dev-analysis-engine`.

JSON brut associé : [`_raw-console-export-30d-2026-10-30.json`](./_raw-console-export-30d-2026-10-30.json)

---

## 0. Périodes supportées (sélecteur)

- `today`
- `7d`
- `30d`
- `3m`
- `6m`
- `1y`
- `all`

---

## 1. Onglet — Vue d’ensemble

### 1.1 KPIs overview

| Champ | Valeur |
| --- | --- |
| period | 30d |
| window | 2026-10-01 → 2026-10-30 |
| voiceKey | month |
| signalsDetected | 56 |
| candidatesProduced | 25 |
| candidatesRetained | 15 |
| candidatesShown | 15 |
| candidatesRejected | 42 |
| totalMs | 7947 |
| signature | 30d|2026-10-01|2026-10-30|0|0|0|38.4|4016|25|585396934 |

### 1.2 Familles starved / rescued

```json
{
  "starved": [],
  "rescued": [
    {
      "family": "adherence",
      "id": "relation.program_gap_mixed",
      "horizon": "short"
    }
  ]
}
```

### 1.3 dataTotals

```json
{
  "sources": 22,
  "ok": 18,
  "sparse": 0,
  "missing": 4
}
```

### 1.4 Warnings

- Donnée manquante : Feedback de séance (RPE / ressenti) (Sport › Aujourd’hui · fin de séance / modal feedback)
- Donnée manquante : Marche manuelle (pas / distance) (Sport › Endurance · marche manuelle / Calendrier)
- Donnée manquante : Sommeil saisi manuellement (Sport › Calendrier · éditeur sommeil manuel)
- Donnée manquante : Questionnaire de profil sportif (Paramètres / Onboarding › Questionnaire profil)

### 1.5 Compteurs registre (agrégés)

| Statut | n |
| --- | --- |
| total | 71 |
| shown_now | 15 |
| intermediate | 25 |
| demoted | 26 |
| rejected | 0 |
| unknown | 5 |
| cross | 2 |
| errors | 0 |

### 1.6 Pipeline summary

```json
{
  "stageCount": 9,
  "executedCount": 9,
  "timedCount": 9,
  "untimedCount": 0,
  "totalMs": 14787,
  "slowest": {
    "id": "adaptive",
    "label": "Insights adaptatifs + sélection",
    "module": "recapAdaptiveInsights",
    "executed": true,
    "skippedReason": null,
    "ms": 6848,
    "startedAt": "2026-10-30T03:25:19.376Z",
    "endedAt": "2026-10-30T03:25:26.224Z",
    "inCount": 25,
    "outCount": 15,
    "countUnit": "candidates",
    "countSemantics": "out = cartes retenues dans le pack final (short+medium+long).",
    "produced": 25,
    "filtered": 10,
    "merged": null,
    "dropped": 10,
    "warnings": [],
    "errors": [],
    "detail": {
      "wallClockOffsetMs": 7943,
      "produced": 25,
      "shown": 15,
      "insufficient": 0,
      "deduped": 0,
      "rankedOut": 10
    },
    "order": 3,
    "functionalLabel": "Insights adaptatifs + sélection",
    "stageStatus": "ok",
    "countUnitMeta": {
      "label": "candidats",
      "short": "cand."
    },
    "droppedApprox": 10,
    "countsComparable": true,
    "msShare": 46.3,
    "hasTiming": true,
    "hasIO": true,
    "technicallyExecuted": true,
    "functionallyOk": true,
    "stageMeta": {
      "label": "Exécutée OK",
      "tone": "green"
    }
  },
  "lossSteps": 2,
  "totalDropped": 20,
  "byStatus": {
    "ok": 9
  },
  "stages": [
    {
      "id": "assessment",
      "label": "Assessment utilisateur",
      "module": "recapUserAssessment",
      "executed": true,
      "skippedReason": null,
      "ms": 880,
      "startedAt": "2026-10-30T03:25:18.280Z",
      "endedAt": "2026-10-30T03:25:19.160Z",
      "inCount": null,
      "outCount": 1,
      "countUnit": "bundle",
      "countSemantics": "out = 1 paquet assessment (pas un nombre de cartes). in non applicable.",
      "produced": 1,
      "filtered": null,
      "merged": null,
      "dropped": null,
      "warnings": [],
      "errors": [],
      "detail": null,
      "order": 1,
      "functionalLabel": "Assessment utilisateur",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "agrégat",
        "short": "agr."
      },
      "droppedApprox": null,
      "countsComparable": false,
      "msShare": 6,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "enrichment",
      "label": "Enrichissement Recap",
      "module": "recapEnrichmentMetrics",
      "executed": true,
      "skippedReason": null,
      "ms": 216,
      "startedAt": "2026-10-30T03:25:19.160Z",
      "endedAt": "2026-10-30T03:25:19.376Z",
      "inCount": null,
      "outCount": 1,
      "countUnit": "bundle",
      "countSemantics": "out = 1 paquet d’enrichissement (métriques dérivées). in non applicable.",
      "produced": 1,
      "filtered": null,
      "merged": null,
      "dropped": null,
      "warnings": [],
      "errors": [],
      "detail": null,
      "order": 2,
      "functionalLabel": "Enrichissement Recap",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "agrégat",
        "short": "agr."
      },
      "droppedApprox": null,
      "countsComparable": false,
      "msShare": 1.5,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "adaptive",
      "label": "Insights adaptatifs + sélection",
      "module": "recapAdaptiveInsights",
      "executed": true,
      "skippedReason": null,
      "ms": 6848,
      "startedAt": "2026-10-30T03:25:19.376Z",
      "endedAt": "2026-10-30T03:25:26.224Z",
      "inCount": 25,
      "outCount": 15,
      "countUnit": "candidates",
      "countSemantics": "out = cartes retenues dans le pack final (short+medium+long).",
      "produced": 25,
      "filtered": 10,
      "merged": null,
      "dropped": 10,
      "warnings": [],
      "errors": [],
      "detail": {
        "wallClockOffsetMs": 7943,
        "produced": 25,
        "shown": 15,
        "insufficient": 0,
        "deduped": 0,
        "rankedOut": 10
      },
      "order": 3,
      "functionalLabel": "Insights adaptatifs + sélection",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "droppedApprox": 10,
      "countsComparable": true,
      "msShare": 46.3,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "composed",
      "label": "Pipeline composé (state, discoveries, essays)",
      "module": "recapInterpretationPipeline",
      "executed": true,
      "ms": 6719,
      "outCount": 22,
      "countUnit": "candidates",
      "produced": 22,
      "detail": {
        "discoveriesAll": 48,
        "discoveriesSelected": 15,
        "discoveriesDropped": 32,
        "essays": 22
      },
      "order": 4,
      "functionalLabel": "Pipeline composé (state, discoveries, essays)",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "countSemantics": "out = candidats issus du pipeline composé (découvertes + essais rendus).",
      "filtered": null,
      "merged": null,
      "dropped": null,
      "droppedApprox": null,
      "countsComparable": false,
      "msShare": 45.4,
      "startedAt": null,
      "endedAt": null,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "span_stories",
      "label": "Span stories",
      "module": "recapAdaptiveInsights",
      "executed": true,
      "ms": 105,
      "outCount": 3,
      "countUnit": "candidates",
      "produced": 3,
      "order": 5,
      "functionalLabel": "Span stories",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "countSemantics": "out = histoires de période générées (span_*).",
      "filtered": null,
      "merged": null,
      "dropped": null,
      "droppedApprox": null,
      "countsComparable": false,
      "msShare": 0.7,
      "startedAt": null,
      "endedAt": null,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "weight_novelty",
      "label": "Pondération novelty / nature / familles",
      "module": "insightNoveltyEngine + recapSelectionDiagnostics",
      "executed": true,
      "ms": 12,
      "inCount": 25,
      "outCount": 25,
      "countUnit": "candidates",
      "produced": 25,
      "merged": 25,
      "order": 6,
      "functionalLabel": "Pondération novelty / nature / familles",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "countSemantics": "in = pool brut ; out = pool pondéré (même cardinalité typique).",
      "filtered": 0,
      "dropped": 0,
      "droppedApprox": 0,
      "countsComparable": true,
      "msShare": 0.1,
      "startedAt": null,
      "endedAt": null,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "dedup",
      "label": "Déduplication kinship",
      "module": "recapCardKinship",
      "executed": true,
      "ms": 5,
      "inCount": 25,
      "outCount": 25,
      "countUnit": "candidates",
      "filtered": 0,
      "dropped": 0,
      "order": 7,
      "functionalLabel": "Déduplication kinship",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "countSemantics": "in = pondérés ; out = distincts ; pertes ≈ doublons sémantiques.",
      "produced": 25,
      "merged": null,
      "droppedApprox": 0,
      "countsComparable": true,
      "msShare": 0,
      "startedAt": null,
      "endedAt": null,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "validate",
      "label": "Validation insights",
      "module": "recapInsightValidate",
      "executed": true,
      "ms": 0,
      "inCount": 25,
      "outCount": 25,
      "countUnit": "candidates",
      "filtered": 0,
      "dropped": 0,
      "order": 8,
      "functionalLabel": "Validation insights",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "countSemantics": "in = distincts ; out = valides ; pertes = rejet validation.",
      "produced": 25,
      "merged": null,
      "droppedApprox": 0,
      "countsComparable": true,
      "msShare": 0,
      "startedAt": null,
      "endedAt": null,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    },
    {
      "id": "select",
      "label": "Sélection colonnes + rescue familles",
      "module": "selectNarrativeColumns",
      "executed": true,
      "ms": 2,
      "inCount": 25,
      "outCount": 15,
      "countUnit": "candidates",
      "filtered": 10,
      "dropped": 10,
      "detail": {
        "rescuedFamilies": [
          {
            "family": "adherence",
            "id": "relation.program_gap_mixed",
            "horizon": "short"
          }
        ],
        "starvedFamilies": []
      },
      "order": 9,
      "functionalLabel": "Sélection colonnes + rescue familles",
      "stageStatus": "ok",
      "countUnitMeta": {
        "label": "candidats",
        "short": "cand."
      },
      "countSemantics": "in = valides ; out = affichés ; pertes = ranked_out / caps.",
      "produced": 15,
      "merged": null,
      "droppedApprox": 10,
      "countsComparable": true,
      "msShare": 0,
      "startedAt": null,
      "endedAt": null,
      "hasTiming": true,
      "hasIO": true,
      "technicallyExecuted": true,
      "functionallyOk": true,
      "stageMeta": {
        "label": "Exécutée OK",
        "tone": "green"
      }
    }
  ]
}
```

---

## 2. Onglet — Pipeline

### 2.1 Assessment utilisateur (`assessment`)

| Champ | Valeur |
| --- | --- |
| module | `recapUserAssessment` |
| stageStatus | `ok` |
| ms | 880 |
| in → out | — → 1 (bundle) |
| produced / dropped / filtered | 1 / — / — |
| executed | true |
| skippedReason | — |

### 2.2 Enrichissement Recap (`enrichment`)

| Champ | Valeur |
| --- | --- |
| module | `recapEnrichmentMetrics` |
| stageStatus | `ok` |
| ms | 216 |
| in → out | — → 1 (bundle) |
| produced / dropped / filtered | 1 / — / — |
| executed | true |
| skippedReason | — |

### 2.3 Insights adaptatifs + sélection (`adaptive`)

| Champ | Valeur |
| --- | --- |
| module | `recapAdaptiveInsights` |
| stageStatus | `ok` |
| ms | 6848 |
| in → out | 25 → 15 (candidates) |
| produced / dropped / filtered | 25 / 10 / 10 |
| executed | true |
| skippedReason | — |

Detail :

```json
{
  "wallClockOffsetMs": 7943,
  "produced": 25,
  "shown": 15,
  "insufficient": 0,
  "deduped": 0,
  "rankedOut": 10
}
```

### 2.4 Pipeline composé (state, discoveries, essays) (`composed`)

| Champ | Valeur |
| --- | --- |
| module | `recapInterpretationPipeline` |
| stageStatus | `ok` |
| ms | 6719 |
| in → out | — → 22 (candidates) |
| produced / dropped / filtered | 22 / — / — |
| executed | true |
| skippedReason | — |

Detail :

```json
{
  "discoveriesAll": 48,
  "discoveriesSelected": 15,
  "discoveriesDropped": 32,
  "essays": 22
}
```

### 2.5 Span stories (`span_stories`)

| Champ | Valeur |
| --- | --- |
| module | `recapAdaptiveInsights` |
| stageStatus | `ok` |
| ms | 105 |
| in → out | — → 3 (candidates) |
| produced / dropped / filtered | 3 / — / — |
| executed | true |
| skippedReason | — |

### 2.6 Pondération novelty / nature / familles (`weight_novelty`)

| Champ | Valeur |
| --- | --- |
| module | `insightNoveltyEngine + recapSelectionDiagnostics` |
| stageStatus | `ok` |
| ms | 12 |
| in → out | 25 → 25 (candidates) |
| produced / dropped / filtered | 25 / 0 / 0 |
| executed | true |
| skippedReason | — |

### 2.7 Déduplication kinship (`dedup`)

| Champ | Valeur |
| --- | --- |
| module | `recapCardKinship` |
| stageStatus | `ok` |
| ms | 5 |
| in → out | 25 → 25 (candidates) |
| produced / dropped / filtered | 25 / 0 / 0 |
| executed | true |
| skippedReason | — |

### 2.8 Validation insights (`validate`)

| Champ | Valeur |
| --- | --- |
| module | `recapInsightValidate` |
| stageStatus | `ok` |
| ms | 0 |
| in → out | 25 → 25 (candidates) |
| produced / dropped / filtered | 25 / 0 / 0 |
| executed | true |
| skippedReason | — |

### 2.9 Sélection colonnes + rescue familles (`select`)

| Champ | Valeur |
| --- | --- |
| module | `selectNarrativeColumns` |
| stageStatus | `ok` |
| ms | 2 |
| in → out | 25 → 15 (candidates) |
| produced / dropped / filtered | 15 / 10 / 10 |
| executed | true |
| skippedReason | — |

Detail :

```json
{
  "rescuedFamilies": [
    {
      "family": "adherence",
      "id": "relation.program_gap_mixed",
      "horizon": "short"
    }
  ],
  "starvedFamilies": []
}
```

---

## 3. Onglet — Données

### 3.1 Totaux catalogue

```json
{
  "sources": 22,
  "ok": 18,
  "sparse": 0,
  "missing": 4
}
```

### 3.2 Absences catalogue

- {"id":"session_feedback","label":"Feedback de séance (RPE / ressenti)","status":"missing","n":0,"origin":"Sport › Aujourd’hui · fin de séance / modal feedback","originPath":"snapshot.sessionFeedbacks","absenceKind":"user_empty","kindLabel":"Jamais saisi (utilisateur)","severity":"action","fixHint":"Remplir le feedback de séance (difficulté RPE) après un workout — sinon sleep×RPE et span effort restent pauvres.","usedBy":["enrichment.feedback","sleep×RPE","span stories"]}
- {"id":"manual_walk","label":"Marche manuelle (pas / distance)","status":"missing","n":0,"origin":"Sport › Endurance · marche manuelle / Calendrier","originPath":"snapshot.enduranceData.manualDailyWalkByDate","absenceKind":"optional_when_garmin","kindLabel":"Optionnel (Garmin couvre déjà)","severity":"info","fixHint":"Optionnel : Garmin fournit déjà des pas. Saisie manuelle utile seulement les jours sans sync.","usedBy":["garminPartial merge","cross-coach","XP pas"]}
- {"id":"manual_sleep","label":"Sommeil saisi manuellement","status":"missing","n":0,"origin":"Sport › Calendrier · éditeur sommeil manuel","originPath":"snapshot.manualSleepByDate","absenceKind":"optional_when_garmin","kindLabel":"Optionnel (Garmin couvre déjà)","severity":"info","fixHint":"Optionnel : le sommeil Garmin est déjà présent. Saisie manuelle pour les nuits hors montre.","usedBy":["garminPartial merge","sleep correlations"]}
- {"id":"profile_quiz","label":"Questionnaire de profil sportif","status":"missing","n":0,"origin":"Paramètres / Onboarding › Questionnaire profil","originPath":"currentUser.profileQuestionnaire","absenceKind":"not_wired_or_empty","kindLabel":"Non branché ou non rempli","severity":"action","fixHint":"Compléter le questionnaire profil (onboarding / Paramètres). La console doit recevoir currentUser.profileQuestionnaire.","usedBy":["assessment","coach structure","attendance expectations"]}

### 3.3 Short catalog

```json
[
  {
    "id": "checked_exercises",
    "label": "Exercices cochés (séances force)",
    "origin": "Sport › Aujourd’hui · Historique",
    "status": "ok",
    "n": 681
  },
  {
    "id": "reps",
    "label": "Répétitions & perfs saisies",
    "origin": "Sport › Aujourd’hui · Historique",
    "status": "ok",
    "n": 675
  },
  {
    "id": "weights",
    "label": "Charges (kg) par exercice",
    "origin": "Sport › Aujourd’hui · Historique",
    "status": "ok",
    "n": 515
  },
  {
    "id": "stretches",
    "label": "Étirements cochés",
    "origin": "Sport › Aujourd’hui · Banque étirements",
    "status": "ok",
    "n": 8
  },
  {
    "id": "circuits",
    "label": "Circuits (définitions + progression)",
    "origin": "Sport › Banque circuits · Aujourd’hui",
    "status": "ok",
    "n": 6
  },
  {
    "id": "active_program",
    "label": "Programme actif (planifié)",
    "origin": "Sport › Programmes / Mon programme",
    "status": "ok",
    "n": 1
  },
  {
    "id": "programs_library",
    "label": "Bibliothèque de programmes",
    "origin": "Sport › Programmes",
    "status": "ok",
    "n": 3
  },
  {
    "id": "completion",
    "label": "Complétion du programme (dérivée)",
    "origin": "Sport › Récapitulatif → Analyse (calcul)",
    "status": "ok",
    "n": 15
  },
  {
    "id": "day_of_week",
    "label": "Assiduité par jour de semaine",
    "origin": "Sport › Récapitulatif → Analyse (calcul)",
    "status": "ok",
    "n": 6
  },
  {
    "id": "session_feedback",
    "label": "Feedback de séance (RPE / ressenti)",
    "origin": "Sport › Aujourd’hui · fin de séance / modal feedback",
    "status": "missing",
    "n": 0
  },
  {
    "id": "day_justifications",
    "label": "Justifications de jours manqués",
    "origin": "Sport › Aujourd’hui · Calendrier",
    "status": "ok",
    "n": 18
  },
  {
    "id": "gtg",
    "label": "GTG (Grease the Groove)",
    "origin": "Sport › Endurance / GTG",
    "status": "ok",
    "n": 6
  },
  {
    "id": "endurance_sessions",
    "label": "Séances endurance (course, etc.)",
    "origin": "Sport › Endurance · Historique cardio",
    "status": "ok",
    "n": 6
  },
  {
    "id": "manual_walk",
    "label": "Marche manuelle (pas / distance)",
    "origin": "Sport › Endurance · marche manuelle / Calendrier",
    "status": "missing",
    "n": 0
  },
  {
    "id": "manual_sleep",
    "label": "Sommeil saisi manuellement",
    "origin": "Sport › Calendrier · éditeur sommeil manuel",
    "status": "missing",
    "n": 0
  },
  {
    "id": "body_metrics",
    "label": "Poids, IMC, mensurations",
    "origin": "Sport › Suivi corporel / Body tracking",
    "status": "ok",
    "n": 6
  },
  {
    "id": "garmin_daily",
    "label": "Garmin — métriques quotidiennes",
    "origin": "Sport › Garmin",
    "status": "ok",
    "n": 88
  },
  {
    "id": "garmin_sleep",
    "label": "Garmin — sommeil (série journalière)",
    "origin": "Sport › Garmin → Sommeil",
    "status": "ok",
    "n": 30
  },
  {
    "id": "garmin_cardio",
    "label": "Garmin — activités (cardio / natation / corde)",
    "origin": "Sport › Garmin → Activités",
    "status": "ok",
    "n": 165
  },
  {
    "id": "profile_quiz",
    "label": "Questionnaire de profil sportif",
    "origin": "Paramètres / Onboarding › Questionnaire profil",
    "status": "missing",
    "n": 0
  },
  {
    "id": "analysis_window",
    "label": "Fenêtre temporelle du run",
    "origin": "Sport › Récapitulatif (sélecteur de période)",
    "status": "ok",
    "n": 1
  }
]
```

### 3.4 Items catalogue (intégralité)

#### 3.4.1 Exercices cochés (séances force)

| Champ | Valeur |
| --- | --- |
| id | `checked_exercises` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.checkedExercises` |
| n | 681 |
| coverage | — |
| note | Cases cochées après une série / exercice réalisé. |

#### 3.4.2 Répétitions & perfs saisies

| Champ | Valeur |
| --- | --- |
| id | `reps` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.reps` |
| n | 675 |
| coverage | — |
| note | Valeurs de performance liées aux exercices cochés. |

#### 3.4.3 Charges (kg) par exercice

| Champ | Valeur |
| --- | --- |
| id | `weights` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.exerciseWeights (+ exerciseSetWeights)` |
| n | 515 |
| coverage | — |
| note | 515 charges simples · 0 profils par série. |

#### 3.4.4 Étirements cochés

| Champ | Valeur |
| --- | --- |
| id | `stretches` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.checkedStretches` |
| n | 8 |
| coverage | — |
| note | Mobilité / stretching réalisé. |

#### 3.4.5 Circuits (définitions + progression)

| Champ | Valeur |
| --- | --- |
| id | `circuits` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.circuitDefinitions + circuitProgress` |
| n | 6 |
| coverage | — |
| note | 2 définitions · 4 progressions. |

#### 3.4.6 Programme actif (planifié)

| Champ | Valeur |
| --- | --- |
| id | `active_program` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `activeProgram` |
| n | 1 |
| coverage | — |
| note | Programme « Programme Cycle 3+1 » |

#### 3.4.7 Bibliothèque de programmes

| Champ | Valeur |
| --- | --- |
| id | `programs_library` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `programs[]` |
| n | 3 |
| coverage | — |
| note | Programmes disponibles pour contexte / étirements planifiés. |

#### 3.4.8 Complétion du programme (dérivée)

| Champ | Valeur |
| --- | --- |
| id | `completion` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `enrichment.completion` |
| n | 15 |
| coverage | — |
| note | Calculé à partir du programme + séances réalisées. |

#### 3.4.9 Assiduité par jour de semaine

| Champ | Valeur |
| --- | --- |
| id | `day_of_week` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `enrichment.dayOfWeek` |
| n | 6 |
| coverage | — |
| note | Jours planifiés vs réalisés. |

#### 3.4.10 Feedback de séance (RPE / ressenti)

| Champ | Valeur |
| --- | --- |
| id | `session_feedback` |
| tab/family | `Sport` |
| status | `missing` |
| originPath | `snapshot.sessionFeedbacks` |
| n | 0 |
| coverage | — |
| note | Ressenti après séance (utile aux corrélations effort). |

#### 3.4.11 Justifications de jours manqués

| Champ | Valeur |
| --- | --- |
| id | `day_justifications` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.dayJustifications` |
| n | 18 |
| coverage | — |
| note | Motifs saisis quand une séance prévue n’a pas eu lieu. |

#### 3.4.12 GTG (Grease the Groove)

| Champ | Valeur |
| --- | --- |
| id | `gtg` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.enduranceData.gtg` |
| n | 6 |
| coverage | — |
| note | Jours avec volume GTG enregistré. |

#### 3.4.13 Séances endurance (course, etc.)

| Champ | Valeur |
| --- | --- |
| id | `endurance_sessions` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.enduranceData.sessions` |
| n | 6 |
| coverage | — |
| note | Sessions d’endurance stockées côté Momentum. |

#### 3.4.14 Marche manuelle (pas / distance)

| Champ | Valeur |
| --- | --- |
| id | `manual_walk` |
| tab/family | `Sport` |
| status | `missing` |
| originPath | `snapshot.enduranceData.manualDailyWalkByDate` |
| n | 0 |
| coverage | — |
| note | Complète Garmin quand les pas sont saisis à la main. |

#### 3.4.15 Sommeil saisi manuellement

| Champ | Valeur |
| --- | --- |
| id | `manual_sleep` |
| tab/family | `Sport` |
| status | `missing` |
| originPath | `snapshot.manualSleepByDate` |
| n | 0 |
| coverage | — |
| note | Nuits sans montre, saisies dans l’app. |

#### 3.4.16 Poids, IMC, mensurations

| Champ | Valeur |
| --- | --- |
| id | `body_metrics` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `snapshot.progressEntries` |
| n | 6 |
| coverage | — |
| note | 6 mesures utiles sur 6 entrées progress. |

#### 3.4.17 Garmin — métriques quotidiennes

| Champ | Valeur |
| --- | --- |
| id | `garmin_daily` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `garmin.dailyMetrics / garminPartial` |
| n | 88 |
| coverage | — |
| note | Partial prêt · 88 j. avec pas |

#### 3.4.18 Garmin — sommeil (série journalière)

| Champ | Valeur |
| --- | --- |
| id | `garmin_sleep` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `enrichment.sleepDaily ← garminPartial` |
| n | 30 |
| coverage | — |
| note | 30 nuits dans la série enrichissement |

#### 3.4.19 Garmin — activités (cardio / natation / corde)

| Champ | Valeur |
| --- | --- |
| id | `garmin_cardio` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `garminData.activities.{cardio,swimming,jumpRope}` |
| n | 165 |
| coverage | — |
| note | 163 cardio · 0 natation · 2 corde. |

#### 3.4.20 Questionnaire de profil sportif

| Champ | Valeur |
| --- | --- |
| id | `profile_quiz` |
| tab/family | `Paramètres / Onboarding` |
| status | `missing` |
| originPath | `currentUser.profileQuestionnaire` |
| n | 0 |
| coverage | — |
| note | Questionnaire absent ou non branché sur ce run |

#### 3.4.21 Assessment Recap (agrégat)

| Champ | Valeur |
| --- | --- |
| id | `assessment_bundle` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `computeRecapUserAssessment` |
| n | 1 |
| coverage | — |
| note | Couche dérivée : ne remplace pas les sources brutes ci-dessus. |

#### 3.4.22 Fenêtre temporelle du run

| Champ | Valeur |
| --- | --- |
| id | `analysis_window` |
| tab/family | `Sport` |
| status | `ok` |
| originPath | `recap window` |
| n | 1 |
| coverage | 2026-10-01 → 2026-10-30 |
| note | 2026-10-01 → 2026-10-30 |

---

## 4. Onglet — Familles

### 4.1 Composition (`mix`)

- shown: **4** · intermediate: 12 · demoted: 4 · rejected: 4 · unknown: — · total: —

### 4.2 Exercices (`exercise`)

- shown: **4** · intermediate: 7 · demoted: 3 · rejected: 4 · unknown: — · total: —

### 4.3 GTG (`gtg`)

- shown: **2** · intermediate: 2 · demoted: 1 · rejected: 0 · unknown: — · total: —

### 4.4 Rythme & séances (`rhythm`)

- shown: **1** · intermediate: 1 · demoted: 1 · rejected: 1 · unknown: — · total: —

### 4.5 Volume & charge (`volume`)

- shown: **1** · intermediate: 2 · demoted: 3 · rejected: 1 · unknown: — · total: —

### 4.6 Sommeil (`sleep`)

- shown: **1** · intermediate: 1 · demoted: 7 · rejected: 0 · unknown: — · total: —

### 4.7 Assiduité (`adherence`)

- shown: **1** · intermediate: 0 · demoted: 0 · rejected: 0 · unknown: — · total: —

### 4.8 Mobilité (`mobility`)

- shown: **1** · intermediate: 0 · demoted: 0 · rejected: 0 · unknown: — · total: —

### 4.9 Cardio / pas (`cardio`)

- shown: **0** · intermediate: 0 · demoted: 4 · rejected: 0 · unknown: — · total: —

### 4.10 Non classé (`misc`)

- shown: **0** · intermediate: 0 · demoted: 3 · rejected: 0 · unknown: — · total: —

---

## 5. Onglet — Corrélations

### 5.1

```json
{
  "id": "sleep_x_volume",
  "label": "Sommeil ↔ volume / charge",
  "left": "sleep",
  "right": "volume",
  "status": "calculated",
  "certainty": "high",
  "matchedKinds": [
    "sleep_volume_threshold",
    "sleep_volume_threshold"
  ],
  "leftData": {
    "present": false,
    "status": "not_instrumented",
    "label": "sleep"
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Au moins un candidat / signal de ce type a été produit dans ce run."
}
```

### 5.2

```json
{
  "id": "sleep_x_rpe",
  "label": "Sommeil ↔ effort perçu (RPE)",
  "left": "sleep",
  "right": "effort",
  "status": "impossible_with_data",
  "certainty": "medium",
  "matchedKinds": [],
  "leftData": {
    "present": false,
    "status": "not_instrumented",
    "label": "sleep"
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Données insuffisantes d’un côté pour évaluer le croisement."
}
```

### 5.3

```json
{
  "id": "sleep_x_cardio",
  "label": "Sommeil ↔ cardio",
  "left": "sleep",
  "right": "cardio",
  "status": "impossible_with_data",
  "certainty": "medium",
  "matchedKinds": [],
  "leftData": {
    "present": false,
    "status": "not_instrumented",
    "label": "sleep"
  },
  "rightData": {
    "present": false,
    "status": "not_instrumented",
    "label": "cardio"
  },
  "note": "Données insuffisantes d’un côté pour évaluer le croisement."
}
```

### 5.4

```json
{
  "id": "adherence_x_progression",
  "label": "Assiduité ↔ progression",
  "left": "adherence",
  "right": "exercise",
  "status": "not_implemented",
  "certainty": "medium",
  "matchedKinds": [],
  "leftData": {
    "present": true,
    "status": "ok",
    "label": "Complétion du programme (dérivée)",
    "n": 15
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Aucun producteur connu n’a émis ce croisement dans l’exécution observée."
}
```

### 5.5

```json
{
  "id": "volume_x_performance",
  "label": "Volume ↔ performance",
  "left": "volume",
  "right": "exercise",
  "status": "not_triggered",
  "certainty": "medium",
  "matchedKinds": [],
  "leftData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Les deux familles ont des données ; aucun candidat de ce croisement dans ce run."
}
```

### 5.6

```json
{
  "id": "program_x_executed",
  "label": "Programme prévu ↔ exécuté",
  "left": "adherence",
  "right": "exercise",
  "status": "calculated",
  "certainty": "high",
  "matchedKinds": [
    "program_gap_mixed",
    "program_gap_mixed"
  ],
  "leftData": {
    "present": true,
    "status": "ok",
    "label": "Complétion du programme (dérivée)",
    "n": 15
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Au moins un candidat / signal de ce type a été produit dans ce run."
}
```

### 5.7

```json
{
  "id": "gtg_x_exercise",
  "label": "GTG ↔ travail exercice",
  "left": "gtg",
  "right": "exercise",
  "status": "calculated",
  "certainty": "high",
  "matchedKinds": [
    "disc_gtg_unplanned_role",
    "disc_gtg_unplanned_progress",
    "disc_gtg_unplanned_role",
    "disc_gtg_unplanned_progress",
    "disc_gtg_unplanned_now",
    "disc_gtg_unplanned_role",
    "disc_gtg_unplanned_progress"
  ],
  "leftData": {
    "present": true,
    "status": "ok",
    "label": "GTG (Grease the Groove)",
    "n": 6
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Au moins un candidat / signal de ce type a été produit dans ce run."
}
```

### 5.8

```json
{
  "id": "body_x_performance",
  "label": "Poids / mensurations ↔ perfs",
  "left": "body",
  "right": "exercise",
  "status": "impossible_with_data",
  "certainty": "medium",
  "matchedKinds": [],
  "leftData": {
    "present": false,
    "status": "not_instrumented",
    "label": "body"
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Données insuffisantes d’un côté pour évaluer le croisement."
}
```

### 5.9

```json
{
  "id": "freq_x_progression",
  "label": "Fréquence ↔ progression",
  "left": "rhythm",
  "right": "exercise",
  "status": "calculated",
  "certainty": "high",
  "matchedKinds": [
    "span_volume_vs_frequency",
    "disc_calendar_rhythm",
    "disc_sleep_rhythm_habit"
  ],
  "leftData": {
    "present": false,
    "status": "not_instrumented",
    "label": "rhythm"
  },
  "rightData": {
    "present": true,
    "status": "ok",
    "label": "Répétitions & perfs saisies",
    "n": 675
  },
  "note": "Au moins un candidat / signal de ce type a été produit dans ce run."
}
```


---

## 6. Onglet — Absences / opportunités

### 6.1

```json
{
  "id": "data:sleep_x_rpe",
  "kind": "insufficient_data",
  "label": "Sommeil ↔ effort perçu (RPE)",
  "signal": "Couverture insuffisante",
  "family": "sleep×effort",
  "reason": "insufficient_data",
  "certainty": "medium",
  "detail": {
    "id": "sleep_x_rpe",
    "label": "Sommeil ↔ effort perçu (RPE)",
    "left": "sleep",
    "right": "effort",
    "status": "impossible_with_data",
    "certainty": "medium",
    "matchedKinds": [],
    "leftData": {
      "present": false,
      "status": "not_instrumented",
      "label": "sleep"
    },
    "rightData": {
      "present": true,
      "status": "ok",
      "label": "Répétitions & perfs saisies",
      "n": 675
    },
    "note": "Données insuffisantes d’un côté pour évaluer le croisement."
  }
}
```

### 6.2

```json
{
  "id": "data:sleep_x_cardio",
  "kind": "insufficient_data",
  "label": "Sommeil ↔ cardio",
  "signal": "Couverture insuffisante",
  "family": "sleep×cardio",
  "reason": "insufficient_data",
  "certainty": "medium",
  "detail": {
    "id": "sleep_x_cardio",
    "label": "Sommeil ↔ cardio",
    "left": "sleep",
    "right": "cardio",
    "status": "impossible_with_data",
    "certainty": "medium",
    "matchedKinds": [],
    "leftData": {
      "present": false,
      "status": "not_instrumented",
      "label": "sleep"
    },
    "rightData": {
      "present": false,
      "status": "not_instrumented",
      "label": "cardio"
    },
    "note": "Données insuffisantes d’un côté pour évaluer le croisement."
  }
}
```

### 6.3

```json
{
  "id": "absent:adherence_x_progression",
  "kind": "relation_absent",
  "label": "Assiduité ↔ progression",
  "signal": "Données adherence + exercise présentes",
  "family": "adherence×exercise",
  "reason": "feature_absent_in_run",
  "certainty": "medium",
  "detail": {
    "id": "adherence_x_progression",
    "label": "Assiduité ↔ progression",
    "left": "adherence",
    "right": "exercise",
    "status": "not_implemented",
    "certainty": "medium",
    "matchedKinds": [],
    "leftData": {
      "present": true,
      "status": "ok",
      "label": "Complétion du programme (dérivée)",
      "n": 15
    },
    "rightData": {
      "present": true,
      "status": "ok",
      "label": "Répétitions & perfs saisies",
      "n": 675
    },
    "note": "Aucun producteur connu n’a émis ce croisement dans l’exécution observée."
  }
}
```

### 6.4

```json
{
  "id": "gap:volume_x_performance",
  "kind": "relation_not_triggered",
  "label": "Volume ↔ performance",
  "signal": "Données volume + exercise présentes",
  "family": "volume×exercise",
  "reason": "rule_not_triggered_or_filtered",
  "certainty": "medium",
  "detail": {
    "id": "volume_x_performance",
    "label": "Volume ↔ performance",
    "left": "volume",
    "right": "exercise",
    "status": "not_triggered",
    "certainty": "medium",
    "matchedKinds": [],
    "leftData": {
      "present": true,
      "status": "ok",
      "label": "Répétitions & perfs saisies",
      "n": 675
    },
    "rightData": {
      "present": true,
      "status": "ok",
      "label": "Répétitions & perfs saisies",
      "n": 675
    },
    "note": "Les deux familles ont des données ; aucun candidat de ce croisement dans ce run."
  }
}
```

### 6.5

```json
{
  "id": "data:body_x_performance",
  "kind": "insufficient_data",
  "label": "Poids / mensurations ↔ perfs",
  "signal": "Couverture insuffisante",
  "family": "body×exercise",
  "reason": "insufficient_data",
  "certainty": "medium",
  "detail": {
    "id": "body_x_performance",
    "label": "Poids / mensurations ↔ perfs",
    "left": "body",
    "right": "exercise",
    "status": "impossible_with_data",
    "certainty": "medium",
    "matchedKinds": [],
    "leftData": {
      "present": false,
      "status": "not_instrumented",
      "label": "body"
    },
    "rightData": {
      "present": true,
      "status": "ok",
      "label": "Répétitions & perfs saisies",
      "n": 675
    },
    "note": "Données insuffisantes d’un côté pour évaluer le croisement."
  }
}
```


---

## 7. Onglet — Texte final (insights colonnes)

### 7.shortTerm (5)

#### shortTerm #1 — Le volume du mois reste proche de la période précédente

- id: `—`
- kind: `disc_volume_shape`
- horizon/nature: `—` / `—`

Ces 30 jours totalisent 4 016 répétitions en 15 jours de renforcement, soit environ 268 répétitions et 50 min par séance, contre 3 728 reps en 13 jours de renforcement sur les 30 jours d'avant (+7,7 %, fréquence +15,4 %, 268 vs 287 reps/séance). La comparaison utile est donc période contre période de même durée. Les répétitions suivies sur 28 jours sont +1,1 % que le mois comparable, tandis que les 7 derniers jours restent (−8,4 %).

#### shortTerm #2 — Les pectoraux porte 20,1 % du volume de ces 30 jours

- id: `—`
- kind: `disc_muscle_now`
- horizon/nature: `—` / `—`

809 de tes 4 016 reps concernent les pectoraux, contre 604 pour les biceps, 577 pour le dos, 473 pour les triceps, auxquels s'ajoutent 212 reps de gainage/tronc. Ce n'est pas le pic d'un seul exercice: plusieurs mouvements vont dans le même sens, et le tirage pèse environ 14,4 % du volume. Les mouvements de poussée (pectoraux, épaules, triceps) totalisent 1 738 reps, contre 577 pour le dos: le haut du corps est clairement plus exposé en poussée. À volume de poussée égal, le dos reste nettement derrière dans cette fenêtre (écart ~292 reps) — constat de répartition, pas un quota à rattraper. Le stimulus dominant du haut du corps est clairement la poussée: le tirage ne suit pas dans les mêmes proportions sur cette fenêtre. Cette part décrit la composition de ces 30 jours, pas celle d'une séance isolée.

#### shortTerm #3 — Relevés de genoux aux parallèles revient après un long silence

- id: `—`
- kind: `disc_ms_return`
- horizon/nature: `—` / `—`

Il y a 2 semaines, tu as enregistré ta première séance depuis 77 jours sur relevés de genoux aux parallèles. L'écart dépasse 11 fois ton intervalle habituel. Avec 40 répétitions, tu reviens à 100 % de ton volume moyen avant l'interruption. Format observé autour du retour: environ 2 × 20 avant l'interruption, puis environ 2 × 20 à la reprise. Le même jour, 60 répétitions de relevés de genoux à la barre portent sur le même muscle principal. Si la suivante baisse, regarde cette fatigue avant d'y voir une perte. Reproduire ce format sur la prochaine séance confirme le retour; en faire tout de suite une nouvelle norme va plus vite que les données.

#### shortTerm #4 — (sans titre)

- id: `—`
- kind: `—`
- horizon/nature: `—` / `—`

Circuit abdos est régulièrement laissé de côté alors que le reste de la séance est davantage réalisé (~0 % de coches). Ce n'est probablement pas un problème général d'adhérence, mais un bloc mal placé, trop lourd, ou peu utile à tes yeux.

#### shortTerm #5 — (sans titre)

- id: `—`
- kind: `—`
- horizon/nature: `—` / `—`

Le réalisé reste nettement sous le plan (~52 %). On ne tranche pas encore entre jours manqués et séances raccourcies : le signal utile est l'écart d'exécution, pas un chiffre isolé de volume.

### 7.mediumTerm (7)

#### mediumTerm #1 — Les passages hors planning tiennent le fil des jours sans créneau coché

- id: `—`
- kind: `disc_gtg_unplanned_role`
- horizon/nature: `—` / `—`

Sans eux, 4 jours de cette fenêtre seraient restés sans Grease the Groove. La fenêtre d’avant en avait 0, et aucun passage de ce type. 4 jours avec un passage ajouté sur cette fenêtre, 0 sur la précédente. Un passage isolé ne fait pas une continuité: ici on compare deux fenêtres de même longueur, de 1 septembre 2026 à 30 octobre 2026.

#### mediumTerm #2 — Repère général : ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h…

- id: `—`
- kind: `disc_sleep_reference`
- horizon/nature: `—` / `—`

Repère général: ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.

#### mediumTerm #3 — Ces 20 reps sont devenues ton niveau récemment reproductible

- id: `—`
- kind: `disc_ms_pr_consolidated`
- horizon/nature: `—` / `—`

Ces 20 reps de relevés de genoux à la barre sont devenues ton niveau récemment reproductible: cette série apparaît sur 5 de tes 5 dernières séances.

#### mediumTerm #4 — Pompes inclinées commence à s'installer

- id: `—`
- kind: `disc_emergence`
- horizon/nature: `—` / `—`

Pompes inclinées apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 10 à environ 4 × 10 (0 %). Au total, 80 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la période.

#### mediumTerm #5 — (sans titre)

- id: `—`
- kind: `—`
- horizon/nature: `—` / `—`

Tu t’entraînes plus souvent, mais de façon moins régulière

Les semaines de cette fenêtre tournent autour de 3 séance(s), entre 1 et 6. Avant, la moyenne était de 2.6 et l’écart entre semaines était plus resserré. La fréquence moyenne monte, la dispersion aussi. Ce n’est pas une régularité plus forte : c’est un rythme plus chargé et plus inégal. L’intervalle médian entre séances est de 1 jour(s), contre 2 avant.

#### mediumTerm #6 — Curl assis dos calé commence à s'installer

- id: `—`
- kind: `disc_emergence`
- horizon/nature: `—` / `—`

Curl assis dos calé apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 3 × 12 à environ 3 × 12 (0 %). Au total, 72 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la période.

#### mediumTerm #7 — Mollets debout entre dans ton historique

- id: `—`
- kind: `disc_emergence`
- horizon/nature: `—` / `—`

Tu enregistres Mollets debout pour la première fois dans l’historique disponible: 100 répétitions sur cette séance. Reproduire ce volume sur la prochaine séance confirme le départ; augmenter tout de suite le total mélangerait l’apprentissage du geste et une dose nouvelle. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la période.

### 7.longTerm (3)

#### longTerm #1 — Le repère de pompes a monté depuis le début du Grease the Groove

- id: `—`
- kind: `disc_gtg_unplanned_progress`
- horizon/nature: `—` / `—`

Il est passé de 20 reps le 2 septembre 2026 à 25 le 6 octobre 2026. Ça couvre la pratique depuis le 2 septembre 2026, pas seulement la fenêtre affichée. Les passages hors planning portent 80 % des reps de pompes sur toute cette durée (40 sur 50). Ils font partie du volume, ils n’expliquent pas à eux seuls la hausse ou la baisse du repère.

#### longTerm #2 — Pompes déclinées : recul puis retour au niveau de départ

- id: `—`
- kind: `disc_exercise_progress`
- horizon/nature: `—` / `—`

Pompes déclinées est passé par un creux (≈10) puis est revenu vers ≈25.3 répétitions par séance, proche du départ (≈27.3). Le format de séries reste du même ordre. La hausse porte surtout sur cet exercice, tandis que Pompes déclinées (autour de 40 répétitions par séance) et Développé couché incliné aux haltères (autour de 48 répétitions par séance) restent stables. Le retour près du niveau de départ est confirmé sur les séances récentes: le maintenir sur les prochaines séances avant de changer la dose.

#### longTerm #3 — (sans titre)

- id: `—`
- kind: `—`
- horizon/nature: `—` / `—`

Les séances d'exercices sont bien plus tenues (~97.8 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

---

## 8. Onglet — Limites

### 8.1

```json
{
  "id": "no_prior_run_memory",
  "text": "Le vert = pack de CE run diagnostic. La comparaison avec un run métier précédent (insight history) n’est pas branchée ici."
}
```

### 8.2

```json
{
  "id": "evidence_heuristic",
  "text": "Le nombre de preuves / sources est heuristique à partir des metrics exposées — pas un compteur moteur officiel."
}
```

### 8.3

```json
{
  "id": "relation_matrix_partial",
  "text": "La matrice de corrélations croise kinds observés et relations d’architecture ; « non implémenté » = aucun kind de ce type dans ce run, pas une preuve d’absence totale du code."
}
```

### 8.4

```json
{
  "id": "pipeline_drop_counts",
  "text": "Pertes = in−out seulement si les compteurs sont de même unité (candidats). Assessment/enrichment exposent des agrégats (bundle=1), pas des cartes — ne pas les comparer aux étapes candidats."
}
```

### 8.5

```json
{
  "id": "pipeline_timing_scope",
  "text": "Les durées des sous-étapes adaptive (composed→select) sont chronométrées dans collectDiagnostic ; assessment/enrichment le sont au niveau diagnostic. Une étape « exécutée OK » ≠ conclusion métier correcte."
}
```

### 8.6

```json
{
  "id": "data_consumed_partial",
  "text": "« Enregistrements consommés » par famille n’est pas encore tracé finement — l’inventaire expose disponibilités, pas le lineage record→insight."
}
```

---

## 9. Onglet — Registre (intégralité des analyses)

Total lignes : **71**

### 9.0 Index par statut

- **Affichée (run actuel)** (`shown_now`) : 15
- **Candidate intermédiaire** (`intermediate`) : 25
- **Déclassée / filtrée** (`demoted`) : 26
- **Rejet / validation** (`rejected`) : 0
- **Non déterminé** (`unknown`) : 5
- **Transversale** (`cross`) : 0

### 9.1 Famille — Assiduité (1)

#### 9.1.shown_now — Affichée (run actuel) (1)

#### 1. _*(vide)*_

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `program_gap_mixed` |
| Id | `relation.program_gap_mixed` |
| Famille | Assiduité (`adherence`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `short` |
| Score / weight | — / 64 |
| Confidence / relevance | 0.8200000000000001 / 0.82 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `pipeline` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Le réalisé reste nettement sous le plan (~52 %). On ne tranche pas encore entre jours manqués et séances raccourcies : le signal utile est l'écart d'exécution, pas un chiffre isolé de volume.

**Evidence**

_*(vide)*_

Liste evidence :
- prévu/réalisé ~52 %
- 3 j. justifiés

**Metrics (scalaires / petites listes)**

- **programCompletionPct** : `52`
- **sessionAlignment** : `null`
- **frequencyDeltaPct** : `-23.1`
- **justifiedDays** : `3`

### 9.2 Famille — Cardio / pas (4)

#### 9.2.demoted — Déclassée / filtrée (4)

#### 1. La dépense de la période distingue densité et fréquence

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_kcal_profile` |
| Id | `disc_kcal_profile` |
| Famille | Cardio / pas (`cardio`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 41 / — |
| Confidence / relevance | — / 0.9255555555555556 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Les 11 238 kcal actives enregistrées ce mois donnent une mesure de la charge globale indépendante des seules répétitions. Croisée avec 12 h 37 d'exercices, cette donnée permet de distinguer une période où l'activité est élevée parce que les séances sont nombreuses d'une période où elle est élevée parce que les séances sont particulièrement denses. Ici la dépense se répartit sur 11 journées.

**Evidence**

11 238 kcal · 12 h 37

**Metrics (scalaires / petites listes)**

_aucune_

#### 2. La charge du mois provient entièrement des exercices de renforcement

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_no_running` |
| Id | `disc_no_running` |
| Famille | Cardio / pas (`cardio`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 26 / — |
| Confidence / relevance | — / 0.9088888888888889 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Aucune course n'a été enregistrée sur ces 30 jours. La charge d'entraînement du mois provient donc entièrement des exercices de renforcement.

**Evidence**

0 km

**Metrics (scalaires / petites listes)**

clés présentes : `readingBeats`

#### 3. Les pas de ces 30 jours sont au-dessus de ton niveau des 30 jours d'avant

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_steps_level` |
| Id | `disc_steps_level` |
| Famille | Cardio / pas (`cardio`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 53 / — |
| Confidence / relevance | — / 0.9388888888888889 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Les jours avec un compte de pas se situent autour de 6 806 pas (médiane, 25 jours). Sur les 30 jours d'avant, la médiane est 5 032 pas (28 jours), soit environ 35 % de plus. Ce n'est pas une séance : c'est le déplacement quotidien, à côté de l'entraînement.

**Evidence**

6 806 vs 5 032 pas

**Metrics (scalaires / petites listes)**

_aucune_

#### 4. Les jours sans séance portent moins de pas que les jours entraînés

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_steps_split` |
| Id | `disc_steps_split` |
| Famille | Cardio / pas (`cardio`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 53 / — |
| Confidence / relevance | — / 0.9388888888888889 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Sur ces 30 jours, les jours entraînés tournent autour de 7 567 pas (15 jours) et les jours sans séance autour de 2 429 pas (10 jours). L'écart est d'environ 68 %. Les pas ne remplacent pas la séance : ils disent comment le jour bouge en dehors d'elle.

**Evidence**

entraîné 7 567 · sans séance 2 429

**Metrics (scalaires / petites listes)**

_aucune_

### 9.3 Famille — Composition (23)

#### 9.3.shown_now — Affichée (run actuel) (4)

#### 1. Pompes inclinées commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-1974855961` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 94 |
| Confidence / relevance | 0.78 / 0.9788888888888889 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Pompes inclinées apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 10 à environ 4 × 10 (0 %). Au total, 80 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la période.

**Evidence**

2 séances · unclear · 0 % · 4×10→4×10 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1974855961`
- **factId** : `emergence|1974855961`
- **name** : `Pompes inclinées`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Pompes inclinées commence à s'installer`
- **draftBody** : `Premier enregistrement de pompes inclinées : 80 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 48 répétitions de développé couché incliné aux haltères portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Pompes inclinées apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de pompes inclinées : 80 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 48 répétitions de développé couché incliné aux haltères portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Pompes inclinées commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 2. Curl assis dos calé commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-405829990` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 94 |
| Confidence / relevance | 0.78 / 0.9777777777777777 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Curl assis dos calé apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 3 × 12 à environ 3 × 12 (0 %). Au total, 72 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la période.

**Evidence**

2 séances · unclear · 0 % · 3×12→3×12

**Metrics (scalaires / petites listes)**

- **exerciseId** : `405829990`
- **factId** : `emergence|405829990`
- **name** : `Curl assis dos calé`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Curl assis dos calé commence à s'installer`
- **draftBody** : `Premier enregistrement de curl assis dos calé : 72 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la fenêtre. Le même jour, 36 répétitions de curl zottman et 36 répétitions de curl marteau portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Curl assis dos calé apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de curl assis dos calé : 72 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la fenêtre. Le même jour, 36 répétitions de curl zottman et 36 répétitions de curl marteau portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `insufficient`
- **trajectoryTitleHint** : `Curl assis dos calé commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `4`
- **trajectoryLimits** : `["no_peers"]`

#### 3. Mollets debout entre dans ton historique

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-728134920` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 94 |
| Confidence / relevance | 0.78 / 0.9833333333333334 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Tu enregistres Mollets debout pour la première fois dans l’historique disponible: 100 répétitions sur cette séance. Reproduire ce volume sur la prochaine séance confirme le départ; augmenter tout de suite le total mélangerait l’apprentissage du geste et une dose nouvelle. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la période.

**Evidence**

1 séances · insufficient · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `728134920`
- **factId** : `emergence|728134920`
- **name** : `Mollets debout`
- **dates** : `["2026-10-17"]`
- **sessionCount** : `1`
- **lastDate** : `2026-10-17`
- **gapDays** : `null`
- **draftTitle** : `Mollets debout entre dans ton historique`
- **draftBody** : `Premier enregistrement de mollets debout : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Mollets debout apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de mollets debout : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `first_session`
- **trajectoryShape** : `insufficient`
- **trajectoryPath** : `insufficient`
- **trajectoryPrimaryStory** : `insufficient`
- **trajectorySetMechanism** : `null`
- **trajectorySetAvailable** : `false`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Mollets debout entre dans ton historique`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `7`
- **trajectoryLimits** : `["no_set_detail"]`

#### 4. Les pectoraux porte 20,1 % du volume de ces 30 jours

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_muscle_now` |
| Id | `relation.reading.short.disc_muscle_now` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `short` |
| Score / weight | — / 74 |
| Confidence / relevance | 0.78 / 0.9488888888888889 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

809 de tes 4 016 reps concernent les pectoraux, contre 604 pour les biceps, 577 pour le dos, 473 pour les triceps, auxquels s'ajoutent 212 reps de gainage/tronc. Ce n'est pas le pic d'un seul exercice: plusieurs mouvements vont dans le même sens, et le tirage pèse environ 14,4 % du volume. Les mouvements de poussée (pectoraux, épaules, triceps) totalisent 1 738 reps, contre 577 pour le dos: le haut du corps est clairement plus exposé en poussée. À volume de poussée égal, le dos reste nettement derrière dans cette fenêtre (écart ~292 reps) — constat de répartition, pas un quota à rattraper. Le stimulus dominant du haut du corps est clairement la poussée: le tirage ne suit pas dans les mêmes proportions sur cette fenêtre. Cette part décrit la composition de ces 30 jours, pas celle d'une séance isolée.

**Evidence**

4 groupes · 3 810 reps identifiées

**Metrics (scalaires / petites listes)**

- **topGroup** : `chest`
- **topShare** : `20.144422310756973`

#### 9.3.intermediate — Candidate intermédiaire (12)

#### 1. Hyperextension commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-1979012181` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 36 |
| Confidence / relevance | 0.78 / 0.9811111111111112 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Hyperextension apparaît sur 2 séances réparties sur 14 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 12 à environ 4 × 12 (0 %). Au total, 96 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 96 répétitions font 16,6 % des 577 répétitions de dos de la période.

**Evidence**

2 séances · unclear · 0 % · 4×12→4×12 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1979012181`
- **factId** : `emergence|1979012181`
- **name** : `Hyperextension`
- **dates** : `["2026-10-02","2026-10-16"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-16`
- **gapDays** : `null`
- **draftTitle** : `Hyperextension commence à s'installer`
- **draftBody** : `Premier enregistrement de hyperextension : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 16,6 % des 577 répétitions de dos de la fenêtre. Le même jour, 48 répétitions de tractions australiennes — prise pronation portent sur le même muscle principal (le 2 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Hyperextension apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de hyperextension : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 16,6 % des 577 répétitions de dos de la fenêtre. Le même jour, 48 répétitions de tractions australiennes — prise pronation portent sur le même muscle principal (le 2 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Hyperextension commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 2. Développé couché incliné aux haltères commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-1488780401` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 36 |
| Confidence / relevance | 0.78 / 0.98 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Développé couché incliné aux haltères apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 12 à environ 4 × 12 (0 %). Au total, 96 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 96 répétitions font 11,9 % des 809 répétitions de pectoraux de la période.

**Evidence**

2 séances · unclear · 0 % · 4×12→4×12 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1488780401`
- **factId** : `emergence|1488780401`
- **name** : `Développé couché incliné aux haltères`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Développé couché incliné aux haltères commence à s'installer`
- **draftBody** : `Premier enregistrement de développé couché incliné aux haltères : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 11,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 40 répétitions de pompes inclinées portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Développé couché incliné aux haltères apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de développé couché incliné aux haltères : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 11,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 40 répétitions de pompes inclinées portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Développé couché incliné aux haltères commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 3. Squat haltères entre dans ton historique

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-1647297599` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 36 |
| Confidence / relevance | 0.78 / 0.9822222222222222 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Tu enregistres Squat haltères pour la première fois dans l’historique disponible: 100 répétitions sur cette séance. Reproduire ce volume sur la prochaine séance confirme le départ; augmenter tout de suite le total mélangerait l’apprentissage du geste et une dose nouvelle. Ces 100 répétitions font 36,8 % des 272 répétitions de quadriceps de la période.

**Evidence**

1 séances · insufficient · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1647297599`
- **factId** : `emergence|1647297599`
- **name** : `Squat haltères`
- **dates** : `["2026-10-17"]`
- **sessionCount** : `1`
- **lastDate** : `2026-10-17`
- **gapDays** : `null`
- **draftTitle** : `Squat haltères entre dans ton historique`
- **draftBody** : `Premier enregistrement de squat haltères : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 36,8 % des 272 répétitions de quadriceps de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Squat haltères apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de squat haltères : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 36,8 % des 272 répétitions de quadriceps de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `first_session`
- **trajectoryShape** : `insufficient`
- **trajectoryPath** : `insufficient`
- **trajectoryPrimaryStory** : `insufficient`
- **trajectorySetMechanism** : `null`
- **trajectorySetAvailable** : `false`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Squat haltères entre dans ton historique`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `7`
- **trajectoryLimits** : `["no_set_detail"]`

#### 4. Relevés de genoux à la barre revient après une interruption

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `relation.reading.medium.disc_emergence.emergence-106` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 36 |
| Confidence / relevance | 0.78 / 0.9844444444444445 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `discovery` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Relevés de genoux à la barre: Réapparition après 35 jours. Le volume par séance passe d’environ 3 × 20 à environ 3 × 20 (0 %), et ce format se maintient sur les séances suivantes. Ces 180 répétitions font 84,9 % des 212 répétitions de gainage/tronc de la période.

**Evidence**

3 séances · plateau · 0 % · 3×20→3×20

**Metrics (scalaires / petites listes)**

- **exerciseId** : `106`
- **factId** : `emergence|106`
- **name** : `Relevés de genoux à la barre`
- **dates** : `["2026-10-12","2026-10-19","2026-10-26"]`
- **sessionCount** : `3`
- **lastDate** : `2026-10-26`
- **gapDays** : `24`
- **draftTitle** : `Relevés de genoux à la barre revient après une interruption`
- **draftBody** : `Relevés de genoux à la barre revient après 24 jours avec 180 répétitions, soit 4,5 % des répétitions de la fenêtre. Ce n'est pas encore une nouvelle norme : c'est le volume du retour. Ces 180 répétitions font 84,9 % des 212 répétitions de gainage/tronc de la fenêtre. Le même jour, 40 répétitions de relevés de genoux aux parallèles portent sur le même muscle principal (le 19 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. Après une absence de cet ordre, répéter ce volume sur plusieurs séances avant de changer la dose dit s'il tient. Le prendre tout de suite pour la nouvelle habitude va plus vite que les données.`
- **legacyTitle** : `Relevés de genoux à la barre revient dans ces 30 jours`
- **legacyBody** : `Relevés de genoux à la barre revient après 24 jours avec 180 répétitions, soit 4,5 % des répétitions de la fenêtre. Ce n'est pas encore une nouvelle norme : c'est le volume du retour. Ces 180 répétitions font 84,9 % des 212 répétitions de gainage/tronc de la fenêtre. Le même jour, 40 répétitions de relevés de genoux aux parallèles portent sur le même muscle principal (le 19 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. Après une absence de cet ordre, répéter ce volume sur plusieurs séances avant de changer la dose dit s'il tient. Le prendre tout de suite pour la nouvelle habitude va plus vite que les données.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `returning`
- **trajectoryShape** : `plateau`
- **trajectoryPath** : `plateau`
- **trajectoryPrimaryStory** : `plateau`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `insufficient`
- **trajectoryTitleHint** : `Relevés de genoux à la barre revient après une interruption`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `3`
- **trajectoryLimits** : `["no_peers"]`

#### 5. Relevés de genoux à la barre revient après une interruption

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:106` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 94 / — |
| Confidence / relevance | — / 0.9844444444444445 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Relevés de genoux à la barre : Réapparition après 35 jours. Le volume par séance passe d’environ 3 × 20 à environ 3 × 20 (0 %), et ce format se maintient sur les séances suivantes. Ces 180 répétitions font 84,9 % des 212 répétitions de gainage/tronc de la période.

**Evidence**

3 séances · plateau · 0 % · 3×20→3×20

**Metrics (scalaires / petites listes)**

- **exerciseId** : `106`
- **factId** : `emergence|106`
- **name** : `Relevés de genoux à la barre`
- **dates** : `["2026-10-12","2026-10-19","2026-10-26"]`
- **sessionCount** : `3`
- **lastDate** : `2026-10-26`
- **gapDays** : `24`
- **draftTitle** : `Relevés de genoux à la barre revient après une interruption`
- **draftBody** : `Relevés de genoux à la barre revient après 24 jours avec 180 répétitions, soit 4,5 % des répétitions de la fenêtre. Ce n'est pas encore une nouvelle norme : c'est le volume du retour. Ces 180 répétitions font 84,9 % des 212 répétitions de gainage/tronc de la fenêtre. Le même jour, 40 répétitions de relevés de genoux aux parallèles portent sur le même muscle principal (le 19 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. Après une absence de cet ordre, répéter ce volume sur plusieurs séances avant de changer la dose dit s'il tient. Le prendre tout de suite pour la nouvelle habitude va plus vite que les données.`
- **legacyTitle** : `Relevés de genoux à la barre revient dans ces 30 jours`
- **legacyBody** : `Relevés de genoux à la barre revient après 24 jours avec 180 répétitions, soit 4,5 % des répétitions de la fenêtre. Ce n'est pas encore une nouvelle norme : c'est le volume du retour. Ces 180 répétitions font 84,9 % des 212 répétitions de gainage/tronc de la fenêtre. Le même jour, 40 répétitions de relevés de genoux aux parallèles portent sur le même muscle principal (le 19 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. Après une absence de cet ordre, répéter ce volume sur plusieurs séances avant de changer la dose dit s'il tient. Le prendre tout de suite pour la nouvelle habitude va plus vite que les données.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `returning`
- **trajectoryShape** : `plateau`
- **trajectoryPath** : `plateau`
- **trajectoryPrimaryStory** : `plateau`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `insufficient`
- **trajectoryTitleHint** : `Relevés de genoux à la barre revient après une interruption`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `3`
- **trajectoryLimits** : `["no_peers"]`

#### 6. Mollets debout entre dans ton historique

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:728134920` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 93 / — |
| Confidence / relevance | — / 0.9833333333333334 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Tu enregistres Mollets debout pour la première fois dans l’historique disponible : 100 répétitions sur cette séance. Reproduire ce volume sur la prochaine séance confirme le départ ; augmenter tout de suite le total mélangerait l’apprentissage du geste et une dose nouvelle. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la période.

**Evidence**

1 séances · insufficient · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `728134920`
- **factId** : `emergence|728134920`
- **name** : `Mollets debout`
- **dates** : `["2026-10-17"]`
- **sessionCount** : `1`
- **lastDate** : `2026-10-17`
- **gapDays** : `null`
- **draftTitle** : `Mollets debout entre dans ton historique`
- **draftBody** : `Premier enregistrement de mollets debout : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Mollets debout apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de mollets debout : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 49,8 % des 201 répétitions de mollets de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `first_session`
- **trajectoryShape** : `insufficient`
- **trajectoryPath** : `insufficient`
- **trajectoryPrimaryStory** : `insufficient`
- **trajectorySetMechanism** : `null`
- **trajectorySetAvailable** : `false`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Mollets debout entre dans ton historique`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `7`
- **trajectoryLimits** : `["no_set_detail"]`

#### 7. Squat haltères entre dans ton historique

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:1647297599` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 92 / — |
| Confidence / relevance | — / 0.9822222222222222 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Tu enregistres Squat haltères pour la première fois dans l’historique disponible : 100 répétitions sur cette séance. Reproduire ce volume sur la prochaine séance confirme le départ ; augmenter tout de suite le total mélangerait l’apprentissage du geste et une dose nouvelle. Ces 100 répétitions font 36,8 % des 272 répétitions de quadriceps de la période.

**Evidence**

1 séances · insufficient · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1647297599`
- **factId** : `emergence|1647297599`
- **name** : `Squat haltères`
- **dates** : `["2026-10-17"]`
- **sessionCount** : `1`
- **lastDate** : `2026-10-17`
- **gapDays** : `null`
- **draftTitle** : `Squat haltères entre dans ton historique`
- **draftBody** : `Premier enregistrement de squat haltères : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 36,8 % des 272 répétitions de quadriceps de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Squat haltères apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de squat haltères : 100 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 100 répétitions font 36,8 % des 272 répétitions de quadriceps de la fenêtre. Cette séance est répartie en 5 séries de 20 répétitions. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `first_session`
- **trajectoryShape** : `insufficient`
- **trajectoryPath** : `insufficient`
- **trajectoryPrimaryStory** : `insufficient`
- **trajectorySetMechanism** : `null`
- **trajectorySetAvailable** : `false`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Squat haltères entre dans ton historique`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `7`
- **trajectoryLimits** : `["no_set_detail"]`

#### 8. Hyperextension commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:1979012181` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 91 / — |
| Confidence / relevance | — / 0.9811111111111112 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Hyperextension apparaît sur 2 séances réparties sur 14 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 12 à environ 4 × 12 (0 %). Au total, 96 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 96 répétitions font 16,6 % des 577 répétitions de dos de la période.

**Evidence**

2 séances · unclear · 0 % · 4×12→4×12 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1979012181`
- **factId** : `emergence|1979012181`
- **name** : `Hyperextension`
- **dates** : `["2026-10-02","2026-10-16"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-16`
- **gapDays** : `null`
- **draftTitle** : `Hyperextension commence à s'installer`
- **draftBody** : `Premier enregistrement de hyperextension : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 16,6 % des 577 répétitions de dos de la fenêtre. Le même jour, 48 répétitions de tractions australiennes — prise pronation portent sur le même muscle principal (le 2 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Hyperextension apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de hyperextension : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 16,6 % des 577 répétitions de dos de la fenêtre. Le même jour, 48 répétitions de tractions australiennes — prise pronation portent sur le même muscle principal (le 2 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Hyperextension commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 9. Développé couché incliné aux haltères commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:1488780401` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 90 / — |
| Confidence / relevance | — / 0.98 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Développé couché incliné aux haltères apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 12 à environ 4 × 12 (0 %). Au total, 96 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 96 répétitions font 11,9 % des 809 répétitions de pectoraux de la période.

**Evidence**

2 séances · unclear · 0 % · 4×12→4×12 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1488780401`
- **factId** : `emergence|1488780401`
- **name** : `Développé couché incliné aux haltères`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Développé couché incliné aux haltères commence à s'installer`
- **draftBody** : `Premier enregistrement de développé couché incliné aux haltères : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 11,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 40 répétitions de pompes inclinées portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Développé couché incliné aux haltères apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de développé couché incliné aux haltères : 96 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 96 répétitions font 11,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 40 répétitions de pompes inclinées portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Développé couché incliné aux haltères commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 10. Pompes inclinées commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:1974855961` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 89 / — |
| Confidence / relevance | — / 0.9788888888888889 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Pompes inclinées apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 4 × 10 à environ 4 × 10 (0 %). Au total, 80 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la période.

**Evidence**

2 séances · unclear · 0 % · 4×10→4×10 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **exerciseId** : `1974855961`
- **factId** : `emergence|1974855961`
- **name** : `Pompes inclinées`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Pompes inclinées commence à s'installer`
- **draftBody** : `Premier enregistrement de pompes inclinées : 80 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 48 répétitions de développé couché incliné aux haltères portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Pompes inclinées apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de pompes inclinées : 80 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 80 répétitions font 9,9 % des 809 répétitions de pectoraux de la fenêtre. Le même jour, 100 répétitions de pompes (endurance) et 48 répétitions de développé couché incliné aux haltères portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Pompes inclinées commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 11. Curl assis dos calé commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_emergence` |
| Id | `disc_emergence:405829990` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 88 / — |
| Confidence / relevance | — / 0.9777777777777777 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Curl assis dos calé apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 3 × 12 à environ 3 × 12 (0 %). Au total, 72 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la période.

**Evidence**

2 séances · unclear · 0 % · 3×12→3×12

**Metrics (scalaires / petites listes)**

- **exerciseId** : `405829990`
- **factId** : `emergence|405829990`
- **name** : `Curl assis dos calé`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Curl assis dos calé commence à s'installer`
- **draftBody** : `Premier enregistrement de curl assis dos calé : 72 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la fenêtre. Le même jour, 36 répétitions de curl zottman et 36 répétitions de curl marteau portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Curl assis dos calé apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de curl assis dos calé : 72 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la fenêtre. Le même jour, 36 répétitions de curl zottman et 36 répétitions de curl marteau portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `insufficient`
- **trajectoryTitleHint** : `Curl assis dos calé commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `4`
- **trajectoryLimits** : `["no_peers"]`

#### 12. Les pectoraux porte 20,1 % du volume de ces 30 jours

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_muscle_now` |
| Id | `disc_muscle_now` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 62 / — |
| Confidence / relevance | — / 0.9488888888888889 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

809 de tes 4 016 reps concernent les pectoraux, contre 604 pour les biceps, 577 pour le dos, 473 pour les triceps, auxquels s'ajoutent 212 reps de gainage/tronc. Ce n'est pas le pic d'un seul exercice : plusieurs mouvements vont dans le même sens, et le tirage pèse environ 14,4 % du volume. Les mouvements de poussée (pectoraux, épaules, triceps) totalisent 1 738 reps, contre 577 pour le dos : le haut du corps est clairement plus exposé en poussée. À volume de poussée égal, le dos reste nettement derrière dans cette fenêtre (écart ~292 reps) — constat de répartition, pas un quota à rattraper. Le stimulus dominant du haut du corps est clairement la poussée : le tirage ne suit pas dans les mêmes proportions sur cette fenêtre. Cette part décrit la composition de ces 30 jours, pas celle d'une séance isolée.

**Evidence**

4 groupes · 3 810 reps identifiées

**Metrics (scalaires / petites listes)**

- **topGroup** : `chest`
- **topShare** : `20.144422310756973`

#### 9.3.demoted — Déclassée / filtrée (4)

#### 1. Curl Zottman commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_emergence` |
| Id | `disc_emergence:298605878` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 87 / — |
| Confidence / relevance | — / 0.9766666666666667 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Curl Zottman apparaît sur 2 séances réparties sur 7 jours — première présence connue dans l’historique disponible. Le volume par séance passe d’environ 3 × 12 à environ 3 × 12 (0 %). Au total, 72 répétitions sur la période, contre aucune sur la période précédente comparable. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la période.

**Evidence**

2 séances · unclear · 0 % · 3×12→3×12

**Metrics (scalaires / petites listes)**

- **exerciseId** : `298605878`
- **factId** : `emergence|298605878`
- **name** : `Curl Zottman`
- **dates** : `["2026-10-17","2026-10-24"]`
- **sessionCount** : `2`
- **lastDate** : `2026-10-24`
- **gapDays** : `null`
- **draftTitle** : `Curl Zottman commence à s'installer`
- **draftBody** : `Premier enregistrement de curl zottman : 72 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la fenêtre. Le même jour, 36 répétitions de curl assis dos calé et 36 répétitions de curl marteau portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **legacyTitle** : `Curl Zottman apparaît dans ces 30 jours`
- **legacyBody** : `Premier enregistrement de curl zottman : 72 répétitions. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses. Ces 72 répétitions font 11,9 % des 604 répétitions de biceps de la fenêtre. Le même jour, 36 répétitions de curl assis dos calé et 36 répétitions de curl marteau portent sur le même muscle principal (le 17 octobre 2026). Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre. La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `insufficient`
- **trajectoryTitleHint** : `Curl Zottman commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `4`
- **trajectoryLimits** : `["no_peers"]`

#### 2. Le stimulus du mois se déplace vers les pectoraux

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_muscle_reorient` |
| Id | `disc_muscle_reorient` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 75 / — |
| Confidence / relevance | — / 0.9633333333333334 |
| Raison (raw/decision) | story_duplicate_composition |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Les pectoraux représentent ce mois 809 reps attribuées, contre 809 sur les 30 derniers jours. À elle seule, ces 30 jours concentre environ 100,0 % de toute ton exposition pectoraux du dernier mois. Cette asymétrie n'est pas seulement descriptive : elle caractérise le stimulus dominant reçu pendant ces 30 jours.

**Evidence**

pectoraux 100,0 % du mois · biceps 100,0 % du mois · dos 100,0 % du mois · triceps 100,0 % du mois

**Metrics (scalaires / petites listes)**

- **leadGroup** : `chest`
- **ofMonthPct** : `100`

#### 3. La part des quadriceps dans ton entraînement a augmenté plus vite que le volume global

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_muscle_share_shift` |
| Id | `disc_muscle_share_shift` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 68 / — |
| Confidence / relevance | — / 0.9555555555555556 |
| Raison (raw/decision) | story_duplicate_composition |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Les quadriceps représentent actuellement 7,1 % du volume musculaire identifié, contre 4,3 % sur les 30 jours précédents. Sa part a donc augmenté de 65,6 % relativement, alors que le volume global est +7,7 %. Exercice 1596646078 comptait 92 répétitions sur la période précédente et n'apparaît plus ici. Une partie du changement de part vient de cette disparition, pas seulement d'une baisse générale. On lit ici un changement de structure, pas seulement une hausse ou une baisse de répétitions.

**Evidence**

quadriceps 4,3 % → 7,1 %

**Metrics (scalaires / petites listes)**

- **group** : `quads`
- **nowShare** : `7.139107611548557`
- **thenShare** : `4.310018903591682`

#### 4. La poussée domine nettement le tirage du mois

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_push_pull` |
| Id | `disc_push_pull` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 60 / — |
| Confidence / relevance | — / 0.9466666666666667 |
| Raison (raw/decision) | story_duplicate_composition |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Ces 30 jours totalise environ 577 reps de dos contre 1 282 reps pectoraux + triceps (et 1 738 reps en comptant aussi les épaules de poussée). Le haut du corps reçoit donc nettement plus de travail en poussée qu’en tirage. Le stimulus dominant du haut du corps est clairement la poussée : le tirage ne suit pas dans les mêmes proportions sur cette fenêtre. Ce n’est pas un jugement d’équilibre idéal : c’est le stimulus dominant réellement reçu.

**Evidence**

dos 577 · pecs+triceps 1 282

**Metrics (scalaires / petites listes)**

- **pullNow** : `577`
- **pushNow** : `1738`
- **ofMonth** : `100`

#### 9.3.unknown — Non déterminé (3)

#### 1. Le mix force / endurance / poly du mois se lit dans les parts, pas dans le total

| Champ | Valeur |
| --- | --- |
| Statut | Non déterminé |
| Kind | `disc_stimulus_mix` |
| Id | `disc_stimulus_mix` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 59 / — |
| Confidence / relevance | — / 0.9455555555555556 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Ces 30 jours répartit 4 016 reps identifiées ainsi : 72,5 % de mouvements polyarticulaires contre 27,5 % d'isolation, 87,5 % de travail de force contre 12,5 % d'endurance musculaire, 13,0 % de volume lesté, le reste au poids du corps, 12,9 % de tirage/poussée vertical contre 40,4 % d'horizontal. Par rapport à ta référence récente, la part d'isolation est plus élevée que sur la référence récente (18,3 % → 27,5 %).

**Evidence**

poly 72,5 % · force 87,5 % · lesté 13,0 %

**Metrics (scalaires / petites listes)**

- **endurance** : `12.450199203187251`
- **strength** : `87.54980079681275`
- **isolation** : `27.539840637450197`
- **compound** : `72.4601593625498`
- **weighted** : `12.998007968127489`
- **bodyweight** : `87.0019920318725`
- **thenEndurance** : `10.72961373390558`
- **thenIsolation** : `18.34763948497854`
- **thenWeighted** : `7.188841201716738`
- **vertical** : `12.94820717131474`
- **horizontal** : `40.38844621513944`
- **unilateral** : `1.9920318725099602`
- **thenVertical** : `13.331545064377682`
- **thenHorizontal** : `32.26931330472103`

#### 2. Pectoraux portent une part nette de ces 30 jours

| Champ | Valeur |
| --- | --- |
| Statut | Non déterminé |
| Kind | `disc_th_composition_now` |
| Id | `disc_th_composition_now` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 64 / — |
| Confidence / relevance | — / 0.9 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

809 des 4 016 répétitions concernent pectoraux, soit 20,1 %. Derrière, biceps pèsent 604 répétitions. Ce chiffre décrit où va le volume de ces 30 jours.

**Evidence**

composition

**Metrics (scalaires / petites listes)**

- **thread** : `composition`
- **axes** : `["families","volume"]`
- **sense** : `fact`
- **factId** : `composition|pectoraux|30d`
- **analysisType** : `anomaly`

#### 3. Exercice 1596646078 a quitté cette fenêtre

| Champ | Valeur |
| --- | --- |
| Statut | Non déterminé |
| Kind | `disc_th_repertoire_journey` |
| Id | `disc_th_repertoire_journey` |
| Famille | Composition (`mix`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 64 / — |
| Confidence / relevance | — / 0.9 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Exercice 1596646078 comptait 92 répétitions sur la période précédente et tombe à zéro ici. Le mouvement disparaît du journal sur cette fenêtre. Sur cette durée, l'absence pèse plus qu'une semaine sautée. S'il ne revient pas sur la fenêtre suivante, c'est un changement de répertoire.

**Evidence**

repertoire

**Metrics (scalaires / petites listes)**

- **thread** : `repertoire`
- **axes** : `["repertoire","volume"]`
- **sense** : `transformation`
- **factId** : `exit|exercice 1596646078|30d`
- **analysisType** : `evolution`

### 9.4 Famille — Exercices (14)

#### 9.4.shown_now — Affichée (run actuel) (4)

#### 1. Pompes déclinées : recul puis retour au niveau de départ

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_exercise_progress` |
| Id | `relation.reading.long.disc_exercise_progress.104` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `long` |
| Score / weight | — / 94 |
| Confidence / relevance | 0.88 / 0.95 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Pompes déclinées est passé par un creux (≈10) puis est revenu vers ≈25.3 répétitions par séance, proche du départ (≈27.3). Le format de séries reste du même ordre. La hausse porte surtout sur cet exercice, tandis que Pompes déclinées (autour de 40 répétitions par séance) et Développé couché incliné aux haltères (autour de 48 répétitions par séance) restent stables. Le retour près du niveau de départ est confirmé sur les séances récentes: le maintenir sur les prochaines séances avant de changer la dose.

**Evidence**

6 séances · recovered · -7.3 % · 3×12→3×12 · témoins:localized_rise

**Metrics (scalaires / petites listes)**

- **exerciseId** : `104`
- **name** : `Pompes déclinées`
- **sessionCount** : `23`
- **historicalMean** : `36`
- **currentMean** : `19.2`
- **recentMean** : `14`
- **vsInitialPct** : `-46.7`
- **vsHabitPct** : `0`
- **bestDate** : `2026-07-27`
- **dates** : `["2026-09-07","2026-09-14","2026-10-01","2026-10-03","2026-10-14","2026-10-15","2026-10-19","2026-10-26"]`
- **draftTitle** : `Pompes déclinées : recul puis retour au niveau de départ`
- **draftBody** : `Niveau initial (moyenne des 5 premières séances) : environ 36 reps. Niveau actuel (moyenne des dernières séances, dernière saisie comprise) : environ 19,2 reps, soit −46,7 %. Les premières séances servent aussi à apprendre le geste : une partie de l'écart avec ce départ peut venir de là. Sans la dernière saisie, la moyenne récente est 14 reps. La dernière séance (36 reps) se lit à part. Dans la même fenêtre, pompes (endurance) compte 500 répétitions : poignets, coudes et épaules encaissent les deux. Le record (136 le 27 juillet 2026) n'est pas le niveau : le niveau, c'est ce que tu reproduis.`
- **legacyTitle** : `Pompes déclinées a reculé de 46,7 % depuis tes premières séances comparables`
- **legacyBody** : `Niveau initial (moyenne des 5 premières séances) : environ 36 reps. Niveau actuel (moyenne des dernières séances, dernière saisie comprise) : environ 19,2 reps, soit −46,7 %. Les premières séances servent aussi à apprendre le geste : une partie de l'écart avec ce départ peut venir de là. Sans la dernière saisie, la moyenne récente est 14 reps. La dernière séance (36 reps) se lit à part. Dans la même fenêtre, pompes (endurance) compte 500 répétitions : poignets, coudes et épaules encaissent les deux. Le record (136 le 27 juillet 2026) n'est pas le niveau : le niveau, c'est ce que tu reproduis.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `progress`
- **trajectoryInstallation** : `already_known`
- **trajectoryShape** : `rebound`
- **trajectoryPath** : `decline_then_full_recovery`
- **trajectoryPrimaryStory** : `recovered`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `localized_rise`
- **trajectoryTitleHint** : `Pompes déclinées : recul puis retour au niveau de départ`
- **trajectoryImplicationRule** : `hold_after_full_recovery`
- **trajectoryRichness** : `10`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 2. Ces 20 reps sont devenues ton niveau récemment reproductible

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_ms_pr_consolidated` |
| Id | `relation.reading.medium.disc_ms_pr_consolidated` |
| Famille | Exercices (`exercise`) |
| Signal family | `milestone` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 98 |
| Confidence / relevance | 0.78 / 0.9644444444444444 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapMilestoneEngine` |
| Reward tone | `jalon` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Ces 20 reps de relevés de genoux à la barre sont devenues ton niveau récemment reproductible: cette série apparaît sur 5 de tes 5 dernières séances.

**Evidence**

20 reps · 5/5

**Metrics (scalaires / petites listes)**

- **type** : `PR_CONSOLIDATED`
- **date** : `2026-10-26`
- **prevDate** : `null`
- **dates** : `["2026-10-26"]`
- **exerciseName** : `null`
- **gapDays** : `null`
- **habitMedianGap** : `null`
- **habitIntervalRatio** : `null`
- **returnReps** : `null`
- **priorAvg** : `null`
- **vsPriorPct** : `null`
- **unit** : `null`
- **mates** : `[]`
- **name** : `Ces 20 reps sont devenues ton niveau récemment reproductible`
- **draftTitle** : `Ces 20 reps sont devenues ton niveau récemment reproductible`
- **draftBody** : `Ces 20 reps de relevés de genoux à la barre sont devenues ton niveau récemment reproductible : cette série apparaît sur 5 de tes 5 dernières séances.`

#### 3. Relevés de genoux aux parallèles revient après un long silence

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_ms_return` |
| Id | `relation.reading.short.disc_ms_return.ms-disc_ms_return-506` |
| Famille | Exercices (`exercise`) |
| Signal family | `milestone` |
| Nature | `now` |
| Horizon | `short` |
| Score / weight | — / 76 |
| Confidence / relevance | 0.78 / 0.9811111111111112 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapMilestoneEngine` |
| Reward tone | `jalon` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Il y a 2 semaines, tu as enregistré ta première séance depuis 77 jours sur relevés de genoux aux parallèles. L'écart dépasse 11 fois ton intervalle habituel. Avec 40 répétitions, tu reviens à 100 % de ton volume moyen avant l'interruption. Format observé autour du retour: environ 2 × 20 avant l'interruption, puis environ 2 × 20 à la reprise. Le même jour, 60 répétitions de relevés de genoux à la barre portent sur le même muscle principal. Si la suivante baisse, regarde cette fatigue avant d'y voir une perte. Reproduire ce format sur la prochaine séance confirme le retour; en faire tout de suite une nouvelle norme va plus vite que les données.

**Evidence**

77 j. · 40 répétitions

**Metrics (scalaires / petites listes)**

- **type** : `EXERCISE_FIRST_RETURN`
- **date** : `2026-10-16`
- **prevDate** : `2026-07-31`
- **dates** : `["2026-07-31","2026-10-16"]`
- **exerciseId** : `506`
- **exerciseName** : `Relevés de genoux aux parallèles`
- **gapDays** : `77`
- **habitMedianGap** : `7`
- **habitIntervalRatio** : `11`
- **returnReps** : `40`
- **priorAvg** : `40`
- **vsPriorPct** : `100`
- **unit** : `reps`
- **factId** : `ms|disc_ms_return|506`
- **name** : `Relevés de genoux aux parallèles`
- **draftTitle** : `Tu reprends Relevés de genoux aux parallèles après 77 jours d'absence`
- **draftBody** : `Il y a 2 semaines, tu as enregistré ta première séance depuis 77 jours sur relevés de genoux aux parallèles. L'écart dépasse 11 fois ton intervalle habituel. Avec 40 répétitions, tu reviens à 100 % de ton volume moyen avant l'interruption. Format observé autour du retour : environ 2 × 20 avant l'interruption, puis environ 2 × 20 à la reprise. Le même jour, 60 répétitions de relevés de genoux à la barre portent sur le même muscle principal. Si la suivante baisse, regarde cette fatigue avant d'y voir une perte. Reproduire ce format sur la prochaine séance confirme le retour ; en faire tout de suite une nouvelle norme va plus vite que les données.`

#### 4. _*(vide)*_

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `exercise_specific_abandonment` |
| Id | `relation.exercise_specific_abandonment` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `short` |
| Score / weight | — / 82 |
| Confidence / relevance | 0.6839999999999999 / 0.84 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `pipeline` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Circuit abdos est régulièrement laissé de côté alors que le reste de la séance est davantage réalisé (~0 % de coches). Ce n'est probablement pas un problème général d'adhérence, mais un bloc mal placé, trop lourd, ou peu utile à tes yeux.

**Evidence**

_*(vide)*_

Liste evidence :
- Circuit abdos ~0 % coché
- reste de séance davantage réalisé

**Metrics (scalaires / petites listes)**

- **leastCheckedPct** : `0`
- **sessionAlignment** : `null`

#### 9.4.intermediate — Candidate intermédiaire (7)

#### 1. Pompes déclinées : recul puis retour au niveau de départ

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_exercise_progress` |
| Id | `disc_exercise_progress` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 63 / — |
| Confidence / relevance | — / 0.95 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Pompes déclinées est passé par un creux (≈10) puis est revenu vers ≈25.3 répétitions par séance, proche du départ (≈27.3). Le format de séries reste du même ordre. La hausse porte surtout sur cet exercice, tandis que Pompes déclinées (autour de 40 répétitions par séance) et Développé couché incliné aux haltères (autour de 48 répétitions par séance) restent stables. Le retour près du niveau de départ est confirmé sur les séances récentes : le maintenir sur les prochaines séances avant de changer la dose.

**Evidence**

6 séances · recovered · -7.3 % · 3×12→3×12 · témoins:localized_rise

**Metrics (scalaires / petites listes)**

- **exerciseId** : `104`
- **name** : `Pompes déclinées`
- **sessionCount** : `23`
- **historicalMean** : `36`
- **currentMean** : `19.2`
- **recentMean** : `14`
- **vsInitialPct** : `-46.7`
- **vsHabitPct** : `0`
- **bestDate** : `2026-07-27`
- **dates** : `["2026-09-07","2026-09-14","2026-10-01","2026-10-03","2026-10-14","2026-10-15","2026-10-19","2026-10-26"]`
- **draftTitle** : `Pompes déclinées : recul puis retour au niveau de départ`
- **draftBody** : `Niveau initial (moyenne des 5 premières séances) : environ 36 reps. Niveau actuel (moyenne des dernières séances, dernière saisie comprise) : environ 19,2 reps, soit −46,7 %. Les premières séances servent aussi à apprendre le geste : une partie de l'écart avec ce départ peut venir de là. Sans la dernière saisie, la moyenne récente est 14 reps. La dernière séance (36 reps) se lit à part. Dans la même fenêtre, pompes (endurance) compte 500 répétitions : poignets, coudes et épaules encaissent les deux. Le record (136 le 27 juillet 2026) n'est pas le niveau : le niveau, c'est ce que tu reproduis.`
- **legacyTitle** : `Pompes déclinées a reculé de 46,7 % depuis tes premières séances comparables`
- **legacyBody** : `Niveau initial (moyenne des 5 premières séances) : environ 36 reps. Niveau actuel (moyenne des dernières séances, dernière saisie comprise) : environ 19,2 reps, soit −46,7 %. Les premières séances servent aussi à apprendre le geste : une partie de l'écart avec ce départ peut venir de là. Sans la dernière saisie, la moyenne récente est 14 reps. La dernière séance (36 reps) se lit à part. Dans la même fenêtre, pompes (endurance) compte 500 répétitions : poignets, coudes et épaules encaissent les deux. Le record (136 le 27 juillet 2026) n'est pas le niveau : le niveau, c'est ce que tu reproduis.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `progress`
- **trajectoryInstallation** : `already_known`
- **trajectoryShape** : `rebound`
- **trajectoryPath** : `decline_then_full_recovery`
- **trajectoryPrimaryStory** : `recovered`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `localized_rise`
- **trajectoryTitleHint** : `Pompes déclinées : recul puis retour au niveau de départ`
- **trajectoryImplicationRule** : `hold_after_full_recovery`
- **trajectoryRichness** : `10`
- **trajectoryLimits** : `[]`
- **exclusions** : `[]`

#### 2. Ces 20 reps sont devenues ton niveau récemment reproductible

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_ms_pr_consolidated` |
| Id | `disc_ms_pr_consolidated` |
| Famille | Exercices (`exercise`) |
| Signal family | `milestone` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 76 / — |
| Confidence / relevance | — / 0.9644444444444444 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapMilestoneEngine` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Ces 20 reps de relevés de genoux à la barre sont devenues ton niveau récemment reproductible : cette série apparaît sur 5 de tes 5 dernières séances.

**Evidence**

20 reps · 5/5

**Metrics (scalaires / petites listes)**

- **type** : `PR_CONSOLIDATED`
- **date** : `2026-10-26`
- **prevDate** : `null`
- **dates** : `["2026-10-26"]`
- **exerciseName** : `null`
- **gapDays** : `null`
- **habitMedianGap** : `null`
- **habitIntervalRatio** : `null`
- **returnReps** : `null`
- **priorAvg** : `null`
- **vsPriorPct** : `null`
- **unit** : `null`
- **mates** : `[]`
- **name** : `Ces 20 reps sont devenues ton niveau récemment reproductible`
- **draftTitle** : `Ces 20 reps sont devenues ton niveau récemment reproductible`
- **draftBody** : `Ces 20 reps de relevés de genoux à la barre sont devenues ton niveau récemment reproductible : cette série apparaît sur 5 de tes 5 dernières séances.`

#### 3. Tu reprends Relevés de genoux aux parallèles après 77 jours d'absence

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_ms_return` |
| Id | `disc_ms_return` |
| Famille | Exercices (`exercise`) |
| Signal family | `milestone` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 91 / — |
| Confidence / relevance | — / 0.9811111111111112 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapMilestoneEngine` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Il y a 2 semaines, tu as enregistré ta première séance depuis 77 jours sur relevés de genoux aux parallèles. L'écart dépasse 11 fois ton intervalle habituel. Avec 40 répétitions, tu reviens à 100 % de ton volume moyen avant l'interruption. Format observé autour du retour : environ 2 × 20 avant l'interruption, puis environ 2 × 20 à la reprise. Le même jour, 60 répétitions de relevés de genoux à la barre portent sur le même muscle principal. Si la suivante baisse, regarde cette fatigue avant d'y voir une perte. Reproduire ce format sur la prochaine séance confirme le retour ; en faire tout de suite une nouvelle norme va plus vite que les données.

**Evidence**

77 j. · 40 répétitions

**Metrics (scalaires / petites listes)**

- **type** : `EXERCISE_FIRST_RETURN`
- **date** : `2026-10-16`
- **prevDate** : `2026-07-31`
- **dates** : `["2026-07-31","2026-10-16"]`
- **exerciseId** : `506`
- **exerciseName** : `Relevés de genoux aux parallèles`
- **gapDays** : `77`
- **habitMedianGap** : `7`
- **habitIntervalRatio** : `11`
- **returnReps** : `40`
- **priorAvg** : `40`
- **vsPriorPct** : `100`
- **unit** : `reps`
- **factId** : `ms|disc_ms_return|506`
- **name** : `Relevés de genoux aux parallèles`
- **draftTitle** : `Tu reprends Relevés de genoux aux parallèles après 77 jours d'absence`
- **draftBody** : `Il y a 2 semaines, tu as enregistré ta première séance depuis 77 jours sur relevés de genoux aux parallèles. L'écart dépasse 11 fois ton intervalle habituel. Avec 40 répétitions, tu reviens à 100 % de ton volume moyen avant l'interruption. Format observé autour du retour : environ 2 × 20 avant l'interruption, puis environ 2 × 20 à la reprise. Le même jour, 60 répétitions de relevés de genoux à la barre portent sur le même muscle principal. Si la suivante baisse, regarde cette fatigue avant d'y voir une perte. Reproduire ce format sur la prochaine séance confirme le retour ; en faire tout de suite une nouvelle norme va plus vite que les données.`

#### 4. Pompes déclinées a été remplacé, pas abandonné au hasard

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `journey_abandoned` |
| Id | `relation.reading.short.journey_abandoned` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `short` |
| Score / weight | — / 10 |
| Confidence / relevance | 0.78 / 0.8 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapHorizonEssays / discoveries` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Tu pratiquais Pompes déclinées régulièrement (retour habituel ~tous les 7 j., 8 séances), puis plus rien depuis 100 jours (dernière fois le 22 juillet 2026). Tu n'as pas arrêté la famille: Pompes déclinées est encore là. La prochaine séance se lira comme une reprise.

**Evidence**

22 juillet 2026 · 100 j. · habitude ~7 j.

**Metrics (scalaires / petites listes)**

_aucune_

#### 5. Plateau — Relevés de genoux aux parallèles

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `journey_plateau` |
| Id | `relation.reading.medium.journey_plateau` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 25 |
| Confidence / relevance | 0.78 / 0.86 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapHorizonEssays / discoveries` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Ton niveau habituel sur Relevés de genoux aux parallèles reste autour de 40 reps depuis 112 jours (6 séances dans cette bande). L'exposition continue, mais la performance maximale n'évolue plus clairement. Ce n'est pas une régression: c'est une absence de nouveau palier.

**Evidence**

~40 reps · 112 j.

**Metrics (scalaires / petites listes)**

_aucune_

#### 6. Ta meilleure série de 12 reps reste éloignée de la série que tu reproduis

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `journey_pr_vs_level` |
| Id | `relation.reading.long.journey_pr_vs_level` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `long` |
| Score / weight | — / 35 |
| Confidence / relevance | 0.88 / 0.9 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `recapHorizonEssays / discoveries` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

La meilleure série observée de Pompes pseudo-planche est de 12 reps, le 30 septembre 2026, il y a 30 j. Sur 5 séances avec des séries saisies, le niveau de série habituel reste autour de 10 reps. Ce n'est pas le total de la séance, et ce n'est pas un record déclaré.

**Evidence**

9 séances observées

**Metrics (scalaires / petites listes)**

_aucune_

#### 7. _*(vide)*_

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `level_established` |
| Id | `relation.level_established` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `long` |
| Score / weight | — / 53 |
| Confidence / relevance | 0.85 / 0.83 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `pipeline` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Nouveau palier consolidé sur Dips (~12 reps de façon répétée) — ce n'est pas qu'un record ponctuel : ton niveau réel semble monter..

**Evidence**

_*(vide)*_

Liste evidence :
- niveau ~12 reps stabilisé sur 3 séances récentes

**Metrics (scalaires / petites listes)**

- **maxReps** : `12`

#### 9.4.demoted — Déclassée / filtrée (3)

#### 1. Reprise et niveau habituel le même jour

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_ms_event_combo` |
| Id | `disc_ms_event_combo` |
| Famille | Exercices (`exercise`) |
| Signal family | `milestone` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 76 / — |
| Confidence / relevance | — / 0.9644444444444444 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapMilestoneEngine` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Le retour n'est pas seulement calendaire : tu retrouves immédiatement 100 % de ton volume habituel. L'interruption n'a pas effacé le niveau, elle l'a seulement interrompu.

**Evidence**

retour × 100 %

**Metrics (scalaires / petites listes)**

- **type** : `EVENT_COMBO`
- **date** : `2026-10-19`
- **prevDate** : `null`
- **dates** : `["2026-10-19"]`
- **exerciseName** : `null`
- **gapDays** : `null`
- **habitMedianGap** : `null`
- **habitIntervalRatio** : `null`
- **returnReps** : `null`
- **priorAvg** : `null`
- **vsPriorPct** : `null`
- **unit** : `null`
- **mates** : `[]`
- **name** : `Reprise et niveau habituel le même jour`
- **draftTitle** : `Reprise et niveau habituel le même jour`
- **draftBody** : `Le retour n'est pas seulement calendaire : tu retrouves immédiatement 100 % de ton volume habituel. L'interruption n'a pas effacé le niveau, elle l'a seulement interrompu.`

#### 2. La reprise de dips est devenue durable

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_ms_return_durable` |
| Id | `disc_ms_return_durable` |
| Famille | Exercices (`exercise`) |
| Signal family | `milestone` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 76 / — |
| Confidence / relevance | — / 0.9644444444444444 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapMilestoneEngine` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

La reprise de dips est devenue durable : 20 séances en 158 jours, alors que l'interruption avait duré 126 jours. Ce n'est plus l'événement du retour : c'est la continuité qui s'installe.

**Evidence**

20 séances · J+158

**Metrics (scalaires / petites listes)**

- **type** : `RETURN_DURABLE`
- **date** : `2026-10-26`
- **prevDate** : `null`
- **dates** : `["2026-10-26"]`
- **exerciseName** : `null`
- **gapDays** : `null`
- **habitMedianGap** : `null`
- **habitIntervalRatio** : `null`
- **returnReps** : `null`
- **priorAvg** : `null`
- **vsPriorPct** : `null`
- **unit** : `null`
- **mates** : `[]`
- **name** : `La reprise de dips est devenue durable`
- **draftTitle** : `La reprise de dips est devenue durable`
- **draftBody** : `La reprise de dips est devenue durable : 20 séances en 158 jours, alors que l'interruption avait duré 126 jours. Ce n'est plus l'événement du retour : c'est la continuité qui s'installe.`

#### 3. Tes mouvements de référence commencent à disposer d’un historique assez fourni

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_repertoire` |
| Id | `disc_repertoire` |
| Famille | Exercices (`exercise`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 56 / — |
| Confidence / relevance | — / 0.9422222222222222 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Pompes (endurance) : 500 ce mois sur 500 en 30 jours. Relevés de genoux à la barre : 180 ce mois sur 180 en 30 jours. Dips : 174 ce mois sur 174 en 30 jours. Ces volumes permettent de ne plus analyser uniquement ton entraînement comme un ensemble : Momentum peut suivre l'évolution de chaque mouvement, en distinguant ceux qui progressent, ceux qui se maintiennent et ceux dont l'exposition reste insuffisante.

**Evidence**

Pompes (endurance) · Relevés de genoux à la barre · Dips

**Metrics (scalaires / petites listes)**

_aucune_

### 9.5 Famille — GTG (5)

#### 9.5.shown_now — Affichée (run actuel) (2)

#### 1. Le repère de pompes a monté depuis le début du Grease the Groove

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_gtg_unplanned_progress` |
| Id | `relation.reading.long.disc_gtg_unplanned_progress.pushups` |
| Famille | GTG (`gtg`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `long` |
| Score / weight | — / 106 |
| Confidence / relevance | 0.88 / 0.992 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapGtgUnplannedReading` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Il est passé de 20 reps le 2 septembre 2026 à 25 le 6 octobre 2026. Ça couvre la pratique depuis le 2 septembre 2026, pas seulement la fenêtre affichée. Les passages hors planning portent 80 % des reps de pompes sur toute cette durée (40 sur 50). Ils font partie du volume, ils n’expliquent pas à eux seuls la hausse ou la baisse du repère.

**Evidence**

Pompes · max · ×1.3

**Metrics (scalaires / petites listes)**

- **exerciseId** : `pushups`
- **ratio** : `1.3`
- **adHocShare** : `80`
- **dates** : `["2026-10-01","2026-10-03","2026-10-14","2026-10-15"]`
- **earlyDate** : `2026-09-02`
- **lateDate** : `2026-10-06`

#### 2. Les passages hors planning tiennent le fil des jours sans créneau coché

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_gtg_unplanned_role` |
| Id | `relation.reading.medium.disc_gtg_unplanned_role` |
| Famille | GTG (`gtg`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 106 |
| Confidence / relevance | 0.78 / 0.986 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapGtgUnplannedReading` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Sans eux, 4 jours de cette fenêtre seraient restés sans Grease the Groove. La fenêtre d’avant en avait 0, et aucun passage de ce type. 4 jours avec un passage ajouté sur cette fenêtre, 0 sur la précédente. Un passage isolé ne fait pas une continuité: ici on compare deux fenêtres de même longueur, de 1 septembre 2026 à 30 octobre 2026.

**Evidence**

12 maintenant · 0 avant

**Metrics (scalaires / petites listes)**

- **currentSets** : `12`
- **previousSets** : `0`
- **gapDays** : `4`
- **dates** : `["2026-10-01","2026-10-01","2026-10-01","2026-10-03","2026-10-03","2026-10-03","2026-10-14","2026-10-14","2026-10-14","2026-10-15","2026-10-15","2026-10-15"]`
- **previousSeries** : `[]`

#### 9.5.intermediate — Candidate intermédiaire (2)

#### 1. Le repère de pompes a monté depuis le début du Grease the Groove

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_gtg_unplanned_progress` |
| Id | `disc_gtg_unplanned_progress` |
| Famille | GTG (`gtg`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 92 / — |
| Confidence / relevance | — / 0.992 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapGtgUnplannedReading` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Il est passé de 20 reps le 2 septembre 2026 à 25 le 6 octobre 2026. Ça couvre la pratique depuis le 2 septembre 2026, pas seulement la fenêtre affichée. Les passages hors planning portent 80 % des reps de pompes sur toute cette durée (40 sur 50). Ils font partie du volume, ils n’expliquent pas à eux seuls la hausse ou la baisse du repère.

**Evidence**

Pompes · max · ×1.3

**Metrics (scalaires / petites listes)**

- **exerciseId** : `pushups`
- **ratio** : `1.3`
- **adHocShare** : `80`
- **dates** : `["2026-10-01","2026-10-03","2026-10-14","2026-10-15"]`
- **earlyDate** : `2026-09-02`
- **lateDate** : `2026-10-06`

#### 2. Les passages hors planning tiennent le fil des jours sans créneau coché

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_gtg_unplanned_role` |
| Id | `disc_gtg_unplanned_role` |
| Famille | GTG (`gtg`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 86 / — |
| Confidence / relevance | — / 0.986 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapGtgUnplannedReading` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Sans eux, 4 jours de cette fenêtre seraient restés sans Grease the Groove. La fenêtre d’avant en avait 0, et aucun passage de ce type. 4 jours avec un passage ajouté sur cette fenêtre, 0 sur la précédente. Un passage isolé ne fait pas une continuité : ici on compare deux fenêtres de même longueur, de 1 septembre 2026 à 30 octobre 2026.

**Evidence**

12 maintenant · 0 avant

**Metrics (scalaires / petites listes)**

- **currentSets** : `12`
- **previousSets** : `0`
- **gapDays** : `4`
- **dates** : `["2026-10-01","2026-10-01","2026-10-01","2026-10-03","2026-10-03","2026-10-03","2026-10-14","2026-10-14","2026-10-14","2026-10-15","2026-10-15","2026-10-15"]`
- **previousSeries** : `[]`

#### 9.5.demoted — Déclassée / filtrée (1)

#### 1. Certains jours, le Grease the Groove ne tient que par un passage hors planning

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_gtg_unplanned_now` |
| Id | `disc_gtg_unplanned_now` |
| Famille | GTG (`gtg`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 90 / — |
| Confidence / relevance | — / 0.99 |
| Raison (raw/decision) | rival |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapGtgUnplannedReading` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

12 passages hors planning, 76 reps, sont entrés dans le journal de la fenêtre. Cela fait environ 6 reps par série. Les 12 séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove : répéter sans aller à l’échec. Sans eux, ces jours n’auraient aucune mini-série. C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.

**Evidence**

12 hors planning · 76 reps

**Metrics (scalaires / petites listes)**

- **sets** : `12`
- **reps** : `76`
- **role** : `only`
- **band** : `null`
- **dates** : `["2026-10-01","2026-10-01","2026-10-01","2026-10-03","2026-10-03","2026-10-03","2026-10-14","2026-10-14","2026-10-14","2026-10-15","2026-10-15","2026-10-15"]`

### 9.6 Famille — Mobilité (1)

#### 9.6.shown_now — Affichée (run actuel) (1)

#### 1. _*(vide)*_

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `stretch_gap` |
| Id | `relation.stretch_gap` |
| Famille | Mobilité (`mobility`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `long` |
| Score / weight | — / 92 |
| Confidence / relevance | 0.72 / 0.76 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `pipeline` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Les séances d'exercices sont bien plus tenues (~97.8 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

**Evidence**

_*(vide)*_

Liste evidence :
- exos ~97.8 % vs étirements ~0 %

**Metrics (scalaires / petites listes)**

- **exoPct** : `97.8`
- **stretchPct** : `0`

### 9.7 Famille — Non classé (3)

#### 9.7.demoted — Déclassée / filtrée (3)

#### 1. La structure du mois se lit dans les ratios, pas seulement dans le total

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_ratio_structure` |
| Id | `disc_ratio_structure` |
| Famille | Non classé (`misc`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 49 / — |
| Confidence / relevance | — / 0.9344444444444444 |
| Raison (raw/decision) | story_duplicate_composition |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Ces 30 jours : poussée/tirage 45,6 % / 31,0 %, bas du corps 15,4 % du volume identifié, rendement 318 reps/h, soit 365 reps par jour entraîné. Ces rapports décrivent le stimulus reçu, pas seulement la quantité de travail.

**Evidence**

poussée/tirage 45,6 % / 31,0 % · bas du corps 15,4 % du volume identifié · rendement 318 reps/h

**Metrics (scalaires / petites listes)**

_aucune_

#### 2. Tes données montrent une association entre repos et volume de séance

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_rest_assoc` |
| Id | `disc_rest_assoc` |
| Famille | Non classé (`misc`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 55 / — |
| Confidence / relevance | — / 0.9411111111111111 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Tes séances réalisées après au moins 48 h depuis la précédente produisent en moyenne 10,2 % moins de répétitions que celles enchaînées le lendemain (272 vs 302, 42 et 50 séances). Ce n'est pas une preuve que le repos provoque ce résultat : c'est une association dans ton historique.

**Evidence**

−10,2 % · 48 h vs J+1

**Metrics (scalaires / petites listes)**

- **restedAvg** : `271.5`
- **denseAvg** : `302.4`
- **deltaPct** : `-10.2`
- **restedN** : `42`
- **denseN** : `50`

#### 3. Hyperextension commence à s'installer

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_structural_memory` |
| Id | `disc_structural_memory` |
| Famille | Non classé (`misc`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 72 / — |
| Confidence / relevance | — / 0.96 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Hyperextension pèsent désormais 96 reps sur 2 séances des 30 derniers jours, soit 14,8 % de ta jambes, alors qu'ils étaient encore marginaux ou absents sur les 30 jours d'avant. Hyperextension apparaît sur 2 séances en 14 jours. Le volume par séance passe d’environ 4 × 12 à environ 4 × 12. Ce n'est plus une séance isolée ; répéter ce volume sur les prochaines séances dira s'il structure vraiment la jambes.

**Evidence**

2 séances · unclear · 0 % · 4×12→4×12 · témoins:mixed

**Metrics (scalaires / petites listes)**

- **name** : `Hyperextension`
- **family** : `jambes`
- **nowShare** : `14.814814814814813`
- **thenShare** : `0`
- **exerciseId** : `1979012181`
- **draftTitle** : `Hyperextension commence à s'installer`
- **draftBody** : `Hyperextension pèsent désormais 96 reps sur 2 séances des 30 derniers jours, soit 14,8 % de ta jambes, alors qu'ils étaient encore marginaux ou absents sur les 30 jours d'avant. Ce n'est plus une séance isolée, mais pas encore une habitude installée de cette famille.`
- **legacyTitle** : `Hyperextension entre dans ta jambes`
- **legacyBody** : `Hyperextension pèsent désormais 96 reps sur 2 séances des 30 derniers jours, soit 14,8 % de ta jambes, alors qu'ils étaient encore marginaux ou absents sur les 30 jours d'avant. Ce n'est plus une séance isolée, mais pas encore une habitude installée de cette famille.`
- **trajectoryOk** : `true`
- **trajectoryMode** : `emergence`
- **trajectoryInstallation** : `installing`
- **trajectoryShape** : `fluctuation`
- **trajectoryPath** : `fluctuation`
- **trajectoryPrimaryStory** : `unclear`
- **trajectorySetMechanism** : `stable_format`
- **trajectorySetAvailable** : `true`
- **trajectoryPeers** : `mixed`
- **trajectoryTitleHint** : `Hyperextension commence à s'installer`
- **trajectoryImplicationRule** : `null`
- **trajectoryRichness** : `6`
- **trajectoryLimits** : `[]`
- **dates** : `["2026-10-02","2026-10-16"]`
- **exclusions** : `[]`

### 9.8 Famille — Rythme & séances (3)

#### 9.8.shown_now — Affichée (run actuel) (1)

#### 1. Tu t’entraînes plus souvent, mais de façon moins régulière

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `span_regularity` |
| Id | `relation.reading.medium.span_regularity` |
| Famille | Rythme & séances (`rhythm`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 97 |
| Confidence / relevance | 0.94 / 0.96 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `spanStories` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Les semaines de cette fenêtre tournent autour de 3 séance(s), entre 1 et 6. Avant, la moyenne était de 2.6 et l’écart entre semaines était plus resserré. La fréquence moyenne monte, la dispersion aussi. Ce n’est pas une régularité plus forte : c’est un rythme plus chargé et plus inégal. L’intervalle médian entre séances est de 1 jour(s), contre 2 avant.

**Evidence**

_*(vide)*_

**Metrics (scalaires / petites listes)**

_aucune metric exposée_

#### 9.8.intermediate — Candidate intermédiaire (1)

#### 1. Le coût objectif des séances semble avoir augmenté

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `span_session_cost` |
| Id | `relation.reading.medium.span_session_cost` |
| Famille | Rythme & séances (`rhythm`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 20 |
| Confidence / relevance | 0.72 / 0.96 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `spanStories` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Le tonnage est +185 %, et 9 séances se suivent à un jour ou moins. Tu n’as pas renseigné le ressenti de séance sur cette période, donc le signal repose sur la charge et la récupération mesurée, pas sur l’effort perçu.

**Evidence**

_*(vide)*_

**Metrics (scalaires / petites listes)**

_aucune metric exposée_

#### 9.8.demoted — Déclassée / filtrée (1)

#### 1. Ces 30 jours mêlent un bloc chargé et un creux

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_calendar_rhythm` |
| Id | `disc_calendar_rhythm` |
| Famille | Rythme & séances (`rhythm`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 52 / — |
| Confidence / relevance | — / 0.9377777777777778 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Du 13 octobre 2026 au 14 octobre 2026, la charge dépasse ton niveau de séance de la fenêtre (médiane 315 répétitions, pic 536). Du 7 octobre 2026 au 11 octobre 2026 reste sans séance. Sur 30 jours, 15 ont une séance et 15 n'en ont pas. Le pic vaut environ 1,7 fois la médiane de séance de la fenêtre : la médiane décrit l’habitude, le pic un point haut. Les jours sans séance font partie de ce rythme : ce sont eux qui rendent le bloc possible. Les jours sans séance font partie du rythme observé : ce n’est pas un trou à remplir automatiquement par une séance « de rattrapage » hors schéma.

**Evidence**

15 jours entraînés · 15 jours sans séance

**Metrics (scalaires / petites listes)**

_aucune_

### 9.9 Famille — Sommeil (11)

#### 9.9.shown_now — Affichée (run actuel) (1)

#### 1. Repère général : ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h…

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_sleep_reference` |
| Id | `relation.reading.medium.disc_sleep_reference` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 98 |
| Confidence / relevance | 0.78 / 0.9 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `discovery` |
| Transversale | oui |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Repère général: ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.

**Evidence**

placement très tardif

**Metrics (scalaires / petites listes)**

- **sleepClockBand** : `270`
- **level** : `tres_tardif`

#### 9.9.intermediate — Candidate intermédiaire (1)

#### 1. Repère général : ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_sleep_reference` |
| Id | `disc_sleep_reference` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 66 / — |
| Confidence / relevance | — / 0.9 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | oui |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Repère général : ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.

**Evidence**

placement très tardif

**Metrics (scalaires / petites listes)**

- **sleepClockBand** : `270`
- **level** : `tres_tardif`

#### 9.9.demoted — Déclassée / filtrée (7)

#### 1. La continuité du sommeil accompagne tes journées à fort volume

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_architecture` |
| Id | `disc_sleep_architecture` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 59 / — |
| Confidence / relevance | — / 0.9455555555555556 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Les séances dépassant 300 reps sont précédées de nuits à 9 h 06 vs 7 h 54 de sommeil, 1 h 05 de REM contre 52 min. Le facteur discriminant n'est pas seulement la durée : REM, éveil et recharge nocturne bougent avec le volume du lendemain.

**Evidence**

9 h 06 vs 7 h 54 de sommeil · 1 h 05 de REM contre 52 min

**Metrics (scalaires / petites listes)**

- **type** : `sleep_architecture`
- **highN** : `15`
- **lowN** : `13`
- **hoursHigh** : `9.1`
- **hoursLow** : `7.9`
- **awakeHigh** : `null`
- **awakeLow** : `null`
- **remHigh** : `65`
- **remLow** : `52`
- **deepHigh** : `52`
- **deepLow** : `68`
- **deepStable** : `false`
- **bbHigh** : `null`
- **bbLow** : `null`
- **confidence** : `high`

#### 2. Autour de 7 h 30, les journées fortes et les journées courtes ne se répartissent pas pareil

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_assoc` |
| Id | `disc_sleep_assoc` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 63 / — |
| Confidence / relevance | — / 0.95 |
| Raison (raw/decision) | cap |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Sur 15 séances dépassant 300 reps, 12 ont été précédées d'au moins 7 h 30 de sommeil. À l'inverse, 6 des 13 séances sous 250 reps ont suivi une nuit plus courte. L'écart entre les deux proportions est d'environ 26 points. Cette fenêtre a aussi des jours sans séance : une nuit plus longue peut venir de ces jours-là, pas seulement précéder le volume. Le phénomène concerne surtout la quantité de travail réalisée : le sommeil semble davantage associé à ta capacité à maintenir une séance longue et volumineuse qu'à une augmentation automatique de chaque série.

**Evidence**

12/15 ≥ 300 · 6/13 < 250

**Metrics (scalaires / petites listes)**

- **type** : `sleep_separation`
- **highN** : `15`
- **highOk** : `12`
- **lowN** : `13`
- **lowShort** : `6`
- **cut** : `7.5`
- **confidence** : `high`

#### 3. Le sommeil se lit aussi sur la densité de séance, pas seulement le volume

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_intensity` |
| Id | `disc_sleep_intensity` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 59 / — |
| Confidence / relevance | — / 0.9455555555555556 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Après les nuits d'au moins 7 h 30, tu réalises en moyenne 339 reps par heure, contre 315 après une nuit sous 7 h (écart 24, 7,7 %). Ce n'est pas une preuve que tu t'entraînes plus près de l'échec : c'est une densité de travail plus élevée, reproductible sur 26 et 9 séances.

**Evidence**

339 vs 315 reps/h

**Metrics (scalaires / petites listes)**

- **type** : `sleep_intensity`
- **highN** : `26`
- **lowN** : `9`
- **highDens** : `339`
- **lowDens** : `315`
- **delta** : `24`
- **deltaPct** : `7.7`
- **confidence** : `high`

#### 4. Le sommeil d’avant-hier pèse encore, même après une nuit correcte

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_j2` |
| Id | `disc_sleep_j2` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 58 / — |
| Confidence / relevance | — / 0.9444444444444444 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Même après une nuit précédente d'au moins 7 h 30, un sommeil sous 7 h deux nuits plus tôt est associé à 328 reps le jour J, contre 245 lorsque les deux nuits dépassent 7 h 30 (4 et 7 cas). La nuit d'avant-hier n'est donc pas un détail : elle sépare encore deux régimes de volume.

**Evidence**

J-2 court 328 · deux nuits ok 245

**Metrics (scalaires / petites listes)**

- **type** : `sleep_j2`
- **isolatedN** : `4`
- **okN** : `7`
- **isolatedVol** : `328`
- **okVol** : `245.3`
- **delta** : `-82.7`
- **deltaPct** : `-25.2`
- **confidence** : `high`

#### 5. Sur le mois, volume et sommeil précédent se séparent — avec un échantillon encore limité

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_month` |
| Id | `disc_sleep_month` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 47 / — |
| Confidence / relevance | — / 0.9322222222222223 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: oui · levelHint: 3 |

**Corps**

Sur les 30 derniers jours, tu as réalisé 11 jours d'entraînement pour 4 016 reps, soit environ 365 reps par jour entraîné. Les séances suivant plus de 7 h 30 totalisent en moyenne 260 reps, contre 218 après une nuit courte (écart 42, 10 et 4 séances). Ce n'est pas une preuve que le sommeil provoque le volume : c'est une co-variation observée sur la fenêtre.

**Evidence**

4 016 reps · ≥ 7 h 30 260 · < 7 h 30 218

**Metrics (scalaires / petites listes)**

- **type** : `sleep_volume_threshold`
- **sample** : `recent14`
- **threshold** : `7.5`
- **highN** : `10`
- **lowN** : `4`
- **highVol** : `259.9`
- **lowVol** : `217.8`
- **delta** : `42.1`
- **deltaPct** : `19.4`
- **highMin** : `69`
- **lowMin** : `49`
- **confidence** : `high`

#### 6. Tes heures de coucher restent dispersées, avec un écart typique d'environ 155 min. Le rythme ne se résume donc pas à une heure habituelle unique : l'heure à laquelle la nuit commence change fortement d'un jour à l'autre. Conséquence : une baisse de perf un jour donné peut venir autant d'un coucher décalé que d'une séance plus dure — sans aligner les horaires, les corrélations sommeil×volume restent fragiles.

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_regularity` |
| Id | `disc_sleep_regularity` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 72 / — |
| Confidence / relevance | — / 0.9 |
| Raison (raw/decision) | other |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Tes heures de coucher restent dispersées, avec un écart typique d'environ 155 min. Le rythme ne se résume donc pas à une heure habituelle unique : l'heure à laquelle la nuit commence change fortement d'un jour à l'autre. Conséquence : une baisse de perf un jour donné peut venir autant d'un coucher décalé que d'une séance plus dure — sans aligner les horaires, les corrélations sommeil×volume restent fragiles.

**Evidence**

IQR coucher 155 min

**Metrics (scalaires / petites listes)**

- **sleepClockBand** : `270`
- **axis** : `bed`

#### 7. Rythme habituel récent : coucher autour de 4 h 40, lever autour de 13 h 30, milieu de nuit vers 8 h 55, pour une durée autour de 8 h 40. La durée et le placement sont deux lectures distinctes : une nuit longue peut rester très tardive.Le coucher et le lever sont tous les deux tardifs, et la durée de sommeil tient. La nuit du 7 octobre 2026 s'écarte d'au moins 1 h 30 de ce placement. Pour lire tes séances du lendemain, ce placement compte autant que la durée : une nuit « longue » mais très tardive ne se compare pas à une nuit plus précoce de même durée.

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_sleep_rhythm_habit` |
| Id | `disc_sleep_rhythm_habit` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 78 / — |
| Confidence / relevance | — / 0.9 |
| Raison (raw/decision) | other |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Rythme habituel récent : coucher autour de 4 h 40, lever autour de 13 h 30, milieu de nuit vers 8 h 55, pour une durée autour de 8 h 40. La durée et le placement sont deux lectures distinctes : une nuit longue peut rester très tardive.Le coucher et le lever sont tous les deux tardifs, et la durée de sommeil tient. La nuit du 7 octobre 2026 s'écarte d'au moins 1 h 30 de ce placement. Pour lire tes séances du lendemain, ce placement compte autant que la durée : une nuit « longue » mais très tardive ne se compare pas à une nuit plus précoce de même durée.

**Evidence**

10 nuits · 24 j

**Metrics (scalaires / petites listes)**

- **sleepClockBand** : `270`
- **n** : `10`
- **level** : `3`
- **pattern** : `late_bed_late_wake_duration_held`

#### 9.9.unknown — Non déterminé (2)

#### 1. Après une nuit courte, poussée et tirage ne bougent pas de la même façon

| Champ | Valeur |
| --- | --- |
| Statut | Non déterminé |
| Kind | `disc_sleep_family` |
| Id | `disc_sleep_family` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `trajectory` |
| Horizon | `—` |
| Score / weight | 60 / — |
| Confidence / relevance | — / 0.9466666666666667 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Après une nuit de moins de 7 h, tes séances de poussée conservent 70,0 % de leur volume habituel, tandis que tes séances de tirage atteignent 120,5 % de leur volume habituel. Le déficit ne touche pas toutes les qualités de la même manière. La poussée apparaît comme la qualité la plus sensible à une mauvaise récupération dans cet historique (8 et 25 séances).

**Evidence**

poussée 70,0 % · tirage 120,5 %

**Metrics (scalaires / petites listes)**

- **type** : `sleep_family`
- **shortN** : `8`
- **longN** : `25`
- **pushRetain** : `70`
- **pullRetain** : `120.5`
- **pushShort** : `60.5`
- **pullShort** : `70`
- **pushHabit** : `86.4`
- **pullHabit** : `58.1`
- **sensitive** : `poussée`
- **confidence** : `high`

#### 2. Les journées les plus denses suivent plus souvent de longues nuits

| Champ | Valeur |
| --- | --- |
| Statut | Non déterminé |
| Kind | `disc_sleep_quarter` |
| Id | `disc_sleep_quarter` |
| Famille | Sommeil (`sleep`) |
| Signal family | `sleep` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 73 / — |
| Confidence / relevance | — / 0.9611111111111111 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `sleep / periodDiscoveries` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

6 des 8 journées à au moins 300 reps ont été précédées d'une nuit d'au moins 7 h 30. Ces nuits représentent 57,1 % de l'ensemble des nuits enregistrées. Les périodes sous 7 h 30 sont au contraire surreprésentées dans les journées à faible volume. Le lien est net, sans qu'on puisse en conclure que le sommeil cause le volume : d'autres facteurs peuvent intervenir. Ce qui ressort, c'est que le volume élevé apparaît plus souvent après une nuit longue.

**Evidence**

6/8 journées ≥ 300 reps après ≥ 7 h 30

**Metrics (scalaires / petites listes)**

- **type** : `sleep_high_day_share`
- **highN** : `8`
- **highOk** : `6`
- **highShare** : `75`
- **nightShare** : `57.1`
- **lowN** : `4`
- **lowShortShare** : `25`
- **confidence** : `medium`
- **streak** : `3`

### 9.10 Famille — Volume & charge (6)

#### 9.10.shown_now — Affichée (run actuel) (1)

#### 1. Le volume du mois reste proche de la période précédente

| Champ | Valeur |
| --- | --- |
| Statut | Affichée (run actuel) |
| Kind | `disc_volume_shape` |
| Id | `relation.reading.short.disc_volume_shape` |
| Famille | Volume & charge (`volume`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `short` |
| Score / weight | — / 94 |
| Confidence / relevance | 0.78 / 0.9633333333333334 |
| Raison (raw/decision) | selected_for_display |
| Stage | `final` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `daily` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Ces 30 jours totalisent 4 016 répétitions en 15 jours de renforcement, soit environ 268 répétitions et 50 min par séance, contre 3 728 reps en 13 jours de renforcement sur les 30 jours d'avant (+7,7 %, fréquence +15,4 %, 268 vs 287 reps/séance). La comparaison utile est donc période contre période de même durée. Les répétitions suivies sur 28 jours sont +1,1 % que le mois comparable, tandis que les 7 derniers jours restent (−8,4 %).

**Evidence**

4 016 vs 3 728 · +7,7 %

**Metrics (scalaires / petites listes)**

- **volPct** : `7.725321888412018`
- **freqPct** : `15.384615384615385`
- **windowSpanDays** : `30`
- **baselineSpanDays** : `30`
- **baselineSameLength** : `true`
- **trainingDays** : `11`
- **totalReps** : `4016`
- **windowStart** : `2026-10-01`
- **windowEnd** : `2026-10-30`

#### 9.10.intermediate — Candidate intermédiaire (2)

#### 1. Le volume du mois reste proche de la période précédente

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `disc_volume_shape` |
| Id | `disc_volume_shape` |
| Famille | Volume & charge (`volume`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 75 / — |
| Confidence / relevance | — / 0.9633333333333334 |
| Raison (raw/decision) | — |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

Ces 30 jours totalisent 4 016 répétitions en 15 jours de renforcement, soit environ 268 répétitions et 50 min par séance, contre 3 728 reps en 13 jours de renforcement sur les 30 jours d'avant (+7,7 %, fréquence +15,4 %, 268 vs 287 reps/séance). La comparaison utile est donc période contre période de même durée. Les répétitions suivies sur 28 jours sont +1,1 % que le mois comparable, tandis que les 7 derniers jours restent (−8,4 %).

**Evidence**

4 016 vs 3 728 · +7,7 %

**Metrics (scalaires / petites listes)**

- **volPct** : `7.725321888412018`
- **freqPct** : `15.384615384615385`
- **windowSpanDays** : `30`
- **baselineSpanDays** : `30`
- **baselineSameLength** : `true`
- **trainingDays** : `11`
- **totalReps** : `4016`
- **windowStart** : `2026-10-01`
- **windowEnd** : `2026-10-30`

#### 2. Le volume bouge surtout parce que le nombre de séances bouge

| Champ | Valeur |
| --- | --- |
| Statut | Candidate intermédiaire |
| Kind | `span_volume_vs_frequency` |
| Id | `relation.reading.medium.span_volume_vs_frequency` |
| Famille | Volume & charge (`volume`) |
| Signal family | `sport` |
| Nature | `trajectory` |
| Horizon | `medium` |
| Score / weight | — / 28 |
| Confidence / relevance | 0.8290000000000001 / 0.96 |
| Raison (raw/decision) | — |
| Stage | `produced` |
| Producteur (hint) | `spanStories` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: oui · implication: non · levelHint: 2 |

**Corps**

15 séances et 4016 répétitions sont enregistrées sur cette fenêtre. La fenêtre équivalente d’avant en comptait 13 et 3728 (+8 % de reps, +15 % de séances). La variation vient surtout du nombre de séances (+15 %), pas des répétitions par séance (-7 %). Une partie des mouvements n’est pas la même d’une fenêtre à l’autre.

**Evidence**

_*(vide)*_

**Metrics (scalaires / petites listes)**

_aucune metric exposée_

#### 9.10.demoted — Déclassée / filtrée (3)

#### 1. Ces 30 jours devient un nouveau point d'ancrage dans ton historique

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_anchor` |
| Id | `disc_anchor` |
| Famille | Volume & charge (`volume`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 59 / — |
| Confidence / relevance | — / 0.9455555555555556 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: non · levelHint: 1 |

**Corps**

Sur les 30 derniers jours, tu as accumulé 4 016 reps en 11 jours entraînés, et ces 30 jours représente à elle seule 100,0 % de tout ce volume mensuel. À cette échelle, le long terme ne doit pas produire une deuxième version du court terme : ces 30 jours sert de nouveau point d'ancrage.

**Evidence**

4 016 / 4 016 · 100,0 %

**Metrics (scalaires / petites listes)**

- **ofMonthVol** : `100`
- **monthReps** : `4016`
- **monthDays** : `11`

#### 2. Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifiable par son profil

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_quarter_profile` |
| Id | `disc_quarter_profile` |
| Famille | Volume & charge (`volume`) |
| Signal family | `sport` |
| Nature | `journey` |
| Horizon | `—` |
| Score / weight | 48 / — |
| Confidence / relevance | — / 0.9333333333333333 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Sur le trimestre, tu as réalisé 13 448 répétitions, dont environ 2 233 pectoraux, environ 1 390 biceps, environ 1 478 dos, environ 1 632 triceps. Ce mois, la répartition observée peut s’écarter de cette structure historique (809 pectoraux, 604 biceps, 577 dos, 473 triceps). Ces 30 jours sert de nouvelle observation dans cette trajectoire.

**Evidence**

trimestre 13 448 reps

**Metrics (scalaires / petites listes)**

_aucune_

#### 3. Pompes inclinées : ces 30 jours sont au-dessus de ton niveau habituel

| Champ | Valeur |
| --- | --- |
| Statut | Déclassée / filtrée |
| Kind | `disc_vs_habit` |
| Id | `disc_vs_habit` |
| Famille | Volume & charge (`volume`) |
| Signal family | `sport` |
| Nature | `now` |
| Horizon | `—` |
| Score / weight | 36 / — |
| Confidence / relevance | — / 0.92 |
| Raison (raw/decision) | score |
| Stage | `periodDiscoveries` |
| Producteur (hint) | `recapPeriodDiscoveries → horizon essays` |
| Reward tone | `—` |
| Transversale | non |
| Qualité texte | flags: — · comparison: non · implication: oui · levelHint: 3 |

**Corps**

Tes séances de pompes inclinées se situent habituellement autour de 24 répétitions (médiane, écart interquartile 24–35,3). Les 36 répétitions du 26 octobre 2026 placent cette séance environ 50,0 % au-dessus de ton niveau habituel. Sur ces 30 jours, tu as accumulé 72 répétitions de ce mouvement (2 séances). Ce n'est pas un record : c'est un écart à ce que tu reproduis d'habitude.

**Evidence**

36 vs habituel 24 · +50,0 %

**Metrics (scalaires / petites listes)**

- **lastReps** : `36`
- **median** : `24`
- **exerciseId** : `105`
- **name** : `Pompes inclinées`
- **sessionCount** : `17`
- **historicalMean** : `24`
- **currentMean** : `32.8`
- **recentMean** : `31.6`
- **vsInitialPct** : `36.7`
- **vsHabitPct** : `50`
- **bestDate** : `2026-08-03`

---

## 10. Diagnostics sélection / qualité / signaux / rejets (échantillon)

### 10.1 selectionDiagnostics

```json
{
  "keys": [
    "byFamily",
    "totals"
  ],
  "byFamily": {
    "rhythm": {
      "produced": 2,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 1,
      "shown": 1,
      "kindsProduced": [
        "span_regularity",
        "span_session_cost"
      ],
      "kindsShown": [
        "span_regularity"
      ]
    },
    "volume": {
      "produced": 2,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 1,
      "shown": 1,
      "kindsProduced": [
        "span_volume_vs_frequency",
        "disc_volume_shape"
      ],
      "kindsShown": [
        "disc_volume_shape"
      ]
    },
    "mix": {
      "produced": 8,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 4,
      "shown": 4,
      "kindsProduced": [
        "disc_muscle_now",
        "disc_emergence",
        "disc_emergence",
        "disc_emergence",
        "disc_emergence",
        "disc_emergence",
        "disc_emergence",
        "disc_emergence"
      ],
      "kindsShown": [
        "disc_muscle_now",
        "disc_emergence",
        "disc_emergence",
        "disc_emergence"
      ]
    },
    "exercise": {
      "produced": 8,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 4,
      "shown": 4,
      "kindsProduced": [
        "disc_ms_return",
        "disc_ms_pr_consolidated",
        "disc_exercise_progress",
        "journey_pr_vs_level",
        "journey_plateau",
        "journey_abandoned",
        "level_established",
        "exercise_specific_abandonment"
      ],
      "kindsShown": [
        "disc_ms_return",
        "exercise_specific_abandonment",
        "disc_ms_pr_consolidated",
        "disc_exercise_progress"
      ]
    },
    "gtg": {
      "produced": 2,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 0,
      "shown": 2,
      "kindsProduced": [
        "disc_gtg_unplanned_role",
        "disc_gtg_unplanned_progress"
      ],
      "kindsShown": [
        "disc_gtg_unplanned_role",
        "disc_gtg_unplanned_progress"
      ]
    },
    "sleep": {
      "produced": 1,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 0,
      "shown": 1,
      "kindsProduced": [
        "disc_sleep_reference"
      ],
      "kindsShown": [
        "disc_sleep_reference"
      ]
    },
    "adherence": {
      "produced": 1,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 0,
      "shown": 1,
      "kindsProduced": [
        "program_gap_mixed"
      ],
      "kindsShown": [
        "program_gap_mixed"
      ]
    },
    "mobility": {
      "produced": 1,
      "insufficient_data": 0,
      "deduped": 0,
      "ranked_out": 0,
      "shown": 1,
      "kindsProduced": [
        "stretch_gap"
      ],
      "kindsShown": [
        "stretch_gap"
      ]
    }
  },
  "starved": null,
  "summary": null
}
```

### 10.2 quality

```json
{
  "shownFlags": [],
  "deferredShown": []
}
```

### 10.3 signals

```json
{
  "phenomena": [
    {
      "type": "contraction",
      "status": "calculated",
      "detail": {
        "id": "recent_contraction",
        "type": "contraction",
        "signals": [
          "frequency_down",
          "rep_exposure_7_down",
          "identity_inside"
        ],
        "strength": 0.8,
        "confidence": 0.86,
        "interpretation": {
          "exposure": "reduced",
          "recentDirection": "still_falling",
          "identityStatus": "normal",
          "identityMeans": "observed_habit"
        },
        "nature": "now",
        "priority": {
          "unusual": false,
          "goalRelevant": true
        },
        "suppresses": [
          "volume_traj",
          "capacity_vs_exposure",
          "recent_vs_identity"
        ]
      }
    },
    {
      "type": "low_adherence",
      "status": "calculated",
      "detail": {
        "id": "program_drift",
        "type": "low_adherence",
        "signals": [
          "program_completion_low"
        ],
        "strength": 0.74,
        "confidence": 0.7,
        "interpretation": {
          "adherence": "low",
          "programPct": 52
        },
        "nature": "trajectory",
        "priority": {
          "unusual": true,
          "goalRelevant": true
        },
        "suppresses": []
      }
    }
  ],
  "sleepCandidateTypes": [
    "sleep_volume_threshold",
    "sleep_separation",
    "sleep_architecture",
    "sleep_family",
    "sleep_j2",
    "sleep_intensity"
  ],
  "sleepDetected": [
    "disc_sleep_month",
    "disc_sleep_assoc",
    "disc_sleep_architecture",
    "disc_sleep_family",
    "disc_sleep_intensity",
    "disc_sleep_quarter",
    "disc_sleep_j2",
    "disc_rest_assoc",
    "disc_sleep_rhythm_habit",
    "disc_sleep_regularity",
    "disc_sleep_reference"
  ],
  "sleepSelected": [
    "disc_sleep_reference"
  ],
  "milestonesDetected": [
    "disc_ms_return",
    "disc_ms_return",
    "disc_ms_return",
    "disc_ms_pr_consolidated",
    "disc_ms_event_combo",
    "disc_ms_return_durable"
  ],
  "milestonesSelected": [
    "disc_ms_return",
    "disc_ms_pr_consolidated"
  ],
  "correlations": [
    {
      "type": "sleep_volume_threshold",
      "status": "calculated",
      "nHigh": 10,
      "nLow": 4,
      "confidence": "high",
      "metrics": {
        "type": "sleep_volume_threshold",
        "sample": "recent14",
        "threshold": 7.5,
        "highN": 10,
        "lowN": 4,
        "highVol": 259.9,
        "lowVol": 217.8,
        "delta": 42.1,
        "deltaPct": 19.4,
        "highMin": 69,
        "lowMin": 49,
        "confidence": "high"
      }
    },
    {
      "type": "sleep_separation",
      "status": "calculated",
      "nHigh": 15,
      "nLow": 13,
      "confidence": "high",
      "metrics": {
        "type": "sleep_separation",
        "highN": 15,
        "highOk": 12,
        "lowN": 13,
        "lowShort": 6,
        "cut": 7.5,
        "confidence": "high"
      }
    },
    {
      "type": "sleep_architecture",
      "status": "calculated",
      "nHigh": 15,
      "nLow": 13,
      "confidence": "high",
      "metrics": {
        "type": "sleep_architecture",
        "highN": 15,
        "lowN": 13,
        "hoursHigh": 9.1,
        "hoursLow": 7.9,
        "awakeHigh": null,
        "awakeLow": null,
        "remHigh": 65,
        "remLow": 52,
        "deepHigh": 52,
        "deepLow": 68,
        "deepStable": false,
        "bbHigh": null,
        "bbLow": null,
        "confidence": "high"
      }
    },
    {
      "type": "sleep_family",
      "status": "calculated",
      "nHigh": null,
      "nLow": null,
      "confidence": "high",
      "metrics": {
        "type": "sleep_family",
        "shortN": 8,
        "longN": 25,
        "pushRetain": 70,
        "pullRetain": 120.5,
        "pushShort": 60.5,
        "pullShort": 70,
        "pushHabit": 86.4,
        "pullHabit": 58.1,
        "sensitive": "poussée",
        "confidence": "high"
      }
    },
    {
      "type": "sleep_j2",
      "status": "calculated",
      "nHigh": null,
      "nLow": null,
      "confidence": "high",
      "metrics": {
        "type": "sleep_j2",
        "isolatedN": 4,
        "okN": 7,
        "isolatedVol": 328,
        "okVol": 245.3,
        "delta": -82.7,
        "deltaPct": -25.2,
        "confidence": "high"
      }
    },
    {
      "type": "sleep_intensity",
      "status": "calculated",
      "nHigh": 26,
      "nLow": 9,
      "confidence": "high",
      "metrics": {
        "type": "sleep_intensity",
        "highN": 26,
        "lowN": 9,
        "highDens": 339,
        "lowDens": 315,
        "delta": 24,
        "deltaPct": 7.7,
        "confidence": "high"
      }
    }
  ],
  "notCalculatedNote": "Seules les corrélations effectivement produites par publishSleepCandidates / detectDiscoveries apparaissent ici."
}
```

### 10.4 coverageInsights

```json
[
  {
    "id": "sleep_thin",
    "text": "Sommeil présent mais couverture probablement insuffisante pour des croisements robustes.",
    "kind": "coverage"
  }
]
```

### 10.5 rejections (échantillon)

```json
[
  {
    "kind": "span_session_cost",
    "reason": "ranked_out_caps",
    "title": "Le coût objectif des séances semble avoir augmenté",
    "stage": "select"
  },
  {
    "kind": "span_volume_vs_frequency",
    "reason": "ranked_out_caps",
    "title": "Le volume bouge surtout parce que le nombre de séances bouge",
    "stage": "select"
  },
  {
    "kind": "disc_emergence",
    "reason": "ranked_out_caps",
    "title": "Hyperextension commence à s'installer",
    "stage": "select"
  },
  {
    "kind": "disc_emergence",
    "reason": "ranked_out_caps",
    "title": "Développé couché incliné aux haltères commence à s'installer",
    "stage": "select"
  },
  {
    "kind": "disc_emergence",
    "reason": "ranked_out_caps",
    "title": "Squat haltères entre dans ton historique",
    "stage": "select"
  },
  {
    "kind": "disc_emergence",
    "reason": "ranked_out_caps",
    "title": "Relevés de genoux à la barre revient après une interruption",
    "stage": "select"
  },
  {
    "kind": "journey_pr_vs_level",
    "reason": "ranked_out_caps",
    "title": "Ta meilleure série de 12 reps reste éloignée de la série que tu reproduis",
    "stage": "select"
  },
  {
    "kind": "journey_plateau",
    "reason": "ranked_out_caps",
    "title": "Plateau — Relevés de genoux aux parallèles",
    "stage": "select"
  },
  {
    "kind": "journey_abandoned",
    "reason": "ranked_out_caps",
    "title": "Pompes déclinées a été remplacé, pas abandonné au hasard",
    "stage": "select"
  },
  {
    "kind": "level_established",
    "reason": "ranked_out_caps",
    "title": "",
    "stage": "select"
  },
  {
    "kind": "disc_emergence",
    "reason": "cap",
    "title": "Curl assis dos calé commence à s'installer",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_emergence",
    "reason": "cap",
    "title": "Curl Zottman commence à s'installer",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ms_return",
    "reason": "cap",
    "title": "Tu reprends Relevés de genoux aux parallèles après 77 jours d'absence",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ms_return",
    "reason": "cap",
    "title": "Relevés de genoux à la barre revient après 49 jours",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ms_return",
    "reason": "cap",
    "title": "Tu reprends Relevés de genoux aux parallèles après 42 jours d'absence",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ms_pr_consolidated",
    "reason": "cap",
    "title": "Ces 20 reps sont devenues ton niveau récemment reproductible",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ms_event_combo",
    "reason": "cap",
    "title": "Reprise et niveau habituel le même jour",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_muscle_reorient",
    "reason": "story_duplicate_composition",
    "title": "Le stimulus du mois se déplace vers les pectoraux",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_reference",
    "reason": "cap",
    "title": "Repère général : ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou de milieu de nuit (2 h 00–4 h 00). Ce repère ne dit pas que c’est un problème.",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_structural_memory",
    "reason": "cap",
    "title": "Hyperextension commence à s'installer",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_rest_assoc",
    "reason": "cap",
    "title": "Tes données montrent une association entre repos et volume de séance",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_gtg_unplanned_now",
    "reason": "rival",
    "title": "Certains jours, le Grease the Groove ne tient que par un passage hors planning",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_steps_level",
    "reason": "cap",
    "title": "Les pas de ces 30 jours sont au-dessus de ton niveau des 30 jours d'avant",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ratio_structure",
    "reason": "story_duplicate_composition",
    "title": "La structure du mois se lit dans les ratios, pas seulement dans le total",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_rhythm_habit",
    "reason": "other",
    "title": "Rythme habituel récent : coucher autour de 4 h 40, lever autour de 13 h 30, milieu de nuit vers 8 h 55, pour une durée autour de 8 h 40. La durée et le placement sont deux lectures distinctes : une nuit longue peut rester très tardive.Le coucher et le lever sont tous les deux tardifs, et la durée de sommeil tient. La nuit du 7 octobre 2026 s'écarte d'au moins 1 h 30 de ce placement. Pour lire tes séances du lendemain, ce placement compte autant que la durée : une nuit « longue » mais très tardive ne se compare pas à une nuit plus précoce de même durée.",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_ms_return_durable",
    "reason": "cap",
    "title": "La reprise de dips est devenue durable",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_regularity",
    "reason": "other",
    "title": "Tes heures de coucher restent dispersées, avec un écart typique d'environ 155 min. Le rythme ne se résume donc pas à une heure habituelle unique : l'heure à laquelle la nuit commence change fortement d'un jour à l'autre. Conséquence : une baisse de perf un jour donné peut venir autant d'un coucher décalé que d'une séance plus dure — sans aligner les horaires, les corrélations sommeil×volume restent fragiles.",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_muscle_share_shift",
    "reason": "story_duplicate_composition",
    "title": "La part des quadriceps dans ton entraînement a augmenté plus vite que le volume global",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_assoc",
    "reason": "cap",
    "title": "Autour de 7 h 30, les journées fortes et les journées courtes ne se répartissent pas pareil",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_push_pull",
    "reason": "story_duplicate_composition",
    "title": "La poussée domine nettement le tirage du mois",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_anchor",
    "reason": "score",
    "title": "Ces 30 jours devient un nouveau point d'ancrage dans ton historique",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_architecture",
    "reason": "score",
    "title": "La continuité du sommeil accompagne tes journées à fort volume",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_intensity",
    "reason": "score",
    "title": "Le sommeil se lit aussi sur la densité de séance, pas seulement le volume",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_j2",
    "reason": "score",
    "title": "Le sommeil d’avant-hier pèse encore, même après une nuit correcte",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_repertoire",
    "reason": "score",
    "title": "Tes mouvements de référence commencent à disposer d’un historique assez fourni",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_steps_split",
    "reason": "score",
    "title": "Les jours sans séance portent moins de pas que les jours entraînés",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_calendar_rhythm",
    "reason": "score",
    "title": "Ces 30 jours mêlent un bloc chargé et un creux",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_quarter_profile",
    "reason": "score",
    "title": "Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifiable par son profil",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_sleep_month",
    "reason": "score",
    "title": "Sur le mois, volume et sommeil précédent se séparent — avec un échantillon encore limité",
    "stage": "periodDiscoveries"
  },
  {
    "kind": "disc_no_running",
    "reason": "score",
    "title": "La charge du mois provient entièrement des exercices de renforcement",
    "stage": "periodDiscoveries"
  }
]
```

---

*Fin du dump — généré automatiquement depuis le rapport live de la console.*