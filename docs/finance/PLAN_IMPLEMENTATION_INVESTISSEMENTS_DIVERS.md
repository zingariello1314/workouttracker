# 🥇 PLAN D'IMPLÉMENTATION - INVESTISSEMENTS DIVERS

## 🎯 PRINCIPE FONDAMENTAL

Écosystème multi-actifs sophistiqué : **Or Physique** + **Liquidités** + **Bourse/Crypto** avec synchronisation transversale et intelligence d'allocation.

## 📋 ARCHITECTURE GÉNÉRALE

### Structure des Données

```javascript
{
  investissements: {
    or: {
      stockActuel: 59.2, // grammes
      objectifMensuel: 150, // euros
      acquisitions: [
        {
          id: 'uuid',
          date: '2024-03-15',
          quantite: 5, // grammes
          prix: 65.50,
          prime: 4.2, // %
          lieuStockage: 'coffre-banque' // coffre-banque, coffre-domicile, tiers-confiance
        }
      ],
      repartition: {
        coffreBanque: 60,
        coffreDomicile: 30,
        tiersConfiance: 10
      }
    },
    liquidites: {
      stockTotal: 8200,
      objectifMensuel: 200,
      progression: [...],
      repartition: {
        lieu1: 3000,
        lieu2: 2500,
        lieu3: 2700
      }
    },
    bourseCrypto: {
      allocation: {
        actions: 60, // %
        crypto: 15,
        cashAttente: 25
      },
      positions: [...],
      dca: {
        frequence: 'mensuel',
        montants: {
          etf: 300,
          actions: 150,
          crypto: 50
        }
      }
    }
  }
}
```

## 🔧 PHASE 1 : STRUCTURE DE BASE (3h)

### 1.1 Composant Investissements Principal

**Fichier**: `src/components/finance/investissements/InvestissementsTab.jsx`

- Système de sous-sections :
  - Or Physique
  - Liquidités
  - Bourse & Crypto
  - Dashboard Unifié

### 1.2 Service Stockage Investissements

**Fichier**: `src/services/investissementsStorage.js`

- LocalStorage avec IndexedDB
- CRUD or, liquidités, positions
- Historique complet acquisitions

### 1.3 Hook Investissements Principal

**Fichier**: `src/hooks/useInvestissements.js`

```javascript
const {
  or,
  liquidites,
  bourseCrypto,
  addOrAcquisition,
  updateLiquidites,
  addPosition,
  calculateAllocation,
  synchronizeAssets
} = useInvestissements();
```

## 🥇 PHASE 2 : OR PHYSIQUE (8h)

### 2.1 Moteur Accumulation

**Fichier**: `src/components/finance/investissements/OrPhysique.jsx`

**Unités configurables**:
- Grammes
- Valeur €

**Métriques display**:
- Stock actuel (grammes + valeur)
- Objectif mensuel
- Progression

### 2.2 Calendrier Acquisition Intelligent

**Fichier**: `src/components/finance/investissements/OrCalendar.jsx`

**Fonctionnalités**:
- Planificateur adaptatif (5g → 10g → 20g → 1oz)
- Optimiseur timing (alertes prix favorables)
- Gestionnaire échéances ("Dans 12 jours : 450€ → Lingotin 10g")
- Anticipation dynamique (report auto si épargne insuffisante)
- Alertes personnalisées (prime <5% optimal, >8% attendre)

### 2.3 Algorithme Stockage Sécurisé

**Fichier**: `src/components/finance/investissements/OrStockage.jsx`

**Répartition**:
- Coffre Banque (60%)
- Coffre Domicile (30%)
- Tiers Confiance (10%)

**Fonctionnalités**:
- Rotation intelligente
- Alertes concentration ("85% même dépositaire = risque")
- Répartition automatique nouveaux achats

### 2.4 Analytics Prédictives

**Fichier**: `src/components/finance/investissements/OrAnalytics.jsx`

