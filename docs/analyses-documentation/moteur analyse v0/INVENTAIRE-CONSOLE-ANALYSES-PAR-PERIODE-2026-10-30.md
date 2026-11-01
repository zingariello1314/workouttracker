# Inventaire — console de diagnostic et analyses par période

**Date :** 30 octobre 2026 (révision vérifiée code)  
**Nature :** inventaire factuel, sans jugement de qualité.  
**Périmètre :** Recap Analyse + console `AnalysisEngineConsole`.  
**Méthode :** croisement UI console ↔ `analysisEngineDiagnostic*` ↔ `recapPeriodDiscoveries` / essays / nature / forensics.  
**Limite :** les cartes *affichées* sur un compte dépendent des données au **Relancer**. Ici : répertoire code, conditions, caps, et surface console.

**Corrections vs version initiale :** mapping nature→horizon documenté ; chemin découverte→carte via `buildHorizonEssayCandidates` ; sommeil rythme = `sleepRhythmAnalysis.js` ; journey `year` ≠ `long` + un kind ; caps / budget sommeil chiffrés ; statuts `DIAG_STATUS` exacts ; milestones sélectionnés à part (score ≥ 44) ; `2y` hors console.

---

## 1. Console de diagnostic

| Élément | Valeur |
| --- | --- |
| Composant | `src/components/dev/AnalysisEngineConsole.jsx` (+ `.css`) |
| Rapport | `buildAnalysisEngineDiagnosticReport` → `analysisEngineDiagnostic.js` |
| Modèle affichage | `analysisEngineDiagnosticModel.js` |
| Pipeline UI | `AnalysisEnginePipelinePanel.jsx` |
| Forensics | `buildFindingForensics` → `analysisEngineFindingForensics.js` |
| Accès | `import.meta.env.DEV \|\| isAdminUser(currentUser)` ; onglet App `dev-analysis-engine` ; lien Recap Analyse détails |
| Exécution | même `buildAdaptiveRecapInsights` que Recap, `collectDiagnostic: true` → **n’écrit pas** l’historique d’insights |
| Section initiale UI | `registry` (pas overview) |
| Relancer | reconstruit assessment + enrichment + adaptive ; compare optionnelle 2ᵉ période |
| Exports | `analysis-engine-diag-<period>-….json` / `.md` |
| Garmin | `useGarminData` + `useRecapCrossCoachGarmin` ; lookback max(start, end−89j) ; si `all`, start lookback 365 j. |

### 1.1 Périodes console (`DIAGNOSTIC_PERIODS`)

`today` · `7d` · `30d` · `3m` · `6m` · `1y` · `all`  

**Absent de la console :** `2y` (présent dans `PERIOD_QUESTIONS` / `getRecapDateWindow`, pas dans `DIAGNOSTIC_PERIODS`).

### 1.2 Fenêtres (`getRecapDateWindow`)

| Période | Fenêtre |
| --- | --- |
| `today` | 24 h glissantes (`mode: 'rolling-24h'`) |
| `7d` | 7 j. inclusifs |
| `30d` | 30 j. |
| `3m` | 92 j. |
| `6m` | 183 j. |
| `1y` | 365 j. |
| `2y` (hors console) | 730 j. |
| `all` | `start: null` → historique jusqu’à `end` |

### 1.3 Sections UI (`SECTIONS`)

| Id | Libellé | Contenu |
| --- | --- | --- |
| `overview` | Vue d’ensemble | Compteurs run, durée, warnings, Δ comparaison |
| `registry` | Registre | Candidats annotés (cartes ou table), filtres, détail forensics |
| `pipeline` | Pipeline | Stages + historique runs locaux |
| `data` | Données | Catalogue (`buildAnalysisEngineDataCatalog`) |
| `families` | Familles | Agrégats familles d’analyse |
| `correlations` | Corrélations | Matrice des corrélations **calculées** ce run |
| `gaps` | Absences | Trous selon instrumentation |
| `prose` | Texte final | Titres / corps retenus |
| `limits` | Limites | Groupes : données / traçabilité / logique / fiabilité / perf |

### 1.4 Filtres registre (`QUICK_FILTERS`)

`all` · `shown_now` · `intermediate` · `demoted` · `rejected` · `no_evidence` · `dupes` · `cross` · `unknown`

