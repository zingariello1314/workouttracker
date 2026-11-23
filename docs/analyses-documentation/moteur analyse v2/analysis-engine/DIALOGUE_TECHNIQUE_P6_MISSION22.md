# Dialogue technique P6 — Mission 22

Pour chaque observation : fonctionnement actuel → producteurs/consommateurs → rupture → nature du défaut → alternatives → avis.

---

### 1. Attribution 100 % (app) vs ~51 % (rejeu)

| | |
|---|---|
| **Fonctionnement** | `decomposeMonthlyProgramChange` → `matchSessionToProgramSlot` ; `recognizedVolumeShare` = volume hors `unattributed` ; `partitionCoverage` ≈ 1. |
| **Producteurs** | `monthlyProgramComposition`, `sessionSlotMatching`, catalogue `buildSessionCatalog`. |
| **Consommateurs** | `discoveryFromMonthlyComposition`, export `observedValues`. |
| **Rupture** | Pas un swap de métriques silencieux post-M21. Volumes classiques **identiques** (5803 / 3881). Sur backup figé + résolveur journal/DB/identité : recognized ≈ **51 %**, structural = **0**, probable ≈ 44 %. L’export app v20 (recognized=100, structural=33, probable=67) implique une **surface d’identité live plus riche** (programme actif, nameMap async, prescriptions) non entièrement reproductible depuis le seul backup. |
| **Nature** | Défaut d’**environnement comparable**, pas forcément défaut moteur. |
| **Alternatives** | (a) figer programme+nameMap dans l’export ; (b) forcer le rejeu à utiliser le même nameMap sérialisé ; (c) déclarer non-parité tant que le programme live diverge. |
| **Avis** | (b)+(a). Ne pas « corriger » le rejeu pour afficher 100 % sans les mêmes entrées. Street Workout ΔM20/M21 vs export : contributions dépendent des sessions classées — avec plus de reconnaissance, les deltas familiaux changent. |

Preuve : `artifacts/analysis-eval/mission22-attribution-parity.json`.

---

### 2. `factRegistry` ≈ 2 faits malgré 21/8 annoncés au rejeu

| | |
|---|---|
| **Fonctionnement** | Découvertes M21 posent `metrics.sharedFacts` + `metrics.factRegistry`. L’export `buildAnalyticalAudit.slimCard` **ne conservait pas** ces champs. `factRegistry` d’audit était reconstruit via `extractAtomicFactsFromCards` (observedValues numériques + fenêtre) → quasi vide. |
| **Rupture** | Sérialiseur d’export (`slimCard`), pas le moteur de découverte. |
| **Nature** | **Défaut d’export / branchement**. |
| **Correction M22** | `slimCard` conserve `sharedFacts`, `factRegistry` slim, `memory`, `contributionRegistry` ; fusion dans `factRegistry` global. |
| **Avis** | Deux représentations existaient (`analyticalFacts` vs `extractAtomicFactsFromCards`). Garder les deux en fusion, une seule autorité d’identité (`fact|…`). |

---

### 3. `memoryEvidence.status=not_passed_to_export`

| | |
|---|---|
| **Fonctionnement** | `buildAnalyticalAudit` attend `memorySummary`. `completeAuditDossier` / `RecapTab` ne le passaient pas (ou un stub). `detectDiscoveries` lisait `extras.analyticalMemory` **jamais injecté** depuis le worker. |
| **Rupture** | Branchement UI/worker → extras ; puis export. |
| **Nature** | Défaut de branchement (mémoire existante sous-utilisée). |
| **Correction M22** | Injection `analyticalMemory` dans extras / worker / pipeline ; `memoryUpdate` renvoyé ; `saveAnalyticalMemory` côté UI ; export `memorySummary` chargé + mémoire carte. |

---

### 4. `hierarchyLink` absent sur 688 cartes

| | |
|---|---|
| **Fonctionnement** | `markDeepenings` + `justifyParentChildLink` (sujet ∩ dimension ∩ épisode). |
| **Rupture probable** | Liens rejetés (`no_shared_subject` / dimension) **ou** lien posé puis perdu dans une sérialisation intermédiaire. Le mécanisme M14 est réel (preuve unitaire parent collectif / enfant retour OK). |
| **Avis** | Ne pas inventer de liens thématiques. Exporter `rejectedDeepeningLinks` et les `hierarchyLink` réussis ; slimCard les conserve désormais. |

---

### 5. `reconciledStrict=false` vs Markdown `countsReconciled=true`

| | |
|---|---|
| **Cause** | Deux autorités : réconciliation publication vs catalogue final post-polish ; Markdown lit parfois `countGap` d’un sous-ensemble. |
| **Avis** | Une seule table de vérité dérivée des ensembles (publiés, accessibles, registre) ; pas d’égalité forcée entre populations distinctes. |

---

## Questions architecturales (réponses)

1. **Autorité séances/faits** — Partiellement opérationnelle sur parcours migrés ; encore une couche en plus des détecteurs historiques non migrés.  
2. **Contournements** — Detecteurs legacy prose-first ; `extractAtomicFactsFromCards` reconstruit sans `analyticalFacts` ; worker sans mémoire (corrigé).  
3. **Mémoire vs sélection** — Avant M22 : sélection avant mémoire réelle. Après : `decideInformativePriority` consomme la transition si `priorMemory` injecté.  
4. **Transformations post-validation** — Polish éditorial, gate raw_id, refillAfterGate, fusion titres.  
5. **Contrat générique** — « Toute conclusion migrée doit citer `sharedFacts[]` résolubles » + refus d’export si slim les coupe.  
6. **Rejeu ≠ export** — slimCard + memorySummary manquant (corrigé côté code ; à revalider sur export utilisateur v21).  
7. **Capacités cas-utilisateur** — Collectif nov. + familles street workout ; packs A–F incomplets en pipeline publié.  
8. **Exploration non exécutée** — Historiquement documenté = 0 ; variantes absentes ; sommeil croisé familles souvent abstenu.  
9. **À retirer/centraliser** — Alias `attributionShare` ; double extraction de faits ; stubs memoryEvidence.  
10. **Obstacles P6 finale** — Parité app/rejeu prouvée sur même nameMap ; DOM ; A/B/C branchés ; hiérarchie visible ; sommeil/horizons généralisés ; Vitest globale.

### Avis sur l’ordre Mission 22

Correct : Porte A/B avant mémoire persistante. Risque : vouloir clôturer généralisation A–F + sommeil dans la même mission — prioriser chaîne produit (faits/mémoire/export/parité) ; packs comme preuves ciblées, pas batterie exhaustive non instrumentée.
