# F7.0c — Publication atomique, interactivité Analyse, diagnostic D/E

**Date :** 1er novembre 2026  
**Périmètre :** F7.0c-A / B / C livrés ; D / E diagnostiqués — **pas de Worker / refonte producteurs**  
**Aucun commit Git** — F7.1–F7.5 non engagés  
**Arrêt pour validation humaine avant transformations architecturales (D profond / Worker).**

---

## Verdict produit (intermédiaire)

| Critère | Statut | Preuve |
|---|---|---|
| Origine des analyses provisoires | **Identifiée** | Code `useRecapTabMetrics.runFor` |
| Publication atomique des cartes | **Implémentée** | B + tests unitaires |
| Structure Analyse sans attendre le moteur | **Déjà partielle + renforcée** | RecapTab + loading insights |
| Changement de période sans contamination de cartes | **Corrigé (code)** | clear insights immédiat |
| Calcul non bloquant (D) | **Non résolu** — yields F7.0b insuffisants pour chunks p36/calendrier | Profilage F7.0 |
| Console (E) | **Diagnostiquée** — recalcul complet synchrone à l’ouverture | `AnalysisEngineConsole` |
| Remesure navigateur | **Bloquée** — Unlock the app | Session live |

**Ne pas annoncer F7.0c comme succès UX final** tant que D (Long Tasks) et remesure navigateur ne sont pas validés.

---

## 1. F7.0c-A — Graphe du cycle de vie Analyse

```
RecapTab (période immédiate)
  ├─ shell / sélecteur période          → immédiat (indépendant du moteur)
  ├─ vues lazy (Analyse déjà hors wait hasMetrics)
  └─ useRecapTabMetrics
       ├─ cache exact (full key)        → publish ready + computing=false
       ├─ cache workout (même période)  → publish refreshing + recompute fond
       └─ miss
            ├─ clear insights immédiatement (F7.0c)
            ├─ runFor (async, yields)
            │    ① shell recapState          → publish (sans cartes)
            │    ② computeRecapUserAssessment → AVANT : publiait pistes legacy
            │                                 → APRÈS : métriques only, insights vides
            │    ③ enrichment                 → publish métriques indépendantes
            │    ④ pipeline composé (coop)    → interne
            │    ⑤ adaptive insights          → SEULE publication « ready » des cartes
            │    ⑥ rememberBundle + setComputing(false)
            └─ genRef++ à cleanup → abandon publication (CPU sync encore possible)
```

### Publications intermédiaires (avant F7.0c)

| # | setBundle | Contenu insights | Effet UI |
|---|---|---|---|
| P0 | Bundle période précédente conservé | Cartes **autre période** | Contamination sous nouveau libellé |
| P1 | Shell | `recapAssessment: null` | OK / vide |
| P2 | + `computeRecapUserAssessment` | **Pistes legacy** (`buildRecapPistes`) | **Cartes provisoires** |
| P3 | + enrichment | Mêmes pistes legacy | Remplacement partiel possible |
| P4 | + adaptive final | Découvertes composées E0/F5 | Remplacement final |

### Origine exacte des analyses provisoires — **prouvée par code**

1. **`computeRecapUserAssessment` → `buildRecapPistes` → `insights.{short,medium,long}`**  
   Publié à l’étape P2 **avant** `buildAdaptiveRecapInsights` / pipeline composé.  
2. **`RecapAnalyseView`** lit `assessment.insights` et rend des cartes dès qu’elles existent.  
3. **Conservation du bundle précédent** au changement de période (miss) : anciennes cartes visibles sous la nouvelle période jusqu’au premier shell.  
4. **Non** : ce n’est pas F3/F4 partiel, ni un second moteur — ce sont les **pistes legacy** puis leur remplacement par le pipeline composé.

Légende preuve : **code** = prouvé ; navigateur live post-fix = **non vérifié** (verrou).

---

## 2. F7.0c-B — Contrat de publication finale

### Règle

| Couche | Peut être publiée tôt ? | Présentée comme analyse définitive ? |
|---|---|---|
| Shell `recapState` / endurance | Oui | Non (métriques structure) |
| Assessment scores / quiz | Oui (sans insights) | Non pour les cartes |
| Enrichment (completion, sleep series…) | Oui | Zones dédiées uniquement |
| **Cartes short/medium/long** | **Non** | **Uniquement `insightsPublication.status === 'ready'`** |

### Identité attachée (`insightsPublication`)

- `status`: `loading` | `ready`
- `period`, `windowStart`, `windowEnd`
- `complete: true` seulement si ready

Helpers exportés : `withInsightsPublication`, `isRecapInsightsReady`, `EMPTY_RECAP_INSIGHTS`  
(`src/hooks/useRecapTabMetrics.js`).

### Comportement refresh (cache workout)

Si un résultat **ready** existe pour la même période : on le garde à l’écran (`analysisStatus: 'refreshing'`) pendant le recalcul — **sans** injecter les pistes legacy.

### Tests

`src/hooks/__tests__/recapInsightsPublication.f70c.test.js` — **OK**  
F6/F7 identité moteur — **OK** (`anySilentRegression: false`, sync≡async).

---

