# Mission 7 — Bilan P6 (intelligence structurelle, profondeur, qualité collective)

Verdict : **fondations structurelles et corrections d’évaluation livrées — qualité des conclusions encore insuffisante pour clore P6 — NO-GO P7.**

Édition : `editorial=p6-sovereign-v6` · `program=structural-adherence-v1` · `identity=discovery-occurrence-v1` · `review=collective-pass4-v3`

Références gelées :

- v5 avant Mission 7 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v5-before-mission7.json`
- v4 avant Mission 6 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v4-before-mission6.json`

---

## 1. Causes réellement diagnostiquées (Mission 6 → 7)

### Jeu C — fausse inflation de doublons

| Couche | Diagnostic |
|---|---|
| Doublons textuels | Titre+corps exacts — compteur légitime |
| Équivalences sémantiques | `substantiveEquivalence` / `semanticPhenomenonKey` |
| Collision d’identité | Corrigée en Mission 6 (`stablePublicationId` = occurrence) |
| Fausse équivalence | **Cause du FAIL « 106 doublons »** : sujets concrets distincts (ex. Hyperextension vs Pompes) collapseés quand le sujet manquait → `same_semantic_phenomenon` à tort |
| Évaluateur | `exactDuplicatesAccessible` mélangeait sémantique et textuel |

**Correctif :** sujets concrets distincts → jamais équivalents ; Game C sépare `textualDuplicatesAccessible` et `semanticEquivalentsAccessible` ; `exactDuplicatesAccessible` = textuel uniquement. Pas de contrôle complaisant.

### Réexploration `reexplored=0`

La 4e passe ne déclenchait que `under_explored` / concentration faible. Les near_equal sous-explorés et les reprises individuelles sans lecture collective ne déclenchaient rien. **Correctif Mission 7 :** triggers structurels + `exploreCollectiveReturn` sur pairs.

### Sélection / horizons

Monopole de reprises individuelles et catalogues quasi identiques sur 1 an / 2 ans / Toujours. **Correctif partiel :** `horizonBoost` favorise structure / adhérence / trajectoire sur horizons longs ; pénalise les reprises « now » hors horizon.

### Paquet qualitatif à l’aveugle

Déséquilibre titres-seuls vs textes+preuves. **Correctif :** `buildQualitativeBlindPack` v2 exige textes complets des deux côtés quand `insightsSlim` est disponible ; sinon `incompleteHistorical=true` documenté. Clé séparée. Jugement humain : **non effectué**.

### Nommage d’artefacts

Un fichier « v4 » ne doit plus contenir silencieusement une v5/v6. Écriture : `p6-replay-v{N}-latest.json` + `p6-replay-latest.json`.

---

## 2. Modules modifiés / créés

| Module | Rôle |
|---|---|
| `sessionStructureGraph.js` | Templates, relations typées, familles de séances |
| `multidimensionalAdherence.js` | Vecteur d’adhérence + contextualisation omissions |
| `structuralProgramDiscoveries.js` | Producteur structure / omission ciblée / récurrence |
| `discoveryIdentity.js` | Sujets concrets distincts non équivalents |
| `evaluation/gameCCollective.js` | Compteurs honnêtes textuel ≠ sémantique |
| `collectiveReview.js` | Réexploration structurelle |
| `collectiveSelection.js` | `horizonBoost` structure / adhérence |
| `analyticalExploration.js` | Near_equal enrichi ; retours collectifs + session/version |
| `conclusionHierarchyContract.js` | Rôles + préparation P7 |
| `underexplorationReport.js` | Occasions vs indemonstrable |
| `evaluation/incrementalP6Replay.js` | Blind pack v2 + noms d’édition |
| `evaluation/completeAuditDossier.js` | Secteurs programme / reasoning / bilans |
| `evaluation/gameBDiscoveryQuality.js` | Dimensions qualité Mission 7 |
| `analysisEdition.js` | v6 / structural-adherence-v1 / pass4-v3 |
| `recapPeriodDiscoveries.js` | `planAssessments` + graphe structurel dans `p6` |
| `plannedVsPerformedAssessment.js` | `plannedSets` / `performedSets` |

---

## 3. Architecture de compréhension structurelle

Voir chapitre dédié dans `ARCHITECTURE_AND_CONTRACTS.md` (Mission 7).

Réutilisation : `assessPlannedVsPerformed`, ledger musculaire, rapports P3 structure — **pas** un second moteur.

Généralisation démontrée en tests unitaires : A/B/C/A′/B′/C′ sur jours quelconques ; full push/pull indépendants non fusionnés ; omission 40 % reps ≠ 66 % groupes ; autres ids/jours.

---

## 4. Exemples avant / après (niveau de profondeur)

### Adhérence (scénario pédagogique)

- **Insuffisant :** « Tu as réalisé 40 % de ton programme. »
- **Après (vecteur + pattern `targeted_omission`) :** écart concentré sur une composante ; groupes intégralement couverts ≠ charge omise ; métriques non interchangeables.

### Structure (séances apparentées)

- **Avant :** lectures exercice par exercice sans famille.
- **Après :** relation `session_variant` / `similar_session` avec preuves (similarité, mouvements partagés, delta de volume) — sans règle lundi=vendredi.

Les textes live dépendent des données de la fenêtre ; les producteurs sont branchés de bout en bout.

