# ADR-006 — UX sync (hors happy path)

## Statut

**Brouillon** — à raffiner quand les repositories `Remote` et la file d’attente existeront.

## Principes

1. **Échec réseau** : message non bloquant + bouton « Réessayer » ; pas de perte locale immédiate (écriture locale d’abord si stratégie offline-first sur un domaine).
2. **401 / session expirée** : renvoi auth ; pas de boucle silencieuse sur sync.
3. **Offline prolongé** : indicateur discret « hors ligne » ; sync en arrière-plan au retour réseau.
4. **Quota / 507** : message explicite ; désactivation temporaire des uploads lourds (ex. photos) si applicable.

## Impact code

- Les use cases exposeront plus tard `syncState` / `lastSyncAt` / `pendingCount` — **pas implémenté** dans ce lot.
