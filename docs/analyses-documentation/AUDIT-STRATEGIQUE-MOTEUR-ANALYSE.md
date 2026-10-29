# Audit stratégique — moteur d’analyse Momentum Sport

**Date :** 29 octobre 2026  
**Périmètre :** génération des cartes Analyse (toutes plages horaires ; les 14 cartes « 30 jours » servent de cas d’étude, pas de limite de solution)  
**Méthode :** lecture du chemin d’exécution réel (graft + sources), sans modification du code applicatif  
**Réponse aux questions centrales :**

1. **Momentum dispose-t-il déjà de suffisamment de données pour de meilleures analyses, mais ne sait pas les exploiter ?**  
   **Oui, en grande partie.** Le snapshot local conserve un historique daté (séances, reps, GTG, endurance, Garmin sommeil / métriques journalières, feedbacks). Le catalogue de séances et le moteur de jalons savent déjà regarder **hors fenêtre** (ex. gap 77 jours). En revanche, la profondeur d’interprétation, la décomposition multi-facteurs et la sélection anti-redondance restent en deçà de ce que les données permettraient.

2. **Le moteur est-il limité par son architecture analytique, par ses règles de rédaction, ou par les deux ?**  
   **Par les deux, avec dominance analytique.**  
   - **Analytique :** détection riche mais fragmentée (plusieurs moteurs parallèles), peu de « dossiers » multi-signaux fusionnés, décomposition fréquence×volume partielle, pas de couche de contradictions entre cartes.  
   - **Rédaction / temporalité :** templates phrase-par-phrase et formulations « Tu viens de… » longtemps ancrées sur l’événement sans ancrage calendaire lecteur (partiellement corrigé via `recapEventVoice`, à généraliser).  
   - **Sélection :** caps et kinship existent mais laissent passer doublons proches (cas 11/13) et n’optimisent pas la complémentarité informative.

---

## A. Architecture actuelle

### A.1 Chemin d’exécution confirmé (production)

```
useRecapTabMetrics (src/hooks/useRecapTabMetrics.js)
  → buildAdaptiveRecapInsights (src/utils/sport/recapAdaptiveInsights.js)
      → buildComposedInterpretationPipeline (src/utils/sport/recapInterpretationPipeline.js)
          → buildUserTrainingState
          → detectStateTransitions / analyzePerformanceRobustness
          → buildAthleteTrainingIdentity / buildAthleteJourney
          → buildTrainingPhenomena
          → buildPeriodDiscoveryBundle (src/utils/sport/recapPeriodDiscoveries.js)  ★ cœur des cartes « découverte »
          → detectTrainingEvents
          → detectTrainingRelations
          → buildHorizonEssayCandidates (src/utils/sport/recapHorizonEssays.js)
              → ré-émet discoveryBundle.selected via emit(kind, title, body, …)
          → renderInterpretations
      → spanStories + candidates
      → applyNoveltyWeights / applyNatureWeights
      → keepDistinctProofCards (src/utils/sport/recapCardKinship.js)
      → filterValidInsights
      → columnCapsForCandidates + selectNarrativeColumns
      → insights.{shortTerm, mediumTerm, longTerm}
  → RecapAnalyseView lit assessment.insights et affiche les cartes
```

**Pas de LLM / API generative** dans `src/` pour ce chemin (recherche `openai|anthropic|llm|generateText|@ai-sdk|gpt-4` : 0 hit indexé). Moteur **100 % déterministe, client-side**, sur le snapshot Workout + Garmin fusionné.

### A.2 Étapes détaillées

