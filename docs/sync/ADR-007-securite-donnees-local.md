# ADR-007 — Sécurité données au repos (Web)

## Statut

**Accepté (provisoire)** — position produit Web.

## Décision

- **IndexedDB / localStorage** ne sont **pas chiffrés** par le navigateur : risque **accepté** pour la cible Web actuelle (poste personnel, pas kiosk public).
- **Finance** : même niveau ; toute promesse « banque grade » exige **Electron/Tauri** + stockage sécurisé ou chiffrement applicatif (ADR à rouvrir).
- **Garmin / santé** : données sensibles traitées comme le reste du stockage local ; export cloud = **opt-in** (ADR-002 Voie A).

## Révision

Rouvrir cet ADR avant packaging **desktop sensible** ou conformité renforcée.
