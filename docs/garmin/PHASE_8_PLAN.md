# Phase 8 · Qualité de vie & cohérence globale

Objectif : capitaliser sur la stack Phase 7 et livrer un onglet Garmin cohérent de bout en bout (UI ↔ exports ↔ accessibilité).

---

## 1. Sélecteurs dérivés (`useGarminChartSelectors`)

### Audit des composants (étape 0)
- `GarminHeartRateChart` (trend multi-jour) consomme `precomputed.data` (`date`, `resting`, `avg`, `max`) + `yAxisDomain`, `displayInfo`, `selectedDate`. Besoin d’exposer min/max/avg globaux, domaine calculé, libellés.
- `GarminHeartRateTimeSeriesChart` (journée) utilise `heartRateTimeSeries` : série enrichie (timeSeries, stats, gaps, metadata zones, realPointsCount). Doit être accessible côté exports pour reproduire la courbe / stats.
- `GarminRespirationChart` réclame `awakeMin/Avg/Max`, `sleepMin/Avg/Max`, moyennes globales, `displayInfo`, `selectedDate`.
- `GarminBodyBatteryChart`, `GarminStressChart`, `GarminSleepChart` : séries temporelles avec moyenne (et breakdown phases pour le sommeil).
- `GarminDailyActivityChart` / `GarminActivityHeatmap` nécessitent agrégats par jour + par semaine (`distance`, `duration`, `count`).
- `GarminCorrelationCharts` (sleep vs steps / bodyBattery vs intensity) utilisent deux datasets spécifiques (`sleepPerformanceData`, `batteryIntensityData`).

=> Les selectors devront exposer une structure stable par “feature” (heartRate.trend, heartRate.series, respiration.trend, etc.) afin que les charts ET les exports l’utilisent.

### Constat actuel
- Le hook expose surtout les données brutes (`dailyMetrics`, `chartData` généré à la volée).
- Chaque composant reformate encore : min/max, timeSeries enrichies, stats agrégées.
- Exports JSON/PDF lisent `garminData` directement → risque d’écarts avec l’UI.

### Cibles
1. **Selectors par usage** : 
   - `selectors.heartRate.trend`, `selectors.heartRate.timeSeries`, `selectors.respiration.trend`, `selectors.sleep.breakdown`, etc.
   - Inclure min/max/avg pré-calculés, couverture, zones FC, activités associées, métadonnées (unités, date sélectionnée, displayInfo).
2. **Mémorisation** (useMemo) + tests unitaires.
3. **Hook d’accès** pour les exports (`useGarminExportSelectors`) s’appuyant sur les mêmes dérivés.

### Proposition de structure
```ts
selectors = {
  heartRate: {
    trend: { data, yAxisDomain, statsGlobales, filteredDates, selectedDate },
    timeSeries: { enriched, chartData, stats, gaps, metadata, realPointsCount, hasEnoughDataForCurve }
  },
  respiration: {
    trend: { data, avgAwake, avgSleep, hasAwakeData, hasSleepData }
  },
  bodyBattery: {
    trend: { data, average }
  },
  stress: {
    trend: { data, average }
  },
  sleep: {
    trend: { data, averageDuration, breakdown },
    correlation: { sleepPerformanceData }
  },
  activity: {
    heatmap: { activityByDate, weeks },
    correlation: { batteryIntensityData }
  },
  metadata: {
    filteredDates,
    displayInfo,
    selectedDate,
    colors
  }
}
```
- Chaque section doit être purement dérivée et mémoïsée.
- Les exports réutiliseront `selectors.<feature>` pour sérialiser.

### Étapes
1. Audit des composants Charts (`components/charts/*`) : lister les dérivés nécessaires.
2. Étendre `useGarminChartSelectors` :
   - ✅ (12/11) `selectors` exposé (`heartRate`, `respiration`, `bodyBattery`, `stress`, `sleep`, `activity`, `metadata`).
   - Documenter les propriétés (ex : `heartRate.timeSeries`, `heartRate.trend`).
