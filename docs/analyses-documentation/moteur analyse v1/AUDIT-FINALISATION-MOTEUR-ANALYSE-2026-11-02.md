# AUDIT DÉTAILLÉ — Finalisation du moteur d’Analyse

**Date :** 2 novembre 2026  
**Contexte :** suite F7.0j et mission « performance + fiabilité + qualité des découvertes »  
**Profil examiné :** live lecture seule (`zingariello1314`)  
**Statut document :** cartographie des causes + correctifs déjà posés + trous restants  
**Pas de commit Git dans cette passe.** F7.1–F7.5 non engagés.

---

## 0. Objectif de ce document

Ce fichier fixe, point par point, ce qui a été **démontré** dans le code et sur les données réelles :

1. Comment le cache fonctionne vraiment (et pourquoi on recalcule trop souvent).
2. D’où viennent les écarts de chiffres Calendrier vs Analyse.
3. Comment les découvertes sont produites, rejetées et sélectionnées.
4. Quels artefacts de rédaction existent encore.
5. Quels correctifs sûrs ont déjà été appliqués.
6. Ce qui reste à faire, dans quel ordre, sans inventer de micro-phases artificielles.

Il ne remplace pas le rapport final de validation (section « avant/après » complète + exemples de cartes réécrits). Il sert de **base de vérité** pour la suite du chantier.

---

## 1. Architecture utile (où ça vit)

### 1.1. Pipeline d’affichage Analyse

| Étape | Fichier / symbole principal | Rôle |
|---|---|---|
| Hook UI | `src/hooks/useRecapTabMetrics.js` | Clés de cache, hit/miss, appel Worker, publication React |
| Worker | `src/workers/recapAdaptiveInsights.worker.js` | Shell + adaptive hors thread UI |
| Bundle période Worker | `src/utils/sport/recapPeriodWorkerCompute.js` | assessment, enrichment, adaptive, program coach |
| Découvertes | `src/utils/sport/recapPeriodDiscoveries.js` | `detectDiscoveries`, `selectPeriodDiscoveriesWithTrace` |
| Trajectoires exercice | `src/utils/sport/exerciseTrajectoryAnalysis.js` | Mécanismes séries / témoins / rédaction |
| Gate éditoriale | `src/utils/sport/recapEditorialGate.js` | Filtre / rewrite cartes |
| Tonnage | `src/utils/exerciseLoadVolume.js` | `getExerciseVolumeFromLog`, agrégats kg×reps |
| Stats mois calendrier | `src/utils/calendarMonthSportStats.js` | `totalReps`, `totalKg`, jours entraînés |
| Intensité jour calendrier | `CalendarHeatmap.getIntensityForDate` | `intensity.reps` par jour |

### 1.2. Ce qui est réellement publié à l’utilisateur

Le bundle mis en cache / affiché contient typiquement :

- `recapState` (musculation / groupes)
- `enduranceDigest`
- `recapAssessment` (dont `insights` + `insightsPublication`)
- `enrichment`
- `programCoachAnalysis`
- `analysisStatus` (`loading` | `refreshing` | `ready` | `error`)
- `analysisPeriod`

**Règle F7.0i/j conservée :** aucun fallback mince (1–3 cartes) ne doit être publié ni caché comme `ready`.

---

## 2. Chantier cache — détail point par point

### 2.1. Ce qui est mis en cache

#### A. Cache mémoire (Map en module)

- `bundlesByFull` : clé = `inputKey.full` → bundle complet affichable.
- `bundlesByWorkout` : clé = `inputKey.workout` → `{ fullKey, bundle }` pour soft-show / refresh.

Contenu mémorisé = **résultat final** (sélection + textes + shell), pas seulement des agrégats intermédiaires bruts.

#### B. Cache persistant IndexedDB

- Store dédié aux bundles récap (persistance différée via `schedulePersistRecapBundles`).
- Sert au reload de page : hydrate async (`ensureRecapCacheHydrated` / `cacheReady`).
- Risque déjà connu : bundles empoisonnés (historique F7.0i) → invalidés par bump de contrat / span (`span7-f70j`, `f70j-shell-adaptive-v1`).

#### C. Cache React

