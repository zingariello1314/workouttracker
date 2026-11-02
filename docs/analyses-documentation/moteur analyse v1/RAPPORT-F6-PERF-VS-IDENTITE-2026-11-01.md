# F6 — Rapport complet : gains de performance vs identité analytique

**Date :** 1er novembre 2026  
**Priorité de lecture :** ce document prime sur les tableaux de millisecondes pour la validation humaine de F6.  
**Règle :** une accélération qui modifie silencieusement les découvertes sélectionnées est une **régression**, même si les temps deviennent excellents.

Artefact machine : `fixtures/f6-perf-vs-identity.json`  
Script : `npx vite-node scripts/f6-perf-vs-identity.mjs`

---

## 1. Question posée

F6 a introduit :

1. une mémoïsation de **portée requête** (`createRecapComputeScope`) ;
2. un partage de `collectLifetimeRepHistory` dans cette portée ;
3. une réécriture O(n) de la construction lifetime (Map date→reps) ;
4. une isolation de cache UI par `accountScope`.

La question critique n’est pas « combien de ms gagne-t-on ? » mais :

> **À données identiques, le moteur produit-il exactement les mêmes analyses qu’avant ces optimisations ?**

Si la réponse est non, F6 échoue — quelle que soit la vitesse.

---

## 2. Définition d’identité analytique (contrat de comparaison)

### 2.1. Inclus dans l’identité (doit être strictement égal)

Pour chaque carte **sélectionnée**, dans le même ordre :

| Champ | Pourquoi |
|---|---|
| `kind` | Type de découverte |
| `nature` / `family` | Classement éditorial |
| `title` | Texte affiché |
| `body` | Narration F4 |
| `evidence` | Preuve affichée |
| `score` | Score agrégé |
| `informativeValue` | Valeur E0 |
| `exerciseId` / `name` | Identité F5.1 |
| `composedOk` / `composedFactCount` | Preuves F3 |
| `continuity` / `attribution` | Raisonnement composé |
| `trajectoryOk` / `trajectoryPrimaryStory` | Trajectoire |
| `f4Used` / `f4Depth` | Narration |
| `phenomenonId` / `phenomenon` | Rivalités / caps F5 |

Également :

- **Pool complet** (`all`) : ensemble `kind|exerciseId|title` trié — détecte une découverte disparue ou ajoutée avant sélection.
- **Raisons de drop** (histogramme) — détecte un changement de filtre / gate / rivalité.

### 2.2. Exclus explicitement (non déterministes légitimes)

| Champ | Motif d’exclusion |
|---|---|
| Durées d’exécution (`ms`, `p35ComputeMs`…) | Mesure, pas analyse |
| `debug.f6.scopeId` / compteurs hits-misses | Diagnostic perf F6 |
| Horodatages de génération | Non sémantiques |

**Interdit :** exclure silencieusement un écart de `title`, `body`, `informativeValue`, `exerciseId`, continuité ou attribution.

### 2.3. Ce qui n’est pas une « accélération acceptable »

- Moins de cartes sélectionnées
- Ordre différent des packs
- Même kind mais texte ou score différent
- Même texte mais autre `exerciseId` (homonymie / identité)
- Pool agrandi ou réduit alors que les données n’ont pas changé

---

## 3. Protocole de mesure

### 3.1. Avant / après

| Variante | Description |
|---|---|
| **Avant (référence)** | `buildPeriodDiscoveryBundle` **sans** `computeScope` |
| **Après (F6)** | Même appel **avec** `createRecapComputeScope({ snapshot, period, window })` |

Même fixture `workout-main-jul-oct-2026`, même `exercise-name-map-main`, mêmes fenêtres.

Le chemin « sans scope » reste le comportement analytique de référence : les optimisations sont opt-in via argument, donc la comparaison est directe dans le même binaire.

### 3.2. Périodes testées

| Période | Fenêtre | Cartes sélectionnées |
|---|---|---:|
| today | 2026-10-29 → 2026-10-30 | 9 |
| 7d | 2026-10-24 → 2026-10-30 | 11 |
| 30d | 2026-10-01 → 2026-10-30 | 14 |
| 3m | 2026-08-01 → 2026-10-30 | 17 |
| 6m | 2026-05-01 → 2026-10-30 | 14 (hist. fixture limité avant ~juil.) |

