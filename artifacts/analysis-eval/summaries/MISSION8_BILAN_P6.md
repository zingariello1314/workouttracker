# Mission 8 — Bilan P6 (raisonnements analytiques sur fondations existantes)

Verdict : **progrès visibles sur les textes prioritaires et filiation jeu C — P6 non validée — NO-GO P7.**

Édition livrée : `editorial=p6-sovereign-v7` · `program=structural-reasoning-v1` · `review=collective-pass4-v4` · `identity=discovery-occurrence-v1` · `consolidation=narrative-coherence-v3`

Références gelées :

- v6 avant Mission 8 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v6-before-mission8.json`
- Rejeu courant : `artifacts/analysis-eval/replays/p6-replay-v7-latest.json` (exécuté `2026-11-21T02:12…`)
- Données : sauvegarde 19 novembre (`momentum-sport-backup-2026-11-19`) — pas de mélange avec live / sommeil / défis non présents

Pas de commit. Pas de P7.

---

## 1. Améliorations réellement visibles

| Horizon | Priorités v7 | Structure / trajectoire en priorité | Cartes inchangées vs v6 (titre+corps≈) | lostSilent jeu C |
|---|---:|---|---:|---:|
| Aujourd’hui | **3** (plus de remplissage à 11) | familles de séances | 1 | **0** |
| 7 jours | 11 | familles + variante de redistribution | 9 | **0** |
| 30 jours | 11 | familles + variante (+ retours individuels documentés) | 2 | **0** |
| 3 mois | 11 | famille de séances | 2 | **0** |
| 6 mois | 11 | arc mensuel + famille | 4 | **0** |
| 1 an | 11 | arc mensuel + famille | 3 | **0** |
| 2 ans | 11 | arc mensuel + famille | 3 | **0** |
| Toujours | 11 | arc mensuel + famille | 3 | **0** |

**Proportion inchangée (priorités, 8 horizons) : 27 / 83** — contre ~45/50 titres identiques dans le brief Mission 7→8, et ~67/83 après le premier passage v7. La baisse porte surtout sur 30j+ et les longs horizons, pas sur une reformulation cosmétique de toutes les cartes.

### Ce qui a changé pour le lecteur

1. **Familles de séances** : observation de similarité → description de socle commun, ajouts par variante, volumes prescrits distincts ; vue d’ensemble des **3 familles** du programme (pas seulement la première paire).
2. **Sélection** : aujourd’hui reste à 3 cartes ; les majeures structurelles / d’arc remontent sur les longs horizons ; les émergences individuelles sont plafonnées quand une majeure structurelle est déjà retenue.
3. **Filiation** : les 69 « pertes » signalées en v6 étaient surtout des **identifiants d’évaluateur obsolètes** vs `occurrenceId` / `fact:` embarqué — cartes souvent déjà publiées.
4. **Fusions abusives** : sujets `ex:` distincts ne fusionnent plus sur similarité textuelle (ex. `ex:505` vs `ex:106` restent séparés ; le jeu C compte alors des doublons *textuels* honnêtes).

---

## 2. Textes complets avant / après (livraisons verticales)

### 2.1 Familles de séances — cas positif

**Avant (v6, aujourd’hui) — `Des séances du programme partagent une structure commune`**

> Les créneaux « Street Workout + Endurance fondamentale » et « Street Workout + Cardio » forment une famille de séances (similar session, confiance high). Ils partagent 9 mouvements documentés, avec des variantes de part et d'autre. Le volume prescrit diffère (429 vs 404 répétitions prévues): ressemblance ≠ identité. Cette lecture décrit la structure programmée, pas encore sa réalisation.

**Après (v7, 7 jours) — `Deux séances apparentées redistribuent un socle commun`**

> Les créneaux « Street Workout + Endurance fondamentale » et « Street Workout + Cardio » sont fortement apparentées: elles partagent 9 mouvements documentés sur un socle commun. « Street Workout + Endurance fondamentale » ajoute tractions australiennes prise large pronation, pompes inclinees; « Street Workout + Cardio » ajoute tractions australiennes prise pronation. Le volume prescrit diffère: 429 …

**Preuves :** graphe structurel + `compareSessionPairComposition` (mouvements partagés / spécifiques, séries, volume prescrit).  
**Publication :** priorité sur 7j / 30j ; fragments `similar session` / `confiance high` retirés.

**Vue d’ensemble (v7, aujourd’hui) — `Ton programme s'organise en 3 familles de séances apparentées`**