- État `bundle` dans `useRecapTabMetrics`.
- Remis à zéro / cleared lors d’un miss pertinent (`clearPublishableInsights`).

#### D. Worker

- **Pas un cache** : exécute une requête. Soft-cancel ou `terminate` selon le cas.
- Les résultats ne doivent être publiés que si génération / période / fenêtre / révision matchent encore.

#### E. Cache `nameMap` (ajouté le 2 nov. 2026)

- Module-level : `{ fp, map }` indexé par `checkedVolumeFingerprint(snapshot)`.
- Évite de reconstruire le dictionnaire de noms à **chaque** changement de période alors que le workout n’a pas changé.
- Invalidé dans `clearRecapMetricsCache()` (changement de compte).

### 2.2. Composition des clés

#### Clé workout (`inputKey.workout`)

Inclut notamment :

- Span / contrat (`span7-f70j`, `RECAP_ADAPTIVE_WORKER_CONTRACT`)
- `accountScope` (isolation comptes)
- Période + bornes `periodWindow.start/end`
- Programme actif + liste programmes
- Hash questionnaire profil
- **Fingerprint workout** (voir §2.3)
- Flags admin / gym

#### Clé full (`inputKey.full`)

= workout + **bit Garmin** + **bit nutrition** + marqueur bundle.

Conséquence : un même workout peut avoir plusieurs `full` successifs pendant le chargement Garmin/nutrition → miss « exact » même sans mutation sportive.

### 2.3. Fingerprint workout — avant / après

#### Avant (insuffisant)

```
n_checked : sum_reps : runningLen : pushupsLen : jumpropeLen : gainageLen
```

Problèmes :

- Une modification de **charge** sans changement de reps → **même fingerprint** → risque de réutiliser une analyse obsolète (tonnage faux).
- Logs structurés / GTG peu ou pas pris en compte.

#### Après (correctif posé)

```
n : sum_reps : weightSig : structuredWeighted : gtgDays : running : pushups : jumprope : gainage
```

- `weightSig` : dérivé de `exerciseWeights` + flag `perArm`.
- `structuredWeighted` : nombre de sets structurés avec `weight > 0`.
- `gtgDays` : cardinalité des jours GTG enregistrés.

### 2.4. Durée de vie et éviction

| Mécanisme | Avant | Après correctif |
|---|---|---|
| LRU mémoire `bundlesByFull` | **16** entrées | **40** entrées |
| Effet observé | Eviction des longues périodes → faux « miss » au retour | Moins d’éviction pour 7 périodes × révisions Garmin |

Une simple navigation 7j → 2y → 1y → 30j pouvait faire sortir du LRU une période encore valide : l’utilisateur avait l’impression que « le cache ne marche pas ».

### 2.5. Événements qui invalident réellement

| Événement | Effet attendu | Effet réel constaté |
|---|---|---|
| Mutation reps / checks | Invalider workout key | Oui via fingerprint (reps) |
| Mutation **charges** seules | Invalider | **Avant : non** → **corrigé** |
| Chargement Garmin | Soft refresh possible | Souvent miss `full` → worker ou refresh |
| Changement de période | Hit exact si déjà calculé | Oui **si** encore en LRU / IDB |
| Changement de compte | Clear total | Oui (`clearRecapMetricsCache`) |
| Remontage React / retour onglet | Ne devrait pas recalculer | OK si hit mémoire/IDB ; sinon hydrate |
| Bump contrat / span | Invalide anciens bundles | Volontaire (sécurité anti-poison) |

### 2.6. Raisons de recalcul instrumentées

Traces DEV (`window.__f70iPub` / `f70iTrace`) enrichies :

| Event | Signification |
|---|---|
| `publish_exact_cache` | Hit exact ; `reason` = `period_switch_exact_hit` / `garmin_upgrade_exact_hit` / `exact_hit` |
| `publish_workout_ready` | Soft ready même full-key |
| `publish_workout_refreshing` | Soft-show + recalcul obligatoire |
| `cache_miss_recompute` | Miss ; `reason` = `period_changed_no_exact` / `workout_fingerprint_changed` / `garmin_or_nutrition_bit_changed` / `no_cache_row` |
| `worker_payload_prep` | Coût prep ; `nameMapCacheHit`, `mapMs`, `snapMs`, `sideMs` |
| `publish_final` | Publication atomique Worker |