### 1.5 Statuts exclusifs (`DIAG_STATUS`)

| Id | Label UI | Sens (meta) |
| --- | --- | --- |
| `shown_now` | Affichée (run actuel) | Dans le pack final de **cette** exécution |
| `intermediate` | Candidate intermédiaire | Générée/retenue à une étape, pas affichée ce run (ex. `discovery_selected`, `produced`) |
| `demoted` | Déclassée / filtrée | Produite puis écartée (caps, rivaux, dédup, sélection) |
| `rejected` | Rejet / validation | Rejet explicite / insuffisance / erreur |
| `unknown` | Non déterminé | Non traçable (ex. `discovery_not_selected`) |
| `cross` | Transversale | Croise plusieurs familles (flag / filtre, pas un 6ᵉ « bucket » métier parallèle) |

Statuts bruts pipeline (avant map) : `shown`, `discovery_selected`, `discovery_dropped`, `discovery_not_selected`, `produced`, dédup / rankedOut / insufficient, etc. → `mapRawStatusToDiag`.

### 1.6 Forensics (RCA UI)

Onglets : `general` · `chain` · `raw` · `groups` · `discovery` · `evidence` · `copy` · `selection` · `json`.  
`general` empile les couches 1–6 (`FORENSIC_STACK`).  
But UI : localiser le défaut (données / calcul / découverte / rédaction / sélection).

---

## 2. Voix éditoriale et questions

Sources : `periodVoice`, `PERIOD_QUESTIONS` (`recapPeriodDiscoveries.js`).

| Période UI | `voice.key` | Unité typique | Question |
| --- | --- | --- | --- |
| `today` | `today` | séance | Qu'est-ce qui caractérise précisément cette séance par rapport à ce que je fais habituellement ? |
| `7d` | `week` | semaine | Qu'est-ce qui s'est réellement passé cette semaine, et comment se compare-t-elle à mon rythme habituel ? |
| `30d` | `month` | mois (« ces 30 jours ») | Comment mon entraînement récent évolue-t-il par rapport aux mois précédents ? |
| `3m` | `long` | trimestre | Quelle trajectoire suis-je réellement en train de construire ? |
| `6m` | `year` | semestre | Quelle trajectoire s’est réellement construite sur ces derniers mois ? |
| `1y` | `year` | année | … sur cette année ? |
| `2y` | `year` | deux années | … sur ces deux années ? |
| `all` | `year` | parcours | … depuis tes premières saisies ? |

Règle code supplémentaire : si `spanDays >= 180` sans id `3m`, bascule aussi `year`.  
`isLongVoice` = `long` ∨ `year`.

---

## 3. Trois axes (ne pas confondre)

| Axe | Valeurs | Fichier |
| --- | --- | --- |
| Période UI | `today`…`all` | sélecteur |
| Voix | `today`/`week`/`month`/`long`/`year` | `periodVoice` |
| Nature découverte | `now` / `trajectory` / `journey` | objet discovery |
| Horizon colonne | `short` / `medium` / `long` | UI Recap |

**Projection fixe** (`recapInsightNature.js`) :

| Nature | Horizon | Colonne |
| --- | --- | --- |
| `now` | `short` | Ce que tu as fait |
| `trajectory` | `medium` | Ce que ça change |
| `journey` | `long` | Ce qui a évolué |

---

## 4. Chemin d’une découverte jusqu’à l’affichage

```
detectDiscoveries (+ ms)
+ sleepRhythm (rewrite)
+ threads
+ gtg
    → scope fenêtre
    → selectPeriodDiscoveriesWithTrace
    → editorialGate → filterValidInsights → refill
    = periodDiscoveries.selected
         │
         ▼
buildHorizonEssayCandidates
  • pour chaque d ∈ selected : emit(reading)  id = relation.reading.<horizon>.<kind>[.factId]
  • puis essays génériques (sauf si discCoversNow / preferPeriodNow / …)
         │
         ▼
renderInterpretations → interpretationToLegacyCandidate
+ spanStories + relations companion
         │
         ▼
novelty / nature weights / boost familles
→ keepDistinctProofCards
→ filterValidInsights (2ᵉ fois, candidats colonnes)
→ selectNarrativeColumns(caps)
→ rescueStarvedFamilySlots
         │
         ▼
insights.shortTerm / mediumTerm / longTerm
```

