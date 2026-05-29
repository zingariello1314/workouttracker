# État des lieux — Moteur quiz & programmes coach

*Dernière mise à jour : **v5** — Global Load + canaux orthogonaux + shadow validation. Quiz **11**.*

---

## 1. Modèle v5 : score principal + contradictions + shadow

```
                    ┌─────────────────────────────┐
                    │   Global Load Engine (v5)   │
                    │  structuralLoadFactor       │  ← quiz / récup
                    │  historyLoadFactor          │  ← logs Sport
                    │  globalLoadFactor           │  ← mix 55/45
                    │  distributionFactor         │  ← √s×h (caps familles)
                    │  sessionLimitsFactor        │  ← min(s, global)
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Shadow validation (lecture) │  ← ne génère PAS
                    │  fatigueConsistency          │
                    │  volumeAnomalyCheck          │
                    │  cardioConflictCheck         │
                    │  contradictions (max 2 UI)   │
                    │  liveBand dynamique          │
                    └──────────────┬──────────────┘
                                   │
         Génération (figé)          │          Live (perturbation)
         meta.globalLoad            │          liveBand 0.82–1.10
         meta.shadowValidation      │          + cycle + reps
```

**Fichiers :** `quizGlobalLoadEngine.js`, `quizShadowValidation.js`, `quizCoachDecisionTrace.js`

---

## 2. Réponses aux risques v4

| Risque | Réponse v5 |
|--------|------------|
| Monolithe / SPOF calibration | Shadow détecte dérives ; contradictions explicites ; 3 scalaires dérivés **non copiés** |
| 1 signal × 4 | `distributionFactor` ≠ `sessionLimitsFactor` ≠ `globalLoadFactor` |
| Live trop faible | `liveBand.max` jusqu’à **1.10** si shadow voit marge (`allowUplift`) |
| Debugging | `meta.globalLoad` + `meta.shadowValidation` + trace hiérarchisée |

---

## 3. Hiérarchie (inchangée, renforcée)

1. **Global Load** (canaux + mix)  
2. **Shadow** (warnings only)  
3. **Distribution** (`distributionFactor`)  
4. **Nerveux** (booléens plyo/fractionné)  
5. **Limites séance** (`sessionLimitsFactor`)  
6. **Génération** (`effectiveVolumeFactor` = global × cycle)  
7. **Live** (bande shadow + cycle + reps)

---

## 4. Ce que shadow ne fait pas

- Ne modifie pas `globalLoadFactor` après coup (sauf refine unique via `loadRatio` nerveux).  
- Ne remplace pas le moteur — **valide** et **borne** le live.

---

## 5. Produit

| Surface | Contenu |
|---------|---------|
| Encart / why | Max 3 signaux + max 2 alertes shadow |
| Meta programme | `globalLoad.*` + `shadowValidation.liveBand` |
| Séance live | Peut monter ~5–10 % si repos récent + bonne marge shadow |

---

## 6. Tests

**40+** tests Vitest : `quizGlobalLoadEngine.test.js`, `quizShadowValidation.test.js`, pipeline, calibration §9.

---

## 7. Curateur d’exercices (banque, additif)

| Module | Rôle |
|--------|------|
| `quizExerciseTemplates.js` | 22 legacy garantis (métadonnées calibration) |
| `exerciseGenerationFitness.js` | Score 0–100, seuils 60 / 80 |
| `quizExerciseBankBridge.js` | DB → template (équipement, groupe, lieu) |
| `quizExercisePool.js` | Fusion legacy + banque (`fitnessScore`, `fineMuscle`) |
| `quizFineMuscleResolve.js` | Muscle fin : **banque d’abord**, regex secours |
| `quizExerciseSelectionScore.js` | Tirage : fitness, priorités quiz, styles, variété |
| `quizExercisePlanner.js` | Pool fusionné ; legacy +2 **si** &lt; 12 candidats |
| `exerciseBankAudit.js` | Non-régression 218 clés + étirements |

**Sélection :** score = objectif + coach deformers + `fitnessScore` + `priorityMuscleGroups` (pecs/dos fins via `primaryMuscles`) + `triedTrainingStyles` + anti-répétition séance.  
**Historique / caps :** `quizFineMuscleCaps` + `quizMuscleVolumeCaps` via `resolveFineMuscleFromExerciseRef` (ids `quiz_ex_*`).  
**Étirements :** toute `stretchDatabase` (inchangé).  
**Hors scope :** overlay tagging manuel, gate CI 85 % auto-pool.

## 8. Hors scope

- Replan calendrier (swap jours)  
- UI Repas auto-fill  

---

*Spec : [`SPEC_MOTEUR_COACH_COMPLET.md`](SPEC_MOTEUR_COACH_COMPLET.md)*