| Étape | Où | Rôle |
| --- | --- | --- |
| 1. Collecte | `useWorkout` / snapshot, `mergeGarminDataForRecap` | Workout keys datées, endurance, GTG, Garmin sleep/daily, quiz |
| 2. Normalisation | `buildSessionCatalog`, `measureRecapWindow`, `buildPeriodComparisons` | Fenêtres p / d7 / d30 / prevSameLength, voix (`periodVoice`) |
| 3. Indicateurs | `userTrainingState`, `athleteTrainingIdentity`, features volume/freq | Deltas %, push/pull, alignment, etc. |
| 4. Événements / relations | `recapMilestoneEngine`, `trainingEventDetector`, `trainingRelationEngine`, sleep/GTG discoverers | Retours, PR, cumul, sommeil×perf, GTG hors planning |
| 5. Candidats | `detectDiscoveries` + sleep + threads (`recapAnalysisProofs` / `writeThreadCard`) + GTG + essays | Objets `{kind, nature, title, body, evidence, score, family}` |
| 6. Scope période | `filterDiscoveriesByPeriodScope` (`recapDiscoveryPeriodScope.js`) | Drop si activité insuffisante pour la nature (ex. sleep_cardio sans course) |
| 7. Sélection découvertes | `selectPeriodDiscoveriesWithTrace` | Caps par nature×famille (sport/sleep/milestone), rivals, score min, mémoire |
| 8. Gate éditorial | `applyEditorialGate` (`recapEditorialGate.js`) + `writeThreadCard` (`recapAnalysisDepth.js`) | Réécriture / rejet rédactionnel |
| 9. Validation | `filterValidInsights` | Filtre dur Spec #24 |
| 10. Colonnes UI | `keepDistinctProofCards` → `selectNarrativeColumns` | 3 horizons short/medium/long |
| 11. Affichage | `RecapAnalyseView` | Motifs Progression / Sommeil / Rythme / etc. |

### A.3 Modules nommés — rôle réel

| Module | Utilisé en prod ? | Rôle |
| --- | --- | --- |
| `recapPeriodDiscoveries.js` | **Oui** (via pipeline) | Bundle comparaisons + détection + sélection |
| `recapDiscoveryPeriodScope.js` | **Oui** | Garde-fou activité / nature |
| `recapEditorialGate.js` | **Oui** | Gate post-sélection |
| `recapAnalysisDepth.js` | **Oui** (threads + tests) | Rédaction structurée « dossier → carte » pour threads |
| `recapMilestoneEngine.js` | **Oui** (`appendMilestoneDiscoveries`) | Jalons (retour exo, cumul, objectifs…) |
| `recapHorizonEssays.js` | **Oui** | Convertit découvertes sélectionnées + essais génériques en candidats colonnes |
| `recapAdaptiveInsights.js` | **Oui** | Orchestration finale insights |
| `recapInterpretationPipeline.js` | **Oui** | Compose state + discoveries + essays |
| `recapCardKinship.js` | **Oui** | Dédoublonnage preuves |
| `recapEventVoice.js` | **Oui** (jalons récents) | Temporalité « Tu viens / Hier / Le DATE » |

### A.4 Sources de données et historique

| Source | Précision temporelle | Hors fenêtre utilisable ? |
| --- | --- | --- |
| `workoutData.reps` / `checkedExercises` (clés datées) | Jour calendaire | **Oui** — catalogue complet jusqu’à `endYmd` |
| Endurance (pompes, course, etc.) | Jour | Oui |
| GTG | Jour + planned/unplanned | Oui (fenêtre pour agrégats, historique pour repères) |
| Garmin sleep / dailyMetrics | Nuit / jour | Oui ; journey sleep ≈ 90 j. dans le bundle |
| Feedbacks difficulté | Liés aux séances | Oui si présents |
| Programme actif / complétion | Jour planifié | Partiel (dépend du programme courant) |
| Quiz profil | Statique | Contexte d’objectif |

**Absence de données ≠ absence d’activité :** le code distingue souvent « aucun enregistrement dans Momentum » (ex. premier hyperextension dans la fenêtre) mais la prose peut encore glisser vers une lecture « jamais pratiqué ». Spec et templates le rappellent parfois (« ce chiffre fixe le point de départ ») — inégale selon les kinds.

---

## B. Diagnostic des limites

### B.1 Problèmes vérifiés

