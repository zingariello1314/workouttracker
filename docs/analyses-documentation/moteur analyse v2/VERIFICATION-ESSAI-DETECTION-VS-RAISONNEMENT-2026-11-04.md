# Vérification contradictoire — « Détection vs raisonnement »

**Date :** 2026-11-04  
**Objet :** Infirmer ou confirmer, avec preuves code + exports + UI, l’essai qui affirme que Momentum Sport détecte des faits mais ne construit pas encore une compréhension de phénomènes.  
**Sources de preuve :**

| Source | Détail |
|---|---|
| Code (graft) | `recapInterpretationPipeline.js`, `recapComposedEvidence.js`, `recapComposedNarration.js`, `exerciseTrajectoryAnalysis.js`, `recapPeriodSelection.js`, `recapEditorialSelection.js`, `recapVolumeQuestion.js`, etc. |
| Export live | `C:/Users/zinga/Downloads/analysis-engine-diag-comparison-30d-vs-7d-1793758946546.json` — période 30d, **4 889** reps vs **3 731**, pack **15** cartes montrées / **30** produites |
| Navigateur (complété) | `http://localhost:3001` → Sport → **Recap** → **Analysis** → période **30 days** (6 oct. → 4 nov. 2026). Session connectée (`zingariello1314`). Captures a11y + screenshots 2026-11-04 ~04:13–04:14. Pack UI live : **4 502** reps / **13–14** jours vs **3 731** (**+20,7 %**) — même fenêtre que l’export « A » incomplet, pas le snapshot 4 889. |

**Légende des verdicts**

| Verdict | Signification |
|---|---|
| **CONTREDIT** | L’affirmation est fausse face au code / aux exports |
| **PARTIEL** | Vrai en partie ; caricature trop forte, ou vrai sur le produit publié mais faux sur le code latent |
| **CONFIRMÉ** | Aligné avec le comportement observé |
| **HORS PÉRIMÈTRE** | Affirmation générale non spécifique à Momentum |

---

## Verdict global

L’essai a **raison sur le diagnostic de maturité** (synthèse, sélection informative, contrats stables), mais **surestime le vide architectural**. Momentum n’est plus un simple pipeline « détecteur → phrase → carte ». Une couche composée (attribution volume, continuité, narration F4, contrat de phénomène, IV éditoriale) **existe et publie déjà**. Elle **ne domine pas** encore le pack : des cartes génériques gagnent encore contre des lectures plus analytiques déjà calculées.

En une phrase : **ce n’est pas « il n’y a que des détecteurs » ; c’est « le raisonnement existe en silos et perd souvent la sélection ».**

---

## 0. Preuve navigateur — Récap Analysis (complété)

**Parcours UI :** Sport (onglet) → Recap → Analysis (menu latéral) → période **30 days**.

**En-tête observé :** *Period recap — 30 days : mardi 6 octobre 2026 → mercredi 4 novembre 2026* · badge agrégat **REPS 4 502**.

### Cartes d’analyse réellement affichées (extrait a11y + screenshot)

| # | Titre UI | Corps / preuves visibles | Lien avec l’essai |
|---|---|---|---|
| 1 | *Certains jours, le Grease the Groove ne tient que par un passage hors planning* | 6 passages hors planning, 38 reps | Détecteur isolé (GTG) |
| 2 | *Relevés de genoux aux parallèles **revient** après un long silence* | Reprise après **42 j.** · 40 reps · ~2×20 | Facette reprise A |
| 3 | *Les séances commencées restent souvent incomplètes* | réalisé ~50 %, alignement ~34/100 | Constat programme |
| 4 | *Le volume de ces 30 jours dépasse la période précédente* | **4 502** vs **3 731** (**+20,7 %**) · ~322 vs 267 reps/séance · footer « 4 502 VS 3 731 » | Cas volume de l’essai — **sans thèse attributive** |
| 5 | *GTG hors séances classiques* | 2/18 jours sans séance classique | Détecteur isolé |
| 6 | *Ces 20 reps sont devenues ton niveau récemment reproductible* | série 20 reps sur 5/5 dernières séances | Mémoire / baseline |
| 7 | *Jalon sous une de tes meilleures nuits (9 h 39)* | 30 oct. 2026 · coïncide reprise pompes déclinées | Event combo sommeil |
| 8 | *Relevés de genoux aux parallèles **reviennent** après une interruption* | Réapparition après **77 j.** · format **2 × 20** stable · retour ponctuel | Facette reprise B (**doublon sémantique**) |
| 9 | *Pompes inclinées sur support : moins de répétitions par séance* | 8 séances · 52 → 40 (−23,1 %) · séries ~4 stables · baisse surtout reps/série | Trajectoire + mécanisme séries |
| 10 | *Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ* | creux ≈10 (1 oct.) puis retour ≈36 · tag arc recovered | Forme de trajectoire (pas seulement early/late) |
| 11 | *octobre 2026 … part la plus productive* | 4 084 reps · 90,7 % de la fenêtre | Portrait calendaire |

