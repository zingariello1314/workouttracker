# F6 — Inventaire des caches

## 1. `useRecapTabMetrics` — bundlesByFull / bundlesByWorkout

| Champ | Valeur |
|---|---|
| Portée | Module (mémoire) + IndexedDB `momentum-recap` / `bundles` |
| Clé | `workout` = période + fenêtre + programme + QQ + `checkedVolumeFingerprint` + **accountScope** + flags ; `full` ajoute Garmin/nutrition |
| TTL | LRU ~16 entrées mémoire ; IDB dernier snapshot (3 rows) |
| Invalidation | fingerprint volume ; changement `accountScope` → `clearRecapMetricsCache` |
| Compte | Isolé via `accountScope` (`u:<id>` / `auth` / `guest`) — **corrigé F6** |
| Période | Clé distincte |
| Séance / programme | Empreinte volume + ids programmes |
| Garmin | Bit dans clé `full` |
| Risque résiduel | IDB partagé navigateur si deux profils sans id distinct avant F6 — mitigué par clear + scope |
| Tests | Matrice fraîcheur § identité ; non-régression analytique scope |

## 2. `periodAnalyticsMemo` (`recapCalendarPeriodAnalytics`)

| Champ | Valeur |
|---|---|
| Portée | Module, 1 entrée |
| Clé | références objet workout/garmin + période + fenêtre + phase |
| Invalidation | Changement de référence / période |
| Risque | Référence stable avec mutation contenu — rare si snapshot immutable |

## 3. `createRecapComputeScope` (F6, nouveau)

| Champ | Valeur |
|---|---|
| Portée | **Une requête** (pas global) |
| Clés | trajectoire (id\|start\|end\|mode\|revision) ; catalog ; baselines ; trainingState ; lifetime |
| Invalidation | Fin de portée ; nouvelle révision snapshot |
| Compte | Portée non partagée entre comptes |
| Diagnostics | `scopeStats` / `counters` hits-misses |
| Persistance | Aucune |

## 4. Insight history / novelty store

Hors F6 (éditorial). Non utilisé comme cache de calcul moteur.

## Règle F6

Pas de nouveau cache persistant opaque. Mémo requête + isolation compte seulement.