1. **Analyses souvent descriptives** : beaucoup de cartes = 1 signal + 1–2 chiffres + phrase de prudence, sans décomposition ni implication actionnable.
2. **Historique disponible mais sous-exploité pour l’interprétation** : gaps (77 j.) et baselines existent ; peu de chaînes « pourquoi maintenant / qu’est-ce qui a changé entre-temps ».
3. **Temporalité lecteur imparfaite** : formulations « Tu viens de… » sur événements anciens dans une vue 30 j. (partiellement adressé par `recapEventVoice` sur jalons ; pas partout).
4. **Doublons / quasi-doublons** : cartes 11 et 13 (25 000 reps) — même corps, titres proches ; `keepDistinctProofCards` ne fingerprint que certains openings « volume », et le match exact de blob échoue si le titre diverge.
5. **Taxonomie UI trompeuse** : carte 7 labellisée « Sommeil » alors que le fond est GTG hors planning (motif / family mapping).
6. **Fragmentation architecturale** : discoveries + milestones + relations + essays + span stories → même fait peut être reformulé plusieurs fois avant sélection.
7. **Sélection = caps de diversité, pas d’utilité marginale** : on remplit des quotas sport/sleep/milestone par nature ; on ne maximise pas « information nouvelle pour l’utilisateur ».
8. **Pas de couche « contradictions / alliances » entre cartes** : sommeil↑volume et difficulté↑après nuit longue peuvent coexister sans synthèse.

### B.2 Causes techniques (par type)

| Type de défaut | Exemples | Cause code |
| --- | --- | --- |
| Données | Sommeil 10 nuits seulement | Garmin partiel — limite réelle |
| Calcul | Volume mois décomposé freq + reps/séance | **Existe** dans carte 5 ; rarement généralisé |
| Raisonnement | Reprise genoux : gap + ratio + mate day, mais pas « séances manquées / programme / intention » | Détection événementielle sans dossier multi-sources |
| Rédaction | « Tu viens d’enregistrer » | Templates + ancrage temporel faible |
| Sélection | Doublon 25k ; trop de sommeil vs trop peu de synthèse | Caps + kinship insuffisant |

---

## C. Capacités déjà présentes

### C.1 À préserver (fonctionne réellement)

- Fenêtres comparables de même durée (`prevSameLength`) et voix par période (`periodVoice`).
- Catalogue de séances + appariement nuits (`pairSessionsWithNights`).
- Baselines d’exercices et absences significatives (`isMeaningfulAbsence`, median interval).
- Jalons de retour (gap calendaire hors fenêtre) — preuve : 77 jours sur relevés.
- Niveau reproductible (ex. 20 reps × 5/5).
- Associations sommeil × volume / difficulté (cartes 9, 12).
- GTG hors planning vs planning (cartes 4, 7, 14).
- Share musculaire + push/pull (carte 8) avec prudence « composition de fenêtre ».
- Scope d’activité (ne pas inventer du cardio sans run days).
- Gate éditorial + tests abondants (`recapPeriodDiscoveries`, `recapEditorialGate`, `recapDiscoveryPeriodScope`, milestones, GTG, kinship…).
- Moteur local déterministe (reproductible, offline, privé).

### C.2 Existe mais insuffisant

| Capacité | État |
| --- | --- |
| Décomposition volume → fréquence × reps/séance | PARTIEL (carte volume mois) |
| Reprises / ruptures | PARTIEL (milestones + phenomena contraction) |
| PR vs niveau reproductible | PARTIEL (events + established) |
| Croisement sommeil × perf | PARTIEL (assoc + window facts) |
| Contextualisation hors fenêtre | PARTIEL (gaps, journey 90 j. sommeil, cumul lifetime) |
| Déduplication sémantique | PARTIEL (kinship volume + blob exact) |
| Temporalité « aujourd’hui vs DATE » | PARTIEL (`recapEventVoice` sur jalons) |
| Threads `writeThreadCard` | PARTIEL (qualité variable selon dossier) |

### C.3 Absent (ou non branché comme raisonnement)

- Dossier analytique unifié (faits / interprétations / hypothèses structurés) consommé par la sélection.
- Moteur de contradictions entre cartes sélectionnées.
- Utilité marginale / information gain pour le ranking.
- Causal inference contrôlée (au-delà d’associations descriptives).
- Distinction systématique « pas de données Garmin » vs « nuit courte ».
- LLM (aucune intégration actuelle sur ce chemin).

