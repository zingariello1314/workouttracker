# RAPPORT F5 — Sélection éditoriale intelligente  
**2026-11-01** — Aucun commit. F6/F7 non engagés. Live : **non inspecté**.

## Verdict (honnête)

F5 **améliore qualitativement** les packs : moins de redondances d’épisode, plus de contradictions pack résolues (Dips), zéro « un mouvement » promu, `rest_assoc` hors budget sommeil, traces explicables, abstention possible.

Ce n’est **pas** un succès total : des descriptifs (density, exercise_share, push_pull) restent sur 7j ; des anchors / calendar peuvent encore apparaître sur 30d si le refill et les caps le permettent ; la résolution d’identité en amont (104 vs 504) reste un chantier producteurs.

**Ne pas conclure « F5 OK » seulement parce que les tests passent.**

| Période | n avant F4 | n après F5 | composées | descriptives faibles | doublons phénomène | contradictions pack | anonymes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 7d | 12 | **10** | 2 | 2 | 0 | 0 | 0 |
| 30d | 19 | **14** | 3 | ~2 | 0 | 0 | 0 |
| 3m | 21 | **16** | 5 | 2 | 0 | 0 | 0 |
| 6m | ~17–21 | **14** | 5 | 2 | 0 | 0 | 0 |

---

## Code livré

| Fichier | Rôle |
| --- | --- |
| `src/utils/sport/recapEditorialSelection.js` | IV A–F, phénomène, rivalités, contradictions, caps épisode |
| `src/utils/sport/recapPeriodDiscoveries.js` | branchement E0 + jalons + abstention + refill F5-aware |
| `src/utils/sport/recapInsightNature.js` | `rest_assoc` → sport |
| `src/utils/sport/__tests__/recapEditorialSelection.f5.test.js` | 18 tests déterministes |
| `scripts/f5-replay-periods.mjs` | replays 7d/30d/3m/6m + thin 1y/2y/always |

## Docs

- `AUDIT-E0-AVANT-F5-2026-11-01.md`
- `MATRICE-VALEUR-INFORMATIVE-F5-2026-11-01.md`
- `REGISTRE-RIVALITES-F5-2026-11-01.md`
- `POLITIQUE-EDITORIALE-HORIZON-F5-2026-11-01.md`
- `TABLEAU-AVANT-APRES-F5-2026-11-01.md`
- `TESTS-F5-2026-11-01.md`
- `TRANSFERT-F5-VERS-F6-F7-2026-11-01.md`
- fixtures `f5-replay-periods.json` / `f5-replay-brief.json`

---

## Cinq décisions difficiles (français naturel)

### 1. Carte profonde qui gagne — Tractions australiennes (6m)

« Un format plus volumineux se maintient » (`disc_emergence`, IV ≈ **150**).  
Preuves : `composedOk`, séries trusted, continuité `consolidated_format`, témoins peers, narration cohérente. Bonus F5 : +8 composed, +5 sets, +4 narration, +4 long_horizon, +6 mécanisme, +5 peers, +4 continuité.  
Elle domine les descriptifs du pack et passe le cap épisode.

### 2. Carte profonde qui perd — Dips « volume stable » (6m)

Deux cartes « Dips » (storage **103** recul vs **503** stable). Même nom canonique → même `exerciseKey`. Récits incompatibles `volume_decline` × `volume_stable`.  
La carte stable (IV ≈ 136) perd contre le recul confirmé (IV ≈ 138, −19,7 % sur 19 séances). Décision tracée : `volume_contradiction` / displace.  
**Avant F5 :** les deux coexistaient → pack illisible.

### 3. Carte simple qui gagne — Face pull vs habit (30d / 6m)

« Face pull : ces 30 jours sont au-dessus de ton niveau habituel » (`disc_vs_habit`). Observation simple, IV de base modeste, mais **contraste habituel chiffré** (médiane, %).  
Elle reste sélectionnée face à des compositions plus longues moins centrées sur l’écart à l’habitude. Critère : information utile ≠ longueur.

### 4. Deux rivales départagées — Pompes (30d)

- `disc_freq_decline_low_exposure` (recul, IV 110)  
- `disc_exercise_progress` arc creux→reprise (IV **116**)  
Puis tentative de refill `disc_ms_return_durable` (reprise durable, IV 76).  

Arc retenu ; recul simple déplacé (`contradiction_outranked`) ; durable **refusé au refill** (F5 `editorialCanTake`) pour ne pas re-raconter la même reprise.

### 5. Refus pour insuffisance de preuve / identité — « un mouvement » (30d)

Plusieurs émergences / freq_progress avec titre « un mouvement » (IV parfois > 100 grâce à la composition).  
F5 : rejet dur `unresolved_exercise_name` — **0 carte anonyme** dans le pack final.  
La preuve structurée ne suffit pas sans identité utilisateur résolue.

---

## Traces

Pour chaque run E0 : `debug.f5.counts`, `rejectedByReason`, `editorialDecisions` (select / reject / displace / abstain / select_milestone).

`selected + rejected = eligible` au niveau E0 (collapse d’identité compté à part).

## Non-régressions

P0/F2/F3/F4.1, P3.0–P3.6, GTG, plan, nuits : suites E0 + composition narration vertes (44 + 38 tests session).

## Limites restantes

1. Descriptifs 7j (density, share, push_pull) encore présents.  
2. Anchor / calendar peuvent survivre sur mois.  
3. Ids storage dupliqués (104/504) — à unifier en amont.  
4. Jalons sans `exerciseId` court — extraction titre heuristique.  
5. `%` de cartes composées **n’est pas** l’indicateur de succès (volontaire).

## Arrêt

F5 livré. Attente validation. **Pas de F6/F7. Pas de commit.**
