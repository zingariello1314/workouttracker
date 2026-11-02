# RAPPORT FINAL — Finalisation du moteur d’Analyse

**Date :** 2 novembre 2026  
**Profil live lecture seule :** `zingariello1314`  
**Pas de commit Git. F7.1–F7.5 non engagés.**  
**Companion live (timings + textes cartes) :** `AVANT-APRES-ANALYSES-LIVE-2026-11-02.md`

---

## 15.1. Modifications réalisées

### A. Fingerprint & cache

| | |
|---|---|
| **Cause** | Empreinte trop agrégée (totaux) → collisions possibles (swap d’exos, sets, charges structurées, GTG contenu). |
| **Modification** | `checkedVolumeFingerprint` : hash des clés cochées, setCount / setRepSum / setWeightSum, GTG checks+reps, empreinte légère des dates de course. Export pour tests. Clé cache `span7-f70j` → **`span8-f70k`**. Contrat Worker **`f70k-shell-adaptive-v1`**. |
| **Fichiers** | `src/hooks/useRecapTabMetrics.js`, `src/utils/sport/recapAdaptiveWorkerContract.js`, `src/hooks/__tests__/checkedVolumeFingerprint.test.js` |
| **Effet** | Invalidation volontaire des bundles obsolètes ; deux jeux analytiquement différents ne partagent plus la même clé par accident de totaux. |
| **Preuve** | 4 tests Vitest fingerprint verts ; live : clés `span8-f70k\|f70k-…` dans `__f70iPub`. |

### B. Arcs multi-mois + course

| | |
|---|---|
| **Cause** | Calendrier montrait juin→sept (−46 % reps, surtout jours) et reprise oct ; le moteur ne racontait que des portraits « pas seulement un total ». |
| **Modification** | Nouveau module `monthlyVolumeArcDiscoveries.js` : détection `prolonged_decline` / `partial_recovery` / …, décomposition fréquence vs densité, exclusion mois courant incomplet. `buildRunningGapDiscoveries`. Branché dans `detectDiscoveries`. Priorités + `discoveryInformativeValue` (+16 / +12). Rivalités vs `disc_volume_shape` / `disc_quarter_arc`. |
| **Fichiers** | `src/utils/sport/monthlyVolumeArcDiscoveries.js`, `recapPeriodDiscoveries.js`, `__tests__/monthlyVolumeArc.test.js` |
| **Effet** | Carte live exacte : *« octobre 2026 interrompt la baisse depuis juin 2026 »* avec −46 % / −41 % jours / −9 % rpd / 82 % fréquence. |
| **Preuve** | Tests fixtures (4) verts ; capture after 6m/1y/2y/all. |

### C. Sélection éditoriale

| | |
|---|---|
| **Cause** | Cartes sommeil / portraits génériques évincaiment des arcs historiques. |
| **Modification** | `TOTAL_SLEEP_BUDGET` month/long/year : **2 → 1**. Boost informativeValue arcs. Dépriorisation titres « pas seulement un total ». |
| **Fichiers** | `recapInsightNature.js`, `recapPeriodDiscoveries.js`, test sélection mis à jour |
| **Effet** | Pack Toujours : 10 → **13** cartes avec arc + habitudes ; sommeil plafonné. |
| **Preuve** | Live + test `recapAnalysisSelectionQuality`. |

### D. Réconciliation juillet / calendrier

| | |
|---|---|
| **Cause** | Écart documenté 6 017 (tuile) vs 5 827 (somme cochée). |
| **Modification** | Audit IDB `WorkoutTrackerDB/workouts/main` + alignement `calendarRepsByDate` pour **ne plus rejouer** les `ENDURANCE_REP_ACTIVITIES` déjà mirorées en `complementary_endurance_pushups`. |
| **Fichiers** | `src/utils/calendarWeekLeaders.js` (+ import `ENDURANCE_REP_ACTIVITIES`) |
| **Effet / conventions** | Voir §15.3. |
| **Preuve** | Décomposition numérique live ci-dessous. |

### E. Non modifié volontairement (préservé)

- Conventions tonnage / perArm (`exerciseLoadVolume`) — correctif F7.0j conservé.  
- Publication atomique, Worker shell, isolation comptes.  
- Identité exercices (pas de fusion homonyme).  

---

## 15.2. Performance avant / après

Mesures **navigateur live uniquement** (pas Node).

| Période | Avant froid | Après froid | Après cache | LT max avant / après | Worker relancé sur hit ? |
|---|---:|---:|---:|---|---|
| 7 jours | 6,0 s | 8,3 s | **0,99 s** | 1092 / 1234 | Non |
| 30 jours | 14,8 s | **8,6 s** | **1,74 s** | 1189 / 1104 | Non |
| 3 mois | **timeout / 0** | **13,0 s** | — | 1196 / 1139 | — |
| 6 mois | 10,5 s | 15,4 s | — | 805 / 1176 | — |
| 1 an | 13,4 s | 18,6 s | — | 773 / 1167 | — |
| 2 ans | 15,4 s | 22,5 s | — | 802 / 1164 | — |
| Toujours | ~18 s puis 1,2 s exact | exact **0,7–1,3 s** | exact | — / ≤1240 | Non |