**Repères / Vision coach (même page, hors pack Period recap) :** consolidation `4×10` Pompes déclinées, tonnage 11 t, benchmarks course/force — confirment l’usage des **formats de séries** hors totaux.

### Ce que le navigateur tranche définitivement

1. **§2 / §12 (volume)** — CONFIRMÉ côté produit : la carte dominante reste le constat +31 % / +20,7 %, pas « surtout densité vs fréquence ».
2. **§5 (doublons)** — CONFIRMÉ côté produit live : **deux cartes** sur le même mouvement (42 j **et** 77 j), malgré `sameHistoricalEpisode` dans le code. L’export B (4 889) avait mieux filtré ; le pack UI 4 502 **pas**.
3. **§3 (trajectoires)** — PARTIEL contredit : la carte *recul puis retour* montre une vraie lecture de forme.
4. **§4 (séries)** — PARTIEL contredit : `2 × 20`, `4×10`, « reps/série ~15 → 10 » apparaissent dans l’UI.
5. **Écart 4 502 vs 4 889** — le Récap live aligne l’export A (journée 2026-11-02 incomplète / absente) ; l’essai citait le total 4 889 de l’export B.

---

## 1. Pipeline de détection vs système de raisonnement

### Affirmation de l’essai
Architecture ≈ données → détecteurs indépendants → candidats narrés → dédup/scores → cartes. La narration arriverait **directement après la détection**, pas après compréhension.

### Preuves contre (architecture réelle plus riche)

Le pipeline composé construit déjà un **état**, des **phénomènes**, des **événements**, des **relations**, puis des découvertes de période :

```57:120:src/utils/sport/recapInterpretationPipeline.js
function buildComposedInterpretationPipelineSync(opts = {}) {
  // ...
  const trainingState = perf.measure('trainingState', () =>
    buildUserTrainingState({ ...mergedOpts, period: opts.period || '7d' })
  );
  // priorState, stateTransitions, performanceRobustness, athleteIdentity, athleteJourney
  const phenomena = buildTrainingPhenomena({
    features: trainingState?.features,
    identity: athleteIdentity,
    goal: trainingState?.context?.goal
  });
  const periodDiscoveries = perf.measure('periodDiscoveries', () =>
    buildPeriodDiscoveryBundle({ /* ... */ })
  );
  const eventBundle = detectTrainingEvents({ ...mergedOpts, performanceRobustness });
  // detectTrainingRelations(trainingState, eventBundle, relationMeta)
```

`buildAdaptiveRecapInsights` **appelle** ce pipeline avant la sélection (`precomputedComposed` ou `buildComposedInterpretationPipeline`).

La narration composée arrive **après** un objet `composedEvidence` (constat / mécanisme / scope / implication) :

