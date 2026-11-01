# F1 — Audit transversal de profondeur, cohérence et qualité réelle  
**2026-11-01** — Lot unique autorisé. Aucune modification fonctionnelle. Aucun commit.

## Verdict

Le moteur **calcule déjà** la plupart des briques nécessaires à des analyses de niveau Exemple A/B (totals, sets trusted, baselines, arcs, coexistence GTG, weekday P3.6). Ce qui manque n’est **pas** un second moteur ni une ribambelle de kinds : c’est (1) la **composition** multi-faits, (2) des **contrats** temps/dénominateurs, (3) une **sélection E0** qui laisse passer densités/ancrages/PR faibles, (4) une **copy/format** fragile. Sur fixture, 133 littéraux `disc_*` scannés, **47** atteignent le pool 7d∪30d∪3m ; le pack 7j sélectionne encore des cartes superficielles alors que des signaux plus riches existent dans le pool ou les droppés.

---

## 1. Pipeline réel (code)

Confirmé dans `buildComposedInterpretationPipeline` / `buildPeriodDiscoveryBundle` / `selectPeriodDiscoveriesWithTrace` :

`getRecapDateWindow → buildAdaptiveRecapInsights → buildComposedInterpretationPipeline → buildPeriodDiscoveryBundle → selectPeriodDiscoveriesWithTrace (E0) → buildHorizonEssayCandidates → renderInterpretations → selectNarrativeColumns → UI Recap`

Bundle extras notables : catalog, sleepContext, sleepCandidates, P3.2b / P3.5 / P3.6, program adherence, milestones, GTG unplanned, period comparisons.

**Console** (`AnalysisEngineConsole`) et **UI** (`RecapAnalyseView` / `RecapAnalyseDetails`) consomment le même pack ; Details ajoute aussi lignes « jours avec activité » via `countTrainingDaysInRange` (contrat distinct des cartes).

---

## 2. Inventaire producteurs / kinds

Voir **[REGISTRE-KINDS-F1-2026-11-01.md](./REGISTRE-KINDS-F1-2026-11-01.md)** + JSON `fixtures/f1-audit-kinds-replay.json` (script `scripts/f1-audit-kinds.mjs`).

### Familles atteintes fixture (exemples)

| Famille / module | Kinds typiques | Sources | Périodes |
| --- | --- | --- | --- |
| Period core | density, calendar_rhythm, anchor, volume_shape, quarter_* | snapshot reps + fenêtre | toutes ; quarter souvent hors sujet 7j |
| Exercice | vs_habit, exercise_progress, exercise_share, emergence, repertoire | reps + setLogs + baselines | compare souvent habit/arc hors fenêtre |
| Muscle | muscle_now, share_shift, reorient, P32b exposure/limits | ledger / parts | |
| Milestone | ms_pr, ms_return*, ms_sessions, ms_cumul | seuil / gap / PR | |
| P3.5 | gtg_coexistence, movement_share, … | classic exclusive vs GTG | |
| P3.6 | weekday_regularity, volume weekday, habit_stability, … | eligible weekday rates | 7j souvent non publiable |
| Sleep | rhythm_*, assoc_* | Garmin nights | **absents fixture** (pas Garmin) |
| Program | freq_progress_*, plan_* | adherence / plan | methodology fréquent |
| GTG unplanned | gtg_unplanned_now/role | gtg days | |

### Kinds morts / bruit

- Préfixes regex : `disc_ms_`, `disc_gtg_`, `disc_p35_`, `disc_p36_`, `disc_sleep_` → **non publiables**.
- ~86 source-only : milestones conditionnels, sleep, running PR, P32b contrast, etc. — **pas tous morts**, souvent non déclenchés sur ce snapshot.

### Chemin rendu

Discovery → (gate éditorial / validation) → E0 selected → essay optionnel → `renderInterpretationText` → prose marks → JSX colonnes nature→horizon.

### Rivaux E0 (extrait code)

`DISCOVERY_RIVALS` / `CROSS_NATURE_RIVALS` : muscle story ; anchor↔freq_continuity ; quarter_arc↔profile ; exercise_share↔repertoire ; family_fade↔emergence ; clusters sleep ; gtg unplanned ; P35/P36 groups ; habit_stability↔anchor/freq. **Manque** rivalité large emergence↔ms_return*.

Caps : `SIGNAL_FAMILY_CAPS` sport-heavy ; `TOTAL_SLEEP_BUDGET` ; methodology → reliability notes.

---

## 3. Données & raisonnements

Matrice détaillée : **[MATRICE-CAPACITES-RAISONNEMENT-F1-2026-11-01.md](./MATRICE-CAPACITES-RAISONNEMENT-F1-2026-11-01.md)**.

Synthèse : **sets par série accessibles** (`exerciseSetLogs` → `readTrustedSessionSets`) mais sous-exploités pour un récit type A ; **cousins push** calculables mais non contrastés automatiquement ; **physio / causalité sommeil** non démontrables (correct).

