# Spec #24 — Plan de correction du moteur d’analyses Récap

Document opérationnel : validation point par point de l’audit utilisateur + backlog de correction aligné sur la **Spec #24** (percutance, conséquence, vérifiabilité), en complément des specs **#22** (pertinence / chiffres) et **#23** (langage). En cas de conflit : **#22 prime**.

- **Audit source** : lecture humaine multi-fenêtres (Auj, 7j, 30j, 3m, 6m, 1a) — octobre 2026.
- **Validation code** : croisement graft / spans (`recapPeriodDiscoveries`, `recapSleepCorrelation`, `recapMuscleInference`, `recapMuscleLoadEngine`, `recapAnalysisCatalog`, `countTrainingDaysInRange`, etc.).
- **Architecture** : voir `docs/sport/RECAP_ONGLET_ANALYSE_ARCHITECTURE_COMPLETE.md`.
- **Révision plan** : retour produit (TDD d’abord, lot 2 semaines, filtre `validateInsight` immédiat, langue avec `renderInsight`, forecasts via repository, risques colonnes vides / gabarits / calibration) — voir §0bis.

---

## 0bis. Révision du plan (à appliquer)

### Ce qui est conservé

- Phase 0 / fondations en premier (mesure unique, assertions, fixtures).
- Réutiliser les détecteurs → Insights bruts (ne pas tout jeter).
- Tests non-régression nommés **B1…L10** (+ B11–B17, C*, X*).
- Section « Ce qu’il ne faut pas faire ».

### Ce qui change

| Avant | Après |
|-------|--------|
| Corriger puis tester | **Tests qui échouent d’abord**, surtout pour causes marquées P / « probablement » (B2, B9, B11, B13, B14) — reproduire sur données réelles / fixtures, puis corriger |
| 5–8 semaines d’un bloc | **Lots livrables** : Lot A ~2 sem. (filtre + quick wins), puis P0 détecteurs, puis contrat/colonnes |
| Phase 3 langage seule (purge 80 gabarits) | **Langage en même temps que `renderInsight`** — une seule réécriture |
| Forecast → localStorage puis sync | **`ForecastRepository` interface** (impl local maintenant, cloud plus tard) |
| B1 : afficher « 112 attribuées dont 36 curls » | **UI = reps primaires uniquement** ; shares réparties = interne / debug / assertions |

### Lot A — ~2 semaines (valeur immédiate) — **EN COURS / partiellement livré (oct. 2026)**

Objectif : **les cartes fausses disparaissent**, sans attendre la refonte F/C/É.

| Item | Statut | Où |
|------|--------|-----|
| Reject log (log only) | ✅ | `recapRejectLog.js` + chip debug panel |
| `validateInsight` / filtre | ✅ | `recapInsightValidate.js` → adaptive + discoveries |
| Titre signe sommeil (B6) | ✅ | `disc_sleep_freq` |
| Mois creux à 0 (B7) | ✅ | `coverageFrom` |
| Jours strength vs any (B8) | ✅ | `countStrengthTrainingDaysInRange` + textes volume |
| Baseline même durée (C1) | ✅ | `prevSameLength` + filtre |
| Allure (B14) | ✅ | normalisation + rejet |
| IDs bruts (L1) | ✅ | filtre |
| Disparition today (B15) | ✅ | `repertoireIdea` + filtre |
| Demi-périodes survendues (B17) | ✅ | seuil 15 % |
| Primary reps affichage (B1) | ✅ helpers | `recapPrimaryMuscleReps.js` (à brancher UI Corps/cartes muscles si besoin) |
| Empty state | ✅ | `RecapAnalyseView` |
| Tests non-régression | ✅ | `recapSpec24LotA.test.js` |

**Ensuite** : Lot B — 3 détecteurs P0 (ablation, fréquence vs intensité, programme changé) → Lot C contrat + colonnes + `renderInsight`.

### Méthode TDD pour causes non figées

Pour **B2, B9, B11, B13, B14** (et tout bug encore « probable ») :