### 3.3. Contrôles unitaires complémentaires

`src/utils/sport/__tests__/recapF6PerfFreshness.test.js` :

1. Réutilisation mémoire de trajectoire (même objet) dans un scope — sans changer le contenu.
2. Mutation de reps → **nouvelle** révision → résultat différent (fraîcheur, pas identité figée).
3. Mini-snapshot : fingerprint sélection avec/sans scope **égal**.

---

## 4. Résultat d’identité — verdict

### 4.1. Synthèse machine

```text
allSelectedEqual: true
allPoolEqual: true
allDroppedEqual: true
anySilentRegression: false
périodes: today, 7d, 30d, 3m, 6m
```

**Aucune régression silencieuse détectée** sur ces horizons pour la fixture historique.

### 4.2. Détail par période

| Période | Sélection identique | Pool identique | Drops identiques | N selected |
|---|---|---|---|---:|
| today | oui | oui | oui | 9 |
| 7d | oui | oui | oui | 11 |
| 30d | oui | oui | oui | 14 |
| 3m | oui | oui | oui | 17 |
| 6m | oui | oui | oui | 14 |

Écarts localisés (`sampleDiffs`) : **aucun** (tableaux vides / `equal: true`).

### 4.3. Exemple d’empreinte 7d (inchangée)

Ordre et kinds stables avec et sans scope :

1. `disc_density`
2. `disc_vs_habit` (504 — Pompes déclinées)
3. `disc_structural_memory` (505)
4. `disc_emergence` (504)
5. `disc_exercise_share`
6. `disc_rest_assoc`
7. `disc_exercise_progress`
8. `disc_freq_continuity`
9. `disc_muscle_share_shift`
10. `disc_muscle_reorient`
11. `disc_push_pull`

Les titres, corps, `informativeValue`, continuité F3 et flags F4 sont byte-identiques dans le JSON de comparaison (voir `f6-perf-vs-identity.json` → `selectedCards` / égalité stricte).

### 4.4. Ce que cela prouve — et ne prouve pas

| Prouvé | Non prouvé |
|---|---|
| Optimisations F6 n’altèrent pas pool + sélection + drops sur cette fixture | Identité sur profil live multi-années |
| Mémo trajectoire / lifetime ne « colle » pas un résultat d’une autre révision dans ces tests | Identité navigateur (Render / essays colonnes UI) |
| Mutation reps casse bien le cache de scope (fraîcheur) | Toutes les mutations UI A–G de la matrice |

---

## 5. Gains de performance — mis en regard de l’identité

### 5.1. Lecture correcte des millisecondes

Les Δms d’un **seul** passage Node sont bruités (JIT, GC). La baseline F6 (médianes chaudes) montrait des gains relatifs **proches de 0 %** sur 7d–3m une fois chaud.

Dans la passe identité (après chauffe partielle) :

| Période | Δms (sans − avec) | Δ % | Identité |
|---|---:|---:|---|
| today | +206 | +34 % | **préservée** |
| 7d | +6 | +1 % | **préservée** |
| 30d | −51 | −5 % | **préservée** |
| 3m | +28 | +2 % | **préservée** |
| 6m | +46 | +3 % | **préservée** |

Interprétation :

- Les gains affichés ne sont **pas** achetés au prix d’une sélection différente.
- Quand le Δms est négatif (30d), l’identité reste vraie : on n’a pas « compensé » une lenteur en simplifiant l’analyse.
- Le signal perf **robuste** de F6 n’est pas le pourcentage de temps, c’est la **réduction de travail redondant** : `lifetimeHits: 2` / `lifetimeMisses: 1` à chaque période (un seul scan lifetime partagé catalog → baselines → adhérence).

### 5.2. Baseline médiane (rappel, document frère)

Sur warm médiane (3 passes), les gains relatifs oscillent autour de 0 ± 3 %.  
Le gain froid « all » (−72 %) a été **rejeté** comme artefact JIT dans `BASELINE-BENCHMARKS-F6` — il ne doit pas servir d’argument de succès F6.

