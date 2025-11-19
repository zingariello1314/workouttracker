# 📊 Diagrammes Architecture - Onglet Nutrition

> **Objectif** : Visualiser l'architecture de l'onglet Nutrition pour améliorer l'onboarding et la compréhension.

---

## 📊 Diagrammes Disponibles

### 1. Architecture Globale

**Fichier** : `diagrams/architecture-global.mmd`

**Description** : Visualise les 4 couches principales de l'architecture :
- UI Layer (React Components)
- Hooks Layer (React Hooks)
- Services Layer (Business Logic)
- Storage Layer (IndexedDB + Cache)

**Utilisation** : Comprendre la structure globale et les interactions entre couches.

```mermaid
graph TB
    subgraph "UI Layer"
        NT[NutritionTab]
        NJ[NutritionJournal]
        NP[NutritionPrograms]
        NA[NutritionAnalyses]
        NG[NutritionGamification]
    end

    subgraph "Hooks Layer"
        UND[useNutritionData]
        URO[useRepositoryObserver]
        UNG[useNutritionGamification]
        UNR[useNutritionRecommendations]
    end

    subgraph "Services Layer"
        REPO[Repository Pattern]
        GAM[Gamification Service]
        EXP[Expert System]
        SHARE[Sharing Service]
        PRED[Predictions ML]
    end

    subgraph "Storage Layer"
        IDB[(IndexedDB<br/>11 Stores)]
        CACHE[Cache Multi-Layer]
    end

    subgraph "External APIs"
        OFF[OpenFoodFacts API]
        USDA[USDA API]
    end

    NT --> NJ
    NT --> NP
    NT --> NA
    NT --> NG

    NJ --> UND
    NP --> UND
    NA --> UND
    NG --> UNG

    UND --> URO
    UND --> REPO
    UNG --> GAM
    UNR --> EXP

    REPO --> IDB
    REPO --> CACHE
    GAM --> IDB
    EXP --> IDB
    SHARE --> IDB
    PRED --> IDB

    UND --> OFF
    UND --> USDA
```

---

### 2. Flux de Données

**Fichier** : `diagrams/data-flow.mmd`

**Description** : Visualise le flux complet de bout en bout :
- Saisie utilisateur → Hook → Repository → IndexedDB
- Consultation → Cache L1 → L2 → L3 → IndexedDB
- Synchronisation automatique via Observer Pattern

**Utilisation** : Comprendre comment les données circulent dans l'application.

```mermaid
sequenceDiagram
    participant User
    participant UI as NutritionJournal
    participant Hook as useNutritionData
    participant Repo as Repository
    participant Cache as Cache Layer
    participant IDB as IndexedDB
    participant Observer as RepositoryObserver

    User->>UI: Saisie repas
    UI->>Hook: saveMeal(mealData)
    Hook->>Repo: save('nutrition_meals', mealData)
    Repo->>Cache: Invalidate cache
    Repo->>IDB: Transaction put
    IDB-->>Repo: Success
    Repo->>Observer: notify('meals:*', mealData)
    Observer->>UI: Update via useRepositoryObserver
    UI-->>User: Affichage mis à jour
```

---

### 3. Repository Pattern

**Fichier** : `diagrams/repository-pattern.mmd`

**Description** : Visualise le Repository Pattern :
- Factory Pattern (singleton, auto-detection)
- Repository Interface (abstraction)
- Implémentations (IndexedDB, LocalStorage, Memory)
- Observer Pattern (synchronisation)

**Utilisation** : Comprendre l'abstraction de l'accès aux données.

```mermaid
graph TB
    subgraph "Factory Pattern"
        FACTORY[RepositoryFactory<br/>Singleton + Auto-detection]
    end

    subgraph "Repository Interface"
        REPO[NutritionRepository<br/>Abstract Class]
    end

    subgraph "Implementations"
        IDB_REPO[IndexedDBRepository<br/>Production]
        LS_REPO[LocalStorageRepository<br/>Fallback]
        MEM_REPO[MemoryRepository<br/>Tests]
    end

    subgraph "Observer Pattern"
        OBSERVER[RepositoryObserver<br/>Synchronization]
    end

    FACTORY -->|Creates| REPO
    REPO -->|Implements| IDB_REPO
    REPO -->|Implements| LS_REPO
    REPO -->|Implements| MEM_REPO

    IDB_REPO -->|Notifies| OBSERVER
    LS_REPO -->|Notifies| OBSERVER
    MEM_REPO -->|Notifies| OBSERVER
```

---

### 4. Hiérarchie de Cache

**Fichier** : `diagrams/cache-hierarchy.mmd`

**Description** : Visualise la résolution multi-niveaux du cache :
1. L1 (Memory) : ~0ms, TTL 60s
2. L2 (IndexedDB) : ~10ms, TTL 24h
3. L3 (API) : ~200ms, TTL 5min
4. Sources : IndexedDB stores, External APIs

**Utilisation** : Comprendre la stratégie de cache et l'ordre de résolution.

```mermaid
graph TB
    REQ[Request]
    
    subgraph "Cache L1: Memory"
        L1[LRU Cache<br/>TTL: 60s<br/>~0ms]
    end

    subgraph "Cache L2: IndexedDB"
        L2[Persistent Cache<br/>TTL: 24h<br/>~10ms]
    end

    subgraph "Cache L3: API"
        L3[OpenFoodFacts/USDA<br/>TTL: 5min<br/>~200ms]
    end

    REQ --> L1
    L1 -->|Cache Miss| L2
    L2 -->|Cache Miss| L3
    L3 -->|Cache Miss| IDB[(IndexedDB)]
    L3 -->|Cache Miss| API[External APIs]
```

---

## 🛠️ Génération SVG

Pour générer les SVG depuis les fichiers Mermaid :

```bash
# Installer Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Générer tous les SVG
cd docs/nutrition/diagrams
mmdc -i architecture-global.mmd -o architecture-global.svg
mmdc -i data-flow.mmd -o data-flow.svg
mmdc -i repository-pattern.mmd -o repository-pattern.svg
mmdc -i cache-hierarchy.mmd -o cache-hierarchy.svg
```

---

## 📚 Utilisation

Ces diagrammes sont intégrés dans :
- **README.md** : Vue d'ensemble
- **ARCHITECTURE_NUTRITION.md** : Documentation détaillée
- **Documentation développeurs** : Onboarding nouveaux développeurs

---

**Dernière mise à jour** : 2025-01-16  
**Version** : 1.0