1. Extraire un fixture depuis les vraies données (ou rejouer la fenêtre).
2. Écrire un test qui **échoue** et documente le symptôme exact (ex. « 3 exos à 50,0 % », « 4501 ≠ 4698 sur sous-fenêtre »).
3. Confirmer la cause racine en debug.
4. Corriger jusqu’au vert.
5. Ne pas merger une « correction théorique » sans ce test rouge→vert.

### Risques ajoutés au plan (précédemment manquants)

| Risque | Mitigation |
|--------|------------|
| **Colonnes vides** sur 1a / 2a / Toujours après garde-fous | Détecteurs de **trajectoire** (deux points de même durée) dédiés aux longues fenêtres ; empty state neutre court et utile (« Pas assez de signal fiable sur cette fenêtre ») |
| **Gabarits monotones** | Variantes de formulation paramétrées + rotation ; relecture humaine périodique (20 cartes) |
| **2 ans, Toujours, nutrition** non audités | Lot d’audit séparé après Lot A ; mêmes assertions ; ne pas inventer de cartes nutrition avant audit |
| **Seuils Spec non calibrés** (poids 0,30/0,20…, seuil 0,45, paliers n) | Valeurs de **départ seulement** ; recalibrer avec reject log sur ~87 séances + relecture 20 cartes |

---

## 0. Verdict global sur l’audit

| Zone | Verdict |
|------|---------|
| Bugs de calcul / cohérence | **Presque tous confirmés** (causes racines trouvées dans le code) |
| Mauvaises comparaisons (durée, prev30, historique recopié) | **Confirmé** — défaut structurel, pas une impression |
| Associations sommeil contradictoires | **Confirmé** — détecteurs indépendants sans réconciliation |
| Formulation / accords / IDs / négatives | **Confirmé** — patterns massifs dans les gabarits |
| Colonnes F/C/É mal rangées | **Confirmé** — le code mappe encore short/medium/long ≠ fait/change/évolue |
| Spec #24 comme cible | **Correcte et prioritaire** — le moteur actuel produit des candidats, pas des Insights à contrat |

**Tu ne te trompes pas sur le diagnostic d’ensemble.** Quelques nuances locales (attribution multi-groupes vs « 112 = 36+76 », allure selon source Garmin) sont précisées ci-dessous ; elles ne sauvent pas les cartes.

---

## 1. Validation point par point (bugs & calculs)

Légende validation : **V** = confirmé code/logique · **P** = plausible / partiellement confirmé · **N** = nuance (pas faux, mais mécanisme à préciser).

### 1.1 Chiffres faux ou contradictoires

