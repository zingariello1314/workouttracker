# Rapport final — Refonte moteur d’analyse + console diagnostic

**Date :** 2026-11-04  
**Commit Git :** aucun (demande explicite)  
**Schémas :** `phenomenon-v1`, `analysis-engine-comparison-v1`, `analyse-dom-capture-v1`

---

## A. Modifications du moteur

### Causes racines corrigées

1. **Sélection par quotas familiaux / épisode trop destructeurs** — remplacé par collapse sémantique de phénomène + soft overflow IV-driven (caps = garde-fous, pas le moteur principal).
2. **Kind confondu avec phénomène** — contrat `buildPhenomenonRecord` / `collapseByPhenomenon` / rivalités complémentaires.
3. **Identités non résolues** — réparation via `exerciseDisplayNames` + `resolveStorageExerciseIdentity` (sans inventer de nom) ; statut diagnostic explicite si échec.
4. **Trajectoires superficielles** — `analyticalReading` (constat / mécanisme / portée / implication) sérialisé dans `trajectoryToMetrics`.

### Fichiers principaux

| Fichier | Rôle |
|---|---|
| `recapPhenomenonContract.js` | Identité de phénomène, collapse, matchConfidence |
| `recapPeriodSelection.js` | Collapse phénomène + soft overflow familles |
| `recapEditorialSelection.js` | Identity enrichie, caps épisode soft, complementary rivalry |
| `recapInsightNature.js` | Caps sport + `SIGNAL_FAMILY_SOFT_OVERFLOW` |
| `recapEditorialIdentity.js` | Chaîne résolution complète |
| `exerciseTrajectoryAnalysis.js` | `analyticalReading` structuré |
| `analysisEngineComparison.js` | Comparaison A/B, issues, DOM↔pack, exports |
| `analysisEngineCompareRegistry.js` | Registre fusionné + filtres comparatifs |
| `analysisEngineDomCapture.js` | Capture DOM Analyse (DEV) |
| `AnalysisEngineConsole.jsx` (+ CSS) | UI A/B, Problèmes, 2y, exports |

### Sélection value-first (résumé)

1. Scorer (IV informative + éditorial).  
2. Collapse identité technique.  
3. Collapse phénomène sémantique.  
4. Packer avec rivalités complémentaires / contradictions volume.  
5. Soft overflow si IV élevée et sujet distinct — **pas** un nouveau plafond rigide déguisé.

### Empreintes 8 périodes (fixture jul–oct 2026)

Mesures **vérifiées** via `scripts/fingerprint-period-bundles.mjs` → `period-bundle-fingerprint-after-refonte.json`.

| Période | Candidats | Sélectionnés (avant mod.) | Sélectionnés (refonte) | ms refonte |
|---|---:|---:|---:|---:|
| today | 23 | 12 | 10 | 565 |
| 7d | 35 | 11 | 12 | 513 |
| 30d | 58 | 21 | 20 | 1195 |
| 3m | 66 | 22 | 26 | 1672 |
| 6m | 68 | 24 | 27 | 1564 |
| 1y | 69 | 24 | 28 | 1851 |
| 2y | 64 | 24 | 29 | 2383 |
| all | 64 | 24 | 29 | 5276 |

**Note factuelle :** la hausse du nombre de cartes sur les longues périodes n’est pas une preuve qualitative à elle seule. Elle coïncide avec soft overflow + moins de pertes « same episode / same phenomenon ». Les périodes courtes restent stables ou légèrement plus sélectives (today 12→10).

---

## B. Modifications de la console

### Architecture

- **Avant :** un `report` + aperçu KPI optionnel `compareReport`.  
- **Après :** deux rapports complets A/B, `buildDiagnosticComparison`, modes **A | B | Comparaison**, registre fusionné, vue Problèmes, capture DOM, exports enveloppe.

### Capacités livrées

- Sélecteur 8 périodes dont **2y**.  
- Double run Worker (A puis B), erreurs B isolées (A conservé).  
- Registre comparatif + filtres (communes, only A/B, flips de statut, caps, identités non résolues).  
- Inspecteur : onglet Identité / phénomène / lecture structurée / trail éditorial.  
- Vue **Problèmes détectés** + lien vers registre.  
- Export JSON simple ou comparatif (`periodA` + `periodB` + `comparison`).  
- Export Markdown comparatif exploitable.  
- Bouton **DOM** : scrape best-effort des cartes Analyse vs pack `shown_now`.

---

## C. Preuves

### Tests exécutés (vitest) — OK

- `recapPhenomenonContract.test.js`
- `analysisEngineComparison.test.js`
- `recapEditorialSelection.f5.test.js`
- `recapEditorialIdentity.f51.test.js`
- `recapAnalyticalReading.test.js`

**41 + tests lecture :** tous verts sur ces fichiers.

### Fingerprint

- Généré : `docs/analyses-documentation/fixtures/period-bundle-fingerprint-after-refonte.json`
- Script exit code 1 après écriture réussie (comportement préexistant / non bloquant) — **fichier présent et valide**.

### Recette navigateur

- URL ouverte : `http://localhost:3001/?tab=dev-analysis-engine`
- Session en restauration / UI verrouillée (« Unlock the app ») au moment du passage automatisé.
- **Non vérifié de bout en bout dans le navigateur authentifié** lors de cette intervention : Relancer A/B, exports, filtres, DOM.
- À faire manuellement une fois la session déverrouillée (checklist §19 du brief).