Point critique : les discoveries **ne sont pas** injectées telles quelles dans les colonnes ; elles sont **ré-émises** comme readings d’essay (`type: 'coach_reading'`, id préfixé `relation.reading.…`).

---

## 5. Caps et budgets (sélection discoveries)

`SIGNAL_FAMILY_CAPS` (`recapInsightNature.js`) — max par nature × famille signal :

| Voix | now | trajectory | journey |
| --- | --- | --- | --- |
| `today` | sport 8, sleep 1, ms 1 | sport 8, sleep 1, ms **0** | sport 8, sleep **0**, ms 1 |
| `week` / `month` / `long` / `year` | sport 8, sleep 1, ms 1 | idem | idem |

`TOTAL_SLEEP_BUDGET` (toutes natures confondues) : `today: 1` · autres : `2`.

`signalFamilyOfKind` : `disc_ms_*` → milestone ; `disc_sleep_*` + `disc_rest_assoc` → sleep ; sinon sport.

**Colonnes UI** (`angleCapsFromFamilies` / `columnCapsForCandidates`) :  
somme sport+sleep+(milestone si jalon détecté dans `all` ou candidats).  
Sans jalon : typiquement **9** / angle ; avec jalon : **10** (`NATURE_COLUMN_CAPS` = 10 documente le cas avec jalons).

### 5.1 Règles `selectPeriodDiscoveriesWithTrace` (extraits)

- Tri : `informativeValue` puis `score` (score déjà × `memoryFactor`)
- Score &lt; **36** → drop (`score`) ; jalons : score &lt; **44**
- Dédup identité ; kind déjà pris sauf si `metrics.exerciseId`
- Rivaux : displace si Δ informativeValue ≥ **5**, sinon drop `rival` / `story_duplicate_composition`
- Famille × nature : max 2 si score &lt; 86
- Passe 1 : kinds de `PERIOD_DISCOVERY_PRIORITY[voice]`
- Passe 2 : reste trié
- Passe 3 : milestones à part (caps milestone)
- Sortie debug : `displaceLog`, `droppedBy`, `selectedInformative`

---

## 6. Priorité de sélection (`PERIOD_DISCOVERY_PRIORITY`)

Liste **ordonnée** (favoris), pas exhaustive.

### 6.1 `today`

- **now :** gtg_unplanned_now, pending_session, density, sleep_night, volume_shape, vs_habit, exercise_share  
- **trajectory :** gtg_unplanned_role, pending_context, sleep_combo/volume/perf/load/intensity/efficiency/family, composition_not_volume, muscle_reorient, structural_memory, stimulus_mix  
- **journey :** gtg_unplanned_progress, sleep_zones, anchor, sleep_freq, sleep_j2, repertoire, exercise_progress, freq_continuity, sleep_quarter, sleep_delayed  

### 6.2 `week` (`7d`)

- **now :** gtg_unplanned_now, pending_session, volume_shape, peak_day, density, sleep_week, sleep_night  
- **trajectory :** gtg_unplanned_role, pending_context, muscle_share_shift, exercise_base, push_pull, structural_memory, stimulus_mix, sleep_volume/perf/architecture/load/cardio/intensity/efficiency/family/assoc  
- **journey :** gtg_unplanned_progress, anchor, kcal_profile, repertoire, best_month, sleep_freq/zones/quarter/j2/delayed  

### 6.3 `month` (`30d`)

- **now :** gtg_unplanned_now, volume_shape, density, muscle_now  
- **trajectory :** gtg_unplanned_role, muscle_share_shift, family_fade, cardio_strength, stimulus_mix, sleep_month/perf/load/cardio/intensity/rpe/efficiency/family/architecture  
- **journey :** gtg_unplanned_progress, best_month, exercise_progress, quarter_profile, sleep_zones, sleep_j2  

### 6.4 `long` (`3m`)

- **now :** gtg_unplanned_now, volume_shape, muscle_now, density  
- **trajectory :** gtg_unplanned_role, sleep_volume/perf/combo/cardio, cardio_strength, muscle_share_shift, sleep_architecture, family_fade  
- **journey :** gtg_unplanned_progress, sleep_quarter, best_month, sleep_freq, sleep_delayed, **sleep_j2**, quarter_arc  