| # | Observation | Val. | Cause racine (code) | Correctif |
|---|-------------|------|---------------------|-----------|
| B1 | « 112 reps de biceps » alors que 36 curls ; 112+107+35+29=283 ≠ 322 « identifiées » | **V/N** | `distributeRepShareAcrossRoles` + `inferMuscleLoadRolesForExercise` : répartition multi-groupes. L’hypothèse « 36+76=112 » était une **coïncidence** côté lecture humaine. | **UI = reps primaires seulement** (ex. 36 curls → biceps). Shares réparties = interne (assertions, debug, balance push/pull interne si besoin). Jamais « 112 attribuées dont 36 » dans une carte utilisateur. Journaliser écart share vs primaire. |
| B2 | 3 mouvements pile à 50,0 % ; base 30j 96 vs 144 (3×48) | **P→TDD** | Cause **non figée** : base 30j recalculée ailleurs, double comptage, ou fenêtre différente. Exactement 50 % ×3 est le symptôme. | **Test rouge d’abord** sur fixture réel (48/96, 3×50 %). Puis une seule `WindowMeasure` ; rejet si ≥2 exos à 50,0 % ±0,05. |
| B3 | Conclusion « 50 % = séance pèse lourd » | **V** | Gabarit fixe de sens, pas dérivé des chiffres. | Titre généré depuis les valeurs : si part élevée + peu de séances historiques → « exo récent », pas « séance lourde ». |
| B4 | Pompes inclinées 36 vs 40 ; chronologie 5 valeurs pour « 4 séances » ; chip « comparables 5 » | **V** | `findComparableSessions` limite=5 **peers** (hors cible) → chip « 5 » ; la série affichée mélange peers + dernière. Dernière séance (40 le 24/10) non prise comme référence « dernière ». | Référence = séance la plus récente réelle ; liste « N précédentes » = N valeurs ; chip = même N ; inclure 40. |
| B5 | Moyenne pompes déclinées 15,2 → 14 après ajout de 30 | **V** | Moyenne recalculée sur un **sous-ensemble différent** (série max-set vs total séance, exclusion dernière, ou fenêtre ≠ échantillon). | Assertion mathématique : moyenne(échantillon∪{x}) cohérente ; tests unitaires sur ce cas. |
| B6 | Titre « semaines bien dormies → plus de jours actifs » avec 2 vs 2,4 (et 0,5 vs 2,4) | **V** | `sleepWeekFrequency` publie si `Math.abs(delta)` passe le seuil (`publishable`) ; titre **hardcodé** positif dans `detectDiscoveries` (`disc_sleep_freq`). | Titre dérivé du signe de `delta` ; si delta≤0 → autre carte ou silence. |
| B7 | « Mois le plus creux : janvier (936) » alors que fév–avr = 0 | **V** | Filtre probable qui ignore les mois à 0, ou « creux parmi mois avec activité ». | Inclure les 0 dans le min ; libeller « mois sans entraînement » si 0. |
| B8 | Jours entraînés 48/102/152 vs 47/92/96 (reps÷moyenne) | **V** | `countTrainingDaysInRange` compte **checked + endurance + circuit + Garmin** ; la moyenne reps/séance vient souvent du **seul renforcement**. Deux définitions. | Spec 6.2 : une définition « jours renforcement » partout pour cartes force ; séparer « jours activité mixte » si besoin. |
| B9 | 4 501 reps (30j) vs 4 698 (mêmes 30j vus depuis 3m/6m/1a) ; 17 vs 16 jours | **P→TDD** | Cause probable : bornes / inclusion jour / sources différentes — **à prouver**. | Fixture : mêmes `start/end` sous 30j et sous 3m/6m/1a → assert égalité. Test rouge puis mesure unique. |
| B10 | « 16 jours + 10 jours de pas ≠ 30 » | **V** | Addition de catégories disjointes présentée comme partition de la fenêtre. | Ne jamais sommer des ensembles non partitionnants sans le dire. |
| B11 | Retour après 42 j (7j) vs 77 j (ailleurs) ; pompes inclinées aussi 42 | **P→TDD** | Plusieurs détecteurs / lookbacks — **hypothèse** jusqu’au test. | Fixture exo + dates ; assert un seul `daysSinceLastSession(exId, endYmd)` pour toutes les cartes de la même end. |
| B12 | « Fin de fenêtre presque vide » + séance 24/10 ; « sur 6 jours » / 7 | **V** | `week_cluster` : critère « early » sur 4 premiers jours ; n’exclut pas une séance en fin ; `spanDays` / dates actives confondues. | Rejeter si séance dans les 2 derniers jours de la fenêtre ; compter 7 jours calendaires explicitement. |
| B13 | Hyperextension « jambes » (7j) vs « dos » (30j) ; épaules=triceps=630 | **P→TDD** | Multi-path + famille dominante **ou** autre bug — à isoler. 630=630 suspect. | Test : même exo → même `primaryGroup` quelle que soit la fenêtre ; log si deux groupes au même total exact. |
| B14 | Allure 44,5 → 19,4 min/km absurde | **P→TDD** | Unité / parse / distance — **à tracer** sur la sortie réelle. | Fixture session (4,7 km, 42 min) → pace ≈ 8,9 min/km ; rejet hors [2, 15]. |
| B15 | « Dips a quitté » sur fenêtre 1 jour | **V** | `repertoireIdea` / absences sans garde `voice !== 'today'`. | Spec 6.3 : disparition exige ≥2 périodes comparables. |
| B16 | Pseudo-planche 5 vs 9 séances ; « éloignée » pour 12 vs 10 ; confiance élevée | **V** | Chips / body / confidence issus de compteurs différents ; adverbe non mappé à l’écart ; `confidence: 'high'` avec n faible. | Un seul compteur ; mapping adverbes Spec 6.3 ; n≥15 pour « forte ». |
| B17 | « Deux moitiés » 13 137 vs 14 004 (+6,6 %) survendu | **V** | Titre fixe dès qu’il y a une différence, sans seuil. | Seuil |Δ|≥15 % pour « pas le même volume » ; sinon silence ou « à peine ». |