### 5.3. Matrice décisionnelle validation

| Situation | Décision |
|---|---|
| Identité OK + gain ms fort | Succès perf sans régression |
| Identité OK + gain ms faible / nul | F6 acceptable sur le critère « ne pas dégrader l’intelligence » ; perf structurelle partielle |
| Identité KO + gain ms fort | **Échec F6** — rollback / correction obligatoire |
| Identité KO + gain ms faible | Échec double |

**Position actuelle :** case « Identité OK + gain ms faible / structurel (lifetime) ».  
Pas d’échec silencieux. Pas non plus de miracle de latence sur la fixture historique.

---

## 6. Risques résiduels d’identité (surveillance)

Même sans écart mesuré, ces mécanismes restent les points où une future « optimisation » pourrait casser l’identité :

| Risque | Mitigation actuelle | Symptôme de régression |
|---|---|---|
| Clé de trajectoire trop large (partage entre fenêtres/modes) | Clé = id + start + end + mode + revision | Même carte pour deux fenêtres |
| Clé trop étroite / revision sourde au contenu | `snapshotRevisionOf` hashe le contenu des reps | Carte périmée après mutation |
| Lifetime Map change l’ordre des séances | Tri explicite par date après Map | Continuity / attribution différents |
| Cache UI croisé comptes | `accountScope` + clear | Analyses compte A sur B |
| Exclure trop de champs dans les diffs CI | Contrat §2.1 | Faux « allEqual » |

---

## 7. Chaîne de preuves (reproductibilité)

```bash
# Identité profonde (sélection + pool + drops)
npx vite-node scripts/f6-perf-vs-identity.mjs
# → exit 0 si anySilentRegression === false
# → docs/.../fixtures/f6-perf-vs-identity.json

# Identité courte (déjà validée)
npx vite-node scripts/f6-nonregression.mjs

# Unitaires fraîcheur + égalité mini
npx vitest run src/utils/sport/__tests__/recapF6PerfFreshness.test.js

# Baseline temps (ne pas lire sans le présent rapport)
npx vite-node scripts/f6-benchmark-baseline.mjs
```

Ordre de lecture recommandé pour la recette humaine :

1. **Ce rapport** (identité)
2. `NON-REGRESSION-F6-2026-11-01.md`
3. `RAPPORT-F6-PERFORMANCE-FRAICHEUR-2026-11-01.md` (verdict global)
4. Tableaux ms / charge

---

## 8. Verdict final sur le critère « perf vs identité »

### Verdict

**Aucune régression analytique silencieuse détectée** sur today / 7d / 30d / 3m / 6m (fixture juil–oct 2026), pour :

- cartes sélectionnées (contenu sémantique complet),
- pool de découvertes,
- histogramme des raisons de rejet.

Les optimisations F6 **préservent l’intelligence du moteur** aux données identiques.

Les gains de latence mesurés sur cette fixture sont **modestes et bruités** ; le bénéfice structurel démontré est la suppression des rescans lifetime redondants (`lifetimeHits: 2`), sans altérer E0/F5/F3/F4.

### Formulation pour validation humaine

> On peut valider F6 sur le critère d’identité analytique.  
> On ne doit **pas** valider F6 comme une victoire de vitesse perçue sur profil live (non mesuré) ni comme une linéarisation des historiques longs (charge 1–2 ans encore superlinéaire).  
> Toute optimisation future qui ferait passer `anySilentRegression` à `true` doit être rejetée, même avec −50 % de temps.

---

## 9. Lien vers les autres livrables F6

| Document | Rôle |
|---|---|
| `RAPPORT-F6-PERFORMANCE-FRAICHEUR-2026-11-01.md` | Synthèse F6 |
| `NON-REGRESSION-F6-2026-11-01.md` | Empreinte courte |
| `BASELINE-BENCHMARKS-F6-2026-11-01.md` | Temps |
| `TESTS-CHARGE-F6-2026-11-01.md` | Échelle |
| `MATRICE-FRAICHEUR-F6-2026-11-01.md` | Mutations |
| `TRANSFERT-F6-VERS-F7-2026-11-01.md` | Suite recette |

**Aucun commit Git. F7 non engagé.**