```544:590:src/utils/sport/recapComposedNarration.js
export function narrateFromComposedEvidence(composed, discovery = {}, { getExerciseNameById = null } = {}) {
  // ...
  const constat = buildObservation(composed, name, lexicon, discovery);
  const mechanism = buildMechanism(composed, dir);
  const continuity = buildContinuityNote(composed);
  // ...
  const reading = composeAnalyticalReading({
    titleThesis: title,
    constat: constat ? capitalizeSentence(constat) : null,
    mechanism: mechanism ? capitalizeSentence(mechanism) : null,
    scope: scope ? capitalizeSentence(scope) : null,
    implication: implication ? capitalizeSentence(implication) : null,
    limit: limit ? capitalizeSentence(limit) : null
  });
```

### Preuves pour (le schéma simplifié reste utile sur le pack publié)

Export 30d — **15** cartes `shown` :

| Avec `composedEvidence` | Avec trajectoire | Avec attribution volume | F4 narration `used: true` |
|---:|---:|---:|---:|
| **8 / 15** | **8 / 15** | **4 / 15** | **5 / 15** |

Donc **près de la moitié** des cartes publiées n’empruntent pas la voie « compréhension → narration ». Des kinds comme `disc_gtg_unplanned_now`, `disc_ms_pr`, `disc_rhythm_streak`, `disc_sleep_drift`, `disc_volume_shape` restent dans le modèle « détecteur → texte ».

### Verdict §1 — **PARTIEL**
L’architecture **cible** de l’essai (étapes 1→7) est déjà **ébauchée** dans le code. Elle n’est **pas le chemin unique** vers la publication. La caricature « uniquement des détecteurs » est **contredite** ; le constat « la narration précède souvent encore la synthèse globale » reste **confirmé** pour une part majeure du pack.

---

## 2. Volume superficiel (+31 %) et absence de décomposition

### Affirmation
Sur 4 889 vs 3 731 (+31 %), le moteur s’arrêterait au pourcentage sans expliquer séances vs densité ; il manquerait un mécanisme systématique d’explication des variations et une structure « explications soutenues / écartées ».

### Preuve que le cas existe bel et bien

**Navigateur (Recap → Analysis → 30 days) — screenshot + a11y :**

- Titre : *« Le volume de ces 30 jours dépasse la période précédente »*
- Corps : *4 502* reps / *14* jours vs *3 731* / *14* (+**20,7 %**) · ~**322** vs **267** reps/séance
- Footer carte : `4 502 VS 3 731 (+20.7%)`
- **Aucune** phrase du type « surtout parce que… séances / contenu des séances »

**Export B** (même titre, autre snapshot) :

- Corps : *4 889* reps / *15* jours vs *3 731* / *14* (+**31,0 %**, fréquence **+7,1 %**, **326 vs 267** reps/séance)

Math indépendante :

| Leviers | Valeur |
|---|---|
| Δ total | +31,0 % |
| Δ fréquence (jours) | +7,1 % (14 → 15) |
| Δ densité (reps/séance) | **+22,3 %** (267 → 326) |

Donc le cas de l’essai est **réel**. La carte globale publiée **cite** les deux leviers mais **n’en tire pas de thèse** (« surtout densité » vs « surtout fréquence »).

### Preuve que la décomposition existe déjà (exercice + span)

Attribution type \(V \approx N \times \overline{V}\) :

```17:74:src/utils/sport/recapComposedEvidence.js
export function classifyVolumeAttribution({ windowSessionCount, prevSessionCount, meanPerSession, prevMeanPerSession, windowTotal, prevComparable } = {}) {
  // ...
  // Hausse de total surtout via fréquence (séances ↑, volume/séance ≈ stable)
  if (freqMovedUp && totalPct != null && totalPct >= 15 && perNear) {
    return {
      kind: 'frequency_driven_total_rise',
      stance: 'probable',
      detail: `Le total de la période augmente surtout parce que tu as pratiqué plus souvent (...)`,
      metrics: { sessionDelta, perSessionPct, totalPct, windowSessionCount, prevSessionCount }
    };
  }
```

**Cartes publiées** qui utilisent déjà cette logique :

- *« Dips parallèles : le total monte surtout parce que tu t’entraînes plus souvent »* — `frequency_driven_total_rise` (5 → 7 séances, ≈31 → ≈30 reps/séance)
- *« Pompes inclinées mains sur banc : le total monte surtout parce que tu t’entraînes plus souvent »* — idem (1 → 3)

