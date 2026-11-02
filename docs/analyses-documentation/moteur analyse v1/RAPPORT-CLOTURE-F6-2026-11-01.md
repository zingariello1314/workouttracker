# Rapport de clôture F6 — Validation navigateur & usage actuel

**Date :** 1er novembre 2026  
**Périmètre :** contrôle ciblé F6 — **aucun commit** — **F7 non engagé**  
**Contexte propriétaire :** utilisation Momentum Sport **depuis moins d’un an** — les benches synthétiques 2 ans ne sont pas la charge cible.

---

## Verdict

**F6 est clôturable** pour l’usage actuel, sous réserve de validation humaine, avec **dette documentée** (pas de refonte trajectoires).

| Critère | Statut |
|---|---|
| Identité analytique (fixtures) | **OK** — `anySilentRegression: false` |
| Couverture réelle profil live | **OK** — mesurée en lecture seule |
| Perf navigateur horizons usuels (7j / 30j / 6m) | **Acceptable** (~0,7–1,6 s premier contenu utile) |
| Horizon 2 ans / All time sur profil live | **Lent** (~16–18 s premier contenu) — dette prioritaire, pas blocker F6 si l’usage courant reste ≤6–12 mois |
| Fraîcheur mutations live | **NV** (pas de test destructif) |
| Isolation cache par compte | **OK** (clé `u:…` observée en IDB) |
| Croissance synthétique 2 ans | **Dette** — n’est pas le profil actuel |

---

## 1. Couverture réelle des données disponibles

### 1.1. Profil live (IndexedDB, lecture seule)

Compte UI : `zingariello1314`.

#### Force / séances — store `workouts` id `main`

| Indicateur | Valeur |
|---|---|
| Première date d’entraînement | **2026-01-05** |
| Dernière date avec reps/checked | **2026-10-30** |
| Jours avec activité | **100** |
| Emprise calendaire | **299 jours** (~10 mois) |
| Exercices distincts | **110** |
| Clés reps | **684** |
| Checked true | **683** |
| Jours GTG | **6** |
| Séances endurance | **6** |

→ Cohérent avec « moins d’un an » : **pas d’historique force multi-années**.

#### Garmin (source distincte)

| Indicateur | Valeur |
|---|---|
| Jours `dailyMetrics` | **375** |
| Première métrique | **2025-10-20** |
| Dernière métrique | **2026-10-29** |
| Lignes activités | **165** |

→ Garmin **dépasse** l’historique force ; les plages ne doivent pas être confondues.

#### Fixture de référence F6 (`workout-main-jul-oct-2026`)

| Indicateur | Valeur |
|---|---|
| Première / dernière | 2026-07-02 → 2026-10-30 |
| Jours actifs | 67 |
| Emprise | 121 jours |
| Garmin dans la fixture | **absent** |

### 1.2. Ce qui n’a pas été extrapolé

- Pas de déduction depuis la date de création de compte.
- Sommeil manuel live : non chiffré dans cette passe (NV détail).
- Guest anonyme : non mesuré (session authentifiée uniquement).

---

## 2. Performances navigateur mesurées

**Env. :** Vite `localhost:3001`, DevTools browser Cursor, profil live, **aucune écriture** dans les données sport.

Artefact : `fixtures/f6-closure-browser-live.json`

### 2.1. Premier contenu utile (changement de période)

| Action | firstUsefulMs | Fenêtre affichée |
|---|---:|---|
| → 7 days | ~1 620 | 26 oct → 1 nov 2026 |
| → 30 days | ~1 385 | 3 oct → 1 nov 2026 |
| → 6 months | ~706 | 3 mai → 1 nov 2026 (cache probable) |
| → 2 years | ~16 686 | **2 nov 2024 → 1 nov 2026** |
| → 7 days après 2y | ~18 188 | ralenti (charge résiduelle) |
| → All time | ~16 517 | All time |
| Remontage Recap (Sport → Recap) | ~617 | réutilisation cache plausible |

**Méthode :** clic période → attente changement header « Analysis Period recap » / empreinte texte.  
**Caveat :** un chronomètre « stable » naïf est pollué par textes async (grades, Garmin) — ne pas l’utiliser comme vérité.

### 2.2. Séparation moteur / React

- Non instrumentée finement dans le navigateur (pas de `performance.measure` produit branché en prod).
- Sur Node (fixture), le bundle découvertes 30j ≈ 1,1–1,3 s ; le navigateur live ajoute Garmin + enrichment + rendu.
- Remontage Recap ~0,6 s ⇒ **rerender ≠ recalcul moteur complet** quand le cache IDB/mémoire hit.

---

## 3. Comparaison horizons courts / longs

### 3.1. Fixture (Node) — fenêtre demandée ≠ données

| Horizon | Jours **avec** données | Jours calendaire vides (approx.) | ms calcul bundle | selected |
|---|---:|---:|---:|---:|
| 7d | 4 | 3 | ~814 | 11 |
| 30d | 16 | 14 | ~1 326 | 14 |
| 3m | 47 | 44 | ~2 001 | 17 |
| 6m | 67 | 116 | ~1 932 | 14 |
| 1y | 67 | 299 | ~2 403 | 14 |
| 2y | 67 | 664 | ~3 237 | 14 |
| all | 67 | — | ~3 171 | 11 |

Même volume de données (67 jours) pour 6m / 1y / 2y, mais **2y reste plus cher** (~+67 % vs 6m) : coût lié à la **largeur de fenêtre** (énumérations / mesures annexes), pas à un inventaire fictif de 730 séances.

