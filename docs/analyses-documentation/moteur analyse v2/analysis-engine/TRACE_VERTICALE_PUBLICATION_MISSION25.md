# TRACE VERTICALE PUBLICATION — Mission 25

Campagne de preuve : probe reproductible  
`artifacts/analysis-eval/mission25-baseline/vertical-probe-v24.json`  
(équivalents Hyperextension 2 créneaux + Squat).

## Parcours 7d (après correction v24)

| # | Étage | Identités / compteurs | Objet transmis |
|---|---|---|---|
| 1 | Catalogue source | 3 découvertes | `all[]` |
| 2 | Détection | inchangée | kinds `disc_traj_parallel_probe` |
| 3 | F3/F4 | N/A probe | — |
| 4 | Entrée P6 | `applyP6({all,selected})` | wrap → claims |
| 5 | Claims | 3 wrap + 1 composé | claim sur découverte |
| 6 | Composition | consolidation + **parallel** | +1 parent, 2 deepenings |
| 7 | Hiérarchie | `hierarchyLink` parallèle | `ok` / relation parallel |
| 8 | Trajectoires | `composedParallel=1` | parent dans pool |
| 9 | Sélection | priority=2, reserve=2 | parent prioritaire |
| 10 | Mémoire | pas de démotion probe | — |
| 11 | Publication | `insightsFromP6` authority=`p6` | cartes + claims |
| 12 | Worker/cache | non exercé (probe local) | — |
| 13 | Pack RecapTab | via `buildPeriodAuditDossier` | serializeConclusion |
| 14 | Dossier période | publicationAuthority=`p6` | priority/reserve |
| 15 | AUDIT | cards=4, claims=4 | integrity ok |
| 16 | DOM | **NON_OBSERVÉ** | — |

## Premier point de rupture (v23)

- **Où** : `applyP6` → `reconcileCounters({ produced: wrapped.length })`  
- **Entrée** : pool avec parents parallèles  
- **Sortie** : `reconciled=false`  
- **Effet aval** : `insightsFromP6` refuse → `legacy_fallback` sans claims

## Correction

1. `produced = wrapped.length + composedParallel`
2. Claim synthétisé sur `parentDiscovery` (`claimFromDiscovery`)
3. `publishDiscovery` propage `row.claim` si absent sur discovery
4. Fallback legacy marqué `degraded` + reason P6
5. Validation : `schemaValidation` ≠ `integrityValidation`

## Preuve résultat publié

```json
{
  "title": "Hyperextension : 2 créneaux parallèles (~6 séances)",
  "hasClaim": true,
  "disposition": "consolidated",
  "childIds": ["…slotA…", "…slotB…"]
}
```

## Unité des exports (Porte E)

- `analysisRunId` : identité d’**exécution / assemblage export** (générée à l’export si absente).
- Fingerprint : empreinte d’**entrées** (snapshot+programme+garmin+nameMap).
- Campagne figée : doit partager fingerprint + envelope ; timestamps d’export peuvent différer.
- Divergence AUDIT vs TRACE sur `analysisRunId` avec même fingerprint = exports distincts, pas deux moteurs.
- `nameMapSize=0` / digest absent : nameMap non fournie à l’enveloppe (à surveiller en live).

DOM non observé. QUAL non effectué.