Lecture **globale** densité vs fréquence — **déjà produite** mais **non montrée** :

- Kind produit : `span_volume_vs_frequency`
- Titre : *« Le volume bouge surtout à l’intérieur des séances »*
- Corps : *« La variation vient surtout du contenu des séances (+22 % par séance), la fréquence bouge de +7 %. »*

Code source de cette lecture :

```34:96:src/utils/sport/recapVolumeQuestion.js
export function evaluateVolumeChange(ctx) {
  // volRel, freqRel, perRel ...
  const fromFrequency = Math.abs(freqRel) >= Math.abs(perRel) + 8;
  const driver = fromFrequency
    ? `La variation vient surtout du nombre de séances (...)`
    : `La variation vient surtout du contenu des séances (${sign(perRel)} par séance), la fréquence bouge de ${sign(freqRel)}.`;
```

### Preuve que le dossier « hypothèses concurrentes » manque

Recherche exhaustive graft : **aucun** symbole `supportedExplanations` / `rejectedExplanations` / `competingHypothes` / « explications soutenues|écartées ».  
Les relations (`detectTrainingRelations`) produisent des **candidats relationnels**, pas un objet phénomène avec hypothèses confrontées et écartées.

### Verdict §2 — **PARTIEL** (fort côté « pack », faible côté « code absent »)
- **CONTREDIT** : « il manque probablement une formule / un mécanisme de décomposition » — le mécanisme **existe** (`classifyVolumeAttribution`, `evaluateVolumeChange`) et **publie** déjà au niveau exercice.
- **CONFIRMÉ** : au niveau **période globale**, la carte dominante reste descriptive (+31 %) alors qu’une lecture attributive **meilleure** a été calculée puis **écartée** de `shown`.
- **CONFIRMÉ** : pas de structure systématique « explications soutenues / écartées / incertitudes » comme dossier unique.

Note : l’exemple « lecture cible » de l’essai (§12) suppose une hausse **portée par la fréquence**. Sur **ces** données réelles, le driver global est la **densité** (+22 % vs +7 %). Le moteur span le dit correctement — quand on le laisse parler.

---

## 3. Trajectoires mal comprises

### Affirmation
`buildExerciseTrajectory` + moyennes early/late ne suffisent pas ; il manquerait une lecture de la **forme** (progressive vs outlier, confirmation de la dernière séance, variabilité, interruption).

### Preuves contre

`classifyShape` encode déjà outlier, monotonie, plateau, creux/rebond, `primaryStory` :

```158:220:src/utils/sport/exerciseTrajectoryAnalysis.js
function classifyShape(sessionTotals, sessionMeta = []) {
  // atypicalIndex si v >= med*1.8 ou <= med*0.4
  // monotoneDown / monotoneUp → steady_decline / steady_rise
  // plateau, decline_phases, rise_phases
  // hasTrough → decline_then_full_recovery / partial_recovery
```

`classifyContinuity` relie forme + mécanisme de séries + installation (retour ponctuel / confirmé, outlier isolé, format consolidé) — `recapComposedEvidence.js` L103–170.

Export : cartes avec `trajectoryOk` + `early`/`late` + `setMech` (`stable_format`, `same_sets_more_reps`, `same_sets_fewer_reps`).

**Navigateur :** carte *« Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ »* — creux ≈10 puis retour ≈36, tag recovered. Ce n’est **pas** une simple comparaison de deux moyennes.

### Preuves pour

Sur `disc_ms_return` Pompes déclinées (export) : continuity `unclear` + `path=fluctuation` alors que le corps raconte une reprise après 28 j — la **forme** ne porte pas toujours l’épisode.  
Deux moyennes (early≈36, late≈36) coexistent avec une attribution `per_session_driven_decline` : les couches ne racontent pas toujours la **même** histoire.

### Verdict §3 — **PARTIEL**
L’essai sous-estime ce qui est déjà dans `classifyShape` / continuity **et dans l’UI** (creux→reprise). Il a raison que **multiplier les repères** sans imposer une histoire unique cohérente produit encore des lectures floues ou contradictoires.