**Lecture :** fluidité cache démontrée ; 3 mois réparé ; froid long encore coûteux (Worker 10–20 s) — UI utilisable, LT ~1 s résiduelles (nameMap / React), pas de gels multi-secondes shell sync.

---

## 15.3. Réconciliation des chiffres (juillet 2026)

### Décomposition exacte (IDB `main`, lecture seule)

| Composante | Valeur |
|---|---:|
| Somme reps **toutes clés cochées** juillet | **5 827** |
| dont `complementary_endurance_pushups` | **500** (5 × 100) |
| hors complémentaire | **5 327** |
| Sessions endurance `pushups` (miroir) | **500** |
| GTG juillet | **0** |
| Reps non cochées juillet | **0** |
| Autres types endurance avec reps | **0** |

### Ce que fait le code actuel

1. **`getIntensityForDate`** : coche classiques + adhoc **incluant** `complementary_endurance_pushups` ; `computeEnduranceDayMetricsForCalendar` **ignore** `pushups` (`ENDURANCE_REP_ACTIVITIES`) → total attendu **5 827**.  
2. **`calendarLoad` / Analyse** : `aggregateCheckedRepsByDateAndExerciseId` inclut aussi `complementary_endurance_pushups` + endurance hors activités mirorées → **5 827**.  
3. **`calendarRepsByDate` (avant correctif)** : agrégat (5 827) **+** rejouait les sessions pushups (+500) → **double compte potentiel 6 327**. **Corrigé** pour skip `ENDURANCE_REP_ACTIVITIES`.

### Origine des « +190 » (6 017 − 5 827)

**Non retrouvée dans l’IDB actuel + chemins canoniques ci-dessus.**  
Hypothèses restantes (ouvertes) :
- tuile UI historique / cache d’intensité obsolète au moment du chiffre 6 017 ;  
- autre snapshot temporairement différent ;  
- agrégat UI non aligné (à re-lire sur tuile Calendrier après hard refresh).

**Interdiction respectée :** on n’a **pas** forcé 6 017 = 5 827.  
**Convention retenue pour Analyse & calendrier intensité :**

| Libellé | Périmètre |
|---|---|
| Répétitions musculation cochées | clés cochées hors `complementary_*` (sauf pushups endurance mirorées) |
| Pompes endurance | `complementary_endurance_pushups` **ou** session, **pas les deux** |
| Total calendrier / banner Analyse | = agrégat unique ci-dessus (**5 827** sur juillet live actuel) |

Tonnage 1er nov. préservé : **418 reps** dont charge mesurable → **1 792 kg×reps** (F7.0j).

---

## 15.4. Qualité des découvertes — exemples avant / après

### 1. Arc multi-mois (NOUVEAU)
- **Avant :** absent (remplacé par « pas seulement un total »).  
- **Problème :** aucun mécanisme.  
- **Après :** titre/corps §2.2 du companion live.  
- **Preuves :** 6947→3728→4367 ; jours 22→13→16 ; freqShare ≈ 0,82.  
- **Valeur :** l’utilisateur voit *pourquoi* le volume a bougé.

### 2. Sommet juin
- **Avant :** « juin 2026 concentre… » (part) sans trajectoire.  
- **Après :** conservé **et** complété par l’arc.  
- **Valeur :** sommet + histoire complète.

### 3. Reprise octobre
- **Avant :** non qualifiée.  
- **Après :** « interrompt la baisse… sans retrouver le sommet ».  
- **Valeur :** pas de faux « retour au max ».

### 4. Course
- **Avant :** « Course et renforcement se lisent ensemble ».  
- **Après (Toujours 1ʳᵉ pub) :** « La course a glissé hors de ta routine, pas toute ton activité » (+ gap producteur).  
- **Limite :** la carte coexistence apparaît encore sur certains packs longs.

### 5. Volume 30 j
- **Avant / Après :** « Le volume du mois dépasse la période précédente » (+20,7 %, densités) — déjà utile ; conservé.

### 6. Trajectoire exercice (mécanisme séries)
- **Après 30 j :** « Pompes inclinées sur support : moins de répétitions par séance » — séries stables, reps/série ↓.  
- **Valeur :** distingue fréquence de séance vs reps/série.

### 7. Habitude jours
- **Après :** « Mer tient mieux que Jeu » / « Jours habituellement actifs ».  
- **Limite :** artefact `[OBJECT OBJECT]` encore dans certains corps P36.