---

## 5. Résultats des huit périodes (rejeu v6 vs v5 gelée)

Sauvegarde 19 nov. · `artifacts/analysis-eval/replays/p6-replay-v6-latest.json`

| Horizon | v5 publié | v6 publié | reexplored | Structure en catalogue | A | B | C |
|---|---:|---:|---:|---|---|---|---|
| Aujourd’hui | 6 | 6 | 0 | `disc_session_family_structure` (priorité) | FAIL | PASS | PASS |
| 7 j | 37 | **38** | **3** | famille + near_equal | FAIL | PASS | PASS |
| 30 j | 56 | **57** | **3** | famille (catalogue ; priorité encore reprises) | PASS | PASS | FAIL* |
| 3 m | 76 | **77** | 0 | famille + retour collectif | PASS | FAIL | FAIL* |
| 6 m | 82 | **83** | 0 | famille + collectif + near_equal | FAIL | FAIL | FAIL* |
| 1 an | 83 | **84** | **3** | famille + near_equal | FAIL | FAIL | FAIL* |
| 2 ans | 83 | **84** | **3** | famille + near_equal | FAIL | FAIL | FAIL* |
| Toujours | 81 | **82** | **3** | famille + near_equal | FAIL | FAIL | FAIL* |

\*C : `exactDuplicatesAccessible` textuel = **0** (plus de faux 106). FAIL restant = `lostSilent` / ids registre sans disposition (émergences fusionnées) — **échec réel de réconciliation**, pas un masquage.

Sur le programme réel (ids distincts `101`/`501`, `dup_*`) : familles **lundi+vendredi**, **mardi+samedi**, **mercredi+dimanche** détectées par similarité de noms — sans règle calendaire.

### Avant / après titres (extraits)

- **Aujourd’hui v6 :** « Des séances du programme partagent une structure commune » entre dans les priorités.
- **7 j v6 :** near_equal + structure commune en tête / haut de pack.
- **30 j :** toujours largement des reprises individuelles en priorité — défaut de sélection **non clos**.
- **1 an / 2 ans / Toujours :** tops encore très proches entre eux — temporalité **partielle**.

---

## 6. Évaluations A/B/C et non-régressions

| Contrôle | État |
|---|---|
| Tests Mission 7 structure / adhérence / jeu C / ids distincts | **9/9 PASS** |
| Édition v6 | PASS |
| Jeu C textuel vs sémantique | Correctif démontré (`exactDup` agrégé = 0) |
| Rejeu 8 horizons v6 | **Exécuté** ; ZIP `artifacts/analysis-eval/complete/momentum-p6-mission5-bis-latest.zip` |
| Paquet aveugle | `qualitative/blind-pack.json` v2 vs **baseline v5** (textes complets des deux côtés) + clé séparée ; **jugement humain non effectué** |
| DOM 8 périodes | Non revendiqué |
| Non-régression données | Aucune purge ; lecture seule |

---

## 7. Défauts résiduels (honnêtes)

1. **30 j et horizons longs :** priorité encore saturée de reprises / volumes individuels malgré la carte structurelle en catalogue.
2. **Game C FAIL** sur 30d+ : `lostSilent` sur émergences fusionnées — à traiter sans affaiblir le critère.
3. Adhérence multidimensionnelle : solide en tests ; peu visible en priorité si snapshots de plan absents / non callables.
4. Secteurs `source-data` / `program-history` exhaustifs : amorcés, pas un dump complet de toutes prescriptions hors export 8 périodes.
5. 1 an ≈ 2 ans ≈ Toujours en tête de pack : boosts insuffisants pour forcer une trajectoire historique dominante.

---

## 8. Dossier d’audit transmissible

Point d’entrée : Récap → Analyse → « Exporter le dossier d’audit complet ».

Artefacts : `p6-replay-v6-latest.json` (nom = édition réelle), `program-understanding/`, `reasoning/underexploration-report.json`, `reasoning/conclusion-hierarchy.json`, `reasoning/p7-actionability-prep.json`, `source-data/data-coverage.json`, bilans M5–M7.

---

## 9. Préparation exigences P7 (contrat seulement)

Dans `p7ActionabilityPrepFields` / claims :

- Conséquences descriptives / conditionnelles organisationnelles
- Hypothèses de continuité
- Indicateurs de suivi (préparés)
- **Interdit en P6 :** options d’intervention complètes, contre-indications cliniques, références sportives appliquées, prédictions physiologiques

P7 exigera : importance · favorise/limite · si persiste · aides adhérence · adaptations · vérification — **avec preuves**.

---

## 10. Verdict P6

| Critère Mission 7 | Statut |
|---|---|
| Diagnostic jeu C honnête | **Fait** |
| Représentation structurelle généralisable | **Fait** (tests + programme réel A/A′ B/B′ C/C′) |
| Adhérence multidimensionnelle | **Fait** (tests) / **partiel** (visibilité live) |
| Profondeur / grammaire | Amorcée — pas dominante sur 30 j+ |
| Sélection / horizons | **Partiel** |
| Réexploration 4e passe | **Améliorée** (0 → 3 sur plusieurs horizons) |
| Export audit | **Partiel** |
| Intelligence par qualité des conclusions | **Pas encore suffisante** |

**NO-GO P7.** Autorisation explicite requise avant toute phase P7.
