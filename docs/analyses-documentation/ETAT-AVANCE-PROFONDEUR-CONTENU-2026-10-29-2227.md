# État avancé — profondeur de contenu (exercices)

**Horodatage de référence :** **29 oct. 2026 · 22:27** (snapshot initial)  
**Suite implémentée :** **29 oct. 2026 · ~23:00** — raisonnement trajectoire (`primaryStory` / path / rebound), sélection anti-doublons composition, contexte hors fenêtre 7j, forensics console enrichis, **89 tests** verts.  
**Statut :** point le plus avancé de la journée sur la qualité de contenu des découvertes exercice (au-delà des moyennes / « première apparition »).  
**Contraintes respectées :** pas de LLM payant · pas de mega-refonte · pas de commit (sauf demande) · métier non cassé silencieusement.

**Appuis :**
- Spec prototype : [console de dev/spec-exercise-trajectory.md](./console%20de%20dev/spec-exercise-trajectory.md)
- Console : [console de dev/ideedebase.md](./console%20de%20dev/ideedebase.md) · [console de dev/RAPPORT-CONSOLE-DIAGNOSTIC.md](./console%20de%20dev/RAPPORT-CONSOLE-DIAGNOSTIC.md)
- Mission / plan : [PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md](./PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md)

---

## Où on en est (résumé)

Le problème cible n’était plus « la console ne montre pas les données », mais **le contenu produit** : Hyperextension (`disc_emergence`) et Pompes déclinées (`disc_exercise_progress`) restaient des constats plats (moyenne first5/last5, première apparition, hedges défensifs), alors que les **séries structurées** et les **séances datées** existaient déjà dans le snapshot.

À 22:27 :

1. Une **couche trajectoire** déterministe existe et alimente la rédaction.
2. Elle est branchée sur **émergence + progress**, puis étendue aux kinds voisins du même défaut de profondeur.
3. La **porte éditoriale** ne réécrit plus les titres riches quand `metrics.trajectoryOk` est vrai.
4. **77 tests** liés passent (`vitest` : trajectoire, gate, discoveries, milestones, setShift).
5. La **vérification live console** (Relancer → Hyperextension / Pompes) a été tentée mais **bloquée** par l’UI (lock / quiz / navigation hash ≠ onglet réel) — à rejouer manuellement après Relancer sur `#dev-analysis-engine`.

---

## Les 4–5 dernières passes (chronologie utile)

### Passe A — Diagnostic contenu cible

- Comparaison **actuel vs désiré** pour Hyperextension et Pompes déclinées.
- Architecture souhaitée rappelée : niveaux (constat → mécanisme séries → témoins → implication), projections, fusion, temporalité.
- Verdict : **données OK, jugement / rédaction trop minces** ; pas un trou d’instrumentation pure sur progress (les dates/sessions étaient déjà là).

### Passe B — Spec + prototype trajectoire (2 kinds)

- Spec écrite : `console de dev/spec-exercise-trajectory.md`.
- Module neuf : `src/utils/sport/exerciseTrajectoryAnalysis.js`
  - `buildExerciseTrajectory` (sessions, sets trusted, installation, forme, mécanisme séries, témoins, findings + stances)
  - `renderExerciseTrajectoryCopy`
  - `trajectoryToMetrics` → `trajectoryOk`, shape, setMechanism, peers, dates, etc.
- Branché dans `recapPeriodDiscoveries.js` pour :
  - `disc_emergence` (mode `emergence`)
  - `disc_exercise_progress` (mode `progress`)
- Gate : `recapEditorialGate.js` — ne force plus « niveau plus haut/bas » si `trajectoryOk`.
- Tests : `src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js` (15).
- Console forensics / provenance : exposition de la trajectoire + legacy A/B.

### Passe C — Demande « tous les problèmes de ce type »

Élargissement systémique (même classe de défaut : agrégats minces + templates défensifs + titres aplatis).

### Passe D — Densification + peers + kinds voisins (aboutit ~22:27)

Réalisé dans la session qui mène à cet horodatage :

| Zone | Changement |
| --- | --- |
| Témoins | `relatedFamilies` : `pushup` ↔ `push` ; textes témoins avec niveaux (~reps/séance) |
| Rédaction | `buildFindings` + `renderExerciseTrajectoryCopy` : prose coach, pas de double « Format observé », hedge physio une seule fois et seulement si pas d’implication |
| `disc_structural_memory` | Part de famille **+** installation / séries / forme via trajectoire ; gate ne réécrit le titre que si **pas** `trajectoryOk` |
| `disc_ms_return` | Titre/retour enrichis ; schéma **séance** (`setBit`) prioritaire sur agrégat trajectoire ; implication « reproduire le format » ; retire le hedge « pas à lui seul une progression » |
| `disc_comparable` | Arc first→last + mécanisme séries si dispo |
| `disc_family_fade` | Distingue absence vs recul de volume/séance |
| Sélection | `selectPeriodDiscoveriesWithTrace` : **+4** score si `metrics.trajectoryOk` |

### Passe E — Tests + tentative console