### 1.2 Mauvaises comparaisons

| # | Observation | Val. | Cause | Correctif |
|---|-------------|------|-------|-----------|
| C1 | 7j « −73 % » vs 30j ; 3m/6m/1a « +311/+696/+724 % » vs prev30 | **V** | `buildPeriodComparisons` expose `prev30` ; discoveries comparent `p.totalReps` (fenêtre entière) à `prev30` sans `sameLengthAsWindow`. | Toujours baseline de **même durée** ; sinon prorata explicite dans le texte + flag. |
| C2 | « Part biceps augmente plus vite que volume » vrai par construction | **V** | Conséquence mathématique d’une base trop courte / dénominateur prev30. | Interdire ce claim si baseline ≠ durée fenêtre. |
| C3 | « 0 km / 0 hors-planning avant » (GtG depuis 02/09) | **V** | Pas de date d’introduction de feature / first-seen. | Spec 6.1 : « depuis le début du suivi » ; pas « apparaît » si first-seen ≥ début fenêtre. |
| C4 | Stats historiques recopiées dans toutes les fenêtres | **V** | `weekFreqJourney` / sleep facts journey réutilisés pour today/week (`weekFreq = journey \|\| window`). | Spec #22 : historique seulement si libellé + période de référence ; pas de copie identique multi-fenêtres. |
| C5 | Jalons « tu viens de 10k » alors que 25k passé | **V** | `recapMilestoneEngine` / discoveries sans filtre « seul le plus haut » + fenêtre 14j. | Spec 6.1 milestones. |
| C6 | Petits n (3 vs 3, 4 vs 7…) + confondant temporel (sorties anciennes) | **V** | Seuils `publishable` trop bas (`minEach: 2` pour weekFreq) ; pas de test confondant. | Spec 6.4 + confondant obligatoire. |

### 1.3 Insights contradictoires (sommeil)

| # | Observation | Val. | Correctif |
|---|-------------|------|-----------|
| X1 | ≥7h30 → plus de densités ; nuits courtes → plus de reps ; coucher tardif → plus volume ; 48h repos → −11 % reps ; RPE plus bas après nuit courte | **V** | Détecteurs parallèles dans `detectDiscoveries` / `recapSleepCorrelation` sans passe de réconciliation. | Spec 6.5 : détecter paires opposées → fusion « le sommeil n’explique pas ton volume » ou garder la plus fiable. |
| X2 | Aujourd’hui 8h44 / densité −23,5 % non relevé | **V** | Pas de détecteur « paradoxe du jour » confrontant règle apprise vs séance courante. | Priorité Spec #24 §9 : paradoxe du jour. |

### 1.4 Formulation

| # | Observation | Val. | Fichiers typiques | Correctif |
|---|-------------|------|-------------------|-----------|
| L1 | IDs bruts / noms EN | **V** | Résolution nom échoue → fallback `#id` / nom DB EN | Rejet si nom non résolu FR ; table traduction |
| L2 | Accords cassés | **V** | Concaténations manuelles | Gabarits à accords + tests |
| L3 | Titres tronqués « … » / corps coupé | **V** | Truncate UI ou split title/body | Pas de truncate mid-word ; title ≠ body |
| L4 | Chips `rhythm` / `repertoire` | **V** | Chip = family/kind interne | Chip = 1–3 chiffres seulement |
| L5 | Titre vs corps (signe, « légèrement », « égale son volume ») | **V** | Titres gabarit | Titre depuis valeurs |
| L6 | Cartes vides / triviales (100 % d’aujourd’hui, pas sans séance) | **V** | Pas de filtre trivialité | Rejet deviation≈0 / evidence tautologique |
| L7 | « Apparaît » en 1a / dips revient vs apparaît | **V** | Voir C3 | First-seen vs fenêtre |
| L8 | « Ce n’est pas X, c’est Y » × dizaines | **V** | ~80+ hits (`recapHorizonEssays`, catalog, milestones, discoveries…) | Interdit Spec 8.1 ; réécrire gabarits |
| L9 | Clôtures vides / conditionnel sans test | **V** | Patterns éditoriaux | `so_what` obligatoire ou silence |
| L10 | Affirmations non data (« poignets encaissent ») | **V** | Prose libre | Interdit |