---

## 4. Séries insuffisamment exploitées

### Affirmation
Raisonnement trop souvent sur totaux agrégés ; les séries devraient être des observations analytiques (ex. 10+10+10+10 vs 16+12+8+4).

### Preuves contre

- Résolution série → schéma : `resolveExerciseSetsForAnalysis` produit `n×r` ou `n séries (a+b+…)` si non uniforme (`exerciseSessionSetsResolver.js` L153–219).
- Mécanisme early/late de format : `classifySetMechanism` (`exerciseTrajectoryAnalysis.js` L334–468).
- Lexique « performance » vs « volume enregistré » selon séries trusted + peers : `resolveVolumeLexicon`.
- Export — retour Pompes déclinées : *« D'habitude, 5 séries de 10… Cette séance: 4 séries (10, 10, 10, 6) »* — exactement le niveau série comme preuve.
- **Navigateur :** *format 2 × 20* (reprise relevés), *4×10 maintenu* (Pompes déclinées, Repères), *reps/série ~15 → 10* (Pompes inclinées sur support).

### Preuves pour

- Pas d’analyse systématique de **dispersion intra-séance** comme phénomène (fatigue) — et le code d’inférence `inferFatigueFallbackDistribution` sert à **reconstruire** des séries manquantes, pas à diagnostiquer la fatigue réelle.
- Beaucoup de cartes `shown` sans `setMech` ; granularité souvent `totals_only` / partielle.

### Verdict §4 — **PARTIEL**
Les séries **sont** déjà des preuves dans plusieurs lectures (reprises, progress). Elles ne sont **pas** encore un niveau d’observation premier pour *toutes* les familles, ni un modèle de structure intra-séance généralisé.

---

## 5. Cartes qui se répètent malgré la déduplication

### Affirmation
Dédup textuelle ; plusieurs facettes d’une même reprise (retour / format / fréquence) restent séparées ; il faudrait un graphe « même histoire ».

### Preuves contre (sélection déjà sémantique / phénoménale)

```64:86:src/utils/sport/recapPhenomenonContract.js
export function buildPhenomenonRecord(d) {
  // id = sujet|classe|mécanisme (sans kind — deux kinds peuvent être le même phénomène)
```

```595:620:src/utils/sport/recapEditorialSelection.js
export function editorialCanTake(d, selectedList, voiceKey = 'week') {
  const phenRival = findPhenomenonRival(d, selectedList);
  // ...
  return { ok: false, reason: 'phenomenon_rival', ... };
```

`sameHistoricalEpisode` fusionne explicitement reprises 42 j / 77 j sur le même mouvement (`recapEditorialIdentity.js` L164–186).  
`selectPeriodDiscoveriesWithTrace` : collapse identité → collapse phénomène → un seul épisode de retour par exercice (`recapPeriodSelection.js` L473+).

Export B (4 889) : pas trois facettes pompes inclinées simultanées.  
**UI live (4 502) — preuve navigateur directe du scénario de l’essai :**

| Carte A | Carte B |
|---|---|
| *Relevés de genoux aux parallèles **revient** après un long silence* | *Relevés de genoux aux parallèles **reviennent** après une interruption* |
| gap **42 j.** · 40 reps · ~100 % du volume habituel | gap **77 j.** · format **2 × 20** · « retour ponctuel » |

Même sujet, même histoire de reprise, **deux cartes** dans Period recap. Le collapse `sameHistoricalEpisode` / `looksReturnEpisode` **n’a pas tenu** sur ce pack UI (ou les deux cartes n’ont pas partagé la même clé d’identité exercice).

### Preuves pour

- Sur les 15 cartes `shown` export B, `phenomenonId` sérialisé est souvent **`null`**.
- Produit : 6 `disc_exercise_progress` dans `produced` — pression à la redondance avant collapse.
- Ce n’est **pas** un graphe de faits relationnels navigable ; c’est un **collapse par clés** + rivalités éditoriales — et le navigateur montre que ce collapse **échoue encore** en conditions réelles.