### 3.2. Live

- Force ≈ 10 mois → 7j / 30j / 6m restent dans l’historique réel.
- 2y / All time élargissent la fenêtre calendaire **au-delà** des données force ; Garmin apporte ~1 an de métriques.
- Coût perçu 2y/All **élevé** (~17 s) sur le profil actuel.

---

## 4. Traitement des périodes / journées vides

### Prouvé

- `collectLifetimeRepHistory` / catalog / baselines : **parcours des clés** reps/checked — **pas** une boucle sur chaque jour vide du calendrier 2 ans.
- Donc une période « 2 ans » avec 10 mois de force **ne matérialise pas** 730 séances fictives.

### Aussi prouvé

- Certains chemins **énumèrent** encore la plage calendaire complète (`enumerateDatesInclusive`) :  
  `calendarLoad`, `describeCalendarShape`, matrice d’adhérence, analytics calendrier UI, etc.
- Cela explique une partie du surcoût 2y à données force égales, sans « inventer » des séances.

### Non fait (volontairement)

- Pas de modification des règles W/C/H.
- Pas de clamp agressif des fenêtres (risque identité / densités).
- Pas d’optimisation du bench synthétique 2 ans.

---

## 5. Fraîcheur des données

| Scénario | Statut |
|---|---|
| Unitaires F6 (mutation reps → revision / fingerprint) | **OK** |
| Identité scope avec/sans mémo | **OK** |
| Isolation compte (clé cache `u:…`) | **OK** (observé IDB) |
| genRef anti-stale (code) | **STRUCT** |
| Mutations live (reps, charge, séries, GTG, programme, Garmin sync, logout) | **NV** — interdit sur profil réel |
| Passage minuit contrôlé | **NV** |

Recommandation F7/recette : rejouer la matrice fraîcheur sur **compte de test** ou fixture injectée, pas sur le profil propriétaire.

---

## 6. Non-régression (rejouée ce jour)

```text
recapF6PerfFreshness.test.js     → 4/4 OK
scripts/f6-perf-vs-identity.mjs  → anySilentRegression: false (today…6m)
scripts/f6-nonregression.mjs     → allEqual: true (7d/30d/3m)
```

Champs contrôlés : kinds, titres, corps, scores/`informativeValue`, exerciseId, preuves F3, ordre, pool, raisons de drop.  
Exclus uniquement : timings / compteurs perf.

Rapport détaillé : `RAPPORT-F6-PERF-VS-IDENTITE-2026-11-01.md`.

---

## 7. Corrections réalisées dans cette passe de clôture

**Aucune correction code supplémentaire** dans cette passe.

Motifs :

- Les défauts « recalcul retour période inchangée » / isolation compte sont déjà couverts par F6 (cache + `accountScope`) et confirmés navigateur (remontage ~0,6 s ; clé `u:`).
- Le surcoût 2y live est **démontré** mais une correction d’énumération calendaire toucherait potentiellement densités / adhérence → exige une preuve d’identité dédiée avant merge (hors clôture minimale).

---

## 8. Problèmes non résolus (dette)

1. **Horizon 2y / All time lent sur profil live** (~16–18 s firstUseful) malgré ~10 mois de force — affecte l’usage **si** l’utilisateur ouvre ces horizons.
2. **Énumérations calendaires** sur grandes fenêtres (adhérence, calendarLoad, UI).
3. **Croissance superlinéaire** fixtures synthétiques 1–2 ans (Node) — hors charge actuelle du propriétaire.
4. Après un calcul 2y, bascule vers 7j encore lente — file / main thread (à traiter avec le point 1).
5. Fraîcheur mutations UI **NV**.
6. Instrumentation navigateur moteur vs React encore grossière.

---

## 9. Preuves par environnement

| Environnement | Ce qui est prouvé |
|---|---|
| Fixture juil–oct | Identité, horizons, empty-day probe, baseline Node |
| Navigateur profil live | Couverture dates, timings périodes, cache accountScope, remontage |
| Navigateur guest | **NV** |
| Mutations live | **NV** |

---

## 10. Décision proposée

### F6 : **clôturable**

Justification :

- Objectif F6 atteint pour l’usage **actuel** (<1 an, ~10 mois force) : pipeline cartographié, redondances lifetime réduites, identité préservée, cache isolé, horizons courants utilisables.
- Le scénario 2 ans synthétique / live large fenêtre est une **dette prioritaire documentée**, pas un motif pour bloquer F6 ni pour lancer une refonte trajectoires maintenant.
- F7 (recette éditoriale / polish produit) peut être discuté **après validation humaine**, sans l’engager automatiquement.

### Ne pas faire maintenant

- Refonte générale des trajectoires.
- Optimiser le bench 2 ans artificiel pour « faire joli ».
- Modifier F3/F4/F5/F5.1.
- Commit Git.

---

## Annexes

| Fichier | Rôle |
|---|---|
| `fixtures/f6-closure-browser-live.json` | Mesures live |
| `fixtures/f6-coverage-horizons.json` | Fixture couverture + horizons |
| `fixtures/f6-perf-vs-identity.json` | Identité vs perf |
| `RAPPORT-F6-PERF-VS-IDENTITE-2026-11-01.md` | Critère bloquant identité |
| `RAPPORT-F6-PERFORMANCE-FRAICHEUR-2026-11-01.md` | Synthèse F6 |
| `TRANSFERT-F6-VERS-F7-2026-11-01.md` | Suite |

**Arrêt — validation humaine requise avant F7.**