> Le contenu réel du programme — pas son seul nom — fait apparaître 3 familles de séances: Street Workout + Endurance fondamentale / Street Workout + Cardio (2 créneaux); biceps / Pectoraux / Jambes / … ; pectoraux / Triceps / Épaules / …. Chaque famille partage un socle de mouvements, avec des variantes de volume ou de composition…

**Contre-exemple :** une similarité de nom de créneau sans socle de mouvements commun ne publie pas de famille (tests Mission 7/8).  
**Généralisation :** matching par noms normalisés de mouvements (pas d’IDs utilisateur ni jours codés en dur) — PPL / split / hybride couverts par les tests synthétiques.

### 2.2 Adhérence multidimensionnelle

**Cas positif (synthétique, tests) :** 500 prévues (300 jambes / 100 pecs / 100 biceps) vs 200 réalisées uniquement haut du corps → texte qui sépare volume global, couverture de groupes, concentration du manque (pas de moyenne arbitraire).  
**Contre-exemple :** sans plan historique fiable → pas de taux d’adhérence inventé ; lecture de la pratique émergente uniquement.  
**Sur le rejeu 19 nov. :** historique de versions de programme limité → adhérence prévu/réalisé **non déclarée démontrée en conditions réelles**. Les tests unitaires seuls ne valident pas le critère P6 « observable sur données utilisateur ».

### 2.3 Réorganisation collective du répertoire

**Avant (v6 / début Mission 8) :** carte collective publiée avec familles taxonomiques (`emergence`) et `après 0 j` — fausse « transformation collective ».

**Après correctif :** `exploreCollectiveReturn` exige interruption ≥ 14 j **et** lien musculaire / famille de séances / version de programme documenté. La taxonomie éditoriale (`emergence`, `repertoire`…) n’est plus une famille musculaire.

**Sur le rejeu 19 nov. (30 jours) :** la fausse collective a disparu des priorités ; restent des retours individuels documentés (ex. Face pull après 28 j).  
**Contre-exemple (jeu B) :** retours simultanés sans famille musculaire → `UNDER_EXPLORED`, pas de conclusion collective.  
**Limite :** les émergences réelles manquent souvent de `muscleGroup` dans les métriques → le collectif **lié** sous-produit sur cette sauvegarde. Ce n’est pas un PASS déguisé.

### 2.4 Trajectoires longues

**Après (v7, 1 an) — `octobre 2026 interrompt la baisse depuis juin 2026`**

> juin 2026: 6 947 reps en 22 jours entraînés (≈316 / jour actif) → septembre 2026: 3 704 reps en 12 jours (≈309 / jour actif), soit -47 % de volume, -45 % de jours, -2 % de volume par jour actif. Entre les deux, juillet … août …. La baisse se décompose en −3 122 répétitions liées aux jours actifs et −121 liées au volume/jour…