### 6.5 `year` (`6m` / `1y` / `all`…)

- **now / trajectory :** = `long`  
- **journey :** gtg_unplanned_progress, sleep_quarter, best_month, **exercise_progress**, sleep_freq, sleep_delayed, quarter_arc  
  → **pas** `sleep_j2` ; **ajoute** `exercise_progress` par rapport à `long`.

---

## 7. Conditions de génération (seuils code)

`emptyPeriod` = `totalReps < 20`.

### 7.1 Repos / pending

| Kind | Conditions |
| --- | --- |
| `disc_rest_day` | empty + today + `describeRestDay` |
| `disc_pending_session` | empty + pas rest |
| `disc_pending_context` | pending + contexte d7/d30 |

### 7.2 Volume / rythme

| Kind | Conditions |
| --- | --- |
| `disc_calendar_rhythm` | `!today` + `describeCalendarShape` |
| `disc_density` | (today∨week) + reps/h + minutes ≥ 20 + (vs30∨vs7) |
| `disc_volume_shape` | (today∨week) **ou** month∧reps≥200 **ou** longVoice∧jours≥8∧reps≥400 |
| `disc_peak_day` | peakDay + trainingDays≥2 + share≥28 % |
| `disc_kcal_profile` | activeKcal≥400 + (week∨month) |

### 7.3 Composition / stimulus

| Kind | Conditions |
| --- | --- |
| `disc_muscle_now` | ≥2 groupes, ≥80 reps identifiées |
| `disc_push_pull` | push≥80 et (push &gt; pull×1.6 **ou** share pull &lt; 18 %) |
| `disc_muscle_reorient` | lead ofMonthPct ≥ 18 % |
| `disc_no_running` | km/min course ≈ 0 + reps≥80 |
| `disc_cardio_strength` | scope running+strength fenêtre |
| `disc_family_fade` / `muscle_share_shift` / `stimulus_mix` / `structural_memory` | gates voix week/month/long (+ sources d30 si today/week) |

### 7.4 Exercices / trajectoire

| Kind | Conditions |
| --- | --- |
| `disc_exercise_share` | today∨week + part mensuelle mouvement |
| `disc_exercise_base` | week + ≥3 exercices + peakDay |
| `disc_emergence` / `disc_exercise_progress` | + évent. `buildExerciseTrajectory` → metrics `trajectoryOk`… |
| `disc_comparable` / `disc_vs_habit` | baselines / habit |

### 7.5 Sommeil

**Producteurs :** branches dans `detectDiscoveries` + `buildSleepRhythmDiscoveries` (`sleepRhythmAnalysis.js`) + `rewriteSleepDiscoveries` (`recapAnalysisProofs.js`).

Kinds `disc_sleep_*` : architecture, assoc, cardio, combo, deep, delayed, drift, efficiency, family, freq, intensity, j2, load, month, night, perf, quarter, reference, regularity, rhythm_habit, rhythm_obs, rpe, tolerance, volume, week, weekend, zones.

Exemples de gates temporels : night/volume courts → today/week ; week → week ; month/rpe → month ; cardio → week/month/long ; plusieurs assoc en `historical_explicit` (`KIND_SCOPE`).

### 7.6 Jalons `disc_ms_*` (`recapMilestoneEngine.js`)

first_session / first_exercise / first_run / first_hour / first_load · return / return_run / return_gtg / return_durable · day_volume · cumul · sessions / km / hours · pr / pr_consolidated / pr_density / pr_pace / pr_load · week_freq · weight · goal / goal_run / goal_weight · sleep_combo · regime · mix_shift · event_combo.

Append : fin de `detectDiscoveries` via `appendMilestoneDiscoveries`. Éligibilité : `eligible(date, window, voiceKey)`.

### 7.7 GTG (`recapGtgUnplannedReading.js`)

| Kind | Nature |
| --- | --- |
| `disc_gtg_unplanned_now` | now |
| `disc_gtg_unplanned_role` | trajectory |
| `disc_gtg_unplanned_progress` | journey |

### 7.8 Threads (`recapAnalysisThreads` + `buildThreadDiscoveries`)