### 1.5 Classement colonnes F / C / É

| # | Observation | Val. | Cause | Correctif |
|---|-------------|------|-------|-----------|
| Col1 | Mapping F↔C↔É incohérent | **V** | UI = short/medium/long (nature now/trajectory/journey), **pas** fait/change/évolue | Nouveau contrat `column: 'fait'\|'change'\|'evolue'` Spec #24 §4 |
| Col2 | Doublons même sujet (pompes ×3, trou ×3) | **V** | Sélection par famille/horizon insuffisante | Synthèse tags + max 1 subject/fenêtre |

---

## 2. Écart Spec #24 vs moteur actuel

| Spec #24 | État actuel | Gap |
|----------|-------------|-----|
| Objet `Insight` (verdict, evidence[], so_what, sampleSizes, score 5 axes) | Candidats hétérogènes (discovery / essay / span / relation) | **Nouveau contrat unique** |
| Colonnes fait / change / évolue | short / medium / long | **Remapping + règles de rejet** |
| Validation dure §6 | Seuils faibles, titres fixes, abs(delta) | **Couche `validateInsight` centrale** |
| Synthèse (programme changé, chaînage, ablation) | Quasi absente | **Phase synthèse avant sélection** |
| Registre de pronostics | Inexistant | **Nouveau module + persistence** |
| Moins de cartes, pas de quota min | Caps + refillAfterGate remplissent | **Supprimer refill forcé ; max 4/6** |
| Aujourd’hui sans séance | Risque de recycler dernière séance | **Règle dédiée** |
| Journal de rejet | Debug panel partiel | **Reject log structuré** |

---

## 3. Architecture cible (implémentation)

```
données
  → candidats (détecteurs existants adaptés)
  → toInsight()          // normalise vers contrat Spec #24
  → validateInsight()    // rejets durs §6 → rejectLog
  → scoreInsight()       // 5 axes, seuil 0.45
  → synthesizeInsights() // tags, chaînage, ablation, paradoxe
  → reconcileOpposites() // sommeil / associations
  → selectInsights()     // max/colonne, 1 subject, diversité
  → renderInsight()      // titre/preuve/Donc/chip ; accords FR
  → forecastRegistry     // create / evaluate / Verdict
```

**Principe** : ne pas jeter tous les détecteurs d’un coup. Les faire **produire des Insights bruts**, puis faire porter la qualité par validation + synthèse + rendu.

Fichiers pivots à créer / étendre :

| Module | Rôle |
|--------|------|
| `src/utils/sport/recapInsightContract.js` | Types Insight / Evidence / Forecast + helpers |
| `src/utils/sport/recapInsightValidate.js` | Toutes les assertions §6 |
| `src/utils/sport/recapInsightScore.js` | Score 5 axes |
| `src/utils/sport/recapInsightSynthesize.js` | Programme changé, chaînage, fusion trous, ablation |
| `src/utils/sport/recapInsightSelect.js` | Caps colonnes, diversité |
| `src/utils/sport/recapInsightRender.js` | FR accords, chips chiffres, interdits |
| `src/utils/sport/recapForecastRepository.js` | Interface `ForecastRepository` + impl locale (IndexedDB/local) ; **pas** d’accès localStorage éparpillé |
| `src/utils/sport/recapRejectLog.js` | Journal rejets (debug + calibration seuils) |
| Adapter | `recapAdaptiveInsights.js` : **d’abord** filtre `validateInsight` sur l’existant |
| UI | Empty state neutre dès Lot A ; colonnes F/C/É au Lot C |