## 3. F7.0c-C — Interface immédiatement interactive

| Attendu | État |
|---|---|
| Structure Analyse sans wait `hasMetrics` | Déjà le cas (RecapTab) |
| Message « Pas assez de signal » pendant load | **Corrigé** → « Préparation des analyses… » |
| `computing` passé à la vue Analyse | **Ajouté** |
| Période visuelle immédiate | Conservé F7.0 |
| Clear cartes ancienne période au miss | **Ajouté** |

Fichiers : `RecapTab.jsx`, `RecapAnalyseView.jsx`, `useRecapTabMetrics.js`.

---

## 4. F7.0c-D — Diagnostic calcul non bloquant (pas de refonte)

### Mesures déjà établies (fixture / synthétique — **pas** profil live)

| Producteur | Ordre de grandeur (synth 2y) |
|---|---|
| p36 | ~35 s |
| calendrier × 7 fenêtres | ~20 s |
| p35 / p32b / adhérence | ~15–19 s |
| detectDiscoveries | ~1,7 s |

### Yields F7.0b

Frontières entre producteurs : **oui**.  
À l’intérieur de p36 / `computeCalendarMonthSportStats` : **non** → Long Task résiduelle = chunk le plus lourd.

### Options (validation humaine requise avant exécution)

1. **Coopération interne** (paquets de jours / occasions) — risque identité à prouver.  
2. **Mémo calendaire partagée** entre `measureRecapWindow` — réduit A, preuve identité.  
3. **Web Worker** — moteur sans DOM ; coût transfert snapshot (~profil réel : centaines de clés reps, pas 2y densifié) ; garder sync de référence.  
4. **Hybride** : Worker pour bundle discoveries + UI atomique déjà en place.

**Recommandation provisoire :** mesurer chunks exclusifs sur profil réel après Unlock ; si max sync > 1–2 s, prioriser (1)+(2) avant Worker ; si max reste > 5 s sur p36 réel, plan Worker avec preuve d’identité.

---

## 5. F7.0c-E — Diagnostic console analytique

### Comportement actuel — **prouvé par code**

`AnalysisEngineConsole` :

- Au `run()` : appelle **`buildAnalysisEngineDiagnosticReport`** synchronement.
- Ce rapport **recalcule** assessment + `buildAdaptiveRecapInsights` avec `collectDiagnostic: true` — **ne réutilise pas** le bundle Recap déjà en mémoire.
- Sérialisation / tables / forensics sur gros graphe → gel probable à l’ouverture / au changement de période console.

### Corrections proposées (non implémentées — attente validation)

1. Ouvrir la coquille console immédiatement (`busy` UI) ; différer `run` idle.  
2. Réutiliser `periodDiscoveries` / assessment du hook Recap si même période + même révision.  
3. Charger sections forensics à la demande (pas tout le registry d’un coup).  
4. Virtualiser les tables denses.  
5. `collectDiagnostic` uniquement sur action explicite, jamais sur navigation Analyse normale (déjà vrai hors console).

---

## 6. Mesures avant / après

| Indicateur | Avant | Après F7.0c B/C |
|---|---|---|
| Publications insights visibles / requête | 2–3 (legacy → final) + contamination période | **1** ready (+ refreshing cache) |
| Cartes provisoires legacy | Oui | **Non** (code) |
| Empty faux pendant load | Oui | **Non** |
| Long Task max navigateur | 15–29 s (mesure F7.0) | **Non remesuré** |
| 2y→7j | ~29 s (F7.0) | **Non remesuré** |

---

## 7. Accès navigateur

Écran **Unlock the app** (100 %, bouton actif) — **aucune contournement**.  
Action humaine requise : cliquer Unlock, puis rejouer scénarios F7.0c-F.

---

## 8. Limites / dette

1. Chunks sync producteurs (D).  
2. Console recalcule tout (E).  
3. `await` yields ≠ garantie frame si un seul producteur > plusieurs secondes.  
4. Remesure live manquante.  
5. `publishedInsightsRef` anti-régression richesse : conservé ; n’affiche plus de legacy en amont.

---

## 9. Critères de succès — scorecard

| # | Critère | Statut |
|---|---|---|
| 1–2 | Ouverture / contrôles | Partiel (structure OK ; Long Task D ouvert) |
| 3–5 | Période / cache / loading | Code OK ; navigateur NV |
| 6–8 | Pas de provisoire / contamination | **Code OK** |
| 9 | Abandon calcul | Abort entre chunks ; pas intra-p36 |
| 10–11 | Console | Diagnostic seul |
| 12–15 | Identité / cache / comptes / tests | **OK fixtures** |
| 16 | Mesures navigateur | **Non** |
| 17 | Limites documentées | **Oui** |

---

## 10. Demande de validation

Avant D (coop interne / mémo calendaire / Worker) et E (console) :

1. Déverrouiller l’app.  
2. Vérifier : changement de période → « Préparation des analyses… » sans cartes legacy.  
3. Cache 7j après visite → réaffichage rapide sans flash.  
4. Autoriser ou non : plan D (préciser option 1/2/3) et correctifs console E.

**Aucun commit. F7.1 non engagé.**
