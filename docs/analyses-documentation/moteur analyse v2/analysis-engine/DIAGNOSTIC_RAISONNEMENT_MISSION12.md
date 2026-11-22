# Diagnostic raisonnement — Mission 12

Édition courante : `editorial=p6-sovereign-v11` · `composition=phenomenon-compose-v1` · `coherence=inter-horizon-v1` · `program=structural-context-v3`  
Gel v10 : `artifacts/analysis-eval/baselines/p6-sovereign-v10-before-mission12.meta.json`

---

## 1. Pourquoi les correctifs M11 ne sont pas tous visibles sur 7j / 30j ?

| Cause | Preuve code |
|---|---|
| Packs exportés / consultés **avant** rechargement v10 | `mayPresentBundleAsCurrent` refuse une édition différente, mais un export Markdown ancien reste lisible hors moteur |
| `polishPublishedInsights` **n’avait aucun appelant** | `editorialProseGuard.js` — polish réserve/priorité incomplet hors `publishableP6Card` |
| Source sommeil encore « seuil … observé » | `recapPeriodDetectDiscoveries.js` titres sleep |
| Annotation programme = note générique, pas raisonnement | `programVariantContext.annotateTrajectory` (avant M12) |
| Horizons longs recalculés plus souvent que 7j/30j en cache | Worker + `cacheReuseDecision` par période |

**M12** : brancher `polishPublishedInsights` dans `insightsFromP6` ; réécriture prescriptions ; titres sommeil sans « seuil ».

---

## 2. Chemins susceptibles de servir d’anciennes conclusions

1. Cache navigateur d’un bundle `analysisEdition` ≠ courant (`useRecapTabMetrics` / worker).  
2. Export 8 périodes figé hors session.  
3. Cartes hors `publishableP6Card` (si chemin legacy) — désormais polish global.  
4. Réserve : aujourd’hui polishée via `polishPublishedInsights`.

---

## 3. Contradictions de volumes mensuels multi-horizons

Cause typique : **même label « 30 derniers jours »** calculé depuis des **populations / identités / agrégats différents** (enregistrement vs occurrence vs variante), pas une seule table de faits atomiques partagée.

Module : `interHorizonFactCoherence.js` — détecte `same_fact_different_values_across_horizons` et labels incompatibles.  
Intégré au jeu A (`referenceFacts.periodFacts`).

---

## 4. Pourquoi les retours collectifs restent individuels ?

`exploreCollectiveReturn` exige ≥3 gaps significatifs **et** un lien (famille / séance / version).  
Même quand conclu, la sélection favorisait les `disc_ms_return` (nouveauté individuelle).  
`collectiveReview` peut marquer `deepening_of_collective`, mais les weights des individuelles restaient hauts.

**M12** : composition de prose (`composeCollectiveReturnReading`) + boost sélection `collective_return` / `composed_*` + pénalité reprises individuelles semaine/mois.

---

## 5. Les trajectoires connaissent-elles le programme ?

Partiellement. `annotateTrajectoryWithProgramContext` est appelé en fin de `detectDiscoveries`.  
**Avant** : note générique. **M12** : `rewriteTrajectoryWithPrescriptions` cite `3×12` / `5×10` réellement trouvés.

Appariement séance↔créneau : toujours absent (`no_slot_matching`).

---

## 6. Lien prescriptions ↔ réalisations

`findProgrammedVolumeVariants` lit le **programme courant** uniquement.  
Pas de rétroprojection d’historique.  
Pas de matching automatique créneau↔séance réalisée.

---

## 7. Pourquoi charges collectives < première apparition ?

Sélection : émergences scorées nouveauté/fit élevés ; `load_progression` souvent en réserve.  
**M12** : `composeLoadProgressionPhase` + boost `load_phase` / `load_progression` mois/semaine.

---

## 8–9. Relations exécutées vs contrats

| Relation | Exécutée | Notes |
|---|---|---|
| Retour collectif | Oui | Enrichie M12 |
| Variantes prescrites | Oui (prose) | Pas matching créneau |
| Fréquence × contenu | Oui | `composeVolumeFrequencyContentReading` + `symmetricDecomposition` |
| Concentration relative | Module prêt | À brancher sur données live 7j/30j |
| Inter-horizons | Contrôle | Pas encore producteur correcteur |
| Matrice underexploration | Rapport | Peu consommée par sélection |

---

## 10. La 4ᵉ passe transforme-t-elle ?

Partiellement : `reviewCollectively` peut remplacer `body` par `exploration.conclusion`.  
M12 enrichit la conclusion collective **à la production**, pas seulement en pass4.  
`reexplored` seul ≠ preuve de meilleure lecture.

---

## 11. Phénomènes anciens sur packs courts

Horizon fit faible + scores individuels + mémoire d’exposition parfois nulle (`history` non passé).  
Boost semaine M12 favorise structure/composition ; pénalise émergences.

---

## 12. Identifiants d’un exercice canonique

`discoveryIdentity` / `stablePublicationId` : occurrence ≠ phenomenon texte.  
Trajectoires par ligne de stockage encore possibles — M6 stable, M12 n’y touche pas.

---

## 13. Métriques poussée / tirage

Plusieurs populations : mono-principales, multi, attributions conventionnelles, exclusions défis.  
Somme 1304 vs total 1340 = écart à documenter, pas à forcer.  
Réconciliation complète populations : **encore partielle**.

---

## 14. Sommeil « hebdomadaire » multi-semaines

`publishSleepCandidates` utilise des paires historiques (≥8), pas la seule fenêtre 7j.  
Les cartes portent des résultats d’échantillon large étiquetés dans un pack court.

**À poursuivre** : afficher explicitement la fenêtre d’appariement dans chaque claim.

---

## 15. Limitations d’adhérence historique

`snapshots=0`, `reconstruct=0`, plans non figés → cartes méthodologiques contradictoires possibles.  
Cause : absence de journal de plans, pas un bug de taux seul.

---

## 16. Complémentaires = preuves / approfondissements

Oui : `deepening_of_collective`, `secondary_to_structure`, `family_cap_reserve`.  
Hiérarchie : `conclusionHierarchyContract` — à mieux exposer UI.

---

## 17. Indispensable pour P6

1. Preuve live v11 : collectif publié, décompositions, prescriptions dans les textes prioritaires.  
2. Faits atomiques partagés → zéro contradiction inter-horizons sur hyperextension / genoux.  
3. Sommeil contextualisé (famille de séance) sans redondance.  
4. DOM + A/B/C × 8 + mémoire.  
5. Aveugle qualitatif.

---

## 18. Meilleur rendement qualitatif

1. Composition (collectif + volume fréquence/contenu + charges) — **fait M12 code**.  
2. Programme dans le raisonnement — **fait M12 partiel**.  
3. Cohérence inter-horizons — **contrôle fait**, correction producteur à poursuivre.  
4. Sélection / hiérarchie — **boosts faits**.  
5. Exports audit réellement remplis live.

---

*Réponses fondées sur le code ; les preuves produit live post-v11 restent à produire depuis Récap → Analyse.*