### Verdict §5 — **CONFIRMÉ sur le produit live** (code plus avancé que « dédup textuelle », mais insuffisant)
L’exemple même de l’essai (plusieurs facettes d’une reprise) est **photographiable** dans Recap Analysis aujourd’hui.

---

## 6. Analyses génériques faute d’objet riche

### Affirmation
Producteurs génèrent le texte trop tôt ; le rédacteur reçoit un objet trop pauvre (`type`, `change=+20%`).

### Preuves mixtes

**Contre — payload riche possible :**
`buildComposedEvidenceFromTrajectory` embarque early/late, attribution, continuity, observations par séance, setMechanism, peers, findings (L228–345).  
F4 réécrit titre/corps quand `composed === true` (`applyComposedNarrationToDiscovery`).

Export : 5 cartes avec `f4Narration.used: true` et corps à mécanisme (fréquence, format, peers).

**Pour — texte précoce + incohérences :**
Sur *Dips parallèles… plus souvent* (`f4Narration.used: true`) :

| Couche | Contenu |
|---|---|
| Titre / attribution | hausse **portée par la fréquence**, volume/séance **proche** (≈31 → ≈30, −3,8 %) |
| Corps (constat trajectoire) | moyenne **20 → 48** (+140 %) « volume par séance reste proche » |

Deux référentiels (moyenne d’arc early/late vs moyenne fenêtre d’attribution) **cohabitent dans la même phrase**. C’est exactement le symptôme « objet analytique pas unifié au moment de la rédaction ».

`disc_volume_shape` (globale) : pas de `composedEvidence` — texte producteur classique.

### Verdict §6 — **PARTIEL / plutôt CONFIRMÉ sur la qualité publiée**
Demander « moins de templates, plus de dossier transmis » est **juste**. Mais le dossier riche **existe déjà** pour une fraction des cartes ; le vrai trou est l’**unification** des métriques (arc vs fenêtre) et la **couverture** F4.

---

## 7. Découvertes peu intéressantes sélectionnées

### Affirmation
Scores d’ampleur / quotas de famille > gain d’information marginal.

### Preuve forte (cas +31 %)

| Candidat | Statut pack | Contenu |
|---|---|---|
| `span_volume_vs_frequency` — *volume bouge surtout à l’intérieur des séances* (+22 % /séance, +7 % séances) | **produit, NON montré** | Lecture analytique du cas |
| `disc_volume_shape` — *volume … dépasse la période précédente* (+31 %) | **montré** | Constat + chiffres, thèse faible |

C’est une preuve directe que la sélection **ne maximise pas** « qu’est-ce que le lecteur n’a pas déjà appris ».

Mécanismes existants (incomplets face à ce critère) :

- `discoveryInformativeValue` — bonus trajectoire / pénalités descriptives (`recapPeriodSelection.js` L380–436)
- `computeCandidateNovelty` + pénalités sémantiques / claim répété (`insightNoveltyEngine.js`)
- `informationGain` dans `recapReasoning.js` — helper local, **pas** le cœur du pack adaptatif

### Verdict §7 — **CONFIRMÉ**
Les briques « valeur informative / nouveauté » existent ; sur le cas critique de l’essai, le pack **choisit encore la carte la plus plate** — **y compris dans Recap Analysis live** (carte volume +20,7 % dominante, sans driver).

---

## 8. Historique ≠ modèle de référence historique

### Affirmation
Séances anciennes présentes, mais pas de mémoire sportive structurée réutilisable (habituel, best, variabilité, interruptions, formats, fréquences, phases).

### Preuves contre

- `habitualLevel` (`athleteJourney.js`)
- `baselineTraceMetrics` / définitions explicites first5 / last5 (`recapPersonalBaselines.js`)
- `buildAthleteTrainingIdentity` — bande de fréquence habituelle, z-score (`athleteTrainingIdentity.js`)
- `temporalScope.interpretingWithHistory` dans les trajectoires
- Mémoire same-weekday (`sameWeekdayExerciseMemory.js`)

### Preuves pour

