# Phase 7 · Guide de surveillance post-rollout

Document de référence pour l’équipe lorsque `GARMIN_SYNC_V7` est déployé à 100 %.  
Objectif : garantir la stabilité du pipeline sync/cache pendant la semaine de stabilisation, puis passer en mode routine.

---

## 1. Fenêtre de surveillance recommandée

| Période | Cadence | But |
|---------|---------|-----|
| J+0 → J+7 (semaine de stabilisation) | 1 capture `bench:metrics` / jour | Détecter toute dérive après le passage à 100 %. |
| J+8 → J+30 | 2 captures / semaine **OU** à chaque release Garmin | Poursuivre le monitoring rapproché mais allégé. |
| Au-delà (régime nominal) | 1 capture / semaine + après chaque mise à jour majeure | Conserver un historique compressé, détecter les anomalies longues. |

> ⚠️ **Incident** : en cas de spike (`sync.failure` ou `cache.misses` anormaux), rebasculer temporairement sur la cadence quotidienne le temps d’investiguer.

---

## 2. Check-list quotidienne (J+0 → J+7)

1. **Exporter les métriques serveur**
   ```bash
   cd C:\Users\zinga\Desktop\workout tracker
   node scripts/bench/exportServerMetrics.js --out=logs/garmin/metrics-$(Get-Date -Format yyyyMMdd).json
   ```
   - Nommer le fichier `metrics-YYYYMMDD.json`.
   - Ajouter le snapshot au dépôt (ou au dossier partagé).

2. **Comparer avec la veille**
   ```bash
   node scripts/bench/compareMetrics.js --previous=logs/garmin/metrics-20251111.json --current=logs/garmin/metrics-20251112.json
   ```
   - Vérifier les compteurs suivants :
     - `sync.total`, `sync.success`, `sync.failure`
     - `sync.python.count` & `sync.python.averageDurationMs`
     - `cache.hits/misses/bypass`
     - `sync.servedFromCooldown`
   - Consigner le diff significatif dans `docs/garmin/ACTION_LOG_PHASE7.md` (colonne Notes).

3. **Contrôler les dashboards**
   - `http://localhost:3001/admin/metrics` : vérifier la courbe sync/cache.
   - DebugPanel → sections `Réseau`, `Télémétrie serveur`, `Observability`.

4. **Optionnel** : lancer une sync forcée (plage 3 jours) si la journée semble “calme” pour assurer qu’un appel réel se produit.

---

## 3. Automatisation (à planifier J+8)

- **Script PowerShell planifié** (tâche quotidienne 07:00) :
  ```powershell
  cd "C:\Users\zinga\Desktop\workout tracker"
  $date = Get-Date -Format "yyyyMMdd"
  node scripts/bench/exportServerMetrics.js --out="logs/garmin/metrics-$date.json" --quiet
  ```
- **Diff automatique** :
  - Utiliser `scripts/bench/compareMetrics.js` avec la veille.
  - Stocker le résultat dans `logs/garmin/diffs/diff-$date.txt`.
- **Alerte** :
  - Envoyer le diff par e-mail/Teams si `sync.failure > 0` ou `cache.misses` progresse de >20 % par rapport à la veille.

---

## 4. Indicateurs clés à suivre

| Compteur | Seuil d’alerte | Actions |
|----------|----------------|---------|
| `sync.failure` | > 0 | Inspecter `/admin/metrics`, logs Python (`garmin-server/logs`). |
| `sync.python.averageDurationMs` | > 12 000 ms pendant 2 jours | Vérifier API Garmin (latence), revalider `retry/backoff`. |
| `cache.misses` | pics répétés (> 5 en < 24h) | Vérifier orchestrateur et TTL côté serveur. |
| `sync.servedFromCooldown` | > 0 en période normale | S’assurer qu’on n’enchaîne pas les forceRefresh (sinon revoir UI). |
| `telemetry.ingested` | plateau / chute | Vérifier auto-push DebugPanel, `TelemetryCoordinator`. |

---

## 5. Actions en cas d’anomalie

1. **Documenter** dans `docs/garmin/ACTION_LOG_PHASE7.md` (date, symptômes, compteur).
2. **Capturer** les logs :
   - `garmin-server/logs/garmin-sync.log` (structured logs).
   - Console front (`garminSyncFetch`, `DebugPanel`).
3. **Rollback partiel** (si besoin) :
   ```powershell
   set VITE_GARMIN_SYNC_V7_ROLLOUT=0.3   # Palier précédent stable
   ```
   - Relancer le front (`npm run dev`) ou rafraîchir.
   - Poursuivre l’analyse, puis remonter progressivement.

---

## 6. Passage en Phase 8

Lorsque la période de stabilisation est validée :

- Geler la cadence quotidienne → hebdomadaire/à chaque release.
- Basculer les efforts sur :
  1. **Selectors dérivés** (`useGarminChartSelectors`).
  2. **Harmonisation export JSON/PDF**.
  3. **Accessibilité & observabilité renforcées** (checklist Phase 5).
  4. Préparer la doc Phase 8 dans `docs/garmin/PHASE_8_PLAN.md`.

Conserver ce fichier comme procédure de référence pour tout nouveau rollout majeur ou résurrection du flag.