### 2.7. Coûts mesurés (rappel F7.0j + suite)

| Poste | Thread | Ordre de grandeur | Commentaire |
|---|---|---:|---|
| JSON snapshot | Main | ~2–4 ms | OK |
| `buildExerciseNameMap` (froid) | Main | ~0,8–1,1 s | Découpé + **cache hit** sur périodes suivantes |
| Structured clone / sideJson programmes | Main | variable ; side ~1,5 Mo | Encore lourd |
| Shell + adaptive | **Worker** | ~3–15 s selon période | N’immobilise plus l’UI comme avant |
| Publication React | Main | LT rendu possible | `startTransition` sur publish cache/final |

**Critère produit :** à données / période / compte / version identiques → restitution **sans** Worker.  
Le Worker reste pour le **froid** et les invalidations réelles.

---

## 3. Fiabilité des chiffres Calendrier ↔ Analyse

### 3.1. Tonnage (séance du 1er novembre 2026) — rappel F7.0j

#### Cause

- UI : charge dans `exerciseWeights` (+ `exerciseWeightPerArm`).
- Volume : `getExerciseVolumeFromLog` préférait `exerciseSetLogs` avec `weight: null` / `weightMode: 'bodyweight'` → **0 kg**.
- Même resolveur pour Calendrier (`aggregateLiftVolumeKgByDate`) et Analyse.

#### Correctif

- Repli legacy si volume structuré ≤ 0 et charge legacy utilisable.
- Sync des logs à la saisie de poids (`syncExerciseSetLogWeightsFromLegacy` + TodayTab).

#### Valeur documentée

- **418** reps totales.
- **328** reps lestées → **1792 kg×reps** (convention plain `charge × reps` avec stubs ID hash ; ×2 haltère bilatéral seulement si matériel dumbbell détecté).
- **90** reps exclues (2 exercices sans charge legacy) = absence de charge mesurable, pas un « zéro certain » inventé.

### 3.2. Juillet 2026 : 6 017 (Calendrier) vs 5 827 (carte Analyse)

#### Mesure live (2 nov. 2026, lecture seule)

| Méthode | Résultat |
|---|---:|
| Somme brute `checkedExercises` + `reps` sur `2026-07-*` | **5 827** |
| dont `complementary_endurance_pushups` (5 jours × 100) | **500** |
| Sans complementary | **5 327** |
| Dédup jour+exercice (max) hors complementary | **5 327** |
| Sessions endurance `pushups` juillet (enduranceData) | **500** (mêmes jours) |

#### Interprétation

Ce n’est **pas** la même convention :

| Source | Périmètre typique |
|---|---|
| **Calendrier** `intensity.reps` → `computeCalendarMonthSportStats.totalReps` | Reps muscu cochées **+** contributions endurance jour (sessions non jumprope, etc.) selon `getIntensityForDate` |
| **Analyse / coach** `sumRepsInRange` via `collectCheckedExerciseRepHistory` | Clés cochées, **exclut** ids contenant `complementary`, déduplique par date+exercice (max) |

Donc :

- Afficher **5 827** sur une carte qui parle du « mois de juillet » peut être cohérent avec la somme des clés workout.
- Afficher **6 017** sur la tuile calendrier peut être cohérent avec **un autre agrégat** (intensité jour).
- **Forcer l’égalité sans unifier le périmètre serait une régression.**

#### Action produit recommandée

1. Nommer explicitement le périmètre dans le texte (« répétitions musculation cochées », « y compris complementary / endurance », etc.).
2. Ou mutualiser une fonction unique `sumMonthReps(snapshot, month, { includeComplementary, includeEnduranceSessions, dedupe })` utilisée par les deux surfaces.
3. Ne pas mélanger GTG / course / muscu dans un même total sans le dire.

### 3.3. Autres métriques à garder alignées (checklist)

| Métrique | Point de vigilance |
|---|---|
| Jours entraînés | Jour calendaire vs séance ; GTG seul ; Garmin |
| Séances | Une journée ≠ une séance |
| Durée | Garmin vs programme vs endurance |
| kg soulevés | Resolveur unique `getExerciseVolumeFromLog` |
| Course | Mois sans sortie → pas de perf inventée |
| Fuseaux / dates | Clés `YYYY-MM-DD` locales |