Fils dossiers sport : concentration, rhythm, composition, repertoire, pushPull, series, continuity.  
Sens → nature : fact→now, relation→trajectory, transformation→journey.  
Kind produit : `disc_th_<thread>_<nature>` (ex. `disc_th_concentration_now`).  
Voix dossiers : `today`, `7d`, `30d`, `3m`, `6m`, `1y`.  
Fils sommeil (placement / regularity / link) : utilisés surtout au **rewrite** des cartes rythme, pas comme grille dossiers période.

### 7.9 Autres

`disc_steps_level`, `disc_steps_split`, `disc_rest_assoc`, `disc_best_month`, `disc_anchor`, `disc_repertoire`, `disc_freq_continuity`, `disc_quarter_*`, `disc_ratio_structure`, `disc_composition_not_volume`.

---

## 8. Rivaux et scope

### 8.1 `COMPOSITION_STORY_KINDS`

`disc_muscle_now`, `disc_push_pull`, `disc_ratio_structure`, `disc_muscle_share_shift`, `disc_muscle_reorient` — une seule carte du groupe.

Autres rivaux : anchor↔freq_continuity ; quarter_arc↔quarter_profile ; exercise_share↔repertoire ; family_fade↔emergence ; blocs sleep assoc ; blocs sleep rythme ; gtg now↔role.  
`CROSS_NATURE_RIVALS` : rivaux aussi hors même nature.

### 8.2 `KIND_SCOPE` (complet)

| Kind | Activities | Mode |
| --- | --- | --- |
| `disc_sleep_cardio` | running, sleep | window |
| `disc_cardio_strength` | running, strength | window |
| `disc_no_running` | strength | window |
| `disc_sleep_volume` / assoc / intensity / perf / rpe / combo / family / delayed / load / j2 / quarter | sleep[+strength] | historical_explicit |
| `disc_sleep_architecture` / efficiency / zones | sleep | historical_explicit |
| `disc_sleep_month` / week / night / deep / freq | sleep | window |

Drops : `no_running_in_window`, `no_sleep_in_window`, `no_strength_in_window`.  
Kinds sans entrée KIND_SCOPE : scope défaut `{ activities: [], mode: 'window' }` → passent le gate.

---

## 9. Mesures de comparaison (`buildPeriodComparisons`)

Toujours calculées pour le bundle : `period`, `d7`, `d30`, `d90`, `prev30`, `prevSameLength`, `first30`, `voice`, `question`, `periodId`, `identity`.

---

## 10. Inventaire live (procédure)

Pour chaque id `DIAGNOSTIC_PERIODS` : Relancer → noter overview → kinds `shown_now` → pipeline → 2–3 forensics → export.  
Comparer deux périodes via sélecteur comparaison.

---

## 11. Fichiers liés console

`AnalysisEngineConsole.jsx/.css` · `AnalysisEnginePipelinePanel.jsx` · `analysisEngineDiagnostic.js` · `analysisEngineDiagnosticModel.js` · `analysisEngineDataCatalog.js` · `analysisEngineFindingForensics.js` · `analysisEngineCopyProvenance.js` · `analysisEnginePipelineModel.js`

---

## 12. Documents liés

- **Capture live console 30d** : [`console de dev/CAPTURE-LIVE-CONSOLE-30d-2026-10-30.md`](./console%20de%20dev/CAPTURE-LIVE-CONSOLE-30d-2026-10-30.md) — 71 registre / 15 affichées / familles / déclassées + chiffres  
- [`ARCHITECTURE-FONCTIONNEMENT-MOTEUR-ANALYSES-2026-10-30.md`](./ARCHITECTURE-FONCTIONNEMENT-MOTEUR-ANALYSES-2026-10-30.md)  
- [`ETAT-AVANCE-PROFONDEUR-CONTENU-2026-10-29-2227.md`](./ETAT-AVANCE-PROFONDEUR-CONTENU-2026-10-29-2227.md)  
- [`console de dev/RAPPORT-CONSOLE-DIAGNOSTIC.md`](./console%20de%20dev/RAPPORT-CONSOLE-DIAGNOSTIC.md)

---

*Inventaire — 30/10/2026 — révision vérifiée.*
