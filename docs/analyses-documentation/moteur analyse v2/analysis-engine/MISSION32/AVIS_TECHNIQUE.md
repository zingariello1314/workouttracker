# AVIS TECHNIQUE — Mission 32

## Pourquoi `domEvidence=not_observed` malgré le bouton

1. Le ZIP d’audit ne lance **pas** la vérif DOM : il ne lit que `__momentumLastDomVerify`.  
2. `getState` était une **fermeture React** figée au clic → insights de la période initiale pendant les 7 autres horizons.  
3. Comparaison titre-à-titre vs DOM **virtualisé** → faux divergents / silence.

Correctifs : `liveExportStateRef` + statuts `partial_mount_virtualized_*` + téléchargement JSON.

## Pourquoi le rejeu backup ≠ live

Le dossier complet ne sérialisait que le **fingerprint**, pas les `reps`/sources.  
`LIVE_INPUTS` sépare désormais entrées / paramètres / résultats observés (référencés, non dupliqués).

## Pourquoi les noncomparables étaient invisibles

`validateCardClaimConsistency` produisait déjà des `notes`, mais `buildAnalyticalAudit` n’exportait que les `conflicts` durs.  
`populationMetricChecks` rend la distinction **pass / fail / noncomparable / not_evaluated** auditable.

## Règle d’arrêt

Pas de nouvelle architecture. Pas de nouveau bouton. Prochaine valeur = **exports Chrome** puis Jeux B/C — pas une Mission 33 de câblage.
