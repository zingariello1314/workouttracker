# Consolidation finale — plan analytique P3 & pertinence des découvertes

**Date :** 31 octobre 2026  
**Nature :** conception + audit code/captures — **aucune implémentation**, **aucun commit**, **aucun fichier de production modifié**  
**Entrées :** revue P3.2 du 31/10, audit P3.2 du 30/10, P3.0/P3.1 validés, captures console 30d, code sélection / muscle / snapshots  

---

## 1. Contradictions de conception encore ouvertes (P3.2)

| # | Contradiction | Statut après consolidation |
| --- | --- | --- |
| C1 | `R` défini comme reps reconnues mais décomposé avec `R_unit_ambiguous` (non exclusif) | **Résolu en modèle** §2 — invariants séparés |
| C2 | Sous-échantillon 2 385 / 4 016 présenté sans statut clair du reste | **Clarifié** §4 — reste = non rejoué, pas non attribuable ; rejeu intégral **encore bloqué** (pas d’export IndexedDB ce tour) |
| C3 | Seuil unique « ≥3 snapshots » pour toute conclusion plan | **Résolu en modèle** §3 — seuils par type de découverte |
| C4 | « 11 training days » vs « 15 jours classiques » | **Expliqué** §5 — deux prédicats distincts |
| C5 | « jours-entrées » ambigu | **Lexique** §5 |
| C6 | Anciens `disc_muscle_*` vs P3.2 (coexistence insuffisante) | **Politiques kind-par-kind** §6 |
| C7 | Limites méthodologiques (`disc_plan_data_insufficient`) traitées comme découvertes prioritaires | **Défaut de sélection démontré** §7 — pas un défaut de calcul P3.0/P3.1 |
| C8 | Validation P3.2 avant invariants + politique éditoriale | **Toujours ouverte** — ne pas valider P3.2 tant que C1–C7 arbitrés |

**Ne pas réécrire P3.0/P3.1** : le calcul d’insuffisance plan est juste ; c’est sa **hiérarchie éditoriale** qui est en cause.

---

## 2. Modèle comptable final proposé

### 2.1 Univers des valeurs enregistrées (partition exclusive)

Soit `E` l’ensemble des valeurs numériques lues sur la fenêtre pour le channel classic (GTG en channel séparé, même schéma).

Partition **exclusive** de `E` :

| Symbole | Définition | Exemple |
| --- | --- | --- |
| `E_reps` | Entier > 0, unité **rep** certaine (mouvement dynamique) | Dips 12 |
| `E_iso_s` | Entier > 0, unité **secondes isométriques** (heuristique nom existante) | Wall sit saisi en « reps » mais classé iso |
| `E_duration` | Durée autre (min cardio prescrit/réalisé si distinct) | Course 45 min |
| `E_unit_unknown` | Valeur > 0, unité non déterminable | Champ ambigu |
| `E_invalid` | Non parseable, ≤0 après floor, ou clé exclue (complementary filtrée) | `""`, `NaN` |

**Invariant U1 :**  
`|E| = |E_reps| + |E_iso_s| + |E_duration| + |E_unit_unknown| + |E_invalid|`  
(en **lignes** ledger, pas en somme de magnitudes incomparables.)

### 2.2 Magnitudes (ne jamais additionner entre unités)

| Symbole | Magnitude | Unité |
| --- | --- | --- |
| `R` | Σ valeurs de `E_reps` | répétitions |
| `S_iso` | Σ valeurs de `E_iso_s` | secondes |
| `D` | Σ / agrégat de `E_duration` | minutes (ou métrique native) |
| `U_unk` | Σ de `E_unit_unknown` | « valeur brute » — **jamais** affichée comme reps |

**Interdit :** `R + S_iso + …` dans un seul total nommé « reps ».

### 2.3 Couverture anatomique de `R` (partition exclusive)

Chaque rep de `R` tombe dans **exactement un** seau :