---

## 4. Backlog par lots (livraison incrémentale)

### Lot A — ~2 semaines — « masquer le faux » (priorité absolue)

| # | Travail | Notes |
|---|---------|--------|
| A0 | Fixtures + **tests rouges** pour B2, B9, B11, B13, B14 (et B1/B5/B6/B8 déjà clairs) | Avant tout correctif « probable » |
| A1 | `WindowMeasure` unique par fenêtre | Fondations |
| A2 | Assertions **log only** → reject log | Pas de throw prod |
| A3 | Quick wins : titre signe (B6), mois à 0 (B7), jours strength/any (B8), allure (B14), IDs (L1), baseline même durée (C1) | |
| A4 | B1 UI : **reps primaires** à l’affichage ; shares internes | |
| A5 | `validateInsight` comme **filtre** sur candidats actuels (rejeté = masqué) | Pas encore nouveau rendu |
| A6 | Empty state court si colonne vide après filtre | Anticiper le risque « vide » |

**DoD Lot A** : sur les fenêtres auditées, les cartes absurdes listées (sommeil inversé, allure impossible, IDs, prev30 silencieux, mois creux faux) ne s’affichent plus ; reject log rempli ; tests B* concernés verts.

### Lot B — ~1,5–2 semaines — 3 détecteurs P0 + trajectoire longues fenêtres

| Priorité | Détecteur | Remplace |
|----------|-----------|----------|
| P0 | Ablation du pic | Concentration / « séance pèse » |
| P0 | Fréquence vs intensité | Volume +% naïf |
| P0 | Programme changé (≥3 apparitions) | 7 cartes « apparaît » |
| P0+ | Trajectoire 2 points (même durée) pour **1a / 2a / Toujours** | Contre colonnes vides post-filtre |
| P0+ | Ratio push/pull chaîné ; paradoxe du jour | Dès que Lot A stable |

Golden tests = Spec #24 §10.

### Lot C — ~2 semaines — Contrat Insight + colonnes + `renderInsight` (langue ici)

- `Insight` Spec §2 ; mapping fait / change / évolue.  
- UI colonnes F/C/É ; empty state soigné.  
- **`renderInsight`** : accords FR, chips chiffres, interdiction « Ce n’est pas… », adverbes chiffrés, variantes de formulation (anti-monotonie).  
- **Ne pas** purger les 80 gabarits dans l’ancienne structure avant ce lot.  
- Score 5 axes (seuils = **départ** ; calibrer ensuite).  
- Sélection : max 4/6, pas de min, 1 subject, diversités ; retirer refill agressif.

### Lot D — ~1 semaine — Pronostics via repository

- Interface `ForecastRepository` : `list`, `create`, `getOpenBySubject`, `updateStatus`.  
- Impl `LocalForecastRepository` (storage local unique derrière l’interface).  
- Plus tard : `CloudForecastRepository` sans toucher les callers.  
- Evaluate à chaque `runFor` ; Verdict en évolué.

### Lot E — Continu — Calibration, audits manquants, QA

| Travail | Détail |
|---------|--------|
| Calibration seuils | Reject log sur ~87 séances + relecture 20 cartes → ajuster poids score, 0,45, paliers n |
| Audit **2 ans / Toujours** | Même grille que l’audit initial |
| Audit **nutrition** | Avant toute carte nutrition Spec #24 |
| Variantes gabarits | Revue périodique anti-monotonie |
| Réconciliation sommeil (X1) | Après P0 |
| Suite tests §6 Spec | 1 test / règle + non-régression |

---

## 5. Ordre d’implémentation concret (Lot A)

1. Fixtures `src/utils/sport/__fixtures__/recapSpec24/` + tests rouges B2/B9/B11/B13/B14.  
2. `WindowMeasure` / unifier `measureRecapWindow` + `trainingDaysStrength` vs `Any`.  
3. `recapInsightValidate.js` (sous-ensemble §6) + `recapRejectLog.js` ; brancher en filtre dans `recapAdaptiveInsights` / sélection discoveries.  
4. Correctifs ciblés : `disc_sleep_freq` titre signe ; mois creux ; pace ; IDs ; baseline same-length.  
5. Affichage musculaire : primaire only (B1).  
6. Empty state UI minimal.  
7. **Stop** : pas de purge langue, pas de Forecast cloud, pas de remap colonnes tant que Lot A n’est pas DoD.

