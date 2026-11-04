# Rapport de clôture — Cohérence données / analyses / observabilité

**Date :** 2026-11-04  
**Commit Git :** aucun  
**Preuves :** exports comparaison 30d vs 7d (Desktop + Downloads), recette navigateur précédente, tests vitest

---

## 1. Causes racines établies

| # | Cause | Preuve | Classe |
|---|---|---|---|
| C1 | **387 reps = journée 2026-11-02** absente du snapshot A, présente dans B | dayRows A `reps:0` vs B `reps:387` ; Δ identique 30d et 7d | **Corrigé et vérifié par analyse d’exports** |
| C2 | Runs A/B **non équivalents** (hist 0 vs 180, quiz missing vs ok, Garmin 87 vs 89) | meta + dataCatalog des deux JSON | **Corrigé (contrat comparabilité)** + vérifié tests |
| C3 | `sameSignature: true` avec signatures null | bug `!domSig \|\| !packSig` dans `compareDomToPack` | **Corrigé et vérifié par tests** |
| C4 | Fausses alertes `unresolved_exercise_name` sur kinds transversaux | `editorialCanTake` + détecteur sans `requiresExerciseIdentity` | **Corrigé et vérifié par tests** |
| C5 | Pack 33→15 / 21→11 : **historique éditorial 0→180**, pas les 387 reps | novelty engine + entryCount | **Expliqué** (pas un bug de volume) |
| C6 | « Relevés … **revient** » | gate / polish / catalog sans `isPluralExerciseLabel` systématique | **Corrigé et vérifié par tests** |
| C7 | Retours 42 vs 77 jours (même exercice) | producteurs distincts ; écarts non fusionnés | **Détecté** (vue cohérence) — fusion éditoriale **implémentée en alerte**, pas encore fusion auto live |

---

## 2. Corrections apportées (fichiers)

| Fichier | Rôle |
|---|---|
| `analysisEngineSubjectContract.js` | **nouveau** — types de sujet + `requiresExerciseIdentity` |
| `analysisEngineRunManifest.js` | **nouveau** — manifeste run + comparabilité |
| `analysisEngineCoherence.js` | **nouveau** — contradictions retours / progress-regress |
| `analysisEngineComparison.js` | DOM honest ; issues typées/dédupliquées ; contexte comparabilité |
| `analysisEngineDomCapture.js` | capture v2 + repli `article.k` + états vide/loading |
| `analysisEngineDiagnostic.js` | runId / runManifest / coherence sur le rapport |
| `analysisEngineDiagnosticModel.js` | `evidenceCount` élargi |
| `analysisEngineInvestigationExport.js` | manifeste + cohérence dans le dossier |
| `recapEditorialSelection.js` | identité exigée seulement si sujet exercice |
| `recapEditorialGate.js` / `recapEditorialPolish.js` / `recapAnalysisCatalog.js` | accords revient/reviennent |
| `AnalysisEngineConsole.jsx` | bandeau comparabilité + MD pack↔DOM enrichi |
| Tests `analysisEngineComparison` / `analysisEngineRunManifest` | non-régression |

---

## 3. Réconciliation exacte des 387

Voir `RECONCILIATION-387-REPS-2026-11-04.md`.

**Résumé :** +387 = jour **2026-11-02** entier. Ledger partiel nommé dans l’export B = 256 reps (6 exercices) ; reste ~131 via canaux calendaires non sérialisés dans l’export comparaison (**limite technique documentée**).

---

## 4. Différence 33/15 et 21/11

| | Run hist=0 | Run hist=180 |
|---|---:|---:|
| 30d shown | 33 | 15 |
| 7d shown | 21 | 11 |

Mécanisme : `computeCandidateNovelty` pénalise thèmes / claims déjà vus dans les 180 entrées.  
Ce n’est **pas** la conséquence des 387 reps (qui vont dans l’autre sens : plus de volume → souvent plus de candidats produits, ici 30 vs 34).

---

## 5. Pack vs DOM

| Export | Pack | DOM capturé | Ancien `comparable` | Nouveau contrat |
|---|---:|---:|---|---|
| A | 33 | 11 | true (buggé) | `indeterminate` si sig null ; `comparable` seulement si sig match |
| B | 15 | 0 (`dom_scrape_empty`) | true + sameSignature true | `indeterminate` + `emptyReason: selector_or_tab_not_ready` |

Écart 33≠12 : couches différentes (pack diagnostic vs publication Analyse + hist). Désormais **explicable**, pas présenté comme régression.

---

## 6. Alertes identité

- Transversal (`disc_repertoire`, `disc_exercise_base`, …) → plus d’exigence d’`exerciseId` à la sélection.
- Détecteur : reclasse en `transversal_misclassified_as_unresolved_identity` (severity **low**, `userImpact: false`).
- Identité réelle non résolue sur kind exercice : **medium** si hors pack, **high** si publié.

---

## 7. Alertes sans preuve

- `evidenceCount` compte désormais sessions / dayRows / dates / composedEvidence / gapDays…
- `selected_without_evidence` ignore les cartes avec preuves implicites (`hasImplicitEvidence`).

---

## 8. Contradictions

- Module `analysisEngineCoherence` : conflits de `gapDays` (ex. 42 vs 77) → alerte `conflicting_return_gaps`.
- Pas de fusion automatique des textes live dans cette passe (évite de changer le moteur « pour produire plus »).

---

## 9–12. Audit 8 périodes / perf / tests / captures

| Item | Statut |
|---|---|
| Tests ciblés contrats (24) | **Réussis** |
| Recette navigateur 8 périodes complète | **Non rejouée** dans cette passe (session déjà utilisée pour P0 exports) |
| Perf avant/après | **Non mesurée** ici (hors scope immédiat des contrats) |
| Exports de preuve | JSON Desktop/Downloads + MD réconciliation |

---

## 13. Limites résiduelles

1. Ledger complet des 131 reps restantes du 02/11 **hors export** (besoin snapshot brut / IndexedDB).
2. Instrumentation React `data-analyse-card` encore partielle → capture DOM souvent `partial`.
3. Fusion éditoriale auto des doubles retours **non** déployée (alerte seulement).
4. Hydratation `getCurrentData()` au clic diagnostic : pas encore de garde « snapshot ready » bloquante (seulement signatures + bandeau).
5. Priorités console (inspecteur Pourquoi / virtualisation / 8 perf scenarios) : **partielles**.

---

## Classification demandée

| Résultat | Classe |
|---|---|
| 387 reps = jour 2026-11-02 | Corrigé et vérifié (exports) |
| Comparabilité runs / no false regression | Corrigé et vérifié par tests |
| DOM sameSignature null | Corrigé et vérifié par tests |
| Fausses identités transversales | Corrigé et vérifié par tests |
| Preuves implicites | Corrigé et vérifié par tests |
| Grammaire revient/reviennent | Corrigé et vérifié par tests |
| Cohérence 42/77 | Implémenté (alerte) mais non vérifié navigateur |
| Garde hydratation snapshot | Défaut confirmé restant (signatures aident) |
| Recette 8 périodes live | Bloqué / non rejoué cette passe |