| Seau | Condition d’admissionibilité |
| --- | --- |
| `R_mono` | L1 identité utilisable + L2 bank/bank_key/name_match medium+ + L3 ≥1 primary mappé + **exactement 1** `MuscleGroups` primary |
| `R_multi` | Idem mais **≥2** primary groups |
| `R_non_attr` | Heuristique low, unknown, primary vide, ou politique stricte sur name_match flou |

**Invariant A1 :** `R = R_mono + R_multi + R_non_attr`

**Invariant A2 :** `volumePrimary[G]` ne reçoit que des lignes de `R_mono` dont primary = {G}.  
`R_multi` et `R_non_attr` **conservés** et reportés — jamais ventilés en silence.

Exposition (jours / exercices) reste **orthogonale** au volume (multi peut exposer plusieurs G sans ventiler `R_multi`).

### 2.4 Charges et séries

- `weightPresent` / `weightUnknown` — absence ≠ 0 kg.  
- `setLogs` absents → ne pas reconstruire depuis `series` prescrit.  
- Channels `classic` / `gtg_certain` / `gtg_other` séparés (identité P3.1).

---

## 3. Conditions d’admissibilité des découvertes (plan × muscle × éditorial)

### 3.1 Trois fenêtres (à formaliser partout)

| Notion | Rôle | Règle d’affichage |
| --- | --- | --- |
| **Fenêtre sélectionnée** `W` | Ce qu’on décrit | Aucune activité hors `W` présentée comme « faite dans la période » |
| **Fenêtre de comparaison** `C` | Qualifier un changement | Doit être explicite (« vs 30 j. précédents ») |
| **Historique de référence** `H` | Trajectoire, nouveauté, récurrence | Admissible hors `W` si `interpretingWithHistory` / `historical_explicit` et daté |

**Existant partiel :** `exerciseTrajectoryAnalysis.temporalScope` ; `KIND_SCOPE.historical_explicit` (surtout sommeil) ; `priorWindowForComparison`.  
**Manquant :** application systématique aux kinds programme / muscle / volume ; la vue 7j n’utilise pas `H` pour relativiser une insuffisance plan.

### 3.2 Adhérence prouvée vs comportements observés

| Famille | Preuve requise | Si preuve absente |
| --- | --- | --- |
| Taux / skip récurrent / off-plan vs plan | Jours `planSource=snapshot` | **Pas** de claim d’adhérence — métadonnée ou silence |
| Expositions, volume, trajectoires P0, GTG | Journal | OK indépendamment des snapshots |

### 3.3 Seuils **par type** (remplace le « ≥3 snapshots » universel)

| Kind / acte | Jours snapshot min | Occasions prévues min (exo/groupe) | Couverture période | Attribution | Notes |
| --- | --- | --- | --- | --- | --- |
| Taux d’adhérence fenêtre | **3** (P3.1) | n/a (créneaux agrégés) | snapDays / trainedDays déclarée | n/a | Inchangé |
| Skip « récurrent » | 3+ | **≥3** occurrences éligibles **du même** matchKey (déjà P3.1) | — | — | **1 occurrence ≠ récurrent** |
| Écart exposition groupe prévu×réalisé | 3 | Groupe prévu sur **≥3** jours snap distincts | ≥50 % des jours entraînés de `W` en snap **ou** limite forte | `R_mono`+exposition medium+ | Sinon watch / denied |
| Push/pull plan vs actual | 3 | ≥2 jours snap classables mouvement | idem | axes mixed OK | — |
| `disc_plan_data_insufficient` comme **carte principale** | — | — | — | — | **Voir §7 — plus prioritaire par défaut** |

---

## 4. Résultats chiffrés réellement rejoués

### 4.1 Fenêtre 2026-10-01 → 2026-10-30 (preuves existantes)

