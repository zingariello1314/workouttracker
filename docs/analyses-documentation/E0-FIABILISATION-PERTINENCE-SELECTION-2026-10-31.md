# E0 — Fiabilisation de la pertinence et de la sélection des analyses

**Date :** 2026-10-31  
**Statut :** validé (pipeline + tests)  
**Hors périmètre :** P3.2a/b, P3.3–P3.5, commit Git

---

## 1. Défauts démontrés et causes exactes

| Défaut | Cause exacte | Correction E0 |
|---|---|---|
| `disc_plan_data_insufficient` en tête de pack 7j | Présent dans `PERIOD_DISCOVERY_PRIORITY` (week/month) + poids élevés → `take()` forçait la carte avant des candidats plus informatifs | Kind retiré des listes de priorité ; `contentClass: methodology_limit` ; demote systématique vers `reliabilityNotes` |
| Fiabilité confondue avec droit de publication | Score/reliability élevés suffisaient à entrer dans le pack principal | Règle E0 : fiabilité ≠ publication ; `canTake` / `take` / `refillAfterGate` rejettent `methodology_limit` |
| Parts musculaires 74/26 lues comme anatomie | Prose `disc_muscle_*` / `disc_push_pull` sans limite claire ; priorité composition trop haute | Reformulation « attribuée / indicative / conventionnelle » ; `contentClass: descriptive` ; poids baissés ; `COMPOSITION_STORY_KINDS` + informativeValue −8 |
| Tautologie `disc_muscle_reorient` sur ~30j | Comparaison fenêtre ≈ `d30` → `ofMonthPct` ~100 % | Gate `comparesPeriodToItself` (month / span 28–32 / reps≡monthReps & ≥95 %) |
| Priorité statique > informativeValue | Priority pass forçait kinds médiocres avant le tri | Priority conserve la couverture thématique **sauf** methodology ; tri principal = `discoveryInformativeValue` puis score |
| Limite invisible hors debug | Notes absentes du bundle UI | `reliabilityNotes` sur le bundle + affichage dans `RecapTrainingStateDebugPanel` |

---

## 2. Fichiers et fonctions modifiés / créés

### Créés
- `src/utils/sport/recapDiscoveryContentClass.js` — `CONTENT_CLASS`, `contentClassForKind`, `resolveContentClass`, `isMethodologyLimitDiscovery`, `methodologyLimitMayPublish` (toujours false), `reliabilityNoteFromMethodologyDiscovery`, `analyticalCandidateIsViable`
- `src/utils/sport/__tests__/recapDiscoverySelectionE0.test.js` — 12 scénarios + horizons + pipeline bundle
- ce livrable

### Modifiés
- `src/utils/sport/recapPeriodDiscoveries.js`
  - `discovery()` stamp `contentClass`
  - prose / weights / metrics `attributionMode` pour `disc_muscle_now`, `disc_push_pull`, `disc_muscle_share_shift`, `disc_muscle_reorient`
  - gate tautologie reorient
  - `PERIOD_DISCOVERY_PRIORITY` sans `disc_plan_data_insufficient` ; composition descendue
  - `discoveryInformativeValue` pénalise methodology / composition non-trajectoire
  - `selectPeriodDiscoveriesWithTrace` → demote + `reliabilityNotes`
  - `refillAfterGate` ignore methodology
  - `buildPeriodDiscoveryBundle` expose `reliabilityNotes`
- `src/utils/sport/recapProgramAdherenceDiscoveries.js` — compose plan insufficient (titre/body/weights/`contentClass`)
- `src/utils/sport/recapAnalyticalReading.js` — `pushPullImplication` sans « stimulus »
- `src/components/sport/recap/RecapTrainingStateDebugPanel.jsx` — section Fiabilité / limites
- tests adherence / analytical reading ajustés

---

## 3. Changements de sélection et de narration

### Classes de contenu
| Classe | Droits de sélection |
|---|---|
| `analytical` | Pack principal (seuils score / informativeValue) |
| `descriptive` | Pack possible, plafond composition (1 story), informativeValue réduite |
| `methodology_limit` | Jamais pack principal → `reliabilityNotes` |
| `technical_internal` | Hors affichage utilisateur |

### Sélection
1. Score + `informativeValue` + `contentClass`
2. Priority thématique **sans** methodology
3. Fill par informativeValue
4. Cap familles / rivals / composition
5. Methodology → notes ; drop reason `methodology_demoted`
6. Editorial gate + validation + refill (sans methodology)

### Narration
- Plan insuffisant : *« Suivi de plan : preuve historique indisponible »* + constat snapshots / reconstruct ; pas une thèse sportive.
- Muscle : *reps attribuées*, *répartition indicative*, *pas une mesure anatomique exacte*.
- Push/pull : asymétrie d’exposition attribuée, pas déficit à rattraper / stimulus.

---

## 4. Avant / après (textes et décisions)

### Contre-exemple 7 jours (sans snapshot, avec performances)

**Avant (comportement ciblé)**  
- Candidat `disc_plan_data_insufficient` score élevé, **retenu** via priority week.  
- Texte type : carte principale « adhérence impossible… » occupant un slot analytique.  
- Progressions / volume éventuels relégués ou concurrencés.