---

## 4. Découvertes, sélection, couverture

### 4.1. Ce que le moteur sait déjà produire

Familles présentes dans le code (non exhaustif) :

- Volume / densité / pic de journée
- Habitudes jours de semaine (P36)
- Adhérence programme / gaps
- GTG vs classique
- Trajectoires **par exercice** (installation, creux, reprise, mécanisme de séries)
- Sommeil (nombreux kinds — budget plafonné)
- Meilleur mois / arcs trimestre (`disc_best_month`, `disc_quarter_arc`)
- Composition musculaire / push-pull

### 4.2. Ce qui manque encore (trou qualitatif majeur)

Les **trajectoires multi-mois calendaires** visibles dans le calendrier :

| Mois 2026 | Reps (tuile) | Jours entraînés (tuile) |
|---|---:|---:|
| Mai | 1 889 | 13 |
| Juin | 6 947 | 22 |
| Juillet | 6 017 | 20 |
| Août | 5 438 | 17 |
| Septembre | 3 728 | 13 |
| Octobre | 4 367 | 14 |
| Novembre (1er) | 418 | 1 |

Phénomènes attendus, peu ou pas racontés comme cartes dédiées :

1. **Baisse prolongée juin → septembre** dominée par la **fréquence** (22 → 13 j), volume/jour relativement stable (~316 → ~287).
2. **Reprise partielle septembre → octobre** (+17 % volume, +1 jour, +~9 % volume/jour).
3. **Course** : montée mai–juin puis chute juillet puis interruption août–octobre.

Les agrégats mensuels coach (`buildMonthlyCoachStats` / `computeMonthCoachSnapshot`) existent, mais la sélection privilégie d’autres kinds ; il manque un producteur/rédacteur d’**arc mensuel** clair (fréquence vs volume/séance).

### 4.3. Comment la sélection limite le rendu

`selectPeriodDiscoveriesWithTrace` :

- Score + valeur informative
- Déduplication d’identité
- Caps par nature (`now` / `trajectory` / `journey`)
- Caps par famille de signal (`SIGNAL_FAMILY_CAPS`)
- Budget sommeil (`TOTAL_SLEEP_BUDGET`)
- Demote methodology limits
- Tri informatif avant score

Conséquences utilisateur :

- Beaucoup de candidats → peu de cartes si caps / sommeil / doublons.
- Cartes génériques parfois mieux scorées que des arcs historiques.
- Périodes « pauvres » vs « riches » : le nombre de cartes **ne doit pas** être un objectif ; la proportionnalité aux données oui.

### 4.4. Écart console 17 vs UI 18 (rappel)

Les pipelines ne comptent pas exactement la même chose (sélection diagnostic vs publication adaptive / historique injecté).  
**Ne pas forcer l’égalité** : documenter les définitions dans la console (Sélectionnées ≠ Affichées ≠ Candidats).

---

## 5. Rédaction et artefacts

### 5.1. Problèmes recensés (exemples types)

| Symptôme | Cause probable | Direction de fix |
|---|---|---|
| Titre abstrait (« la période n’est pas un seul total ») | Templates trop génériques | Titres liés au mécanisme |
| « Exercice 504… » | Nom non résolu / id brut | Gate `raw_exercise_id` + nameMap fiable |
| `témoins:LOCALIZED_RECOVERY` | Evidence technique | **Corrigé** → libellé FR / omis si code |
| `[object Object]` | Objet passé comme titre | `toInsightCard` JSON-safe (F7.0h) |
| Sommeil répété | Budget + kinds proches | Renforcer anti-doublon éditorial |
| Répétition titre dans le corps | Templates | Gate rewrite |
| Conclusion physiologique excessive | Sur-interprétation | Distinguer observation / mécanisme / causalité |

### 5.2. Correctif rédaction déjà posé (2 nov.)

Dans `renderExerciseTrajectoryCopy` :

- Plus de `témoins:${verdict}` brut.
- Mapping FR (`autres mouvements stables`, etc.) ou **null** si code technique inconnu.

---

## 6. Correctifs code déjà appliqués (liste)

