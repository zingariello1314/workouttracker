# RAPPORT VALIDATION VERTICALE — Mission 29

## Baselines

| Campagne | Dossier |
|---|---|
| v26 | `artifacts/analysis-eval/mission28-baseline/` |
| v27 | `artifacts/analysis-eval/mission29-baseline/` |

v27 confirme : 716/716, autorité 8/8, 2 orphan_parent, 40 publications mémoire, mêmes 716 ids carte que v26 (7 textes, 2 rôles).

## Corrections code (v28)

| Domaine | Preuve code | Exécution UT | Publié rejeu app | Observé DOM |
|---|---|---|---|---|
| Fusion : REFORMULATION → réserve | collectiveSelection | M29 | Non | Non |
| Aspects jamais redondants | marginalValue + relateClaims | M29 | Non | Non |
| Redirection enfants post-sélection | p6Pipeline | M29 | Non | Non |
| Reconcile catalogue complet | p6Publication | M29 | Non | Non |
| dispositionRecord subjectKey / null | p6Publication | M29 | Non | Non |
| Totaux structural_memory + traj | detectDiscoveries + trajectoryToMetrics | M29 | Non | Non |

Batterie M25–M29 : **39/39 OK**.

## Cas Hyperextension (exigence Mission 29)

Le test `mission29ContractAuthority` traverse sélection→publication avec **assertions réelles** (pas des stubs sans `assertions[]`).

- Échoue sous le contrat v27 (REFORMULATION ⇒ suppress) — reproduit par l’ancien `marginalValue`.  
- Réussit sous v28 : overlap 0 pour aspects distincts ; pas d’orphan_parent au validateur.

Snapshot source utilisateur complet : **non disponible** dans le dépôt → pas de prétention de rejeu app 8 horizons ici. Entrées manquantes : snapshot figé + Garmin + programme + mémoire initiale de campagne.

## Mémoire (v27)

- 40 publications observées (progrès M28 `appendPublication`).  
- À valider en rejeu : idempotence (recalcul identique), distinction calculé vs présenté, absence d’écriture déclenchée seulement par l’export.  
- Ne pas annuler la démotion 7d du collectif connu.

## Procédure utilisateur (preuves manquantes)

1. Build `p6-sovereign-v28`.  
2. Même environnement que v27.  
3. Export AUDIT + TRACE + AUDIT_IA (une campagne).  
4. Vérifier : `orphan_parent=0` ; parent recent30 **accessible** ou enfants redirigés vers quarter **avec** parent présent ; textes composition avec totaux si 192/96 structurés.  
5. DOM 8 périodes → noter observé / non observé.

## Non-régression

UT sport M25–M29 verts. Pas de verdissage massif hors sport.