### Extraits JSON (structure)

```json
{
  "schemaVersion": "analysis-engine-comparison-v1",
  "mode": "comparison",
  "periodA": { "report": { "...": "rapport complet" } },
  "periodB": { "report": { "...": "rapport complet" } },
  "comparison": {
    "overview": {},
    "matchedPhenomena": [],
    "onlyInA": [],
    "onlyInB": [],
    "statusTransitions": [],
    "issues": []
  }
}
```

---

## D. Analyses avant / après (exemples réels fixture)

Textes **après** tirés du fingerprint refonte (sélection / candidats). Les « avant » sont ceux de `period-bundle-fingerprint-after.json` (post-modularisation, pré-refonte sélection) quand disponibles ; sinon noté « même producteur, enrichissement mécanisme ».

1. **Pompes déclinées — retour (today/30d)**  
   - Après : réapparition 28 j + format 5×10→5×10 + portée « retour ponctuel » + historique 7 séances.  
   - Phénomène : `return_after_gap`.  
   - Amélioration : mécanisme de format explicite, pas seulement « revient ».

2. **Pompes déclinées — recul confirmé**  
   - Après : 50→33,7 reps/séance, séries 5→4, reps/série stables.  
   - Phénomène : trajectoire `net_decline` / content-driven.  
   - Amélioration : distinction volume séance vs schéma séries.

3. **Relevés de genoux à la barre — fréquence**  
   - Après : total monte parce que fréquence d’entraînement augmente.  
   - Phénomène : attribution fréquentielle (complémentaire d’un retour).

4. **Relevés de genoux aux parallèles — interruption**  
   - Après : carte return distincte.  
   - Complémentarité avec (3) sur sujets différents.

5. **Face pull — vs habit (30d)**  
   - Conservée : comparaison au niveau habituel avec preuve chiffrée.

6. **GTG hors planning**  
   - Conservée / priorisée : signal méthodologique hors séances classiques.

7. **Volume shape 30d**  
   - Conservée : dépassement vs période précédente (descriptif contrôlé).

8. **Dips — volume par séance**  
   - Présente dans les candidats ; sélection value-first peut préférer trajectoire plus riche.

9–15. Diversité familles sur 6m/1y/2y (empreinte) : regularity weekday, GTG, volume arcs, emergences multi-exercices, progress — **5+ kinds distincts sélectionnés** sur longues périodes (vérifié par comptage fingerprint, pas par lecture qualitative ligne à ligne de 15 paires avant/après UI).

**Limite honnête :** 15 paires texte « avant édité / après édité » strictement juxtaposées UI n’ont pas toutes été rejouées sur historique live > oct. 2026 ; les exemples 1–8 sont ancrés fixture ; 9–15 sont des familles/kinds confirmés dans le pack refonte.

---

## E. Limites restantes

| Élément | Statut |
|---|---|
| Contrat phénomène + collapse | Terminé + tests |
| Soft overflow sélection | Terminé + tests |
| Résolution identité snapshot/storage | Terminé ; **candidats fixture** peuvent encore porter des noms vides si displayNames absents du snapshot de fingerprint |
| analyticalReading trajectoires | Terminé (instrumentation) |
| Console A/B + exports + issues + 2y + DOM | Code livré |
| Recette navigateur authentifiée complète | **Non terminée** (session verrouillée) |
| Historique live multi-années hors fixture | **Non rejoué** ici |
| Cache tiède vs froid séparé (Worker UI) | Partiellement (ms fingerprint = froid script) |
| Trail éditorial 15 étapes exhaustif | Partiel (`non_instrumenté` si non capturé à la source) |
| Corrélations sport×sommeil | Non forcé (conforme brief) |

### Critères d’acceptation — lecture factuelle

1. Caps moins destructeurs (soft overflow) — **oui (code + tests + hausse packs longs)**.  
2. Doublons vs complémentaires — **oui (contrat + tests)**.  
3. Identités fiables — **amélioré** ; unresolved encore possibles si données absentes.  
4. Trajectoires mécaniques — **oui (structured reading)**.  
5. Analyses plus riches sans remplissage — **soutenu par textes fixture** ; validation qualitative live partielle.  
6. Huit périodes — **fingerprint oui**.  
7–11. Console comparaison / registre / JSON / MD — **implémenté** ; **UI live non validée**.  
12–13. Anomalies + compteurs — **détecteur + registre** ; cohérence counters testée unitairement.  
14. Perfs mesurées — **fingerprint ms**.  
15. Non-régression tests ciblés — **OK**.  
16. Navigateur — **bloqué session**.  
17–18. Pas de pollution historique / pas de résultat obsolète UI — **non prouvé navigateur**.  
19. Pas de commit — **respecté**.  
20. Preuves vs affirmations — **ce rapport**.

---

## Suite recommandée (hors scope « dire que c’est fini »)

1. Déverrouiller la session → Relancer **30d vs 7d** → vérifier registre Comparaison + export JSON.  
2. Capturer DOM depuis Analyse puis comparer dans Problèmes.  
3. Relancer fingerprint avec un snapshot incluant `exerciseDisplayNames` complets pour mesurer la baisse réelle des `unresolved_exercise_name`.
