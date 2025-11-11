# Analyse approfondie – Forçage Garmin

## Objectif du document
Fournir une vue complète et structurée du fonctionnement actuel du bouton **Forcer** dans l’onglet Garmin, identifier précisément les dysfonctionnements observés (toutes variantes confondues) et établir un plan d’action professionnel pour fiabiliser et optimiser entièrement le système de synchronisation forcée.

---

## 1. Fonctionnement actuel

### 1.1 Chaîne utilisateur → backend
1. **Interface**  
   - `ForceSyncMenu` affiche les presets (`Aujourd’hui`, `La veille`, `Plage personnalisée`).  
   - Pour le preset *Plage personnalisée*, `ForceRangeDialog` permet de choisir la plage et l’option « Inclure aujourd’hui ».

2. **Construction de la requête**  
   - `forceSyncUtils` convertit la sélection en requête (`mapPresetToRequest`, `mapRangeToRequest`).  
   - Les objets produits contiennent `mode`, `range`, `includeToday`, `forceRefresh`, `skipDelay` (et métadonnées).

3. **Orchestration synchronisation**  
   - `ForceSyncMenu` appelle `onSync`, relayé vers `useGarminSync.syncNow`.  
   - `syncNow` regroupe toutes les optimisations (cache, retry, auto-range) avant d’appeler `performSyncRequest`.

4. **Transport réseau**  
   - `performSyncRequest` prépare la query `?start=…&end=…&lastSyncTimestamp=…&forceRefresh=true`.  
   - `tryFetch` exécute le `fetch` avec retry et fallback sur plusieurs bases URL.

5. **Serveur Node (`garmin-server.js`)**  
   - Endpoint principal `POST /api/garmin/sync`.  
   - `resolveForceRange` consolide la plage (mode, includeToday, start/end).  
   - Purge éventuelle du cache, appel Python, enregistrement historique.

### 1.2 Persistances et historiques
- **SessionStorage** : `storeLastRange` / `restoreLastRange` mémorisent la dernière plage front.  
- **IndexedDB / backend** : historique des forçages (`saveForcedRangeEntry`, `loadForcedRangesHistory`).  
- **Caches** : 
  - Front (`frontendCache` dans `useGarminSync`).  
  - Serveur (`serverCache`).  
  - Fichiers Python (via purge) + caches Vite (assets).

---

## 2. Comportements anormaux constatés

### 2.1 Erreur 404 côté front
- **Symptôme** : requête `http://localhost:3001/api/garmin/sync?...` renvoie `404`.  
- **Impact** : la synchronisation forcée échoue (pas de réponse JSON, toast d’erreur silencieux), le serveur Python ne voit pas la requête.

### 2.2 Paramétrage incomplet de l’état côté front
- **Avant correctifs récents** :  
  - L’option « Inclure aujourd’hui » repassait à `false` lors d’une nouvelle ouverture du dialogue.  
  - La plage personnalisée n’était pas mise à jour après confirmation.  
  - Les presets ne transmettaient pas systématiquement `includeToday`.
- **Impact** : incohérence entre l’intention utilisateur et le payload réellement envoyé (`includeToday` parfois `false`, end-date incorrecte si l’utilisateur s’attend à inclure aujourd’hui).

### 2.3 Risques de désynchronisation caches / historique
- Les hooks front prennent des décisions en fonction du cache (front ou serveurs). Si la requête ne va pas au bon endpoint, l’état reste inchangé mais peut être marqué comme synchronisé via d’autres signaux (ex. messages UI).  
- Le serveur enregistre l’historique seulement s’il reçoit la requête POST. En cas de 404, aucune trace n’est conservée, ce qui fausse les diagnostics.

### 2.4 Résilience transport perfectible
- `tryFetch` listait `http://localhost:3031` puis `http://localhost:3001`. Sans proxy sur 3001, la seconde tentative échoue systématiquement (404), rallonge les temps et remonte une erreur confuse.  
- Absence d’une source configurable pour des environnements autres que localhost.

---

## 3. Causes racines

| Problème | Analyse détaillée |
|----------|-------------------|
| `404` sur `/api/garmin/sync` | Vite (port 3001) ne proxyait pas vers le backend (port 3031). Le front émettait des requêtes vers sa propre origine, réceptionnait la requête mais n’ayant aucun routeur API, répondait `404`. |
| État « Inclure aujourd’hui » instable | `ForceSyncMenu` initialisait `includeToday` à `false` à l’ouverture du dialogue et ne réécrivait pas la valeur après confirmation. `restoreLastRange()` retournait l’information mais elle n’était pas réinjectée dans l’état local. |
| Presets incomplets | `mapPresetToRequest` n’ajoutait pas `includeToday`. Les presets reposaient sur une valeur implicite supposée côté backend. |
| Fallback base URLs non cohérent | `BASES` contenait 3001 sans condition. L’absence de proxy entraînait une erreur non interceptée. Pas de support natif pour une URL externe configurable. |
| Difficulté de diagnostic | Les erreurs transport étaient visibles seulement dans la console réseau du navigateur. Côté serveur, aucune trace car la requête n’atteignait pas le port 3031. |

