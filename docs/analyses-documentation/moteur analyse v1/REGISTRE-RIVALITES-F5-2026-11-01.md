# Registre des rivalités F5  
**2026-11-01**

## Identité technique (inchangée)

`discoveryIdentity` = `kind:exerciseId` (ou `kind`) — collapse exact.

## Identité de phénomène (nouvelle)

`phenomenonIdentity` = `exerciseKey|phenomenonClass`

- **exerciseKey** : nom canonique préféré (`name:…`), sinon `ex:id` (unifie 103/503 « Dips »).
- **Classes** : `return_after_gap`, `format_or_install`, `volume_decline`, `volume_rise`, `volume_stable`, `decline_then_recovery`, `frequency_attribution`, `descriptive_weak`, `gtg_channel`, `habit_p36`, `sleep`, `rest_sleep_assoc`, …

## Rivalités kind (préexistantes, conservées)

Muscle story, sleep assoc, sleep rhythm, GTG unplanned, P35/P36 groups, etc. (`DISCOVERY_RIVALS` / `CROSS_NATURE_RIVALS`).

## Rivalités phénomène (nouvelles)

Même `phenomenonIdentity` → une carte ; la plus haute IV gagne (seuil displace ≥ 4).

Exemples couverts :

| Exercice | Cartes | Décision |
| --- | --- | --- |
| Pompes | emergence retour × ms_return | 1 carte return_after_gap |
| Dips | emergence recul × emergence stable (ids 103/503) | 1 carte via nom + incompatibilité récit |

## Incompatibilités de récit (pack)

| Phénomène A | Incompatible avec |
| --- | --- |
| volume_decline | volume_stable, volume_rise, decline_then_recovery |
| volume_stable | volume_decline, volume_rise |
| volume_rise | volume_decline, volume_stable |
| decline_then_recovery | volume_decline, return_after_gap |
| return_after_gap | decline_then_recovery |

Complémentaires (conservés si IV ok) : `frequency_attribution` × `volume_decline` avec attributions distinctes.

## Caps épisode

Max émergences/retours : today 1, week 2, month 3, long/year 3 (+1 exception IV≥110).

## rest_assoc

Famille **sport** (plus sleep) — ne consomme plus le budget nuits.