**Analyses**:
- Courbe DCA sophistiquée (théorique vs réalité)
- Projection valorisation (3 scénarios : +3%, +7%, +12%)
- Analyse prime moyenne (coût vs spot)
- ROI métal vs alternatives (ETF/Actions/Immobilier)
- Stress-test portfolio (impact inflation)

### 2.5 Gestion Stratégique Évolutive

**Fichier**: `src/components/finance/investissements/OrStrategy.jsx`

**Fonctionnalités**:
- Diversification métaux (Or → Argent/Platine)
- Adaptation tailles (5g → 10g → 20g → 1oz)
- Rebalancing auto ("Or >40% → Pause accumulation")
- Exit strategy (règles revente partielle)

## 💰 PHASE 3 : LIQUIDITÉS (6h)

### 3.1 Moteur Accumulation Pure

**Fichier**: `src/components/finance/investissements/Liquidites.jsx`

**Focus**:
- Accumulation cash maximale
- Zero-based budgeting (excédent → cash)
- Tracking progression mensuelle
- Surplus occasionnels

### 3.2 Calculateur Efficacité

**Fichier**: `src/components/finance/investissements/LiquiditesCalculator.jsx`

**Métriques**:
- Rate mensuel cible
- Accélérateurs identifiés (bonus, ventes, économies)
- Optimiseur lifestyle (réduction dépenses → plus cash)
- Compteur satisfaction ("Objectif 10k€ dans X mois")

### 3.3 Gestionnaire Stockage Sécurisé

**Fichier**: `src/components/finance/investissements/LiquiditesStockage.jsx`

**Fonctionnalités**:
- Dispersion obligatoire (répartition auto)
- Seuils escalade (1k€/5k€/10k€+ → stratégies sécurité)
- Monitoring concentration (alertes si >X€ même emplacement)
- Backup automatique (règles dispersion proportionnelle)

### 3.4 Analytics Performance Accumulation

**Fichier**: `src/components/finance/investissements/LiquiditesAnalytics.jsx`

**Dashboard minimaliste**:
- Courbe accumulation pure (target vs réalisation)
- Velocity tracking (accélération/ralentissement)
- Projections motivantes ("À ce rythme = 50k€ dans 3.2 ans")
- Records personnels (meilleur mois/trimestre/année)

## 🚀 PHASE 4 : BOURSE & CRYPTO (8h)

### 4.1 Architecture Portefeuille Hybride

**Fichier**: `src/components/finance/investissements/BourseCrypto.jsx`

**Allocation multi-niveaux**:
- ACTIONS (60%) :
  - ETF Monde (40%)
  - ETF Sectoriels (10%)
  - Actions Individuelles (10%)
- CRYPTO (15%) :
  - Bitcoin (10%)
  - Altcoins (5%)
- CASH PHYSIQUE (25%)

### 4.2 Moteur DCA Sophistiqué

**Fichier**: `src/components/finance/investissements/DCAManager.jsx`

**Fonctionnalités**:
- Multi-fréquences (Hebdomadaire/Mensuel/Trimestriel)
- Smart averaging (augmentation achats sur baisses >15%)
- Rebalancing automatique (maintien allocation cible)
- Momentum integration (pause DCA sur cassures techniques)

### 4.3 Analytics Portfolio Avancées

**Fichier**: `src/components/finance/investissements/PortfolioAnalytics.jsx`

**Métriques**:
- Performance attribution (contribution par actif/secteur)
- Risk metrics (Sharpe ratio, Beta, VaR, corrélations)
- Backtesting stratégies (simulation historique)
- Benchmarking intelligent (vs CAC40, S&P500, portefeuilles types)

### 4.4 Gestionnaire Opportunités

**Fichier**: `src/components/finance/investissements/OpportunitiesManager.jsx`

**Fonctionnalités**:
- Watchlist intelligente (titres suivis avec alertes)
- Cash deployment rules (accumulation pure, zéro sortie)
- Contrarian indicators (focus entrées cash)
- Tactical overlay (optimisation lifestyle pour maximiser flux)

## 🔗 PHASE 5 : INTÉGRATION TRANSVERSALE (6h)

### 5.1 Dashboard Unifié