---

## D. Étude des 14 analyses (fenêtre 30 jours — cas d’étude)

> Ces diagnostics servent à illustrer les défauts du **système** ; la solution cible doit bénéficier à **toutes** les plages (`today`, `7d`, `30d`, `3m`, … `all`) via la même logique de voix / profondeur / sélection.

### 1. Progression — Relevés de genoux (retour 77 j.)

| | |
| --- | --- |
| **Détecté** | `disc_ms_return` / EXERCISE_FIRST_RETURN — gap, volume vs moyenne pré-interruption, companion same-day |
| **Données** | Catalogue historique complet + séance fenêtre |
| **Raisonnement** | Événement de reprise + ratio d’intervalle + mate muscle |
| **Manqué** | Dates exactes de reprise côté lecteur ; intention programme ; séances depuis la reprise ; charge/série ; lien carte 10 (barre) |
| **Cause** | Fort en détection, faible en dossier multi-cartes et temporalité lecteur |

### 2. Sommeil — Rythme habituel

| | |
| --- | --- |
| **Détecté** | Habitudes coucher/lever/durée + outlier 7 oct. |
| **Données** | Nuits Garmin fenêtre |
| **Raisonnement** | Stats de placement, pas lien entraînement |
| **Manqué** | Corrélation avec jours entraînés / GTG / difficulté ; stabilité semaine vs week-end |
| **Cause** | Carte descriptive mono-source (sommeil seul) |

### 3. Progression — Hyperextension « apparaît »

| | |
| --- | --- |
| **Détecté** | Premier enregistrement dans l’historique dispo + share dos + mate day |
| **Données** | Snapshot (aucun histo avant) |
| **Raisonnement** | Correctement prudent (« point de départ ») |
| **Manqué** | Lien programme (ajout récent ?) ; volume relatif aux autres exos dos |
| **Cause** | Limite données + peu de croisement programme |

### 4. Activité — GTG hors planning

| | |
| --- | --- |
| **Détecté** | 12 passages, 76 reps, zone facile |
| **Raisonnement** | Utilité pour continuité |
| **Manqué** | Quels mouvements ; jours concernés ; lien performance pompes (carte 14) ; planned vs unplanned ratio |
| **Cause** | Agrégat GTG sans fusion avec progression |

### 5. Rythme — Volume du mois

| | |
| --- | --- |
| **Détecté** | 4540 vs 3564, +freq, reps/séance, contraste 7 j. |
| **Raisonnement** | **Bon exemple** de décomposition déjà dans le moteur |
| **Manqué** | Quels exos portent la hausse ; qualité vs quantité ; lien sommeil (12) |
| **Cause** | Manque de couche « synthèse croisée » post-sélection |

### 6. Sommeil — Dispersion coucher

| | |
| --- | --- |
| **Détecté** | σ ≈ 155 min |
| **Raisonnement** | Mono-métrique |
| **Manqué** | Impact sur séances du lendemain ; redondance avec carte 2 |
| **Cause** | Sélection sleep caps remplit des slots sans utilité marginale |

### 7. « Sommeil » — GTG hors planning vs fenêtre précédente

| | |
| --- | --- |
| **Détecté** | 4 jours sauvés vs 0 avant |
| **Problème UI** | Motif Sommeil pour un signal GTG |
| **Manqué** | Fusion avec carte 4 ; ne pas compter comme insight sommeil |
| **Cause** | Mapping family/motif + deux angles du même phénomène |

### 8. Répertoire — Share pectoraux / push-pull

| | |
| --- | --- |
| **Détecté** | Shares + déficit dos estimé (~478) |
| **Raisonnement** | Correctement borné à la fenêtre |
| **Manqué** | Intensité (pas que reps) ; évolution vs 30 j. précédents ; lien programme |
| **Cause** | Volume reps comme proxy unique |

### 9. Sommeil — Difficulté ressentie

