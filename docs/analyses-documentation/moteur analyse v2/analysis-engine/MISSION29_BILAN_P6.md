# MISSION 29 — Bilan P6

Départ : `p6-sovereign-v27`. Code : `p6-sovereign-v28`.  
**P6 non clôturée. NO-GO P7. Aucun commit.**

## Incorrect dans v27

1. Parent recent30 toujours **supprimé** via `REFORMULATION` (claims), malgré aspects distincts.  
2. Enfants orphelins ; `unjustifiedFusions=0` grâce au seul `collapsedInto`.  
3. Reconcile publication **par colonne** + `||` sur `collapsedInto` — filet inefficace.  
4. Totaux 192/96 dans la prose, absents des `observedValues` (moyennes seulement).

## Démontré (code + UT)

- Contrat fusion : partial → réserve ; aspects jamais redondants.  
- Redirection enfants après sélection.  
- Reconcile sur catalogue complet.  
- Totaux structurés `structural_memory` + `trajectoryToMetrics`.  
- Tests M25–M29 : 39/39.  
- Plan clôture clarifié B/G/V/P.

## Encore P6

Rejeu produit v28 ; jeux A/abondance ; exploration ; sommeil/programme ; DOM.

## Ultérieur

Planner P8, implications P7, VIE.

## Preuves manquantes

Snapshot source figé ; campagne AUDIT v28 ; DOM.

## Obstacles réels

Contrats concurrentiels (corrigés en code) + **absence de rejeu produit** + validation indépendante non exécutée sur pipeline.

## Avis

Le plus court chemin : rejeu v28 pour verdir B, puis V1/V2, puis G2 — sans nouvelle série de rustines locales.
