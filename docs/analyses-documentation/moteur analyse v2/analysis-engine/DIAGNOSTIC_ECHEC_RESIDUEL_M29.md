# DIAGNOSTIC — Échec résiduel Hyperextension — Mission 29

Baseline : `artifacts/analysis-eval/mission29-baseline/` (exports v27).  
Édition code après correction : `p6-sovereign-v28`.

## Règle d’arrêt M28 appliquée

Trois tentatives locales (M27 aspects, M28 subjectKey + destination + reconcile publication) n’ont pas éliminé l’orphan en produit.  
**Pas de quatrième rustine locale** : investigation des responsabilités.

## Observations v27 (confirmées)

| Signal | Valeur |
|---|---|
| Parent recent30 | `exact_duplicate_suppressed` |
| `collapsedInto` | → parent `quarter` |
| Enfants structural_memory | `parentId` = recent30, `hierarchyLink.ok=true` |
| `orphan_parent` | 2 (période 3m) |
| `unjustifiedFusions` | 0 |
| Dispositions `parent_detached` | présentes (côté effets) |
| Cartes finales | **gardent** le parentId (pas détachées dans le catalogue exporté) |

## Réponses obligatoires

1. **Pourquoi l’interdiction d’aspects n’empêche pas la suppression ?**  
   `substantiveEquivalence` refuse bien la fusion d’aspects. Mais `marginalValue` consultait encore `relateClaims`. Avec des `assertions[]` réelles, `sameSubject=parallel:` + `sameProof` (moyennes 48) → `REFORMULATION` **même si les aspects diffèrent**, dès que les `windowId` d’assertion ne divergent pas (fenêtre de présentation d’horizon identique).

2. **Décision finale** : `selectCollectively` via `marginalValue.overlap===1` → `suppressed` (hors catalogue accessible).

3. **Corrections M28 exécutées ?**  
   Partiellement : `subjectKey` parallèle OK (visible dans `fusionLineage`) ; destination `collapsedInto` renseignée ; reconcile publication **exécuté** (dispositions `parent_detached`) mais **inefficace sur le graphe exporté** et surtout **trop tard**.

4. **Objets transmis** : rows `{discovery, claim}` → `substantiveEquivalence(discovery)` puis `relateClaims(claim)` → `marginalValue` → `selectCollectively` → `p6.sources` / priority / reserve → `insightsFromP6`.

5. **Aspect / sujet préservés ?**  
   Sur le discovery : oui (`analyticalAspect`, `subjectKey=parallel:…`).  
   Sur le claim/assertion : aspect **absent** jusqu’à M29 ; `windowId` souvent celui de la présentation.

6. **`subjectKey=null` en disposition** : `dispositionRecord` ne lisait que `metrics.exerciseId` (null pour un parent parallèle). La lineage utilisait `stablePublicationId` / stamp complets.

7. **Pourquoi reconcile M28 n’agit pas** :  
   - Réconciliation **par colonne isolée** : parent `quarter` en priorité invisible aux enfants en réserve → détache « à tort » ou rate la retarget.  
   - `dispositionRecord(collapsedInto: null)` retombait sur l’ancien `collapsedInto` via `||`.  
   - Même avec détache, le produit v27 montre encore des liens → la réparation publication n’est pas la source de vérité du graphe.

8. **Pourquoi la trace ne signale plus de fusion injustifiée** : présence de `collapsedInto` suffit au filtre `unjustifiedFusions` (`!reason && !collapsedInto`). **Validité structurelle ≠ validité sémantique.**

9. **`collapsedInto` suffit-il à faire disparaître le signalement ?** **Oui** — et c’est un défaut de diagnostic, pas une preuve d’équivalence.

10. **Perte d’accessibilité pour similarité ?** **Oui** sous l’ancien contrat : `REFORMULATION` ⇒ suppression. Une redondance partielle doit seulement déclasser.

11. **Même état final ?** Non : sélection produit un graphe incohérent (enfants → parent absent) ; publication tente de réparer ; l’export / audit observent encore les orphelins.

## Trace réelle du cas (étapes)

| Étape | Fonction | Effet v27 |
|---|---|---|
| Création | `applyParallelTrajectoryComposition` | 2 parents aspectés (recent30, quarter) + enfants liés à recent30 |
| Revue | `reviewCollectively` | ne fusionne pas (aspects distincts via substantive) |
| Sélection | `marginalValue` + `selectCollectively` | recent30 overlap via `relateClaims` REFORMULATION → suppressed vers quarter |
| Hiérarchie | enfants inchangés | `collapsedInto=recent30` |
| Publication | `insightsFromP6` | dispositions detach ; graphe exporté encore orphelin |
| Export | `buildPeriodAuditDossier` / audit | `orphan_parent` ×2 ; unjustifiedFusions=0 |

## Cause racine (contrats, pas condition locale)

**Autorités concurrentes** : équivalence discovery vs relation claim, avec seuil de suppression trop bas (`REFORMULATION`).  
La publication ne doit **pas** être le lieu de réparation du graphe.

## Correction M29 (contrat)

- `REFORMULATION` / partial → **réserve**, pas `suppressed`.  
- Aspects parallèles distincts : jamais redondants dans `marginalValue`.  
- Redirection des enfants **dans `applyP6` après sélection**.  
- Vérification orphan sur **catalogue complet**.  
- `dispositionRecord` : `subjectKey` réel ; `collapsedInto: null` respecté.  
- Totaux structurés remontés depuis `structLead` / `trajectoryToMetrics`.
