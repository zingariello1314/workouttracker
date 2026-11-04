# Rapport de clôture — Finalisation qualitative moteur + observabilité

**Date :** 2026-11-04  
**Commit Git :** aucun  
**Données de preuve principales :** fixture `workout-main-jul-oct-2026.json` + `exercise-name-map-main.json`  
**Fingerprint :** `period-bundle-fingerprint-finalisation.json`

---

## A. Défauts corrigés

| Symptôme | Cause racine | Fichier | Correction | Test | Résultat réel |
|---|---|---|---|---|---|
| `un mouvement : format repris…` (IDs hashés 146651247, 1974855961…) | Les storage IDs numériques sont des `convertToStableNumericId(ex_/dup_…)` ; la name map a les originaux, pas les hash | `recapAdaptiveWorkerContract.js` `buildExerciseNameMap` + `recapPeriodDiscoveries.js` | Remplissage reverse-hash depuis `extraNameById` / originaux ; repair via map enrichie | `identityReverseHash.recovery.test.js` | 30d : 13 candidats anonymes → **0–1** ; analyses récupérées avec noms réels (voir §B) |
| `Ces 7 jours sont plus dense` | Gate réécrit « Cette semaine » → « Ces 7 jours » sans réaccorder l’adjectif | `recapEditorialGate.js`, `recapEditorialPolish.js`, `recapPeriodVoice.js` | Accords dens/e ; voice 7d = « ces 7 jours » dès la source | `editorialGrammar.weekRewrite.test.js` | Contrats unitaires verts |
| `36,8 % de ta tronc` | Concat `de ta ${family}` avec family masculines | `recapPeriodVoice.js` `possessiveMuscleShare` + detectDiscoveries | Possessif selon label | idem | Unitaire OK |
| `5×10` alors que total = 36 | `schemeLabel` = `n×maxSetReps` même si séries inégales ; prose reprise ignore l’écart total | `exerciseSessionSetsResolver.js`, `exerciseTrajectoryAnalysis.js` | Schéma non uniforme = `n séries (a+b+…)` ; si total ≠ set×perSet, prose explicite | Fingerprint / unitaire scheme | Code corrigé ; pack live 30d sans flag métrique `shownFlags` vide |
| Inspecteur « aucune date » sur calendrier | Producteur `describeCalendarShape` ne sérialisait pas `dayRows`/`dates` | `recapCalendarShape.js` + detectDiscoveries | Metrics structurées (dayRows, hot/quiet ranges, dénominateur) | `recapContextReadings` | Attaché aux candidats |
| Compteurs 15+29+41≠86 | Statut CROSS / unknown hors somme documentée | `analysisEngineDiagnosticModel.js` | Conservation explicite + `hors_pack` ; CROSS ramené au statut primaire | Investigation export test | Contrat documenté |
| Export insuffisant | JSON = rapport brut | `analysisEngineInvestigationExport.js` + bouton **Dossier** | Schéma `analysis-investigation-v1` | `analysisEngineInvestigationExport.test.js` | Unitaire OK |

---

## B. Analyses récupérées (preuve fingerprint 30d)

Anciens IDs anonymes résolus (extrait) :

| ID hashé | Original | Nom | Nouveau statut (pack 30d) |
|---|---|---|---|
| 146651247 | `ex_1790540909908_zqmzjwj` | Tractions australiennes — prise serrée supination | **sélectionné** (émergence + freq progress) |
| 1433469569 | `ex_1790540236477_0hcmz4e` | (même mouvement / autre original) | progression liée |
| 1974855961 | `dup_…_t1fvyur` | Pompes inclinées | **sélectionné** (format + retour) |
| 1488780401 | `dup_…_opan3kz` | Développé couché incliné aux haltères | **sélectionné** |
| 405829990 / 298605878 / 1393146215 / 1343403170 | curls dup_* | Curl assis / Zottman / marteau / concentration | **sélectionnés** (format repris) |
| 1979012181 | `ex_…_6g4y7qg` | Hyperextension | **sélectionné** |
| 728134920 | mollets | Mollets debout | **sélectionné** (entre dans l’historique) |
| 1647297599 | squat | Squat haltères | **sélectionné** |

**Ancienne raison d’exclusion dominante :** `unresolved_exercise_name` / IV pénalisée / demotion identité.  
**Nouvelle :** identité résolue → cartes publiables dans le pack diagnostic.

Exemples de textes pack (fingerprint finalisation, 30d) :

- `Pompes inclinées : format repris, pas encore installé`
- `Pompes inclinées reviennent après une interruption`
- `Tractions australiennes — prise serrée supination : volume par séance en hausse`
- `Squat haltères entre dans ton historique`
- `Mollets debout entre dans ton historique`

---