| | |
| --- | --- |
| **Détecté** | 2,7 vs 4,2 selon durée nuit |
| **Raisonnement** | Association + disclaimer échelle perso |
| **Manqué** | n par bin trop petit ? causalité inverse (séance dure → note) ; croisement volume |
| **Cause** | Assoc sans robustesse / n affiché |

### 10. Progression — Niveau reproductible 20 reps

| | |
| --- | --- |
| **Détecté** | Série stable 5/5 |
| **Manqué** | Lien carte 1 (même famille genoux) ; charge ; progression depuis |
| **Cause** | Pas de clustering par mouvement / famille |

### 11 & 13. Rythme — 25 000 reps cumulées (**doublon**)

| | |
| --- | --- |
| **Détecté** | `disc_ms_cumul` + `cumulReading` (lifetime depuis 2026-01-05) |
| **Problème** | Deux cartes quasi identiques |
| **Cause technique probable** | Kinship ne regroupe pas les non-« volume openings » ; titres légèrement différents ⇒ blob distinct ; ou double émission essay/span. **À confirmer** par un test de régression sur `keepDistinctProofCards` + `selectNarrativeColumns` avec ce corps. |

### 12. Sommeil — Volume et récupération

| | |
| --- | --- |
| **Détecté** | 260 vs 218 reps selon nuit |
| **Manqué** | Lien cartes 5, 9 ; confondre corrélation / sélection des jours durs |
| **Cause** | Bon signal isolé, pas de graphe de relations affichées |

### 14. Progression — Repère pompes 20→25

| | |
| --- | --- |
| **Détecté** | Max 2 sept. → 6 oct. ; 80 % reps hors planning |
| **Raisonnement** | Historique hors fenêtre affichée **déjà** utilisé |
| **Manqué** | Trajectoire intermédiaire ; lien cartes 4/7 ; reproductibilité du 25 |
| **Cause** | Landmark mono-ligne sans série temporelle |

### Synthèse D

Les 14 cartes prouvent que le moteur **sait déjà** : sortir hors fenêtre, décomposer un volume, associer sommeil, détecter reprises et GTG. Elles prouvent aussi qu’il **échoue** à : fusionner les signaux liés, dédupliquer, ancrer le temps lecteur, et produire une conclusion de second niveau (« ce que ça implique ensemble »).

---

## E. Options d’amélioration

### E1 — Renforcer le moteur déterministe (recommandé en priorité)

| | |
| --- | --- |
| **Quoi** | Couche « Analytical Claim / Dossier » ; ranking par utilité ; dédup sémantique ; temporalité généralisée ; fusion de signaux liés |
| **Avantages** | Offline, privé, testable, gratuit, cohérent avec l’existant |
| **Risques** | Complexité de maintenance si on empile encore des if |
| **Coût** | Eng. produit / tests — pas d’API |

### E2 — Architecture analytique supplémentaire (couche unique de claims)

| | |
| --- | --- |
| **Quoi** | Un bus de *claims* typés (`ReturnClaim`, `AssociationClaim`, `ThresholdClaim`…) produits par les détecteurs actuels, puis un *Composer* qui assemble 1 carte = 1 thèse + preuves |
| **Avantages** | Réduit la fragmentation essays/discoveries/milestones |
| **Risques** | Refactor moyen ; besoin de migration progressive |
| **Compat** | Réutilise detectors existants |

### E3 — LLM optionnel (non par défaut)

| | |
| --- | --- |
| **Où il aiderait** | Reformulation / priorisation narrative **après** claims validés — jamais pour inventer des chiffres |
| **Où il nuirait** | Calculs, dates, hors-ligne, reproductibilité, coût, privacy |
| **Verdict** | Utile seulement comme polish contrôlé (JSON claims → prose), avec validation schema stricte. **Non nécessaire** pour le saut de qualité principal. |

### Comparatif court

| Option | Qualité analytique | Coût | Risque | Fit Momentum |
| --- | --- | --- | --- | --- |
| E1 | Élevée | Moyen | Faible | ★★★★★ |
| E2 | Très élevée | Élevé | Moyen | ★★★★ |
| E3 | Cosmétique / style | Variable | Moyen–élevé | ★★ |

