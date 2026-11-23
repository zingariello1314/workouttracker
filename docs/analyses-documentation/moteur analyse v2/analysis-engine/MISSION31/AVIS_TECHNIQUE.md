# AVIS TECHNIQUE — Mission 31

## Cause profonde des 75 « divergences »

Ce n’était **pas** une épidémie de totaux faux. M30 a introduit une contrainte algébrique utile (`total ≈ mean × n`) mais l’a branchée sur un effectif **inventé** dès que la carte n’exposait que `metrics.dates` (arc). Le validateur a alors créé 75 faux échecs d’intégrité, tout en laissant passer le schéma JSON.

Références :
- `resolvePrimaryWindowSessionPopulation` — `src/utils/sport/recapMetricContract.js`
- `validateCardClaimConsistency` — `src/utils/sport/evaluation/claimAssertionIdentity.js`
- Consommation fingerprint — `parallelTrajectoryComposition.js` (déjà corrigé M30 pour les parents liés)

## Leçon de convergence

Les missions 28–30 ont empilé des **contrats locaux** (totaux, fusion, effectifs composition). M31 montre qu’un contrat sans **précondition de comparabilité** devient une source de bruit d’intégrité. La règle : *pas de triple sans population liée ; pas de PASS silencieux non plus — noter la non-comparabilité*.

## Fingerprints

`c8aa227e` (live v28/v29) vs `6c66326b` (backup dépôt) : mêmes outils, **entrées différentes** (≈500 reps d’écart). P1 « rejeu » est satisfait comme exécution pipeline ; la parité live exige le snapshot exact de l’export (toujours partiellement manquant — nameMap, DOM).

## Verdict mission

**PARTIEL** au sens du brief : défaut d’intégrité métrique des 75 **résolu en code + tests + revalidation** ; rejeu pipeline **fait** ; DOM **NON_OBSERVÉ** ; V1/V2 éditorial **enregistré non clôturé** ; P6 **non clôturée** ; **NO-GO P7**.