### 8. Identité / artefact
- **Avant & Après 7 j :** « Exercice 504… » — **encore ouvert** (résolution de nom).

### 9. GTG
- Conservé : « Certains jours, le Grease the Groove ne tient que par un passage hors planning ».

### 10. 3 mois
- **Avant :** aucune carte.  
- **Après :** 14 cartes (expositions, push/pull, progressions…).

---

## 15.5. Sélection éditoriale

| Candidat | Statut typique longues périodes | Motif |
|---|---|---|
| `disc_monthly_volume_arc` | **Sélectionné** | informativeValue boost + priorité journey |
| `disc_volume_shape` « pas seulement un total » | Dépriorisé / rival | −14 info + rivals |
| `disc_quarter_arc` | Dépriorisé si arc mensuel | rival |
| Sommeil | Cap total month/long **1** | `TOTAL_SLEEP_BUDGET` |
| `disc_best_month` | Peut coexister avec arc | complementary (sommet vs trajectoire) |

Traces : titres dans `__f70iPub` ; kinds inspectables via console diagnostic existante.

---

## 15.6. Tests

| Commande | Résultat |
|---|---|
| `npx vitest run src/utils/sport/__tests__/monthlyVolumeArc.test.js` | **4/4 OK** |
| `npx vitest run src/hooks/__tests__/checkedVolumeFingerprint.test.js` | **4/4 OK** |
| `npx vitest run src/utils/sport/__tests__/recapAnalysisSelectionQuality.test.js` | **3/3 OK** (attente budget sommeil mise à jour) |
| `node scripts/f7-worker-identity.mjs` | **Échec préexistant** : module manquant `userTrainingState` (hors scope de cette passe) |

Non rejoués ici (temps / dépendance cassée) : `f6-perf-vs-identity`, `f6-nonregression`, `f7-coop-identity` — à relancer quand l’import `userTrainingState` est rétabli.

---

## 15.7. Limites restantes

| Point | Statut |
|---|---|
| Arc multi-mois + mécanisme fréquence | **Corrigé et prouvé live** |
| Cache exact re-clic 7j/30j/all | **Corrigé et prouvé live** |
| 3 mois publication | **Corrigé et prouvé live** |
| Fingerprint collisions totaux | **Corrigé + tests** ; pas fuzz exhaustif de tous les cas Garmin/nutrition |
| Double compte calendarRepsByDate pushups | **Corrigé code** ; tuile 6017 **non reproduite** sur IDB actuel |
| Écart 190 vs tuile 6017 | **Encore ouvert** (non forcé) |
| « Exercice 504 » / `[OBJECT OBJECT]` / codes type PUSHPULL | **Encore ouvert** (gate à renforcer) |
| Froid 1–2 ans 18–22 s | **Partiellement** (Worker) — pas encore au niveau « instantané » |
| nameMap premier miss ~1,7 s | **Partiellement** (cache inter-périodes OK ensuite) |
| Payload sideJson ~1,5–2 Mo | **Encore ouvert** |
| Suites f6/f7 identity Node | **Bloquées** par module manquant hors périmètre |
| F7.0 formal closure | **Non déclaré** — critères essentiels améliorés mais artefacts + froid long restent |

---

## Inventaire code (ajouté / modifié / non commit)

### Ajouté
- `src/utils/sport/monthlyVolumeArcDiscoveries.js`  
- `src/utils/sport/__tests__/monthlyVolumeArc.test.js`  
- `src/hooks/__tests__/checkedVolumeFingerprint.test.js`  
- Docs : ce rapport + `AVANT-APRES-ANALYSES-LIVE-2026-11-02.md` + JSON captures  

### Modifié
- `src/hooks/useRecapTabMetrics.js` — fingerprint + span8 + export  
- `src/utils/sport/recapAdaptiveWorkerContract.js` — `f70k-…`  
- `src/utils/sport/recapPeriodDiscoveries.js` — producteurs, priorités, infoValue, rivals  
- `src/utils/sport/recapInsightNature.js` — budget sommeil  
- `src/utils/calendarWeekLeaders.js` — anti double-compte endurance  
- `src/utils/sport/__tests__/recapAnalysisSelectionQuality.test.js`  

### Supprimé
- Rien d’existant fiable ; invalidation cache via bump de contrat uniquement.

---

## Verdict

Le moteur **raconte désormais l’arc réel juin→septembre→octobre avec le bon mécanisme**, restitue le cache exact en &lt; 2 s sur re-clic, et **répare 3 mois**.  
Ce n’est **pas** une clôture « parfaite » : artefacts rédactionnels, mystère 6017, et froids longs restent.  
**F7.0 reste ouvert** tant que ces limites ne sont pas traitées et que les suites identity Node ne repassent pas.