**Fichier**: `src/components/finance/investissements/DashboardUnifie.jsx`

**Vue 360°**:
- Patrimoine diversifié (Or + Liquidités + Bourse/Crypto)
- Allocation actuelle vs cible
- Actions recommandées
- Métriques consolidées

**Affichage**:
```
┌─────────────────────────────────────────────┐
│ PATRIMOINE DIVERSIFIÉ - Vue 360°            │
├─────────────────────────────────────────────┤
│ 🥇 Or Physique    : 12,450€ (+840€/+7.2%)  │
│ 💰 Liquidités     :  8,200€ (stable)       │  
│ 📈 Bourse/Crypto  : 24,380€ (+2,980€/+13.9%)│
├─────────────────────────────────────────────┤
│ 🎯 ALLOCATION ACTUELLE vs CIBLE             │
│ Or        : 28% [🟢 Cible 30% ±2%]         │
│ Cash      : 18% [🟡 Cible 15% +3%]         │
│ Risqué    : 54% [🟢 Cible 55% ±1%]         │
├─────────────────────────────────────────────┤
│ 🚨 ACTIONS RECOMMANDÉES                     │
│ • Réduire cash : 1,350€ → Or ou Bourse     │
│ • Prochain achat or dans 8 jours           │
│ • Opportunity: Tech en correction -12%      │
└─────────────────────────────────────────────┘
```

### 5.2 Système Alertes Cross-Assets

**Fichier**: `src/services/investissementsAlerts.js`

**Alertes**:
- Rebalancing (dérive allocation >seuils)
- Opportunités croisées ("Vendre or surperformant → Racheter actions décotées")
- Macro correlations ("Inflation +4% → Augmenter or, réduire obligations")
- Liquidité optimale ("Cash excédentaire → Répartition selon momentum")

### 5.3 Modélisation Prédictive Unifiée

**Fichier**: `src/components/finance/investissements/PredictiveModeling.jsx`

**Fonctionnalités**:
- Projection patrimoine (5/10/20 ans selon hypothèses)
- Monte Carlo simulation (1000 scenarios pour confidence intervals)
- Stress testing (impact crises : COVID, 2008, inflation)
- Optimisation allocation (frontière efficiente personnalisée)

## 🎨 PHASE 6 : INTERFACE RÉVOLUTIONNAIRE (4h)

### 6.1 Modes Adaptatifs Intelligents

**Fichier**: `src/components/finance/investissements/InvestissementsModes.jsx`

**Modes**:
- Vue d'Ensemble : Dashboard synthétique
- Détail Actif : Drill-down spécialisé (Or/Cash/Bourse)
- Simulation : Laboratoire scénarios avec sliders
- Historique : Analytics temporelles avec annotations

### 6.2 Interactions Fluides Cross-Platform

- Drag & drop allocations (répartition visuelle)
- Gestures avancés (zoom graphiques, comparaisons)
- Voice commands (optionnel futur)

## 📦 STRUCTURE FICHIERS FINALE

```
src/
├── components/
│   └── finance/
│       └── investissements/
│           ├── InvestissementsTab.jsx
│           ├── OrPhysique.jsx
│           ├── OrCalendar.jsx
│           ├── OrStockage.jsx
│           ├── OrAnalytics.jsx
│           ├── OrStrategy.jsx
│           ├── Liquidites.jsx
│           ├── LiquiditesCalculator.jsx
│           ├── LiquiditesStockage.jsx
│           ├── LiquiditesAnalytics.jsx
│           ├── BourseCrypto.jsx
│           ├── DCAManager.jsx
│           ├── PortfolioAnalytics.jsx
│           ├── OpportunitiesManager.jsx
│           ├── DashboardUnifie.jsx
│           ├── PredictiveModeling.jsx
│           └── InvestissementsModes.jsx
├── services/
│   ├── investissementsStorage.js
│   └── investissementsAlerts.js
└── hooks/
    └── useInvestissements.js
```

## 🏗️ ARCHITECTURE TECHNIQUE DÉTAILLÉE

### Backend Architecture (Services)