**Décision :** priorité sur 6m / 1y / 2y / all (souvent en milieu de pack, pas toujours #1).  
**Contre-exemple :** ne pas lire la baisse comme perte de capacité quand la densité/jour actif est stable.  
**Limite restante :** le pack long reste encore mélangé (GTG, émergences, formats) — l’arc et la famille de séances sont présents mais ne monopolisent pas encore la lecture.

---

## 3. Jeu C — filiation et évaluation

### Diagnostic des 69 « pertes » v6

| Statut réel | Exemple | Traitement Mission 8 |
|---|---|---|
| Publiée sous `occurrenceId` long, registre court `rhythm\|streak\|5` | disposition `…\|fact:rhythm\|streak\|5\|…` | Alias `fact:` + conservation `occurrenceId` dans `p6Slim` |
| Phénomène texte legacy vs occurrence | `ex:…\|emergence\|text:…` | Ignoré comme id de publication (Mission 6/7) ; multi-alias dispositions |
| Vraie perte | — | Aucune sur le rejeu v7 final (`lostSilent=0` × 8) |

**`admissiblePreserved` (ids) : true** sur les huit horizons.  
**`gameCAcrossEight.pass` : false** uniquement à cause de **14 doublons textuels accessibles** (souvent homonymes `ex:106`/`ex:505` volontairement non fusionnés — preuve que similarité ≠ identité de trajectoire).

Ne pas adoucir le critère pour obtenir PASS : les doublons textuels restent un défaut éditorial à traiter (formulation différenciée par sujet), pas une excuse pour fusionner.

### Fusions `ex:505` → `ex:106`

Bloquées : `relateClaims` / équivalence substantielle refusent la fusion de sujets `ex:` distincts. Les cartes restent accessibles séparément → comptage textuel, pas perte silencieuse.

---

## 4. Jeux A / B — détail (pas seulement compteurs)

### Jeu A (exactitude)

| Horizon | Pass | factualConflicts | Exemples d’échecs |
|---|---|---:|---|
| today | FAIL | 1 | `disc_th_concentration_now` — `priority_without_numeric_proof` |
| 7d | FAIL | 3 | concentration 13 nov. ; share 3 mouvements ; rythme trajectoire |
| 30d | FAIL | 3 | muscle exposure chest ; repertoire journey ; repertoire |
| 3m–all | FAIL | 1–3 | `disc_quarter_arc`, `disc_th_rhythm_journey`, parfois arc mensuel si proof vide |

**Cause dominante :** claim sans `proof.observedValues` / `sourceEvents` alors que le corps contient des chiffres (producteurs qui ne remplissent pas `metrics.observedValues` / champs reconnus par `observedValuesOf`).  
**Correctifs partiels Mission 8 :** `peakReps`/`troughReps`/… branchés dans `observedValuesOf` ; `disc_rest_day` marqué `documentaryOnly`.  
**Pas un PASS :** d’autres producteurs (concentration, quarter_arc, share) restent sous-prouvés au sens du jeu A.

Règle : *priorité sans preuve numérique attachée au claim* — le texte peut être factuellement correct et échouer quand même. Le correctif doit être côté claim, pas côté critère.

### Jeu B (qualité de découverte)

| Horizon | Pass | Note |
|---|---|---|
| today / 7d / 30d | **PASS** | références volume / near_equal / collectif lié OK |
| 3m–all | FAIL | surtout `disc_challenge_format_time` (attractive incorrecte) + dimensions qualité Mission 7 |

Références collectives mises à jour :

- lié (même famille musculaire + gaps ≥ 14) → doit conclure ;
- simultané sans lien → doit s’abstenir (`UNDER_EXPLORED`).

---

## 5. Réexploration (passe 4)

Les déclenchements ne se limitent plus à un compteur : near_equal, retours sans collectif, défauts d’exploration alimentent `exploration.conclusion` quand une hypothèse est retenue.  
Sur 7 jours, la carte near_equal prioritaire porte désormais une lecture de **composition différente** (« Des journées à volume proche racontent des séances différentes »), pas seulement l’égalité arithmétique.

Trace type attendue (revue) : découverte initiale → défaut → faits/relations examinés → hypothèses → conclusion enrichie ou abstention. Les artefacts `review.decisions` du partial conservent un échantillon.

---

## 6. Sélection collective — plafond 11

Mécanisme audité : `selectCollectively` traitait 11 comme objectif de remplissage dès `marginal ≥ 8`.

**Correctifs Mission 8 :**

- plafond souple (pas d’obligation de remplir) ;
- plafond de famille pour émergences individuelles ;
- si une majeure structurelle/arc est déjà en priorité, les émergences individuelles vont en réserve sauf valeur exceptionnelle ;
- `deepening_of_collective` hors priorité.

**Résultat :** today = 3 ; longs horizons gardent 11 mais avec majeures structurelles/arc présentes (pas uniquement 11 émergences).

---

## 7. Preuves de généralisation (tests)

Fichier : `src/utils/sport/__tests__/mission8Reasoning.test.js` (+ Mission 7 structurelle) — **17/17 puis 8/8 Mission 8 verts**.

Couverture exercée :

- deux séances apparentées à composants différents ;
- omission musculaire récurrente (texte d’adhérence) ;
- retour collectif lié vs simultanéité seule ;
- taxonomie `emergence` ≠ famille musculaire ;
- sélection sans remplissage cosmétique à 11 ;
- réconciliation multi-alias + `fact:` embarqué.

Cas demandés encore surtout synthétiques (PPL, une séance/semaine, substitution documentée, horizons longs équivalents vs distincts) : présents en partie dans Mission 7/8 unitaires ; **non tous rejoués comme paquets qualitatifs utilisateur**.

---

## 8. Performances (rejeu 19 nov.)

| Horizon | ms (approx.) |
|---|---:|
| today | ~5–8 s |
| 7d | ~5–7 s |
| 30d | ~6–9 s |
| 3m–all | ~10–17 s |
| assemble | ~2 s |

Fingerprint : le rejeu archive un fingerprint de snapshot ; un fingerprint « reps seuls » ne suffit pas à prouver l’identité analytique complète (programme, Garmin, défis, identités) — rappel Mission 8 §11.

---

## 9. Non-régression

- Densités appariées / défis / Garmin : non régressés volontairement (pas de modification de ces producteurs dans Mission 8).
- Jeu C filiation : **amélioration nette** (0 lostSilent).
- Homonymes non fusionnés : **préservé** (coût : doublons textuels).
- Édition v7 distincte de la baseline v6 gelée.

---

## 10. Limites (honnêtes)

1. **P6 non close** : jeux A (tous horizons) et B (longs) encore FAIL ; C FAIL sur doublons textuels malgré filiation OK.
2. **Collectif réel sous-alimenté** sur la sauvegarde 19 nov. (métadonnées musculaires manquantes sur beaucoup de retours).
3. **Adhérence multidimensionnelle** démontrée en tests, pas en rejeu historique riche en versions de programme.
4. **Sommeil / défis live** : non exercés sur ce jeu — ne pas déclarer démontrés.
5. **Longs horizons** : encore trop d’individuel en tête de pack malgré la présence d’arc + familles.
6. **Preuves claim** : plusieurs cartes prioritaires chiffrées dans le texte restent `priority_without_numeric_proof`.
7. **Dossier d’audit** : secteurs Mission 7 à terminer / normaliser ; boutons d’export Analyse conservés ; pas d’exposition publique des données personnelles.

---

## 11. État exact des critères P6

| Critère | État |
|---|---|
| Architecture / contrats inutilisés évités | OK — exploitation des fondations M7, pas de pile parallèle |
| Textes prioritaires plus riches (familles, arc) | **Partiel — visible** |
| Jeu C filiation / pertes silencieuses | **OK (0 lostSilent, admissible ids)** |
| Jeu C sans doublons textuels accessibles | **FAIL (14)** |
| Jeu A | **FAIL** |
| Jeu B tous horizons | **Partiel (courts OK, longs FAIL)** |
| Quatre livraisons verticales observables | **Partiel** (familles + trajectoire oui ; collectif réel et adhérence live insuffisants) |
| Généralisation hors overfitting utilisateur | **Partiel (tests)** |
| Comparaison qualitative v6↔v7 | Faite (27/83 inchangées ; blind pack v2) |
| Validation définitive P6 | **NON** |
| Autorisation P7 | **NO-GO** |

---

## 12. Prochaines priorités (hors P7)

1. Attacher systématiquement `observedValues` / `sourceEvents` dans `claimFromDiscovery` pour les producteurs encore vides (concentration, share, quarter_arc, rhythm).
2. Différencier les formulations des homonymes non fusionnés (supprimer les 14 doublons textuels sans fusionner les trajectoires).
3. Propager `muscleGroup` / famille de séance sur les événements de retour pour débloquer le collectif lié en conditions réelles.
4. Poursuivre la sélection longue : arc + structure en tête de pack quand l’histoire le permet.
5. Jeux de données distincts (récent, sommeil, synthétique versionné) — résultats non mélangés.
6. Finaliser le dossier d’audit (manifeste, noms v6/v7, secteurs source).

---

*Mission 8 — bilans sur preuves de rejeu et textes publiés, pas sur architecture seule.*
