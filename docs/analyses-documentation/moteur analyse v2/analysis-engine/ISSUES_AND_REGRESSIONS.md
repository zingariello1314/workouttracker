# Registre des défauts et régressions — v2

## ISS-2026-11-18-TODAY-CALENDAR

- **Décision :** Aujourd’hui = jour civil Europe/Paris. Les 24 h glissantes sont abandonnées.
- **Correction :** `getRecapDateWindow` et `todayWindowMode`.
- **Tests :** `recapTemporalContracts.test.js`
- **Limite :** les séances stockées ne sont pas migrées.

## ISS-2026-11-18-GTG-CLASSIC

- **Symptôme :** des reps GTG synchronisées entraient dans le total classique du bandeau et de la mesure.
- **Correction :** `classicExclusiveRepsForDay` sur le bandeau et sur `measureRecapWindow` / `calendarLoad`.
- **Tests :** 100 reps dont 40 GTG → 60 classiques.

## ISS-2026-11-18-PLAN-PROOF

- **Symptôme :** un pourcentage de programme pouvait être publié à partir du programme courant projeté sur le passé.
- **Correction :** l’essai coach n’utilise ce pourcentage que s’il existe au moins un jour à plan figé dans la fenêtre.
- **Tests :** `countFrozenPlanDays`

## ISS-2026-11-18-CACHE-EDITION

- **Symptôme :** un paquet publié restait affiché après un changement de calcul.
- **Correction :** `analysisEditionKey()` entre dans la clé de cache. Une édition différente n’est pas montrée comme actuelle. Les anciennes entrées ne sont pas effacées.

## ISS-2026-11-18-PROGRAM-RATE-COVERAGE

- **Symptôme :** `program_gap_mixed` publiait un pourcentage à partir du planning vivant (`computeProgramDayCompletion28`).
- **Correction :** la relation n’est émise que si au moins 2 jours ont un plan figé et si ces jours couvrent au moins la moitié de la fenêtre. Le validateur refuse le même cas avec `program_rate_without_frozen_coverage`.
- **Tests :** `recapColumnPipeline.test.js`.

## ISS-2026-11-18-FALSE-KINSHIP

- **Symptôme :** programme, étirements et progression coûteuse sortaient en `dedup_kinship`. Chrome seulement pour les deux premiers.
- **Cause :** `parasite()` traitait le suffixe `(objectif hypertrophie / définition)` et le nombre `~-2.64` comme un texte parasite. Le titre vide n’intervenait pas. Le questionnaire Chrome (49 réponses contre 0) ajoutait le suffixe.
- **Correction :** ces deux motifs ne retirent plus la carte. Le motif de parenté est enregistré sur `kinshipDrop`.
- **Tests :** `recapCardKinship.test.js`.

## ISS-2026-11-18-REFRESH-STALL

- **Symptôme :** Cursor, 7 jours, `analysisStatus` reste `refreshing` après `worker_posted`. Aucune annulation, aucune publication `ready`.
- **Observé :** une seule génération. Préparation 29 s, puis silence du Worker au-delà de quatre minutes. L’horloge `endAt` n’a pas relancé le calcul.
- **État :** clos pour le fonctionnement fondamental. Le dossier Chrome authentifié du 19 novembre montre un Worker terminé, une publication `ready` et huit cartes affichées. La trace reste en place. La divergence 8 cartes Analyse / 9 en console n’est pas un échec de publication : la console recalcule, l’écran montre le pack en cache. Le bouton « Pack publié » lit ce cache.

## ISS-2026-11-18-CHROME-CURSOR

- **Symptôme :** 7 cartes publiées dans Chrome, 20 dans Cursor, fenêtre 12–18 novembre 2026.
- **Démontré :** les deux publications sont `ready` pendant que `analysisStatus` reste `refreshing`. Ce ne sont pas les éditions définitives du moteur chargé. Dans Chrome, le même snapshot et le même historique produisent 11 cartes au passage frais ; une séance synthétique de 332 reps ne change pas ce 11. L’écart de données (332 reps, 7 clés, 2 576 kg) est réel, mais les dossiers n’ont pas les événements.
- **Démontré séparément :** l’export appelait « récentes » les 12 plus anciennes entrées d’un historique trié du plus récent au plus ancien. Le service worker Garmin ne met pas en cache le JavaScript.
- **Correction de mécanisme :** la clé de relance ignore `endAt`, pour qu’une nouvelle horloge n’annule pas le Worker. L’export porte désormais l’édition, le contrat Worker, la trace de publication, l’historique complet et les preuves de la fenêtre.
- **Non vérifiable encore :** la part exacte de l’historique 180 contre 73, et le rejeu de la vraie séance du 17 novembre.
- **Tests :** `recapChromeCursorDossier.test.js`

## ISS-2026-11-04-VOL-SHAPE

- **Symptôme :** `disc_volume_shape` publié ; `span_volume_vs_frequency` produit mais absent
- **Cause :** pas de rivalité de phénomène global entre catalogue et discoveries
- **Correction :** kinship `global_volume_period` (kinds exacts) + boost adaptive/IV
- **Tests :** ✅ kinship + non-fusion exo/densité/GTG
- **Live :** ❌ non vérifié navigateur
- **Statut :** corrigé tests ; live ouvert