#### Service Investissements Storage - IndexedDB Multi-Actifs

**Fichier**: `src/services/investissementsStorage.js`

**Implémentation Complète**:
```javascript
import { openDB } from 'idb';

const DB_NAME = 'InvestissementsDB';
const DB_VERSION = 1;
const STORES = {
  OR: 'or',
  LIQUIDITES: 'liquidites',
  BOURSE_CRYPTO: 'bourseCrypto',
  ACQUISITIONS: 'acquisitions',
  ALLOCATION: 'allocation'
};

class InvestissementsStorage {
  async initDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store Or avec index
        if (!db.objectStoreNames.contains(STORES.OR)) {
          const orStore = db.createObjectStore(STORES.OR, { keyPath: 'id' });
          orStore.createIndex('date', 'date', { unique: false });
        }

        // Store Liquidités
        if (!db.objectStoreNames.contains(STORES.LIQUIDITES)) {
          db.createObjectStore(STORES.LIQUIDITES, { keyPath: 'id' });
        }

        // Store Bourse/Crypto
        if (!db.objectStoreNames.contains(STORES.BOURSE_CRYPTO)) {
          const bcStore = db.createObjectStore(STORES.BOURSE_CRYPTO, { keyPath: 'id' });
          bcStore.createIndex('type', 'type', { unique: false }); // 'action' ou 'crypto'
        }

        // Store Acquisitions (historique)
        if (!db.objectStoreNames.contains(STORES.ACQUISITIONS)) {
          const acqStore = db.createObjectStore(STORES.ACQUISITIONS, {
            keyPath: 'id',
            autoIncrement: true
          });
          acqStore.createIndex('date', 'date', { unique: false });
          acqStore.createIndex('type', 'type', { unique: false });
        }
      }
    });
  }

  async saveOrAcquisition(acquisition) {
    const db = await this.initDB();
    const tx = db.transaction([STORES.OR, STORES.ACQUISITIONS], 'readwrite');
    
    // Sauvegarder acquisition
    await tx.objectStore(STORES.ACQUISITIONS).add({
      ...acquisition,
      type: 'OR',
      timestamp: Date.now()
    });
    
    // Mettre à jour stock or
    const orData = await tx.objectStore(STORES.OR).get('current');
    const updated = {
      id: 'current',
      stockActuel: (orData?.stockActuel || 0) + acquisition.quantite,
      acquisitions: [...(orData?.acquisitions || []), acquisition]
    };
    await tx.objectStore(STORES.OR).put(updated);
  }
}

export const investissementsStorage = new InvestissementsStorage();
```

#### Service Prix Or - Intégration API Fixer

**Fichier**: `src/services/orPriceService.js`

**Implémentation avec Fixer API**:
```javascript
import { getApiKey } from '../../config/apiKeys';

class OrPriceService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60 * 60 * 1000; // 1h
  }

  async getCurrentPrice() {
    const cached = this.cache.get('current');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.price;
    }

    try {
      const apiKey = getApiKey('FIXER');
      const response = await fetch(
        `https://api.fixer.io/latest?access_key=${apiKey}&symbols=XAU&base=EUR`
      );
      const data = await response.json();
      
      // Convertir taux (1 XAU = X EUR)
      const price = 1 / data.rates.XAU;
      
      this.cache.set('current', { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.error('Error fetching gold price:', error);
      // Fallback : dernière valeur cache
      return cached?.price || 65; // Prix par défaut
    }
  }

  async getHistoricalPrice(date) {
    // Utiliser endpoint historique Fixer si disponible
    // Sinon, utiliser cache local
  }
}

export const orPriceService = new OrPriceService();
```

### Frontend Architecture (Components)

#### Composant Or Physique - Interface Complète

**Fichier**: `src/components/finance/investissements/OrPhysique.jsx`

**Implémentation avec Calculs Temps Réel**:
```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { useOrData } from '../../../hooks/useOrData';
import { orPriceService } from '../../../services/orPriceService';