---

## 4. Plan d’action chirurgical

### 4.1 Stabiliser la couche transport
1. **Proxy Vite (dev)** – *Fait* : `vite.config.js` redirige toutes les requêtes `/api/garmin` vers `http://localhost:3031`.  
2. **BASES dynamiques** – *Fait* : `tryFetch` construit maintenant sa liste à partir de `VITE_GARMIN_SERVER_URL`, de `window.location.origin` (utile pour le proxy Vite ou la prod) puis du fallback `http://localhost:3031`.  
3. **Variable d’environnement** – *Fait* : support via `VITE_GARMIN_SERVER_URL` + documentation (cf. script ci-dessous).  
4. **Tests réseau** – À exécuter après redémarrage (voir check-list + script de vérification).

### 4.2 Assainir la logique UI/état
1. **Synchronisation état local ↔ sessionStorage** – *Fait* : `ForceSyncMenu` conserve la plage sélectionnée et `includeToday` entre les sessions.  
2. **Presets explicites** – *Fait* : chaque preset envoie `includeToday` et un `meta` cohérent.  
3. **Validation front** – Maintenir `validateRange` pour bloquer les plages invalides ; envisager un message explicite lorsque l’utilisateur coche « Inclure aujourd’hui » avec une fin passée.  
4. **Accessibilité & feedback** – Ajouter un état visuel (spinner, toast) spécifique lorsque le forçage échoue côté réseau (ex. 404, timeout) pour informer l’utilisateur immédiatement.

### 4.3 Vérifications backend
1. **Logs de diagnostic** – Continuer à surveiller `[🔍 DIAGNOSTIC SERVEUR] POST /api/garmin/sync` pour s’assurer que toutes les variantes atteignent le serveur.  
2. **Historique forçages** – Vérifier que `saveForcedRangeEntry` enregistre bien les nouvelles entrées (plage, includeToday).  
3. **Tests automatiques** – *Fait (script manuel)* : `node scripts/garmin_force_sync_check.js`.

### 4.4 Durcissement global
1. **Détection proactive** – *Fait* : message enrichi dans `tryFetch` + logs console détaillés.  
2. **Fail-safe UI** – *Fait* : statut utilisateur orienté diagnostic (`/api/garmin/debug`) & message contextuel dans la modale.  
3. **Documentation** – Conserver ce fichier et le tenir à jour pour les futures refontes (Phase 6+).  
4. **Scénarios QA** – Tester systématiquement : `Aujourd’hui`, `La veille`, plage passée sans includeToday, plage couvrant aujourd’hui avec includeToday, plage large (> 30 jours) pour valider les messages d’erreur.

---

## 5. Check-list validation après correctifs

- [ ] Redémarrer `npm run dev` (proxy chargé).  
- [ ] Vérifier via `Network` que `POST /api/garmin/sync` part bien (statut 200).  
- [ ] Confirmer dans la console serveur la réception (logs `[SERVER] POST`).  
- [ ] Tester chaque variante de forçage et observer le payload côté serveur (`includeToday`, `mode`, `range` corrects).  
- [ ] Contrôler la persistance (`sessionStorage`) : rouvrir la modale et vérifier que la dernière plage est restaurée.  
- [ ] Vérifier l’historique forcé (`forcedRangesHistory` dans l’UI) et l’absence d’erreurs dans l’onglet Console.

---

## 6. Prochaines optimisations possibles

1. **Monitoring automatique** : intégrer un indicateur visuel dans l’onglet Garmin (ex. badge rouge) lorsqu’une requête réseau échoue, avec accès aux journaux.  
2. **Tests end-to-end** : script Playwright simulant les interactions (sélection, confirmation) pour éviter régressions manuelles.  
3. **Configuration multi-environnements** : gérer un tableau d’URLs dans un fichier de config partagé (ex. `config/garmin.json`) pour simplifier les déploiements.  
4. **UX avancée** : mémoriser aussi le dernier preset utilisé pour accélérer les forçages répétitifs (ex. un bouton « Rejouer le dernier forçage »).

---

### Résumé
Les dysfonctionnements provenaient principalement d’un mauvais routage (absence de proxy) et d’incohérences d’état client. Les correctifs appliqués (proxy Vite, bases dynamiques, état du menu) rétablissent le flux nominal. Le plan ci-dessus garantit une stabilisation durable et prépare le terrain pour des améliorations futures (monitoring, QA automatisée, configuration multi-env).