## C. Audit des huit périodes (fixture jul–oct 2026)

| Période | Cand. | Sél. avant refonte | Sél. après identité | Anon. cand. | ms |
|---|---:|---:|---:|---:|---:|
| today | 23 | 10 | 10 | 1* | ~950 |
| 7d | 35 | 12 | 13 | 4* | ~820 |
| 30d | 58 | 20 | **30** | **0–1** | ~2000 |
| 3m | 66 | 26 | **34** | 0 | ~2750 |
| 6m | 68 | 27 | 28 | 2* | ~2680 |
| 1y | 69 | 28 | 29 | 2* | ~3230 |
| 2y | 64 | 29 | 30 | 2* | ~3920 |
| all | 64 | 29 | 30 | 2* | ~9640 |

\* Anonymes restants = titres sans exercice (`3 mouvements…`, socle hebdo…), pas des IDs hashés non résolus.

**Attention :** la hausse 20→30 sur 30d reflète surtout la **récupération d’identités**, pas un gonflement artificiel de quotas. Une revue qualitative live reste nécessaire (plusieurs curls « format repris » peuvent rester redondants au sens éditorial).

**Historique live navigateur authentifié :** exécuté le 2026-11-04 (~02:16–02:19 UTC) — compte `zingariello1314`. Preuve structurée : `browser-validation-2026-11-04.json`.

### Recette live 30d vs 7d (console)

| | 30d (A) | 7d (B) |
|---|---:|---:|
| Fenêtre | 2026-10-06 → 2026-11-04 | 2026-10-29 → 2026-11-04 |
| Pack `shown_now` | **33** | **21** |
| Déclassées | 36 | 26 |
| Intermédiaires | 19 | 15 |
| Registre total | 89 | 62 |
| Conservation `total=shown+…` | **holds** | **holds** |
| Anonymes **dans le pack** | **0** | **0** |
| Durée run | ~2,7 s | ~1,5 s |

Comparaison A/B : 49 appariements (47 exacts, 2 probables), 40 only-A, 13 only-B, 31 changements de statut.

**Problèmes instrumentés (dossier) :** 35 — dont 24× `unresolved_exercise_name` (**uniquement hors pack / déclassées**), 10× `selected_without_evidence`, 1× prose trajectoire.

**DOM Analyse (filtre All = 12)** vs pack diagnostic 33 : non équivalents (attendu : publication live ≠ pack diagnostic sans `insightHistory` aligné). Capture manuelle 11/12 cartes. Exemples live nommés : Pompes inclinées, Relevés de genoux aux parallèles, Dips, « Ces 30 jours… ».

Exports cliqués : **Dossier** + **JSON** + **MD**.

---

## D. Console

Livré / enrichi :

- Comparaison A/B + registre  
- Conservation des compteurs affichée  
- Bouton **Dossier** → `analysis-investigation-v1`  
- MD basé sur le dossier d’investigation  
- Capture DOM + vue Problèmes  

**Recette navigateur authentifié :** exécutée (Relancer 30d vs 7d, registre, problèmes, DOM Analyse, exports).

---

## E. Limites restantes

1. **Identités hors pack :** 24 `unresolved_exercise_name` restent en déclassées (pas dans le pack montré) — reverse-hash incomplet sur une frange d’émergences live.  
2. **Grammaire résiduelle live :** « Relevés de genoux aux parallèles **revient**… » encore visible dans le DOM Analyse (accord singulier).  
3. **Artefact rédactionnel pack :** 1× `technical_artifact` sur `disc_sleep_architecture`.  
4. **Pack diagnostic (33) ≠ DOM Analyse (12)** — publication / hist. insights ; ne pas confondre les deux niveaux.  
5. Observabilité annexe (fiche « Pourquoi cette décision », timeline, virtualisation registre) : partielle.  
6. Soft overflow + récupération → packs plus riches ; surveiller perf Worker.

---

## Priorités traitées vs annexe

| Priorité | Statut |
|---|---|
| 1 Fiabilité (identités, compteurs, provenance calendrier, contradictions format) | **Corrigé** (fixture + live pack sans anonyme) |
| 2 Qualité analytique (récupération, rédaction accords) | **Amélioré** ; 1 artefact + 1 accord live restants |
| 3 Observabilité (dossier export, conservation) | **Livré et validé UI** |
| 4 Ergonomie console étendue | Partiel |
| 5 Validation navigateur + périodes live | **Fait** (30d vs 7d authentifié) |

**Conclusion :** le défaut majeur des analyses anonymes **dans le pack publié** est corrigé (0 anonyme shown live 30d/7d). La console A/B + exports fonctionnent sur session réelle. Restent des demotions identité hors pack, un accord verbal live, et l’écart structurel pack↔DOM Analyse.