## ISS-2026-11-04-RETURN-42-77

- **Symptôme :** deux cartes relevés (42 j et 77 j)
- **Cause :** collapse par id ; buckets gap distincts ; homonyme non borné
- **Correction :** `returnEpisodeCollapseKey` = nom+date de retour (ou id) ; `sameHistoricalEpisode` refuse homonyme sans date partagée
- **Tests :** ✅ fusion même date ; ✅ non-fusion dates/ids distincts
- **Live :** ❌
- **Statut :** corrigé tests ; live ouvert

## ISS-2026-11-04-DIPS-REFERENTS

- **Symptôme :** « reste proche » + early/late 20→48 sans distinction
- **Correction :** F4 frequency_driven ; hard consistency
- **Tests :** ✅
- **Live :** ❌

## ISS-2026-11-04-EMPTY-WINDOW-LESTEES

- **Symptôme :** Pompes lestées / gilet hors fenêtre
- **Correction :** `recapDiscoveryPeriodScope` (session antérieure)
- **Tests :** ✅ (vagues antérieures)
- **Live :** à reconfirmer

## ISS-2026-11-04-DELTA-387

- **Cause :** snapshot A sans jour 2026-11-02 (387 reps) — voir `../RECONCILIATION-387-REPS-2026-11-04.md`
- **Statut :** documenté ; ne pas égaliser artificiellement

## ISS-2026-11-04-GLOBAL-VOLUME-REGEX (nouveau, traité)

- **Symptôme potentiel :** rivalité volume trop large
- **Correction :** suppression matching blob ; exclusion si `exerciseId`
- **Tests :** ✅ non-fusion trajectoire / densité / GTG
- **Statut :** corrigé tests

## ISS-2026-11-19-EXPOSURE-COUNTS

- **Symptôme :** des compteurs d’historique à 60, 242 ou 286.
- **Cause :** `recordShownInsights` incrémentait `count` à chaque publication dont la signature changeait. Ce n’était pas une consultation. Le diagnostic passe `collectDiagnostic: true` et n’écrit pas cet historique.
- **Correction :** la publication n’appelle plus `recordShownInsights`. L’ancien historique de 180 entrées est conservé et traité comme une trace de qualité limitée. Une présentation de la même édition n’ajoute pas un second événement dans `momentum.analyticalMemory.v1`.
- **Limite :** les anciens compteurs restent dans l’historique hérité. Ils ne sont pas réinterprétés comme des lectures.

## ISS-2026-11-19-STALE-EDITION

- **Symptôme :** 7 jours montrait encore les 8 cartes anciennes, sans réserve, avec NET RISE et les anciens titres. 30 jours montrait déjà les consolidations.
- **Cause :** la clé d’édition n’avait pas changé. Le cache exact servait l’ancien pack comme édition courante. Le bouton « Pack publié » listait tous les paquets, y compris une autre fenêtre.
- **Correction :** `editorial=final-gate-v2` et `consolidation=mechanism-window-v1` entrent dans la clé. Un paquet d’une autre édition reste stocké et n’est plus peint comme résultat actuel. Le bouton ne lit que la période et la fenêtre demandées.
- **Tests :** `editionAndEditorialGate.test.js`.

## ISS-2026-11-19-MUSCLE-SHARE-RATIO

- **Symptôme :** une carte de six mois annonçait 966 répétitions de pectoraux contre 252 sur 30 jours, puis une concentration de 383,3 %.
- **Cause :** la part divisait le total long par le mois inclus. 966 / 252 × 100 = 383,3. Le mois est une partie du long total : 252 / 966 ≈ 26,1 %.
- **Correction :** `muscleWindowRelation` refuse une part supérieure à son ensemble. Si la période contient le mois, la phrase dit quelle part du total long se trouve dans les 30 jours.
- **Tests :** `p3ExplanatoryReasoning.test.js`.

## ISS-2026-11-19-SESSION-POPULATIONS

- **Symptôme :** le bandeau et les cartes de rythme n’annoncent pas le même nombre de jours.
- **Lecture sur la sauvegarde du 18 novembre, six mois jusqu’au 18 :** 100 jours selon la règle calendrier (renforcement coché, endurance, circuit, GTG complet) et 105 jours ayant au moins une répétition enregistrée. Les cinq jours d’écart ont des répétitions sans remplir la règle calendrier.
- **30 jours, 20 octobre–18 novembre :** les deux compteurs donnent 16. L’écart 16 contre 15 cité pour le 21 octobre–19 novembre n’est pas dans cette sauvegarde, qui s’arrête le 18.
- **Correction visible :** quand les deux comptes diffèrent, la carte de volume les nomme. Les deux populations sont conservées.

## Ouverts

- Preuve navigateur de P3 : non observée dans une session authentifiée
- Les identifiants absents du journal de la sauvegarde restent sans nom. La carte ne leur invente pas un libellé
- Le planificateur d’hypothèses et le moteur de cohérence P6 ne sont pas construits
- Console « pourquoi perdu »