---

## F. Proposition d’architecture cible

### F.1 Composants

1. **Evidence Store** — lecture seule du snapshot + Garmin (déjà là).  
2. **Detectors** (existants) — émettent des *Evidence atoms* (faits datés, métriques, fenêtres).  
3. **Claim Builder** (nouveau) — assemble atoms → claims typés avec :
   - `eventYmd`, `window`, `confidence`
   - `facts[]` / `interpretation` / `hypothesis?`
   - `relatedClaimIds`
4. **Temporal Voice** (`recapEventVoice` généralisé) — choisit les formulations selon `eventYmd` vs aujourd’hui.  
5. **Claim Graph** — liens same-exercise, same-day, sleep↔session, GTG↔PR.  
6. **Selector** — maximise couverture informative (pénalise redondance, récompense complementary edges).  
7. **Composer** — 1 claim (ou petit cluster) → titre + corps + evidence (templates structurés, éventuellement `writeThreadCard`).  
8. **Validators** — period scope, editorial gate, fact check (nombres ∈ atoms).  
9. **UI** — colonnes inchangées en surface ; motifs corrigés (GTG ≠ Sommeil).

### F.2 Flux cible

```
Detectors → Atoms → Claims (+ Temporal Voice)
                ↓
         Claim Graph
                ↓
         Selector (utilité)
                ↓
         Composer → Cards
                ↓
         Validators → assessment.insights
```

### F.3 Invariants

- Aucun chiffre hors atoms.  
- Fenêtre = périmètre principal ; historique = contexte explicite.  
- « Tu viens de » ⇔ `eventYmd === today`.  
- Une preuve = une carte (sauf cluster complémentaire volontaire).  
- Même logique pour toutes les `periodVoice` (today → all).

---

## G. Plan de mise en œuvre

### Phase 0 — Instrumentation (1–2 j.)

- Logger `periodDiscoveries.debug` + candidats droppés en admin.  
- Snapshot golden des 14 cartes 30 j. (titres, kinds, bodies) comme corpus de non-régression.  
**Critère :** pouvoir rejouer les 14 kinds.

### Phase 1 — Quick wins sélection / temporalité (tous periods)

- Dédup par empreinte de corps (ignorer titre) + plafond 1 `disc_ms_cumul` / seuil.  
- Généraliser `recapEventVoice` à tous les leads « Tu viens ».  
- Corriger mapping motif GTG vs Sommeil.  
**Critère :** plus de doublon 11/13 ; temporalité OK sur fixtures multi-dates.

### Phase 2 — Claim model mince

- Wrapper detectors → claims sans casser UI.  
- Composer lit claims pour 3–5 kinds pilotes (return, cumul, volume_decomp, sleep_assoc, gtg_unplanned).  
**Critère :** tests « expected claims / forbidden claims » verts.

### Phase 3 — Graph + selector utilité

- Liens related ; scoring marginal.  
- Fusion cartes 4+7, 1+10, 5+12 quand complementary.  
**Critère :** sur corpus 30 j. / 7 j. / 3 m., diversité informative ↑ (rubrique humaine + métriques de redondance).

### Phase 4 — Profondeur

- Décomposition systématique fréquence×dose.  
- Trajectoires intermédiaires (pompes 20→25).  
- Affichage n / confiance associations.  
**Critère :** grilles d’acceptation qualitatives sur cas représentatifs.

### Phase 5 — (Optionnel) LLM polish

- Uniquement si Phase 2–3 stables ; schema JSON claims → prose ; reject si drift numérique.

### Risques de régression

- Caps trop agressifs → pages « vides » sur users jeunes.  
- Refactor essays → double comptage pendant transition.  
- Changer temporalité → snapshots de tests prose à mettre à jour.

### Tests / preuves (méthode qualité ≠ longueur)

