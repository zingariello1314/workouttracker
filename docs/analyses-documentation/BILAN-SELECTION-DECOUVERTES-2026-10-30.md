# Bilan — sélection des découvertes (post-P0)

**Date :** 30 octobre 2026  
**Périmètre :** arbitrage candidats → pack affiché (sans P3, sans commit)  
**Validation live :** diagnostic `30d` · `2026-10-01` → `2026-10-30` · `generatedAt` `2026-10-30T04:17:24.628Z`  
**Baseline conflit :** validation P0 (`disc_exercise_progress` → `discovery_not_selected`, remplacé par `journey_progress`)

---

## 1. Pipeline de sélection (remonté)

```
detectDiscoveries (+ GTG, threads…)
  → filterDiscoveriesByPeriodScope
  → selectPeriodDiscoveriesWithTrace
       • memoryFactor(kind [, discovery])
       • discoveryInformativeValue (rawScore + preuves trajectoire)
       • canTake : score / identity / kind / rivaux composition / famille
       • caps SIGNAL_FAMILY_CAPS + budget sommeil
  → applyEditorialGate
  → filterValidInsights (rejets durs Spec #24)
  → refillAfterGate
  → buildHorizonEssayCandidates (émet selected + essays journey_*)
  → novelty / kinship / natureSelectionBoost / caps colonnes
  → pack final (shown_now)
```

Pour chaque candidat, le diagnostic expose désormais mieux les sorties post-sélection via `insight_validation:*` / `editorial_gate` (avant : `discovery_not_selected` muet).

---

## 2. Conflit `disc_exercise_progress` / `journey_progress`

| | `disc_exercise_progress` | `journey_progress` |
| --- | --- | --- |
| Données | Fenêtre + historique de forme (shape, séries, témoins, creux→reprise) | Lifetime : 1ʳᵉ référence fiable → niveau habituel (+ PR, tenure) |
| Conclusion type (live) | Pompes déclinées : recul puis retour (~10 → ~36) | Plusieurs mouvements : niveaux de référence en hausse |
| Spécifique | Granularité séries, peers, implication | Ancrage parcours / paliers / base séances |
| Redondant | « ça progresse » au sens large | Idem au sens large |
| Valeur | **Plus précise** sur l’évolution récente étayée | **Complémentaire** (échelle lifetime) |

**Arbitrage retenu :** coexistence quand les scopes diffèrent (fenêtre ≠ parcours).  
`journey_progress` n’est plus masqué dès que `disc_exercise_progress` est sélectionné ; le corps précise la complémentarité (`complementaryToWindowProgress`).

**Live après correctifs :** les deux sont `shown_now`.

---

## 3. Cause réelle du rejet (prioritaire)

Deux couches, pas une seule :

1. **Sélection / mémoire** — un score 63 × mémoire de kind agressive pouvait passer sous le seuil 36 → sortie `score`.  
   *Mitigé :* mémoire douce si `trajectoryOk` ; `informativeValue` sur `rawScore` ; bypass seuil si trajectoire riche (`info ≥ 85`).

2. **Validation dure (cause live dominante)** — le texte témoin injectait `[id 466084426]` → `insightRejectReason` = `raw_exercise_id` → carte retirée **après** sélection, sans raison dans `dropped` → statut console `discovery_not_selected`.  
   *Corrigé :* prose témoins sans id brut ; rejets post-sélection tracés.

---

## 4. Corrections code

| Fichier | Changement |
| --- | --- |
| `recapPeriodDiscoveries.js` | Mémoire douce trajectoire ; `rawScore` / informativeValue ; seuil score intelligent ; famille plus permissive si info élevée ; traçage `insight_validation:*` / `editorial_gate` |
| `recapHorizonEssays.js` | Coexistence journey ↔ progress ; metrics `temporalScope: lifetime` ; relevance légèrement baissée si déjà couvert par fenêtre |
| `recapNarrativeClaims.js` | Topics `exercice.fenetre.*` vs `exercice.parcours.*` (claims distincts) |
| `exerciseTrajectoryAnalysis.js` | `peerPhrase` sans `[id …]` ; limites homonymes sans `#id` |

Pas de quota artificiel par famille. Pas de règle hard-codée « pompes déclinées ».

---

## 5. Cartes fusionnées / rejetées (audit)

| Raison | Live 30j | Lecture |
| --- | --- | --- |
| `story_duplicate_composition` | `disc_muscle_now`, `disc_muscle_reorient`, `disc_push_pull`, `disc_ratio_structure` | Même constat mix/poussée — **redondance réelle** ; une carte composition suffit |
| `dedup_kinship` | 0 sur ce run | — |
| `ranked_out_caps` | ~10 au total sélection adaptive | Capacité pack, pas un bug progress |
| Assiduité / mobilité | **affichées** (`program_gap_mixed`, `stretch_gap`, `span_regularity`) | Plus « perdues » sur ce run |

---

## 6. Comparaison pack avant / après (30j)

**Avant (validation P0) :** progress absente du pack ; `journey_progress` présent.  
**Après (`04:17:24Z`) :** **17** cartes `shown_now`, dont :

- `disc_exercise_progress` — Pompes déclinées : recul puis retour… (**weight 94**)
- `journey_progress` — Tes niveaux de référence… (`complementary: true`, weight 63)
- Assiduité / rythme / mobilité présents
- Emergences, GTG, volume, sommeil, jalons inchangés dans l’esprit

Corps progress : témoin « Développé couché incliné aux haltères (autour de 48…) » **sans id**.

---

## 7. Tests

- Mémoire de kind n’élimine plus une trajectoire riche  
- Deux `disc_exercise_progress` d’exercices distincts coexistent  
- Trajectoire précise n’est pas écartée par un générique haut score  
- `journey_progress` émis même si progress déjà sélectionné  
- Claims fenêtre ≠ parcours  
- `raw_exercise_id` : dirty reject / clean pass  
- Suites trajectoire + essays + claims : **87 tests OK**

---

## 8. Limites restantes (hors P3)

1. Pack à **17** cartes (rescues familles) — plafond « ~15 » non strict ; pas de re-quota forcé ici.  
2. `story_duplicate_composition` reste agressif sur le mix : OK pour ce run, à revisiter si deux angles composition vraiment distincts.  
3. `insightRejectReason` / `raw_exercise_id` reste utile mais fragile si d’autres producteurs réinjectent des ids longs dans le prose.  
4. P3 (similarité fine des témoins, etc.) **non commencé**.

---

## 9. Verdict

Le cas prioritaire est **corrigé et validé en live** :  
`disc_exercise_progress` riche est sélectionné **et** coexiste avec `journey_progress` complémentaire.  
La cause principale n’était pas « journey bat toujours progress », mais **validation qui tuait une trajectoire valide** après une sélection déjà fragile sur la mémoire de kind.