3. `buildDerivedDataset` enrichi (inclut `selectors` → export JSON/PDF alignés).
4. Migration charts :
   - ✅ GarminHeartRateChart consomme `selectors.heartRate.trend` (fallback `precomputed` conservé).
   - ✅ GarminBodyBatteryChart consomme `selectors.bodyBattery.trend`.
   - ✅ GarminStressChart consomme `selectors.stress.trend`.
   - ✅ GarminSleepChart consomme `selectors.sleep.trend`.
   - ✅ GarminRespirationChart consomme `selectors.respiration.trend`.
   - ✅ GarminHeartRateTimeSeriesChart consomme `selectors.heartRate.timeSeries`.
   - ✅ GarminActivityHeatmap consomme `selectors.activity.heatmap`.
   - ✅ GarminCorrelationCharts consomme `selectors.sleep.correlation` / `selectors.activity.correlation`.
5. Tests : comparer rendu avant/après + snapshots JSON.
   - ✅ (12/11) `node --experimental-specifier-resolution=node scripts/bench/exportSelectorsDiff.js` → parité chartData/selectors, snapshots `logs/garmin/export-phase8-{legacy,after}.json`.

---

## 2. Harmonisation export JSON / PDF

### Constat
- Exports existants reformatent les données encore différemment (ex : zones FC, points timeSeries).
- PDF et JSON ne partagent pas toujours les mêmes champs / libellés.

### Cibles
1. **Adapter les générateurs d’export** pour consommer les selectors dérivés.
2. **Garantir la parité UI ↔ export** :
   - mêmes champs (stats, coverage, zones).
   - même logique de formatage (arrondi, date locale).
3. **Documenter** la structure JSON officielle + versionner.

### Étapes
1. Cartographie des exports (`services/export/json`, `services/export/pdf`).
2. Brancher les selectors dérivés.
3. Ajouter tests (diff/instant snapshot) pour verrouiller la cohérence.
4. Mettre à jour la doc (`docs/garmin/EXPORT_SCHEMA.md` si nécessaire).

---

## 3. Accessibilité & observabilité UI

### Axes
- **Accessibilité** :
  - Focus trap sur les modales (`ForceRangeDialog`, `AutoSyncConfig`, etc.).
  - Navigation clavier (tab order, raccourcis synchr).
  - Annonces screen reader (`aria-live` lors d’un succès/échec de sync).
- **Observabilité** :
  - Modulariser utilitaires AutoSync/Debug en services dédiés.
  - Instrumenter `NetworkDiagnostics`, `CacheDiagnostics` pour exploiter `fetchDebugData`.
  - Ajouter métriques UI (re-renders, temps de rendu) dans TelemetryCoordinator.

### Étapes
1. Audit des modales + check-list WCAG (focus initial, escape, retour focus).
   - ✅ (12/11) ForceRangeDialog/ForceSyncMenu/DebugPanel utilisent `useFocusTrap` + focus auto.
2. Ajouter un module `accessibility/` (hooks utilitaires `useFocusTrap`, `useKeyboardShortcut`).
   - ✅ (12/11) `useKeyboardShortcut` expose les raccourcis globaux (Ctrl+Maj+D).
3. Enrichir DebugPanel :
   - ✅ (12/11) Boutons refresh + snapshot serveur (`/api/garmin/debug`), live region, badge `aria-busy`.
   - ✅ (12/11) `NetworkDiagnostics`/`CacheDiagnostics` affichent TTL/entries serveur, timeline locale.
4. Tests : manuels (tabbing) + Vitest (hooks) + story XR (si existante).
   - ✅ (12/11) Navigation clavier & VoiceOver validés (menu Forcer, modale range, DebugPanel).
   - ☐ Script de test automatisé (facultatif, à planifier si besoin).

---

## 4. Livrables & suivi

- **Docs** :
  - `analyse ducodedegarmin.md` section Phase 8 (objectifs, état).
  - `EXPORT_SCHEMA.md` (si refonte).
  - Checklist accessibilité.
- **Tests** :
  - Vitest : selectors dérivés, exports, hooks a11y.
  - Snapshots PDF/JSON.
- **Observabilité** :
  - Mise à jour DebugPanel (nouveaux counters).
  - Dashboard `/admin/metrics` : ajouter “UI telemetry push”.

---

## 5. Roadmap indicative

| Sprint | Travaux |
|--------|---------|
| S1 | Sélecteurs dérivés (heart rate + respiration) + Charts refactor. |
| S2 | Alignement export JSON + PDF, tests de cohérence. |
| S3 | Accessibilité : focus trap, shortcuts, annonces screen reader. |
| S4 | Observabilité complémentaire + finalisation doc/tests. |

> Ajuster en fonction des retours QA ou incidents éventuels.