| Axe | Comment |
| --- | --- |
| Calculs | Fixtures numériques (gaps, %, shares) |
| Dates / fenêtres | `recapDiscoveryPeriodScope` + voice fixtures |
| Non-invention | Assert : tout entier du body ∈ atoms |
| Croisements | Cas multi-sources obligatoires |
| Interprétation | Rubrique attendue / interdite par cas |
| Redondance | Similarité cosine / exact body ; max 1 claim/seuil |
| Titres | Cohérence motif ↔ kind |
| Robustesse | Snapshot sans Garmin, sans GTG, 1 séance |
| Régression | Corpus 14 cartes + jeux 7d / 3m / all |

**Jeu de cas représentatifs (à constituer) :**

| Cas | Sources | Attendu | Interdit |
| --- | --- | --- | --- |
| Reprise 77 j. vue 30d | histos + séance | DATE ancrée, gap exact | « Tu viens » si pas today |
| Cumul 25k | lifetime | 1 carte | Doublon |
| GTG + PR pompes | GTG + max | Lien explicite | Deux cartes disjointes sans lien |
| Volume + sommeil | reps + nights | Synthèse ou cross-ref | Deux monologues |
| Premier exo | pas d’histo | « premier enregistrement » | « tu n’as jamais fait » |

---

## H. Questions encore ouvertes

1. **Confirmation exacte du doublon 11/13** — faut un dump `assessment.insights` (ids/kinds) au moment du rendu ; hypothèse kinship/titres, non prouvée à 100 % sans runtime.  
2. **Couverture Garmin réelle** (combien de nuits / users) — limite le plafond sommeil.  
3. **Politique produit** : combien de cartes max par plage ? priorité « pédagogie » vs « alertes » ?  
4. **Programme / modifications d’exercices** — granularité historique des changements de programme suffisamment fine pour « ajout récent » ? À vérifier dans le modèle `programs`.  
5. **Feedbacks** — densité réelle des notes de difficulté (carte 9 fragile si n faible).  
6. **Souhaite-t-on exposer facts/interprétation/hypothèse dans l’UI** ou seulement en interne ?  
7. **Perf** — budget CPU acceptable pour Claim Graph sur historiques longs (`all`) ?  
8. **Les agents d’exploration parallèles** de cette session ont été limités (quota modèle) ; cet audit s’appuie sur le chemin graft/lecture directe — un second passage runtime sur fixtures utilisateur renforcerait D et H.1.

---

## Annexes

### A. Fichiers pivots

- `src/hooks/useRecapTabMetrics.js` — entrée métriques Recap  
- `src/utils/sport/recapAdaptiveInsights.js` — orchestration insights  
- `src/utils/sport/recapInterpretationPipeline.js` — pipeline composé  
- `src/utils/sport/recapPeriodDiscoveries.js` — découvertes période  
- `src/utils/sport/recapMilestoneEngine.js` — jalons  
- `src/utils/sport/recapHorizonEssays.js` — essais / émission colonnes  
- `src/utils/sport/recapDiscoveryPeriodScope.js` — scope activité  
- `src/utils/sport/recapEditorialGate.js` / `recapAnalysisDepth.js` — rédaction  
- `src/utils/sport/recapCardKinship.js` / `recapInsightNature.js` — sélection  
- `src/utils/sport/recapEventVoice.js` — temporalité  
- `src/components/sport/recap/views/RecapAnalyseView.jsx` — UI cartes  

### B. Principe directeur pour la suite

> **Ne pas améliorer « les 14 cartes 30 jours ».**  
> Améliorer le **moteur de claims + sélection + voix**, paramétré par `periodVoice`, pour que chaque plage horaire en hérite.

### C. Réponses synthétiques (rappel)

| Question | Réponse |
| --- | --- |
| Assez de données, mal exploitées ? | **Oui, surtout** |
| Limite archi vs rédaction ? | **Les deux ; archi/sélection d’abord** |
| LLM nécessaire ? | **Non pour le saut principal** |
| Réécriture totale ? | **Non — évolution vers Claims + Selector** |

---

*Document de référence pour faire avancer le chantier Analyses. Prochaine étape recommandée : Phase 0–1 (corpus golden + dédup + temporalité généralisée), puis validation produit avant Phase 2 Claim model.*