- Suites : **77/77** OK après correctif setShift (ne pas écraser `3 séries de 20` par un `4 × 12` agrégé).
- Console : hash `#dev-analysis-engine` ≠ affichage garanti ; besoin `setActiveTab('dev-analysis-engine')` via NavigationContext ; overlay Unlock / quiz ont interrompu Relancer. **À revalider à la main.**

---

## Ce qui a été remarqué dans la console (avant / pendant)

| Observation | Conséquence |
| --- | --- |
| Hyperextension 30j : metrics « minces » côté jugement alors que séances/sets existent | Prototype trajectoire émergence |
| Pompes déclinées : ~23 dates, données riches, texte = mean first/last + hedges | Prototype progress + peers |
| Legacy title/body encore visibles en forensics | Conservés volontairement pour A/B (`legacyTitle` / `draftTitle` + rendu trajectoire) |
| Gate aplatissait les titres progress / structural / return | Skip rewrite si `trajectoryOk` (progress déjà ; structural + return ajoutés) |
| Relancer / onglet console fragiles (lock, quiz, hash) | Vérif live non concluante à 22:27 — tests unitaires = filet principal |

---

## Fichiers touchés (précis — cœur profondeur contenu)

### Nouveaux

| Fichier | Rôle |
| --- | --- |
| `src/utils/sport/exerciseTrajectoryAnalysis.js` | Couche trajectoire (calcul + copy + metrics) |
| `src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js` | Tests déterministes |
| `docs/analyses-documentation/console de dev/spec-exercise-trajectory.md` | Spec audit + contrat |
| `src/utils/sport/analysisEngineCopyProvenance.js` | Provenance texte (kinds + transforms) — lié console |

### Modifiés (profondeur / branchements)

| Fichier | Quoi |
| --- | --- |
| `src/utils/sport/recapPeriodDiscoveries.js` | Wire emergence, progress, structural_memory, comparable, family_fade ; boost sélection `trajectoryOk` |
| `src/utils/sport/recapEditorialGate.js` | Conserve titres trajectoire (progress / structural / return) |
| `src/utils/sport/recapMilestoneEngine.js` | Enrichissement `disc_ms_return` + metrics trajectoire |

### Console / diagnostic (passes antérieures de la même journée, toujours dans le working tree)

| Fichier | Rôle |
| --- | --- |
| `src/components/dev/AnalysisEngineConsole.jsx` (+ `.css`) | Console diagnostic |
| `src/components/dev/AnalysisEnginePipelinePanel.jsx` | Vue pipeline |
| `src/utils/sport/analysisEngineDiagnostic.js` (+ model, finding forensics, data catalog, pipeline model) | Collecte forensics |

*Note : d’autres fichiers `git status` (Garmin, settings, workout…) sont hors de ce fil « profondeur contenu exercice » — ne pas les confondre avec cette avancée.*

---

## Contrat de contenu atteint (cible)

Pour une carte exercice « réussie » on veut maintenant, quand les données le permettent :

1. **Constat** chiffré sur séances (pas seulement une moyenne opaque).
2. **Mécanisme** : `N × R` avant → après, si `exerciseSetLogs` structurés.
3. **Portée** : témoins de famille (local vs partagé), dont pompes ↔ dips / push.
4. **Implication** coach concrète (consolider / cibler un volume, pas « il faudrait vérifier »).
5. **Limites** explicites une seule fois (outlier, pas de sets), sans hedges empilés.

Stances : `established` | `probable` | `watch` | `indeterminate`.

---

## Suite 29/10 — formulation globale (pas seulement les 2 refs)

Les deux analyses de référence = **standard de vibe / structure**, pas un périmètre de kinds.

- Helper `recapAnalyticalReading.js` : `composeAnalyticalReading` (titre-thèse → constat → mécanisme → portée → implication|silence) + implications bornées (`density`, `pushPull`, `calendarGap`, `volumeShape`, `peakDay`).
- Branché : densité, muscle_now, push_pull, calendrier, volume_shape (7j + mois), peak_day, no_running, muscle_reorient, exercise_share, rendu trajectoire exercice.
- Encore ouvert côté prose : sommeil / essays horizon / long volume_shape (déjà riches mais pas tous passés au helper).

---

## Hors scope / encore ouvert

- Programme **prévu vs fait** (hors prototype trajectoire).
- Sommeil + essais horizon + `disc_volume_shape` long voix → même contrat 4 temps.
- Commit / push (non demandés).
- Rejouer **Relancer** en console sur 7j/30j : vérifier vibe (titre-thèse, implication ou silence) sur cartes non-exercice aussi.
- Eventuel mode `return` dédié dans `buildExerciseTrajectory`.

---

## Comment reprendre

1. Console diagnostic → **7d** puis **30d** → Relancer.
2. Spot-check : densité / poussée-tirage / volume / pic / calendrier **et** hyperextensions / pompes déclinées.
3. Commit seulement sur demande.

**Commande tests (filet) :**

```bash
npx vitest run src/utils/sport/__tests__/recapAnalyticalReading.test.js src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js src/utils/sport/__tests__/recapEditorialGate.test.js src/utils/sport/__tests__/recapPeriodDiscoveries.test.js
```

*(72 tests verts sur ces suites au moment de cette suite.)*

---

*Document d’état — 29/10/2026 22:27 (+ suite formulation) — snapshot, pas spec normative.*
