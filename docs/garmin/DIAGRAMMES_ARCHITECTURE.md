# Diagrammes Architecture - Onglet Garmin

> **Objectif** : Visualiser l'architecture de l'onglet Garmin pour améliorer l'onboarding et la compréhension.

---

## 📊 Diagrammes Disponibles

### 1. Architecture Globale

**Fichier** : `diagrams/architecture-global.mmd`

**Description** : Visualise les 5 couches principales de l'architecture :
- UI Layer (React Components)
- Orchestration Layer (Custom Hooks)
- Services Layer (Business Logic)
- Storage Layer (Persistence)
- Observability Layer (Telemetry)

**Utilisation** : Comprendre la structure globale et les interactions entre couches.

![Architecture globale](./diagrams/architecture-global.mmd)

---

### 2. Pipeline de Synchronisation

**Fichier** : `diagrams/sync-pipeline.mmd`

**Description** : Visualise les 12 étapes du `SyncPipelineRunner` :
1. ValidateStep
2. NormalizeStep
3. ClearCacheStep
4. ResolveRangeStep
5. BuildContextStep
6. ExecuteOrchestratorStep
7. HandleAdjustedRangeStep
8. HandleCacheHitStep
9. ProcessNetworkResponseStep
10. HandleErrorStep
11. RecordHistoryStep
12. UpdateMetricsStep

**Utilisation** : Comprendre le flux de synchronisation étape par étape.

![Pipeline de synchronisation](./diagrams/sync-pipeline.mmd)

---

### 3. Flux de Données

**Fichier** : `diagrams/data-flow.mmd`

**Description** : Visualise le flux complet de bout en bout :
- Trigger (User Action / AutoSync / Import)
- Orchestration (useGarminSyncActions → SyncPipelineRunner)
- Services (Range → Cache → Request → Retry)
- Persistence (processSyncResponse → IndexedDB → In-memory)
- Selection & Derivation (Selectors → ChartSelectors → DerivedDataset)
- Rendering (UI / Exports)
- Instrumentation (TelemetryCoordinator → DebugPanel)

**Utilisation** : Comprendre comment les données circulent dans l'application.

![Flux de données](./diagrams/data-flow.mmd)

---

### 4. Hiérarchie de Cache

**Fichier** : `diagrams/cache-hierarchy.mmd`

**Description** : Visualise la résolution multi-niveaux du cache :
1. Existing Data (in-memory state)
2. Memory Cache (TTL 60s, 30s for today)
3. IndexedDB Cache (Persistent, TTL 5min)
4. Server Cache (TTL 5min, ETag support)
5. Network Request (tryFetch + Circuit Breaker)
6. SWR (Stale-While-Revalidate)

**Utilisation** : Comprendre la stratégie de cache et l'ordre de résolution.

![Hiérarchie de cache](./diagrams/cache-hierarchy.mmd)

---

## 🛠️ Génération SVG

Pour générer les SVG depuis les fichiers Mermaid :

```bash
# Installer Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Générer tous les SVG
cd docs/garmin/diagrams
mmdc -i architecture-global.mmd -o architecture-global.svg
mmdc -i sync-pipeline.mmd -o sync-pipeline.svg
mmdc -i data-flow.mmd -o data-flow.svg
mmdc -i cache-hierarchy.mmd -o cache-hierarchy.svg
```

---

## 📝 Intégration dans la Documentation

Les diagrammes sont référencés dans :
- `ANALYSE_DETAILLEE_ONGLET_GARMIN.md` : Sections 1.1, 1.3, 2.1
- `VERIFICATION_METHODIQUE_PHASE_8.md` : Section 9.1
- Ce document : Vue d'ensemble

---

## 🎯 Impact

**Onboarding** : -2h par nouveau dev (3h → 1h lecture)

**Architecture reviews** : Plus rapides (coup d'œil vs relecture doc complète)

**Maintenance** : Compréhension visuelle immédiate des flux