---

## 6. Definition of Done

### DoD Lot A (shippable)

- [ ] Tests rouges→verts pour B2, B9, B11, B13, B14 (causes prouvées).  
- [ ] `WindowMeasure` unique consommée par les cartes filtrées.  
- [ ] Assertions log only + reject log visible DEV/admin.  
- [ ] Plus de titre sommeil inversé, IDs bruts, allure hors plage, baseline durée inégale silencieuse, mois creux ignorant les 0.  
- [ ] UI musculaire = primaires (pas le jargon « attribuées »).  
- [ ] Colonne vide → message neutre, pas de refill.

### DoD Spec #24 complet

- [ ] Tous B1–B17, C*, X*, L* verts.  
- [ ] Contrat Insight + colonnes F/C/É.  
- [ ] Langue via `renderInsight` (pas double réécriture).  
- [ ] P0 + trajectoire longues fenêtres.  
- [ ] Forecast derrière `ForecastRepository`.  
- [ ] Seuils recalibrés (reject log + 20 cartes).  
- [ ] Audits 2a / Toujours / nutrition faits ou explicitement hors scope documenté.  
- [ ] Lecture humaine ≥80 % sur 20 cartes.

---

## 7. Ce qu’il ne faut **pas** faire

- Ajouter encore des gabarits « Ce n’est pas X… » pour « rassurer ».  
- **Purger / réécrire 80 gabarits dans l’ancienne structure** avant `renderInsight` (double travail).  
- Augmenter les caps / refill pour remplir les colonnes.  
- Comparer toute longue fenêtre à `prev30` « parce que c’est pratique ».  
- Afficher une corrélation sommeil sans n, sans confondant, sans Donc.  
- Corriger uniquement le français sans assertions de calcul.  
- Traiter short/medium/long comme F/C/É sans migration de contrat.  
- Corriger une cause « probable » (B2/B9/B11/B13/B14) **sans test rouge** sur fixture réel.  
- Afficher les shares multi-groupes à l’utilisateur (« 112 dont 36 »).  
- Écrire le registre de pronostics directement dans `localStorage` hors repository.  
- Traiter les poids de score 0,30/0,20… et le seuil 0,45 comme vérité produit avant calibration.

---

## 8. Synthèse validation audit

| Domaine | Verdict |
|---------|---------|
| Bugs de calcul | **Oui** (plusieurs causes code confirmées) |
| Texte par la négative | **Oui** |
| Durées inégales (`prev30`) | **Oui** |
| Sommeil contradictoire | **Oui** |
| Colonnes mal rangées | **Oui** |
| Spec #24 | **Bonne cible** |
| Hypothèse 36+76=112 | **Coïncidence** — cause réelle = répartition multi-groupes ; UI = primaires |

**Conclusion** : plan ancré code, **livré par lots**, TDD sur les causes non figées, filtre `validateInsight` pour valeur immédiate, langue une seule fois avec le nouveau rendu.

---

## 9. Estimation révisée (dev solo)

| Lot | Contenu | Effort |
|-----|---------|--------|
| **A** | Mesure + log assertions + quick wins + filtre validate | **~2 sem.** (ship) |
| **B** | 3× P0 + trajectoire longues fenêtres | ~1,5–2 sem. |
| **C** | Contrat + colonnes + renderInsight (langue) + score | ~2 sem. |
| **D** | ForecastRepository + verdicts | ~1 sem. |
| **E** | Calibration, audits 2a/Toujours/nutrition, QA | continu / ~1 sem. dispersée |

**Premier ship utile** : fin du Lot A (~2 semaines), pas 5–8 semaines d’un coup.

---

*Document révisé : audit validé + plan de correction incrémental Spec #24.*