**Après (mesuré par tests pipeline)**  
- Candidat **toujours généré** (calcul absence de snapshot conservé).  
- `selected` : **aucun** `disc_plan_data_insufficient`.  
- `dropped.reason` : `methodology_demoted`.  
- `reliabilityNotes[0]` : même kind + titre/summary.  
- Texte compose (réel) :

> **Titre :** Suivi de plan : preuve historique indisponible  
> **Corps :** Aucun jour de cette fenêtre n’a de plan figé (snapshot) : un taux d’adhérence au programme prévu ne peut pas être calculé. N jour(s) documentent seulement le réalisé (reconstruction). Les expositions et trajectoires restent lisibles à part.  
> **weights.importance :** 0.35 (avant : ~0.9+)

### Composition musculaire (extrait après)

> … reps attribuées …  
> **Limite :** Répartition indicative (parts conventionnelles primary/secondary), pas une mesure anatomique exacte.  
> `metrics.attributionMode` : `conventional_rep_share`  
> `contentClass` : `descriptive`

### Vue 30j tautologique

- `disc_muscle_reorient` **non produit** quand la fenêtre ≈ 30j (gate).  
- Au plus **une** carte composition parmi muscle_now / push_pull / share_shift / reorient.

---

## 5. Tests ajoutés et résultats

Fichier : `src/utils/sport/__tests__/recapDiscoverySelectionE0.test.js`

| # | Scénario | Résultat |
|---|---|---|
| 1 | 7j sans snapshot + progress | demoted + progress retenue |
| 2 | observations banales | volume OK, pas de faux plan |
| 3 | progression + limite concurrente | progress gagne |
| 4 | 30j multi-familles | diversité, pas methodology |
| 5 | composition concurrente | ≤1 carte |
| 6 | 3m historique riche | journey progress vs kcal |
| 7 | longue distinctifs | 2 progress coexistent |
| 8 | historique vide | selected [] + note |
| 9 | redondance composition | 1 retenue |
| 10 | familles familles | coexistence |
| 11 | fiabilité ≠ informativeValue | traj > limit |
| 12 | aucun digne | pack vide + note |
| + | priority lists sans plan_insufficient | OK |
| + | horizons today/week/month/long/year | demote |
| + | pipeline 7j / 30j / multi-horizons bundle | OK |

**Exécution :** 26/26 E0 passed.

---

## 6. Non-régressions vérifiées

| Suite | Résultat |
|---|---|
| `recapPeriodDiscoveries.test.js` | 33 passed |
| `recapProgramAdherenceDiscoveries.test.js` | 15 passed |
| `recapProgramAdherenceProgression.test.js` (P3.0/P3.1) | 19 passed |
| `recapAnalyticalReading.test.js` | 7 passed |
| `calendarDayPlanSnapshot.test.js` (P0) | 12 passed |

**Total non-régression + E0 ciblés :** 86 + 26 (chevauchement adherence) — toutes vertes.

---

## 7. Limites encore présentes

- `reliabilityNotes` visibles surtout via panneau debug/admin ; pas encore une bannière utilisateur grand public dédiée (le demote suffit à ne plus polluer le pack principal).
- Parts 74/26 **toujours calculées** (moteur muscle inchangé) — E0 ne fait que reformuler / rétrograder éditorialement.
- `DESCRIPTIVE_COMPOSITION_KINDS` inclut aussi volume/density : peut encore remplir le pack si aucun analytique fort (voulu pour ne pas inventer, mais peut rester « plat »).
- Historique plan (H snapshots) : sans snapshots, **aucune** adhérence inventée — correct ; contextualisation W via C/H reste partielle selon kinds existants.
- Pas de golden ledger 4016 — validation sur fixtures représentatives, pas sur le jeu utilisateur intégral.

---

## 8. Reporté (hors E0)

| Sujet | Lot |
|---|---|
| Modèle musculaire R / mono-multi / non_attr (remplacer 74/26) | **P3.2a/b** |
| Golden ledger intégral + invariants éditoriaux restants | prérequis P3.2 |
| Surface UI utilisateur pour reliabilityNotes (hors debug) | lot UX post-E0 ou P3.3 narrative |
| Enrichissement systématique C/H pour tous les kinds | lots ciblés après E0 (documenter dépendance par kind) |
| P3.3 / P3.4 / P3.5 | inchangés |

---

## 9. Critère de fin E0

- [x] Architecture de sélection corrigée (pas un patch de texte isolé)
- [x] Classes de contenu formalisées
- [x] Contre-exemple 7j : limite = contexte, pas découverte sportive prioritaire
- [x] Muscle : prose + demote + gate tautologie (sans implémenter P3.2)
- [x] Tests représentatifs + non-régression P0/P3.0/P3.1
- [x] Validation pipeline `buildPeriodDiscoveryBundle` (selected / dropped / reliabilityNotes / textes)
- [x] Pas de commit

**E0 est déclaré terminé** sur la base du comportement final du pipeline, pas seulement des unitaires de scoring.
