## Diagnostic Express – Boucles de forçage Garmin (logs du 10/11/2025)

### Contexte immédiat
- Les 10 derniers aller/retours montrent que la **sync classique** termine correctement (`today` sans `forceRefresh`) avec un temps d'exécution Python compris entre 5 et 7 s.
- Dès que l’on enchaîne un **forçage `today` (forceRefresh=true)** :
  - le front part bien sur `http://localhost:3031`, puis retente via `3001` après 90 s ;
  - Python produit un JSON très volumineux (539 points FC, 288 points respiration) mais la réponse ne parvient pas au front ;
  - aucun crash Node n’apparaît (heap portée à 8 Go), mais la connexion reste bloquée puis le front abandonne.
- Le script CLI (`node scripts/garmin_force_sync_check.js`) échouait aussi (heap trop faible) ; il est désormais auto-relancé avec `--max-old-space-size=8192`.

### Analyse des symptômes
1. **Payload gigantesque**  
   - Incrémental = 0 point → le script repasse en full fetch (539 points FC, 24 points respiration, etc.).  
   - `res.json()` doit sérialiser plusieurs Mo → la réponse stagne avant d’être envoyée, d’où la persistance du timeout.

2. **Timeout front à 90 s**  
   - suffisant pour Python, mais inutile si la réponse n’est jamais flushée.  
   - Le front retente via la base 3001 puis abandonne (circuit breaker ouvert).

3. **Script CLI**  
   - résolu : relance automatique avec heap 8 Go avant d’exécuter `fetch`.

### Pistes d’optimisation (à intégrer dans le refactoring)

| Axe | Constats | Actions proposées |
| --- | --- | --- |
| **Gestion mémoire Node** | OOM dès qu’on chaîne plusieurs forçages. | - Empêcher la mise en cache serveur pour les forçages (fait).<br>- Activer la compression gzip (`compression`) pour réduire les réponses.<br>- Déverser les gros objets dès que la réponse est envoyée (`global.gc()` si dispo). |
| **Volume JSON** | Les time series (~300 points) sont compressées mais toujours chargées en mémoire. | - Mise en place d’un **cooldown** : les forçages répétés (< 2 min) renvoient la dernière réponse sans relancer Python.<br>- À planifier : streaming JSON / segmentation, compression côté Python. |
| **Timeout front / CLI** | 30 s trop juste. | - Garder 90 s côté front pour l’instant.<br>- Script CLI mis à jour (auto-relance avec `--max-old-space-size=8192`). |
| **Circuit breaker** | Ouvre après 3 tentatives, même si problème mémoire. | - Ajouter une détection spécifique `Heap out of memory` → message utilisateur clair (“Relancer le serveur Garmin avec davantage de mémoire”). |

### Plan d’action immédiat
1. **Valider la compression + cooldown** (au moins deux forçages successifs → pas de timeout, second servi depuis cooldown).
2. **Script CLI** : vérifier qu’il se relance bien avec 8 Go et récupère la réponse complète.
3. **Prochaine étape** : étudier une stratégie de streaming/delta pour réduire la charge Python/Node lors des forçages lourds.
4. **Documenter** dans `ANALYSE_FORCE_SYNC.md` + `analyse ducodedegarmin.md` les évolutions (cooldown, compression, short-circuit).

_Ce fichier sert de snapshot diagnostic ; à archiver avec les logs avant de passer aux optimisations structurelles (Phase 3/4)._ 