- Plusieurs producteurs **reconstruisent** encore leur propre contexte (baselines vs trajectory vs identity vs journey).
- Commentaires / correctifs autour des gaps 42 j vs 77 j montrent que l’épisode historique n’était **pas** centralisé de façon fiable — d’où `sameHistoricalEpisode`.

### Verdict §8 — **PARTIEL**
La « mémoire sportive » **commence** à exister en modules. Elle n’est **pas** encore une API unique consommée homogènement par tous les producteurs — ce que l’essai demande à juste titre.

---

## 9. Pourquoi les moteurs avancés « semblent » comprendre

### Affirmation
Représentations + questions + validation + sélection > volume de données ; hybridité déterministe / stats / LLM.

### Verdict §9 — **HORS PÉRIMÈTRE / CONFIRMÉ comme principe**
Aucun élément du dépôt ne contredit ce paragraphe. Il ne dit rien de faux sur Momentum ; il cadre correctement la suite.

---

## 10. Six causes structurelles

| Cause (essai) | Verdict | Preuve |
|---|---|---|
| Producteurs trop indépendants | **CONFIRMÉ** | `detectDiscoveries` + essays + span + journey ; UI : GTG + volume + 2 reprises + sommeil côte à côte |
| Agrégation trop précoce | **PARTIEL** | Séries trusted + setMechanism + UI `2×20` / `4×10` ; beaucoup de cartes restent totals-only |
| Référentiels historiques hétérogènes | **CONFIRMÉ** | Contradiction dips early/late vs attribution ; UI 42 j **et** 77 j sur le même mouvement |
| Narration trop proche de la détection | **PARTIEL** | F4 après evidence pour une fraction ; pack UI encore très « une carte = un détecteur » |
| Sélection ≠ information nouvelle | **CONFIRMÉ** | `span_volume_vs_frequency` battu par `disc_volume_shape` ; UI volume plat dominant |
| Contrats données / publication instables | **CONFIRMÉ** | « +140 % » vs « reste proche » (export) ; 4 502 vs 4 889 selon snapshot ; « revient » / « reviennent » |

L’essai précise lui-même « causes **probables** » faute d’inspection complète du dépôt. Après inspection : **5/6 confirmées ou partiellement**, aucune infirmée.

Le facteur « accumulation de règles / correctifs locaux » est **compatible** avec l’historique récent du dépôt (gates, reverse-hash, phenomenon collapse, F4, etc.).

### Verdict §10 — **CONFIRMÉ** (avec nuances de degré, pas de nature)

---

## 11. Quatre fondations proposées

| Fondation | État réel 2026-11-04 |
|---|---|
| 1. Vérité analytique commune | **En cours** — run/subject contracts, fingerprints, diagnostics ; pas encore une métrique unique pour tous les modules |
| 2. Couche de compréhension des phénomènes | **Ébauchée** — composed evidence + continuity + attribution + relations ; **pas** d’hypothèses concurrentes formalisées |
| 3. Sélection sur valeur informative | **Partielle** — IV + novelty + phenomenon rival ; **échoue** sur le cas volume global |
| 4. Rédaction issue des preuves | **Partielle** — F4 / `composeAnalyticalReading` ; encore des brouillons producteurs et contradictions soft |

Banc d’essai « interprétation attendue / interdite / preuves obligatoires » : **non trouvé** comme suite de cas sportifs golden (des tests unitaires ciblés existent, pas le banc narratif décrit).

### Verdict §11 — **CONFIRMÉ comme feuille de route** ; une partie du travail est **déjà amorcée**, pas à inventer from scratch.

---

## 12. Différence attendue dans l’UI

### Affirmation
Aujourd’hui : « ton volume augmente + fréquence ». Cible : « tu reconstruis surtout ta régularité / le total monte parce que plus de séances, densité stable… ».

### Preuve sur données réelles

La lecture **produite** (non montrée) est même plus juste que l’exemple fictif de l’essai :

> *« Le volume bouge surtout à l’intérieur des séances »* — +22 % par séance, +7 % séances.

La lecture **montrée** colle à la « lecture actuelle typique » de l’essai (hausse de volume + chiffres, thèse molle).