---

## 4. Profondeur vs exemples A / B

| Exemple | Données | Déjà calculé | Trou | Effort |
| --- | --- | --- | --- | --- |
| A déclinées | totals+sets+cousins | vs_habit, progress, freq_decline | composition + copy + preuve | F3/F4 |
| B hyperextensions | sets×reps + continuité | emergence ≈ 60–70 % | labels volume vs perf ; anti-physio | F3/F4 |

---

## 5. Périodes & sommeil

| Période console | Voice / bundle | Notes |
| --- | --- | --- |
| Aujourd’hui | today | focusDate = end |
| 7j | week | Journey −91j et habit 30j peuvent **fuir** dans le texte |
| 30j | month | |
| 3m+ | long | quarter_* légitimes |
| 6m / 1an / 2ans / toujours | year/long variants | Caps year dérivés long |

Producteurs à fenêtre fixe fréquents : habit baselines, journey 91j, quarter profile/arc, sleep journey facts.

**Sommeil :** `extractSleepNight(garmin, ymd)` — nuit = métriques du jour `ymd`. `extractSleepNightsInWindow` borne la fenêtre ; associations séance↔nuit via catalog. Objectif F1 : **aucune nuit hors période sans label historical_explicit + date FR**. Défaut live « nuit associée » = D05.

---

## 6. Contrats de dénominateurs (ne pas corriger ici)

| Libellé apparent | Calcul A | Calcul B | Légitime ? | Harmoniser |
| --- | --- | --- | --- | --- |
| Jour entraîné | `dayCountsAsCalendarTrainingDay` | days with reps / classic exclusive P35 | Souvent **non** | Glossaire F2 |
| strengthDays vs trainingDays | Log reject `strength_days_gt_training_days` 30d/3m | — | Bug contrat | F2 |
| Reps classiques exclusives | P3.5 | Totals reps bruts ailleurs | Oui si libellé clair | Copy |
| Volume pondéré vs brut | muscle ledger vs reps | | Oui | Explicit |

---

## 7–8. Cartes réelles & E0

Voir **[AUDIT-CARTES-REELLES-F1-2026-11-01.md](./AUDIT-CARTES-REELLES-F1-2026-11-01.md)** et catalogue **[CATALOGUE-DEFAUTS-F1-2026-11-01.md](./CATALOGUE-DEFAUTS-F1-2026-11-01.md)**.

Replay fixture : 7d 31→12 ; 30d 43→19 ; 3m 52→21.

---

## 9. Formats / coloration

Central actuel : `recapProseMarks.segmentRecapProseValues` (regex). Limites : ISO non couverts ; noms d’exos non markés ; durées multi-tokens fragiles. Proposition structurée → F4 (non implémentée).

---

## 10. Performance (observation)

| Mesure | Valeur |
| --- | --- |
| Bundle fixture 7d / 30d / 3m | ~468 / 1014 / 1819 ms |
| Rapport v0 temps perçu | ~13 s (adaptatif dominant) |
| E0 | Inclus ; pas le goulot principal |

Protocole F6 dans **[FEUILLE-ROUTE-F2-F7-2026-11-01.md](./FEUILLE-ROUTE-F2-F7-2026-11-01.md)**.

---

## 11. Livrables

| | Document |
| --- | --- |
| A | Ce rapport |
| B | REGISTRE-KINDS-F1-2026-11-01.md |
| C | MATRICE-CAPACITES-RAISONNEMENT-F1-2026-11-01.md |
| D | CATALOGUE-DEFAUTS-F1-2026-11-01.md |
| E | AUDIT-CARTES-REELLES-F1-2026-11-01.md |
| F | FEUILLE-ROUTE-F2-F7-2026-11-01.md |
| Artefact | fixtures/f1-audit-kinds-replay.json ; scripts/f1-audit-kinds.mjs |

---

## 12. Critères de fin F1 — checklist

1. Producteurs atteignables inventoriés — **oui** (registre + replay).  
2. Kinds ↔ données/métriques — **oui** (registre + matrices ; détail evidenceKeys dans JSON).  
3. Raisonnements manquants — **oui** (matrice A/B).  
4. Comparaisons temporelles — **oui** §5.  
5. Contradictions dénominateurs — **oui** §6 + D08.  
6. Textes faibles expliqués — **oui** audit cartes + défauts.  
7. E0 traçable — **oui** dropped reasons replay.  
8. Formats/couleurs localisés — **oui** §9.  
9. Coûts cartographiés — **oui** §10.  
10. Plan F2–F7 fondé code — **oui**.  
11. Comportement produit inchangé — **oui** (scripts/docs only).  
12. Aucun commit — **à respecter** (non effectué par cet audit).

---

## Conclusion opérationnelle

**Autoriser F2** (contrats) puis quick-wins F4 et profondeur F3 avant tout retune E0 massif (F5). Ne pas ouvrir de nouveaux kinds tant que A/B ne sont pas atteignables par composition des producteurs existants.