| Mesure | Valeur | Statut |
| --- | --- | --- |
| Total reps pipeline (`disc_volume_shape` / signature) | **4 016** | Démontré (console) |
| Snapshots | **0** | Démontré (P3.0) |
| Jours matrice classic (checks) | **15** | Démontré (P3.0) |
| `trainingDays` measure / volume_shape | **11** | Démontré (console metrics) |
| Composition conventionnelle | pecs 809, etc. ; « 3 810 identifiées » | Démontré — **non** P3.2 |

### 4.2 Comptabilité conservatrice — sous-échantillon documenté

24 entrées nommées (audit live + hash résolus) : **2 385** reps  
- `R_mono` = **1 677** (18)  
- `R_multi` = **708** (6)  
- `R_non_attr` = **0**  
- Invariant A1 OK sur ce sous-ensemble  

### 4.3 Les 1 631 restantes (4 016 − 2 385)

| Interprétation | Valide ? |
| --- | --- |
| « Non attribuables anatomiquement » | **Non** — confusion interdite |
| « Non rejouées ligne à ligne dans cet audit » | **Oui** |

Cause du non-rejeu intégral ce tour : application / IndexedDB non accessibles (pas de serveur local, pas d’export brut `reps`/`checkedExercises` dans les JSON console).  

Le reste **inclut vraisemblablement** (hypothèses à vérifier au golden ledger, non démontrées ici) : autres IDs des 47 exercices oct., pompes endurance synthétiques, éventuels iso, lignes hors sous-échantillon.  
**Gate validation P3.2 :** script de rejeu sur aggregate `main` produisant la table U1+A1 pour les 4 016.

### 4.4 Écart 4 016 vs 3 810 « identifiées »

**206** reps dans le total mais hors portrait muscle conventionnel — signal que le % 20,1 % n’a pas un dénominateur unique transparent (`disc_muscle_now` evidence vs body).

---

## 5. Lexique des dénominateurs (11 vs 15 et « jours-entrées »)

### 5.1 Pourquoi 11 ≠ 15

| Compteur | Symbole code | Prédicat |
| --- | --- | --- |
| **15** | Matrice P3.0 / `hasPerformanceKeysForDate` | Toute clé check/reps/poids/sets pour la date (y compris sync GTG) |
| **11** | `measureRecapWindow.trainingDays` ← `computeCalendarMonthSportStats` ← `dayCountsAsCalendarTrainingDay` | Muscu **non-GTG** (`hasNonGtgMomentumWorkoutForDate`), ou GTG seul 100 %, endurance, circuit, Garmin |

Preuves :  
- `hasPerformanceKeysForDate` — `calendarDayPlanSnapshot.js` L15–35  
- `hasNonGtgMomentumWorkoutForDate` — `calendarGtgDay.js` L139–167 (soustrait les reps GTG)  
- `measureRecapWindow` — `recapPeriodDiscoveries.js` L598 : `trainingDays = cal?.trainingDays \|\| repsByDate.size`  

Donc **4 jours** ont une activité enregistrée au sens P3.0 mais ne passent pas le filtre « jour entraîné calendrier » (souvent GTG-only après sync où `total − gtg ≤ 0` et GTG seul non compté, ou autre filtre) — **à confirmer jour par jour** au golden (défaut de **données de rejeu**, pas d’incompréhension du code).

### 5.2 Noms non ambigus (contrat d’affichage)

| Terme affiché | Définition | Symbole |
| --- | --- | --- |
| **Dates distinctes avec force** | Jours où `strengthReps` / `repsByDate` > 0 | `strengthCalendarDays` |
| **Jours entraînés calendrier** | `dayCountsAsCalendarTrainingDay` | `calendarTrainingDays` |
| **Séances classiques distinctes** | Jours avec check+reps hors canal GTG exclusif | `classicSessionDays` (P3.1) |
| **Occurrences d’exercice** | Lignes (date × storageId) | `exerciseOccurrences` |
| **Séries enregistrées** | Entrées `exerciseSetLogs` | `recordedSets` |
| **Jours d’exposition musculaire primary(G)** | Dates distinctes avec G ∈ primary | `exposureDaysPrimary[G]` |
| **Occurrences multi-primary touchant G** | Entrées (pas des dates) | `multiPrimaryOccurrences[G]` — **jamais** « jours-entrées » |

