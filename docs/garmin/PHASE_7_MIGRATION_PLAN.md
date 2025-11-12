## Phase 7 — Migration progressive & hardening

> **Objectif** : basculer l’orchestrateur Garmin et toute la chaîne d’observabilité vers la nouvelle architecture (Phases 2→6) sans régression, en capitalisant sur les métriques bench/serveur/ front pour piloter chaque palier.

### 1. Pré-requis

- ✅ Phase 6 finalisée : scénarios today / mode dégradé / export JSON / backend offline benchés (`logs/garmin/metrics-*.json`).
- ✅ `/admin/metrics` opérationnel, scripts `bench:metrics` & `bench:metrics:diff` disponibles.
- ✅ Documentation mise à jour (`analyse ducodedegarmin.md`, `ANALYSE_ONGLET_GARMIN.md`).
- ✅ Feature flag défini (`GARMIN_SYNC_V7`, valeur initiale 0 % dans la configuration prévue).
- ✅ Baseline Phase 7 capturée (`logs/garmin/metrics-phase7-baseline-before.json`).
  - Par défaut (si variable absente) : rollout client = **10 %** (`DEFAULT_ROLLOUT_VALUE = 0.1`). Ajuster via `VITE_GARMIN_SYNC_V7_ROLLOUT` ou `window.__GARMIN_SYNC_V7_ROLLOUT__`.

### 2. Stratégie générale

1. **Pilotage par paliers** (feature flag ou configuration orchestrateur) : 10 % → 30 % → 60 % → 100 %.
2. **Validation systématique** :
   - Captures `before/after` avec `node scripts/bench/exportServerMetrics.js --out=logs/garmin/metrics-<palier>-{before|after}.json`.
   - Diff via `node scripts/bench/compareMetrics.js --previous=... --current=...`.
   - Scénarios manuels clés (today / mode dégradé / backend offline) rejoués au moins sur le palier final.
   - Flag d’activation : `VITE_GARMIN_SYNC_V7_ROLLOUT` (0 → 0 %, 1 → 100 %, valeur décimale pour échantillonnage). Décision persistée côté client (localStorage) afin de garantir une expérience stable par utilisateur.
3. **Monitoring continu** :
   - Dashboard `/admin/metrics` (compteurs `sync`, `cache`, `telemetry`, historique).
   - DebugPanel (sections Cache / Network / UI / ServerMetrics).
   - Exports JSON/PDF + scripts bench (journalisation).
4. **Hardening** :
   - Tests de charge (scripts `bench/loadData`, `bench/network`).
   - Injection d’erreurs (timeouts, baseUrl fallback) pour valider circuit breaker + mode dégradé.
   - Surveiller `sync.failure`, `sync.servedFromCooldown`, `cache.bypass`, `telemetry.ingested`, `uiMetrics`.

### 3. Palier type

1. **Configuration** :
   - Activer le nouveau flux sur le pourcentage cible (flag, env, config orchestrateur).
2. **Baseline** :
   - `bench:metrics -- --out logs/garmin/metrics-<palier>-before.json`
3. **Mise en route** :
   - Laisser tourner quelques synchronisations (auto + forçages).
4. **Validation** :
   - `bench:metrics -- --out logs/garmin/metrics-<palier>-after.json`
   - `bench:metrics:diff -- --previous ...before.json --current ...after.json`
   - Vérifier : `sync.total/success` stables, `failure` et `cache.bypass` maîtrisés, `telemetry.ingested` continue, `python.count` n’explose pas.
5. **Scénarios manuels** (au moins sur palier final) :
   - today (cache hit / live),
   - mode dégradé (cooldown),
   - export JSON (invariance),
   - backend offline (fallback).
6. **Documentation** :
   - Ajouter les résultats dans `analyse ducodedegarmin.md` (journal).
   - Si anomalies, rollback au palier précédent, corriger, relancer.

### 4. Checklist Phase 7

- [ ] Flag/feature toggle installé (permet pourcentage d’activation).
- [ ] Baseline Phase 7 capturée (`logs/garmin/metrics-phase7-baseline-before.json` + diff n°0).
- [ ] Palier 1 (ex. 10 %) : diff OK, métriques conformes, fallback validés.
- [ ] Palier 2 (30 %) : même vérifications.
- [ ] Palier 3 (60 %) : idem + stress test léger.
- [ ] Palier final (100 %) : tous scénarios manuels rejoués.
- [ ] Hardening : tests bench (network/load/save), injection erreurs, surveillance metrics (synchro).
- [ ] Clean-up : suppression ancienne implémentation, feature flag à 100 %.
- [ ] Documentation : runbook incident, procédures bench, cartographie des métriques (`docs/garmin/ANALYSE_ONGLET_GARMIN.md`).

### 5. Runbook incident (extraits)

- **Sync failure accrue** : vérifier `sync.failure`, `lastError`, logs `garmin-sync.log`. Rebasculer sur palier précédent si nécessaire.
- **Cache bypass massif** : surveiller `cache.bypass` + `telemetry` ; peut révéler une invalidation trop agressive.
- **Circuit ouvert** : `sync.servedFromCooldown`, `network.totals.blocked` ; enclencher CTA “Réessayer” (reset breaker), investiguer baseUrl.
- **Telemetrie stagnante** : `telemetry.pendingPush`, `lastPushStatus`. Vérifier `TelemetryCoordinator` et endpoint POST.

---

**Note** : Des journaux bench existent déjà (`logs/garmin/metrics-...`) pour Phase 6. Ils servent de baseline initiale. Chaque palier Phase 7 doit produire ses propres snapshots datés (ex. `metrics-phase7-30-before.json`).*** End Patch