Donc §12 est **CONFIRMÉ comme écart produit**, avec une correction factuelle : sur **ce** mois, ce n’est pas « surtout la régularité », c’est **surtout le contenu des séances**. Le moteur sait le dire ; le pack ne le choisit pas.

---

## Conclusion de l’audit

| Thèse centrale de l’essai | Verdict |
|---|---|
| Ce qui compte = organisation / représentations / confrontation / sélection, pas un algo « plus intelligent » | **CONFIRMÉ** |
| Momentum = surtout des détecteurs qui publient trop tôt | **PARTIEL** — caricature trop forte ; couches composées réelles mais non dominantes |
| Manque d’explication systématique des variations de volume | **PARTIEL** — existe au niveau exercice et span ; **perd** au niveau carte globale |
| Manque de synthèse « même histoire » | **CONFIRMÉ live** — UI affiche 42 j **et** 77 j ; collapse code insuffisant ; graphe / hypothèses concurrentes absents |
| Prochaine étape = représenter l’évolution puis choisir ce qui mérite d’être expliqué | **CONFIRMÉ** — et le cas `span_volume_vs_frequency` vs `disc_volume_shape` en est la preuve opérationnelle |

### Ce que l’essai a de plus juste
La hiérarchie **sélection / unification des preuves / narration après synthèse** explique mieux les frustrations actuelles que « il faudrait plus de détecteurs » ou « plus de LLM ».

### Ce que l’essai a de trop pessimiste
Il décrit parfois une architecture **déjà partiellement livrée** (attribution, continuity, F4, phenomenon contract, IV) comme si elle était absente. Le gap n’est plus « zéro raisonnement » : c’est **raisonnement fragmenté + sélection qui préférère encore des constats**.

### Preuve unique à retenir
Sur le mois **4 889 vs 3 731 (+31 %)** — exactement le chiffre de l’essai — Momentum a **calculé** la bonne lecture attributive globale et a **publié** la lecture plate. Ce n’est pas un manque de détection. C’est un manque de **pouvoir de la compréhension sur la publication**.

---

## Annexe A — Capture navigateur (Recap Analysis, 30d, 2026-11-04)

- URL effective : onglet app `recap` (Sport → Recap), vue `analyse`, période `30d`
- Agrégat UI : **4 502** reps · calendrier période visible (ex. mar 13 = 536, dim 1 nov = 418)
- Screenshots locaux session agent : `page-2026-11-04T03-13-54-219Z.png` (carte volume), `page-2026-11-04T03-14-10-013Z.png` (reprise 42 j)
- Doublon reprise relevés : titres exacts `…revient après un long silence` + `…reviennent après une interruption`

## Annexe B — Échantillon export `shown` (30d, snapshot 4 889)

| Kind | Titre (extrait) | Composed | Attribution |
|---|---|---|---|
| disc_gtg_unplanned_now | Grease the Groove hors planning | non | — |
| disc_ms_return | Reprise Pompes déclinées après 28 j | oui | per_session_driven_decline |
| disc_ms_pr | Meilleure série 18 pompes inclinées | non | — |
| disc_volume_shape | Volume 30 j dépasse période préc. (+31 %) | non | — |
| disc_rhythm_streak | 3 jours consécutifs | non | — |
| span_regularity | Régularité resserrée | non | — |
| disc_emergence | Relevés de genoux… après interruption | oui | — |
| disc_exercise_progress | Dips… plus souvent | oui | frequency_driven_total_rise |
| disc_exercise_progress | Pompes inclinées… plus souvent | oui | frequency_driven_total_rise |
| disc_exercise_progress | Pompes lestées : moins de reps/séance | oui | — (setMech same_sets_fewer_reps) |
| disc_exercise_progress | Pompes diamant lentes : davantage… | oui | — (same_sets_more_reps) |
| disc_sleep_drift | Décalage coucher résorbé | non | — |

**Candidat clé absent de `shown` :** `span_volume_vs_frequency` — *« Le volume bouge surtout à l’intérieur des séances »*.