---

## 6. Anciens moteurs musculaires — politique kind par kind

| Kind | Problème démontré | Politique recommandée |
| --- | --- | --- |
| `disc_muscle_now` | Parts via `repShareByGroup` / 74/26 ; vocabulaire « concernent » trompeur ; dénominateur 4016 vs 3810 | **Reformuler** en « composition indicative (parts conventionnelles) » + limite ; **rétrograder** `informativeValue` ; rivaliser avec P3.2 exposition si les deux coexistent |
| `disc_push_pull` | Même base shares ; utile comme orientation grossière | **Reformuler** + limite ; garder si P3.2 push/pull jours non dispo |
| `disc_muscle_reorient` | Tautologie 100 % quand `W` = mois de référence ; mot **stimulus** excessif | **Retirer de la sélection** ou gate `comparesItself` (déjà partiel ailleurs) ; reformuler sans « stimulus » |
| `disc_muscle_share_shift` | % shares conventionnels | **Rétrograder** ; OK en secondaire si Δ fort et limite affichée |
| `COMPOSITION_STORY_KINDS` | Une seule carte composition — bon filet | **Conserver** le rival group ; y **ajouter** futurs kinds P3.2 volume-% si jamais produits |
| UI zones / mesh / `RepartitionMusculaireChart` | Visualisation | **Préserver** ; ne pas brancher P3.2 conclusions dessus sans étiquette |

Fichiers : `recapMuscleLoadEngine.js` (`PRIMARY_REP_SHARE`), `musclesFromRecapState`, `COMPOSITION_STORY_KINDS` / `DISCOVERY_RIVALS` dans `recapPeriodDiscoveries.js`.

---

## 7. Audit éditorial — contre-exemple 7j et système multifacette

### 7.1 Contre-exemple (prose exacte = code)

`composeProgramAdherenceDiscoveries` (`recapProgramAdherenceDiscoveries.js` L504–518) produit le texte cité lorsque `snapshotDayCount === 0`.

**Calcul :** juste (P3.0/P3.1).  
**Pertinence comme analyse principale :** faible — décrit une **incapacité**, pas un comportement athlète.

### 7.2 Chemin jusqu’à l’affichage (preuves)

1. **Données :** 0 snapshot sur fenêtres sans gel post-28/10 — fréquent en 7j/30j actuel.  
2. **Candidat :** toujours émis si `< MIN_SNAPSHOT_DAYS_FOR_RATE` (`buildAdherenceFindingsFromMatrix` L141–158).  
3. **Weights :** `reliability: 0.95`, `importance: 0.72`, `novelty: 0.7`, `fit: 0.88` — score compétitif.  
4. **Nature :** `trajectory` → colonne « Ce que ça change ».  
5. **Priorité :** `PERIOD_DISCOVERY_PRIORITY.week.trajectory` place `disc_plan_data_insufficient` **très tôt** (L3158–3162) ; `selectPeriodDiscoveriesWithTrace` **prend d’abord la liste priority** (L3536–3540) **avant** le tri `informativeValue`.  
6. **Effet :** une limite méthodologique **occupe un slot sport trajectory** même si des trajectoires d’exercices / GTG / volume contextuel existent via `H`.  
7. **Caps :** `SPORT_HEAVY.sport = 8` — la carte n’est pas seule, mais elle **pollue le haut de pile** et le message utilisateur.

**Classification du défaut :** **sélection + narration** (pas calcul, pas absence totale de données utiles).

### 7.3 Ce qui aurait pu rester admissible (sans inventer)

Sur 7j avec reconstructions : expositions réelles, `disc_exercise_progress` avec `interpretingWithHistory`, GTG, volume de `W` contextualisé par `C`/`H`, peak day si seuils.  
L’insuffisance plan devrait être : **métadonnée** (« adhérence historique non calculable ») ou **phrase limite** attachée à une carte d’exposition — pas la tête d’affiche.

