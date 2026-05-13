# ADR-002 — Garmin : trajectoire de synchronisation

## Statut

**Accepté (défaut)** — révisable si le produit exige parité multi-appareil sur tout l’historique brut.

## Décision (Voie A par défaut)

- **Local first** : données volumineuses **IndexedDB** (`GarminDataDB`) restent la **référence locale** ; pas d’obligation de miroir complet cloud au lancement.
- **Cloud** (quand Phase 2+) : **métadonnées** (dernière sync, plages de dates, compteurs) + **export / résumés** optionnels pour analytics multi-device.
- **Voie B** (source de vérité synchronisée, sous-ensemble canonique + rétention) : à rouvrir uniquement si besoin métier documenté (coût stockage, schéma, tests).

## Conséquences

- Le client mobile annexe peut **ne pas** embarquer tout l’historique Garmin : lecture API des **résumés** convenus, ou message « données sur l’app principale ».

## Références

- `src/hooks/garminDataUtils.js` — `GarminDataDB`, version, stores.
