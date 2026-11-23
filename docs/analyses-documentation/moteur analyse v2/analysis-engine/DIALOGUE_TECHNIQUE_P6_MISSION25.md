# DIALOGUE TECHNIQUE P6 — Mission 25

## 1. Origine de la régression ?

**Publication / réconciliation post-sélection**, pas le raisonnement amont ni le worker.

Les étapes P6 s’exécutaient. Le compteur `reconciled` devenait faux dès qu’un parent parallèle était ajouté. `insightsFromP6` refusait alors le pack ; le fallback legacy prenait la main **sans claims**. Cache et export ne faisaient qu’enregistrer le résultat déjà dégradé.

## 2. Pourquoi les mêmes familles de pertes reviennent ?

Parce que **plusieurs représentations** coexistent (découverte P6, carte publiable, slim audit, legacy insight) et qu’un seul booléen (`counters.reconciled`) décide de l’autorité. Une mission ajoute une capacité (parallèles) sans mettre à jour le contrat de comptage → bascule silencieuse vers un autre chemin.

## 3. Responsabilités encore dupliquées

- Sélection narrative legacy (`selectNarrativeColumns`) vs sélection P6 (`selectCollectively`).
- `publishableCard` / `toInsightCard` vs `publishableP6Card`.
- Claims : wrap P6 vs absence totale en legacy.
- Compteurs publication vs catalogue final vs cardRegistry audit.

## 4. Représentations concurrentes de la conclusion finale ?

Oui : `periodDiscoveries.p6.priority`, insights P6, insights legacy, `serializeConclusion`, `slimCard` audit. Après correction, **seule l’autorité P6** doit alimenter le catalogue utilisateur quand `reconciled`.

## 5. Objet d’autorité après sélection ?

`insightsFromP6(p6)` lorsque `publicationAuthority ∈ {p6, p6_partial}`.  
Sinon : état **dégradé** `legacy_fallback` — ce n’est pas une réussite P6.

## 6. Pourquoi la validation ne protégeait pas ?

Elle validait surtout la **syntaxe** et les claimIds orphelins. Une carte sans claimId passait. Un `reconciledStrict` avec compteurs null passait. Un fallback legacy n’était pas une erreur d’intégrité.

## 7. Suppression / centralisation possible sans refonte ?

Oui, localement :

- Compter toute conclusion injectée post-wrap dans `produced` (fait).
- Séparer schema/integrity (fait).
- À terme : interdire le legacy comme sortie « produit nominal » hors mode diagnostic explicite (non fait — garde-fou app).

## 8. Dette éliminée

- Incohérence compteurs ↔ composition parallèle.
- Claims absents sur parents parallèles.
- Confusion schemaValidation = succès analytique.
- Fallback sans cause P6 visible.

## 9. Risque de régression restant

- Toute nouvelle injection post-wrap non comptée.
- Legacy encore utilisable si P6 casse pour une autre raison.
- Campagne 8 horizons live non rejouée ici → volumes exacts non certifiés.
- Mémoire pack vs store toujours divergente.
- DOM / QUAL absents.

## 10. Préconisation indépendante

1. Traiter `counters.reconciled` comme **contrat d’autorité**, pas un détail de debug.
2. Toute étape qui ajoute des conclusions doit mettre à jour le contrat **dans le même commit**.
3. Ne jamais accepter un audit `schemaOk && mass_claim_loss` comme preuve de mission.
4. Prochaine étape : **rejeu 8 horizons sur entrées figées utilisateur** (exports v22/v23 fournis) pour quantifier v24 vs v22 — pas une nouvelle capacité.

### Hypothèse ChatGPT contredite

L’idée que « serializeConclusion / audit strippe les claims hors today » comme cause première est **contredite** : `serializeConclusion` copie `card.claim`. La rupture est **en amont** : les cartes legacy n’ont jamais de claim. Preuve : probe v23-style (produced sans composed) → authority unavailable ; après fix → claims présents jusqu’à l’audit.