### 7.4 Contrat de pertinence proposé

Score de publication `P` (conceptuel) :

| Facteur | Poids indicatif | Notes |
| --- | --- | --- |
| Importance du constat athlète | haut | Pas importance du trou moteur |
| Précision (unités, dénominateurs) | haut | |
| Profondeur `H` / `C` | moyen | Bonus `interpretingWithHistory` déjà partiel |
| Nouveauté | moyen | |
| Confiance | **plancher**, pas plafond | Fiable ∩ pauvre → bas |
| Utilité | haut | Actionnable ou compréhensif |
| Non-redondance | haut | Rivals / composition |

**Classes de contenu :**

| Classe | Exemples | Place UI |
| --- | --- | --- |
| Découverte informative | traj P0, skip récurrent prouvé, exposition contrastée | Principale |
| Statistique descriptive | volume shape neutre | Secondaire / densité basse |
| Limite méthodologique | plan insufficient, ledger limits | Métadonnée / footer / attach |
| Diagnostic interne | scores, caps, drop reasons | Console only |
| Interprétation | push/pull « dominant » | Seulement si chiffres + limite |

### 7.5 Limites techniques ≠ découvertes par défaut

| Kind | Politique |
| --- | --- |
| `disc_plan_data_insufficient` | **Métadonnée de fiabilité** + indication discrète « Suivi de plan : indisponible sur cette fenêtre » ; carte autonome **seulement** si l’utilisateur filtre « Programme » / aucune autre trajectory sport |
| `disc_muscle_ledger_limits` (P3.2 proposé) | Attach aux cartes muscle ; autonome si `R_non_attr / R` élevé **et** masquerait autrement un faux volume |
| Autres « impossible si… » | Préférer silence + flag metrics |

**Ne pas masquer** une limite qui change le sens d’une conclusion publiée.

### 7.6 Horizons — état réel

| Horizon UI | Utilise déjà `H` ? | Problème |
| --- | --- | --- |
| today / 7d | Trajectoires P0 oui ; programme insuffisant **non contextualisé** | Priority list + carte limite |
| 30d | Composition + traj ; reorient tautologique possible | |
| 3m–all | Essays / journey plus riches | Voix `long` **retire** kinds plan P3.1 de la priority trajectory (L3225–2237) — asymétrie 7j/30d vs long |

Formaliser pour **chaque** période : `W`, `C`, `H` nommés dans metrics.

### 7.7 Données sous-exploitées (opportunistes)

| Source | Statut | Action |
| --- | --- | --- |
| `exerciseSetLogs` / charges | Partiel P0 | Joindre dans prose volume sans nouveau % muscle |
| Snapshots (quand présents) | P3.0/P3.1 | OK |
| GTG nature post-sync | Perdue | P3.5 |
| `dailyVariations` | P3.0 | OK si snap |
| Historique hors `W` pour contextualiser insuffisance | **Non utilisé** | Joindre : « Des snapshots existent hors fenêtre / n’existent nulle part » |
| Anatomie Delavier | Absent machine | Non défendable |
| Feedback séance | Sparse | P3.5 optionnel |

---

## 8. Typologie des défauts

| Défaut | Exemples | Remède |
| --- | --- | --- |
| **Calcul** | 74/26 présenté comme mesure | P3.2 comptable ; reformuler anciens |
| **Données** | 0 snapshot ; 1631 non rejouées | P3.3 ; golden ledger |
| **Sélection** | Priority early sur `disc_plan_data_insufficient` | Retirer/réordonner priority ; classe méthodologique |
| **Narration** | « stimulus », % trompeurs, tautologie reorient | Gates prose ; lexique |

---

## 9. Corrections transversales

### Indispensables

1. Invariants U1/A1 + lexique dénominateurs.  
2. Seuils d’admissibilité **par kind** (§3.3).  
3. Déclasser limites méthodologiques (§7.5) — **touche sélection, pas le socle P3.0**.  
4. Politiques `disc_muscle_*` (§6).  
5. Golden ledger 4 016 avant validation P3.2.  
6. Trois fenêtres W/C/H dans le contrat metrics.