| Fichier | Changement | Pourquoi |
|---|---|---|
| `src/utils/exerciseLoadVolume.js` | Repli legacy si structured vol = 0 | 0 kg faux |
| `src/utils/exerciseSetLogUtils.js` | `syncExerciseSetLogWeightsFromLegacy` | Cohérence écriture |
| `src/components/tabs/TodayTab.jsx` | Sync poids → set logs | Éviter futurs drifts |
| `src/utils/sport/__tests__/exerciseLoadVolumeResolver.test.js` | Cas F7.0j | Non-régression tonnage |
| `src/hooks/useRecapTabMetrics.js` | Fingerprint charges/GTG ; LRU 40 ; cache nameMap ; traces miss/hit | Cache fiable + moins de LT |
| `src/utils/sport/exerciseTrajectoryAnalysis.js` | Evidence témoins lisible | Plus de codes internes UI |
| Worker / `recapPeriodWorkerCompute.js` | Shell hors UI (F7.0j) | Gels multi-secondes |

---

## 7. Tests déjà verts (référence)

- `scripts/f7-worker-identity.mjs` → `allEqual=true`
- `scripts/f7-coop-identity.mjs`
- `scripts/f6-perf-vs-identity.mjs`
- `scripts/f6-nonregression.mjs`
- Vitest tonnage resolver
- Vitest cache F7.0i

Ces suites prouvent surtout **stabilité / identité**, pas la **qualité rédactionnelle** ni la **pertinence** des cartes.

---

## 8. Plan de suite (sans micro-phases nommées)

Ordre de valeur utilisateur :

### A. Performance / cache (finir)

1. Recette navigateur : froid vs cache sur Toutes les périodes ; vérifier `nameMapCacheHit: true` au 2ᵉ passage.
2. Réduire encore le coût `sideJson` (programmes ~1,5 Mo) sans nouvelle architecture hasardeuse.
3. Annulation Worker : s’assurer qu’un calcul 2y obsolète ne continue pas 15 s après un clic 7j (terminate déjà sur period change — mesurer).

### B. Chiffres

1. Documenter ou unifier le total reps mensuel (Calendrier vs Analyse).
2. Légendes UI si les périmètres restent distincts à dessein.

### C. Qualité analytique (cœur)

1. Producteur d’**arcs mensuels** (fréquence vs volume/séance) avec titres du type « Octobre interrompt trois mois de baisse ».
2. Arc course mai–juin–interruption.
3. Revoir caps / informativeValue pour ne pas écraser ces cartes par du sommeil générique.
4. Audit qualitatif carte par carte sur données réelles (meilleures / pires / manquantes).

### D. Rédaction

1. Gate : titres abstraits, ids bruts, redites, métadonnées.
2. Longueur proportionnelle à la découverte.
3. Console : définitions de compteurs explicites.

---

## 9. Critères de « satisfaisant » (rappel mission)

Le chantier ne sera pas déclaré terminé tant que :

- Une période déjà calculée et valide n’est pas restituée **sans** recalcul lourd.
- L’UI reste réactive pendant un calcul froid.
- Les écarts Calendrier/Analyse sont soit unifiés, soit **explicitement** justifiés à l’écran.
- Les arcs historiques majeurs (activité, exercices, course) apparaissent quand les données le permettent.
- Les cartes sont précises, sans artefacts techniques, avec mécanisme démontré quand c’est possible.
- Un rapport final compare **avant/après** (perf + exemples de textes réels), pas seulement des tests verts.

---

## 10. Verdict intermédiaire (2 nov. 2026)

| Domaine | État |
|---|---|
| Diagnostic causes cache | **Établi** |
| Correctifs cache / tonnage / evidence | **Partiels, posés** |
| Perf froide longues périodes | **Encore trop lente** (Worker CPU) ; UI moins gelée |
| Restitution cache | **Améliorable / à re-mesurer** après LRU + nameMap cache |
| Cohérence chiffres | **Comprise** (périmètres) ; pas encore unifiée produit |
| Qualité découvertes / rédaction | **Insuffisante** vs objectif « remarquable » |
| Prêt à clôturer | **Non** |

---

*Document rédigé pour servir de référence unique avant les prochaines corrections ciblées. Mettre à jour ce fichier à chaque lot de correctifs significatifs plutôt que multiplier les mini-rapports.*