const OrPhysique = () => {
  const { orData, addAcquisition } = useOrData();
  const [prixOr, setPrixOr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrice = async () => {
      const price = await orPriceService.getCurrentPrice();
      setPrixOr(price);
      setLoading(false);
    };
    loadPrice();
    
    // Refresh prix toutes les heures
    const interval = setInterval(loadPrice, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcul valorisation temps réel
  const valorisation = useMemo(() => {
    if (!prixOr || !orData) return 0;
    return orData.stockActuel * prixOr;
  }, [prixOr, orData]);

  // Calcul plus-value
  const plusValue = useMemo(() => {
    if (!orData?.acquisitions || !prixOr) return 0;
    
    const totalInvesti = orData.acquisitions.reduce((sum, acq) => 
      sum + (acq.quantite * acq.prix), 0
    );
    
    const valorisationActuelle = orData.stockActuel * prixOr;
    return valorisationActuelle - totalInvesti;
  }, [orData, prixOr]);

  return (
    <div className="or-physique">
      <div className="metrics-grid">
        <MetricCard
          label="Stock Actuel"
          value={`${orData?.stockActuel || 0}g`}
          subtitle={`${formatCurrency(valorisation)}`}
        />
        <MetricCard
          label="Prix Or"
          value={loading ? '...' : formatCurrency(prixOr) + '/g'}
          subtitle="Cours spot"
        />
        <MetricCard
          label="Plus-Value"
          value={formatCurrency(plusValue)}
          subtitle={`${((plusValue / totalInvesti) * 100).toFixed(2)}%`}
          color={plusValue >= 0 ? 'green' : 'red'}
        />
      </div>
      
      <OrCalendar 
        objectifMensuel={orData?.objectifMensuel}
        stockActuel={orData?.stockActuel}
      />
      
      <OrStockage 
        repartition={orData?.repartition}
        stockActuel={orData?.stockActuel}
      />
    </div>
  );
};
```

## 🔒 SÉCURITÉ & VALIDATION

### Validation Données Investissements

**Fichier**: `src/utils/investissementsValidation.js`

```javascript
import { z } from 'zod';

export const orAcquisitionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantite: z.number().positive().max(10000), // Max 10kg
  prix: z.number().positive().max(100000),
  prime: z.number().min(0).max(50), // Prime max 50%
  lieuStockage: z.enum(['coffre-banque', 'coffre-domicile', 'tiers-confiance'])
});

export function validateOrAcquisition(data) {
  try {
    return { success: true, data: orAcquisitionSchema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
}
```

## 🧪 TESTS & QUALITÉ

### Tests Unitaires Investissements

**Fichier**: `src/services/__tests__/investissementsStorage.test.js`

```javascript
describe('InvestissementsStorage', () => {
  test('saveOrAcquisition updates stock correctly', async () => {
    const acquisition = {
      date: '2024-03-15',
      quantite: 5,
      prix: 65.50,
      prime: 4.2,
      lieuStockage: 'coffre-banque'
    };
    
    await investissementsStorage.saveOrAcquisition(acquisition);
    const orData = await investissementsStorage.getOrData();
    
    expect(orData.stockActuel).toBe(5);
    expect(orData.acquisitions).toHaveLength(1);
  });
});
```

## ⏱️ ESTIMATION TOTALE RÉVISÉE

**45 heures** de développement pour module complet niveau production avec toutes optimisations.

**Détail**:
- Phase 1-2 : Structure + Or Physique (13h) - FONDATION
- Phase 3 : Liquidités (8h) - CORE
- Phase 4 : Bourse & Crypto (10h) - ESSENTIEL
- Phase 5-6 : Intégration + Interface (12h) - AVANCÉ
- Tests & Optimisations : (2h) - QUALITÉ

## 🚀 PRIORITÉS

1. **Phase 1-2** : Structure + Or Physique (13h) - FONDATION
2. **Phase 3** : Liquidités (8h) - CORE
3. **Phase 4** : Bourse & Crypto (10h) - ESSENTIEL
4. **Phase 5-6** : Intégration + Interface (12h) - AVANCÉ
5. **Tests & Qualité** : Tests + Monitoring (2h) - PRODUCTION