### Utiles

7. `informativeValue` malus pour kinds `methodology_limit`.  
8. Comparateur « snapshots existent-ils hors W ? » pour contextualiser.  
9. Étiquette UI composition indicative.  
10. Alignement `strengthCalendarDays` vs `calendarTrainingDays` dans une même carte.

### Facultatifs

11. Persist `bankKey`.  
12. Inverser P3.2/P3.3.  
13. Refonte charts %.

---

## 10. Impact sur l’ordre P3.0 → P3.5

| Étape | Impact |
| --- | --- |
| P3.0 / P3.1 | **Inchangés** en calcul ; éventuel patch **sélection/prose** transversal (hors « réécriture ») pour `disc_plan_data_insufficient` |
| **P3.1bis / P3.edit (nouveau lot mince)** | Priorité éditoriale + classes de pertinence — **avant ou en parallèle court de P3.2** |
| P3.2 | Comptabilité + findings bornés ; pas de validation tant que golden 4016 + politiques §6–7 arbitrées |
| P3.3 | Toujours requis pour prévu historique riche |
| P3.4 | `classificationVersion` + scheduleHash |
| P3.5 | GTG nature + feedback |

**Proposition d’ordre d’exécution concret :**

1. **Lot E0 — Éditorial transversal** (sélection : demote methodology limits ; malus informativeValue ; gate tautologies muscle) — ne casse pas P3.0/P3.1 findings.  
2. **Lot P3.2a — Socle comptable** (modules attribution/exposition, invariants, tests conservation, golden 4016).  
3. **Lot P3.2b — Findings muscle** (exposition contrast ; plan_vs_actual gated ; pas de carte limite prioritaire).  
4. **P3.3** snapshots jours manqués.  
5. **P3.4** révisions programme.  
6. **P3.5** GTG×plan / feedback.

---

## 11. Tests de qualité du résultat final (au-delà unitaires)

| Test | Critère de réussite |
| --- | --- |
| Golden ledger oct. | U1+A1 sur 4016 ; table des restes explicite |
| Pack 7j sans snapshot | Aucune carte principale = seule insuffisance plan ; présence d’au moins une carte comportement si données |
| Pack 30d | `disc_muscle_reorient` absente si tautologique ; composition avec limite si montrée |
| Pack avec ≥3 snaps | Adhérence / skip récurrent seulement si occasions ≥3 |
| Lexique | Aucune occurrence de « jours-entrées » ; trainingDays labellisé |
| Non-régression | Suites P3.0/P3.1 vertes |
| Revue humaine pack | Grille §7.4 sur 7j + 30d + 3m |

---

## 12. Décisions humaines encore requises

1. Confirmer demote de `disc_plan_data_insufficient` (métadonnée vs carte rare).  
2. Heuristique → `R_non_attr` strict ou watch.  
3. Secondary : jours seuls vs `volumeSecondaryTouch`.  
4. Reformuler vs retirer `disc_muscle_reorient`.  
5. Insérer lot **E0** avant P3.2a ? (recommandé : **oui**).  
6. Autoriser rejeu golden IndexedDB dès que l’app est dispo.

---

## Verdict

Le plan P3 reste viable. Les incohérences P3.2 **comptables** sont levables par le modèle §2–3. Le blocage principal pour une « validation P3.2 » n’est plus seulement musculaire : c’est aussi la **pertinence éditoriale** (priority list + cartes-limites), démontrée dans le code de sélection.

**P3.2 n’est pas validable** tant que : (a) invariants exclusifs adoptés, (b) politiques muscle/limites arbitrées, (c) golden 4016 produit, (d) lot E0 cadré.

**P3.0/P3.1** : pas de réécriture — correctifs de **place** dans la hiérarchie, pas de remise en cause du refus d’inventer l’adhérence.
