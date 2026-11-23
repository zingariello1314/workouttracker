# DIAGNOSTIC AUTORITÉS & IDENTITÉS — Mission 27

Baseline : exports utilisateur **v25** (715 cartes, integrityValidation.ok=false).  
Édition corrigée : `p6-sovereign-v26`. NO-GO P7.

## Avis sur le contrat proposé (avant implémentation)

**Adopté.** Quatre couches distinctes sont nécessaires et réalisables sans réécriture du moteur :

| Couche | Rôle | Autorité actuelle (corrigée) |
|---|---|---|
| Sujet canonique | Entité sportive (`ex:`, groupe parallèle) | `subjectKey` / `metrics.subjectKey` |
| Phénomène | Dimension + épisode (sans titre) | `phenomenonKey` / `conclusionKey` aspecté |
| Assertion contextualisée | Phénomène + fenêtre d’observation + population + période | `assertionClaimKey` |
| Présentation | Horizon d’affichage | `presentationHorizon` / `presentationWindow` |

Les titres ne doivent plus entrer dans les identités. Les seuls ids d’exercice ne suffisent pas : deux lectures du même couple d’exercices restent distinctes si calendriers/dimensions diffèrent.

## A1 — Collision Hyperextension 3m (v25)

### Fait

Deux parents v24 (~8 séances volume vs ~4 séances structure) partageaient en v25 :

`parallel_traj|ex:1979012181+ex:703294235|2`

→ fusion vers soi, parents absents du catalogue accessible, approfondissements orphelins, unjustifiedFusions=1.

### Cause

`conclusionKey` = sujets + count, **sans dimension ni empreinte calendaire**.  
`occurrenceId` dérivait de cette clé → collision publication.

### Correction

`conclusionKey = parallel_traj|{subjects}|{span|sess|calHash}|{n}`  
`phenomenonKey` parallèle. IDs distincts pour dimensions distinctes.

## A2 — Invariants graphe

Ajoutés à `validateAnalyticalAudit` : self_fusion, self_parent, orphan_parent, hierarchy_cycle, self_child.

## A3 — Temporalité

`validateCardClaimConsistency` ne traite plus présentation≠observation comme divergence dure si `observationWindow` est alignée.  
Les parallèles exposent `observationWindow` / `presentationWindow` séparément ; `metrics.window*` = observation.

## B1 — Volumes

`sessionFingerprint` lit `windowMeanPerSession` / `observedValues` structurés.  
Prose sans ids techniques ; preuves conservent `recentReps:ex:…` et `prevReps:ex:…`.

## B2 — Habitual

Référentiel `last_before_gap` nommé (M26). `habitualReps` toujours dépendant de l’amont ; pas inventé. Si absent → `habitualShortfallCount` reste 0 (honnête).

## B3 — Hiérarchie

`prior_episode_not_deepening` si ancre enfant antérieure à l’épisode collectif.

## C — Mémoire (cause réelle)

1. **Double préfixe** : RecapTab passait `accountScope: u:{id}` ; le hook faisait `u:${accountScope}` → clé `u:u:{id}`. Audit lisait `u:{id}` → storePhenomena=0.
2. **Merge export** cherchait `analyticalMemoryOut` alors que le dossier expose `memorySnapshot`.

Corrections : `resolveAnalyticalMemoryProfile`, lecture `memorySnapshot`, écriture + relecture instrumentée sur export.  
**Avis** : l’export ne doit pas être le seul writer — le chemin live (`useRecapTabMetrics`) est légitime ; il était juste mal clé. L’export reste un filet de sécurité de campagne.

## Porte D

Non implémentée (priorité A/B/C).
