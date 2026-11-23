# Dialogue technique — Mission 23

Avis indépendant. Les hypothèses ChatGPT sont confrontées au code.

## Porte A — Mémoire vs sélection

**Fonctionnement actuel (avant correctif)**  
`evolveCollectivePhenomenonMemory` + `decideInformativePriority` produisent `publicationDecision.newPriorityCard=false` (ex. `confirmation_sans_nouveaute`). La carte garde pourtant `informativeValue` élevé et `selectCollectively` ne lisait pas cette décision → `selectionReason=p6_priority`.

**previousState sur 7j** vient de `priorMemory.phenomena[episodeId]` injecté via `extras.analyticalMemory` (chargé dans le worker depuis `loadAnalyticalMemory(u:…|local)`). Ce n’est pas `memoryEvidence` d’export.

**Écart memoryEvidence** : l’export rechargeait souvent un profil (`local`) ou un état sans phénomènes alors que les cartes embarquent la mémoire du run ; les expositions (59) peuvent s’accumuler via `noteExposure` sans phénomènes si `memoryUpdate` n’a pas persisté.

**Sept horizons** : packs calculés/cachés séparément ; s’ils ne partagent pas le même `analyticalMemory` initial au moment du compute, un horizon voit `new` et un autre `confirmed_once`. Contrat théorique : même état initial figé pour une campagne multi-horizons.

**Correction** : `selectCollectively` démotive (`demoted_memory_familiarity`) si `newPriorityCard===false`, sauf `forcePriority` explicite. Persistance testée sur profil isolé. Pas de suppression systématique.

## Porte B — Hiérarchie

**Premier point de divergence** : `subjectIdsOf` incluait `metrics.events` du parent collectif → tout mouvement présent dans le nuage d’événements (ex. Dips) partageait un sujet avec le collectif même hors des 9 `namedMoves` documentés. `justifyParentChildLink` était bien appelé dans `markDeepenings`, mais avec une définition trop large du sujet.

**Second point** : `publishableP6Card` n’exportait pas `hierarchyLink` ; `insightsFromP6` relabelisait quand même `verified_hierarchy_deepening` dès que `p6Disposition===deepening_of_collective`.

**Correction** : sujets parent collectif = participants documentés uniquement ; deepening sans `hierarchyLink.ok` → autonome, jamais « verified ».

## Porte C — Trace

Classer `not_called` faute d’étapes était une erreur d’observabilité. Désormais : `unknown_not_instrumented` vs exécution observée. `applyP6` émet `pipelineSteps` (validation, composition, hierarchy, select, memory, publication).

Détecteur « fusions injustifiées » élargi aux `parentId` sans lien ok.

## Porte D — Fingerprint / réconciliation

Le moteur consomme `activeProgram`, Garmin/sommeil et `nameMap` hors snapshot plat ; le fingerprint v4 ne les voyait pas → `programId=null`, `garminSleepDays=0`. v5 accepte un contexte.

Réconciliation : Markdown et JSON s’alignent sur `finalCatalogReconciliation.reconciledStrict`.

## Questions architecturales

1. **Mémoire contredite** : décision calculée mais non consommée par la sélection (corrigé).  
2. **Hiérarchie verified sans preuve** : label marketing + sujets trop larges + perte à l’export (corrigé).  
3. **Plusieurs autorités de publication** : encore P6 counters, dispositions, finalCatalog, MD legacy — centralisation partielle via reconciledStrict.  
4. **Faits communs** : partagés dans detect/compose/export ; pas tous les producteurs.  
5. **Raisonnement non utilisé** : relations coverage souvent kind-matching ; packs A–F absents comme runners.  
6. **À simplifier** : une seule voie publicationDecision → sélection → disposition export.  
7. **Difficultés restantes** : branchement (fingerprint contexte aux appels), observabilité (instrumentation partielle), moteur (sommeil/horizons/généralisation).  
8. **P6 non satisfaits** : DOM, QUAL aveugle, sommeil contextualisé, différenciation horizons, parité attribution live, C/D collectifs, exploration honnête complète.

## Stratégie de clôture (avis)

Ne pas ouvrir P7. Prochaine mission = campagne de preuves live (fingerprint+nameMap figés, DOM 8 horizons, A/B/C sur packs réels, paquet aveugle humain) plutôt que nouvelles briques. Les contrats manquants restants sont surtout d’exécution observée, pas d’architecture parallèle.
