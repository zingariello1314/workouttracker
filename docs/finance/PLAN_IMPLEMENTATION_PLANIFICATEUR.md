# 📅 PLAN D'IMPLÉMENTATION - PLANIFICATEUR FINANCIER PERSONNEL

## 🎯 PRINCIPE FONDAMENTAL

Gestionnaire de salaire intelligent : **Répartition salaire** + **Planification loisirs** + **Contrôle 3 ans** + **Synchronisation cross-modules** avec calculs automatiques et alertes intelligentes.

## 📋 ARCHITECTURE GÉNÉRALE

### Structure des Données

```javascript
{
  planificateur: {
    salaire: {
      netMensuel: 3000,
      repartition: {
        loyer: 800,
        investissementOr: 300,
        investissementBourse: 500,
        cashAccumulation: 200,
        loisirs: 400,
        surplus: 800
      }
    },
    loisirs: {
      budgetMensuel: 400,
      achats: [
        {
          id: 'uuid',
          nom: 'MacBook Pro',
          photo: 'url',
          lien: 'https://...',
          prix: 2500,
          moisCible: '2024-10',
          priorite: 'urgent', // urgent, normal, peut-attendre
          statut: 'planifie', // planifie, a-venir, realise, depassement, annule, reporte
          faisabilite: {
            possible: true,
            budgetDisponible: 4000, // Cumul jusqu'au mois cible
            manque: 0,
            suggestions: []
          }
        }
      ]
    },
    planification3ans: {
      timeline: '3-ans', // 3-mois, 6-mois, 12-mois, 3-ans
      chargesFixes: [
        {
          type: 'loyer',
          montant: 800,
          frequence: 'mensuel',
          icone: '🏠'
        },
        {
          type: 'or',
          montant: 300,
          frequence: 'mensuel',
          icone: '🥇'
        }
      ],
      objectifs: [
        {
          id: 'uuid',
          titre: 'MacBook Pro 2500€',
          montant: 2500,
          date: '2024-10-15',
          moisCible: '2024-10',
          workflow: {
            creation: '2024-01-15',
            notificationJ7: '2024-10-08',
            notificationJ1: '2024-10-14',
            realisation: null,
            montantReel: null,
            analyse: null
          }
        }
      ]
    }
  }
}
```

## 🔧 PHASE 1 : STRUCTURE DE BASE (3h)

### 1.1 Composant Planificateur Principal

**Fichier**: `src/components/finance/planificateur/PlanificateurTab.jsx`

- Système de sections :
  - Répartition Salaire
  - Planification Loisirs
  - Planification 3 Ans
  - Synchronisation

### 1.2 Service Stockage Planificateur

**Fichier**: `src/services/planificateurStorage.js`

- LocalStorage avec IndexedDB
- CRUD salaire, répartition, achats loisirs
- Historique modifications répartition

### 1.3 Hook Planificateur Principal

**Fichier**: `src/hooks/usePlanificateur.js`

```javascript
const {
  salaire,
  repartition,
  achatsLoisirs,
  updateSalaire,
  updateRepartition,
  addAchatLoisir,
  updateAchatLoisir,
  calculateFaisabilite,
  synchronizeModules
} = usePlanificateur();
```

## 💰 PHASE 2 : RÉPARTITION SALAIRE (6h)

### 2.1 Configuration Salaire Mensuel

**Fichier**: `src/components/finance/planificateur/RepartitionSalaire.jsx`

**Champs**:
- Salaire net mensuel
- Répartition :
  - Loyer (montant fixe)
  - Investissement Or (DCA mensuel)
  - Investissement Bourse (DCA mensuel)
  - Cash accumulation (épargne mensuelle)
  - Loisirs (budget mensuel)
  - Surplus/Sécurité (restant)

### 2.2 Contrôle Répartition Intelligent

**Fichier**: `src/components/finance/planificateur/RepartitionControl.jsx`

**Calcul automatique**:
- Total allocations vs Salaire
- Alertes équilibre :
  - ✅ "Répartition équilibrée, 0€ non alloué"
  - ⚠️ "Sur-allocation de 150€, ajuster répartition"
  - 💰 "Sous-allocation de 200€, budget disponible"

**Modifications temps réel**:
- Sliders interactifs
- Impact immédiat autres modules
- Validation cohérence

### 2.3 Synchronisation Cross-Modules

**Fichier**: `src/services/planificateurSync.js`

**Propagation automatique**:
- Vers Investissements : Mise à jour montants Or/Bourse/Cash
- Vers Budget Personnel : Nouveau budget loisirs propagé
- Vers Smart Shopping : Budget courses/loisirs actualisé

**Notifications live**:
- "Budget loisirs modifié : 400€ → 500€"
- "Investissement Or modifié : 300€ → 350€"

## 🎮 PHASE 3 : PLANIFICATION LOISIRS (8h)

### 3.1 Gestion Budget Loisirs Mensuel

**Fichier**: `src/components/finance/planificateur/LoisirsBudget.jsx`

**Budget alloué**:
- Montant défini dans répartition salaire
- Utilisation flexible :
  - Dépenser intégralement chaque mois
  - Épargner plusieurs mois pour gros achat
  - Mixer dépenses + épargne

### 3.2 Création Achat Loisir Détaillé

**Fichier**: `src/components/finance/planificateur/AchatLoisirForm.jsx`

**Champs**:
- Nom produit (description personnalisée)
- Photo (image produit souhaité)
- Lien (URL site/magasin)
- Prix exact (montant TTC précis)
- Mois cible (quand acheter)
- Priorité (Urgent/Normal/Peut attendre)

### 3.3 Calculs Faisabilité Automatiques

**Fichier**: `src/components/finance/planificateur/FaisabiliteCalculator.jsx`

**Calculs**:
- Budget disponible : Cumul budget loisirs jusqu'au mois cible
- Faisabilité :
  - ✅ "Possible - Budget suffisant"
  - ⚠️ "Limite - Utilise 95% du budget"
  - ❌ "Impossible - Manque X€ sur budget loisirs alloué"

**Suggestions optimisation**:
- "Reporter 2 mois → budget loisirs OK"
- "Réduire budget loisirs mois X pour libérer montant"
- "Utiliser surplus loisirs mois précédents"

### 3.4 Interface Achats Loisirs

**Fichier**: `src/components/finance/planificateur/AchatsLoisirsList.jsx`

**Affichage**:
- Liste achats avec statuts visuels
- Filtres (statut, priorité, mois)
- Tri (date, prix, priorité)
- Actions rapides (modifier, supprimer, reporter)

## 📅 PHASE 4 : PLANIFICATION 3 ANS (8h)

### 4.1 Timeline Étendue

**Fichier**: `src/components/finance/planificateur/Timeline3Ans.jsx`

**Vues temporelles**:
- 3 mois : Vue court terme rapprochée
- 6 mois : Vision tactique moyen terme
- 12 mois : Planification annuelle complète
- 3 ans : 36 mois avec navigation fluide

**Projection budget**:
- Cumul budget loisirs sur durée choisie
- Visualisation charges fixes

### 4.2 Charges Fixes

**Fichier**: `src/components/finance/planificateur/ChargesFixes.jsx`

**Affichage**:
- Loyer (montant fixe, icône 🏠)
- Or (DCA mensuel, icône 🥇)
- Bourse (DCA mensuel, icône 📈)
- Cash (accumulation, icône 💰)

**Visualisation**:
- Barres charges fixes sur timeline
- Calcul budget libre dynamique

### 4.3 Épargne Loisirs Intelligente

**Fichier**: `src/components/finance/planificateur/EpargneLoisirs.jsx`

**Workflow détaillé**:
1. **Création** → Planification : Définition objectif avec détails
2. **Notification J-7** → Rappel Semaine : Alerte approche achat
3. **Notification J-1** → Alerte Veille : Confirmation achat lendemain
4. **Réalisation** → Achat : Validation achat effectué
5. **Saisie montant réel** → Validation Coût : Prix réel vs prévu
6. **Analyse prévu/réel** → Comparaison : Écart budget
7. **Mise à jour score** → Score XP : Attribution points discipline
8. **Analyse tendances** → Insights : Patterns comportement
9. **Recommandations** → Conseils : Optimisations futures

### 4.4 Statuts Visuels

**Fichier**: `src/components/finance/planificateur/StatutsVisuels.jsx`

**Statuts**:
- 📌 "prévu" : Achat programmé
- ⏰ "à venir" : Dans les 30 jours
- ✅ "réalisé" : Achat effectué
- 🔴 "dépassement" : Budget dépassé
- ❌ "annulé" : Achat annulé
- 🔄 "reporté" : Date modifiée

**Affichage**:
- Badges colorés
- Transitions animations
- Tooltips détails

### 4.5 Planification Enrichie

**Fichier**: `src/components/finance/planificateur/PlanificationEnrichie.jsx`

**Champs supplémentaires**:
- Titre (description)
- Montant (prix prévu)
- Date (mois cible)
- Lien (URL produit)
- Photo (visuel produit)
- Catégorie (Tech/Vêtement/etc)
- Priorité (Essentiel/Normal/Optionnel)

## 🔄 PHASE 5 : SYNCHRONISATION TEMPS RÉEL (4h)

### 5.1 Impact Modifications Salaire

**Fichier**: `src/services/planificateurSync.js`

**Propagation automatique**:
- Changement répartition → Propagation tous modules
- Nouvelle allocation investissements → Mise à jour DCA Or/Bourse
- Budget loisirs modifié → Recalcul faisabilité achats planifiés

**Alertes cascade**:
- "Réduction budget loisirs → 3 achats impossibles"
- "Augmentation investissements → DCA Or/Bourse mis à jour"

### 5.2 Notifications Cross-Modules

**Fichier**: `src/components/finance/planificateur/CrossModuleNotifications.jsx`

**Notifications**:
- Vers autres onglets : "Budget loisirs 400€ → 500€, achats redevenus possibles"
- Suggestions intelligentes : "Surplus 100€ → +100€ loisirs ou +100€ Or ?"
- Cohérence globale : Vérification équilibre total temps réel

### 5.3 Analytics Intégrées

**Fichier**: `src/components/finance/planificateur/PlanificateurAnalytics.jsx`

**Analyses**:
- Évolution répartition : Historique modifications 12 mois
- Performance objectifs : % achats loisirs réalisés vs planifiés
- Optimisations planning : "Décaler achat X → budget équilibré"

## 🎨 PHASE 6 : INTERFACE RÉVOLUTIONNAIRE (4h)

### 6.1 Contrôle Total Répartition

**Fichier**: `src/components/finance/planificateur/RepartitionInterface.jsx`

**Fonctionnalités**:
- Sliders interactifs (modification répartition direct)
- Calculs live (impact changement visible immédiatement)
- Équilibre intelligent (alertes si sur/sous allocation)
- Graphique répartition (pie chart visuel)

### 6.2 Planification Loisirs Avancée

**Fichier**: `src/components/finance/planificateur/LoisirsInterface.jsx`

**Fonctionnalités**:
- Achats détaillés (Photo + lien + prix + faisabilité)
- Épargne multi-mois (Cumul budget pour gros achats)
- Vision 3 ans (Planification long terme avec objectifs)
- Timeline interactive (navigation fluide)

### 6.3 Synchronisation Parfaite

**Fichier**: `src/components/finance/planificateur/SyncInterface.jsx`

**Fonctionnalités**:
- Temps réel (Modifications propagées instantanément)
- Cross-modules (Impact visible partout)
- Cohérence globale (Équilibre maintenu automatiquement)
- Indicateur sync (Badge statut synchronisation)

## 📦 STRUCTURE FICHIERS FINALE

```
src/
├── components/
│   └── finance/
│       └── planificateur/
│           ├── PlanificateurTab.jsx
│           ├── RepartitionSalaire.jsx
│           ├── RepartitionControl.jsx
│           ├── LoisirsBudget.jsx
│           ├── AchatLoisirForm.jsx
│           ├── FaisabiliteCalculator.jsx
│           ├── AchatsLoisirsList.jsx
│           ├── Timeline3Ans.jsx
│           ├── ChargesFixes.jsx
│           ├── EpargneLoisirs.jsx
│           ├── StatutsVisuels.jsx
│           ├── PlanificationEnrichie.jsx
│           ├── CrossModuleNotifications.jsx
│           ├── PlanificateurAnalytics.jsx
│           ├── RepartitionInterface.jsx
│           ├── LoisirsInterface.jsx
│           └── SyncInterface.jsx
├── services/
│   ├── planificateurStorage.js
│   └── planificateurSync.js
└── hooks/
    └── usePlanificateur.js
```

## 🏗️ ARCHITECTURE TECHNIQUE DÉTAILLÉE

### Backend Architecture (Services)

#### Service Planificateur Sync - Synchronisation Cross-Modules

**Fichier**: `src/services/planificateurSync.js`

**Implémentation Complète avec Event Bus**:
```javascript
class PlanificateurSyncService {
  constructor() {
    this.eventBus = new EventTarget();
    this.subscribers = new Map();
  }

  // Propager changement répartition
  async propagateRepartitionChange(newRepartition) {
    // 1. Mettre à jour Investissements
    await this.updateInvestissements(newRepartition);
    
    // 2. Mettre à jour Budget Personnel
    await this.updateBudgetPersonnel(newRepartition);
    
    // 3. Mettre à jour Smart Shopping
    await this.updateSmartShopping(newRepartition);
    
    // 4. Émettre événement
    this.eventBus.dispatchEvent(new CustomEvent('repartitionChanged', {
      detail: newRepartition
    }));
  }

  async updateInvestissements(repartition) {
    // Mettre à jour DCA Or
    if (repartition.investissementOr) {
      await investissementsStorage.updateOrDCA(repartition.investissementOr);
    }
    
    // Mettre à jour DCA Bourse
    if (repartition.investissementBourse) {
      await investissementsStorage.updateBourseDCA(repartition.investissementBourse);
    }
    
    // Mettre à jour Cash accumulation
    if (repartition.cashAccumulation) {
      await investissementsStorage.updateCashAccumulation(repartition.cashAccumulation);
    }
  }

  async updateBudgetPersonnel(repartition) {
    if (repartition.loisirs) {
      await budgetStorage.updateLoisirsBudget(repartition.loisirs);
    }
  }

  // S'abonner aux changements
  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    this.eventBus.addEventListener('repartitionChanged', handler);
    
    return () => {
      this.eventBus.removeEventListener('repartitionChanged', handler);
    };
  }
}

export const planificateurSync = new PlanificateurSyncService();
```

### Frontend Architecture (Components)

#### Composant Répartition Salaire - Sliders Interactifs

**Fichier**: `src/components/finance/planificateur/RepartitionSalaire.jsx`

**Implémentation avec Contrôles Avancés**:
```javascript
import React, { useState, useMemo, useCallback } from 'react';
import { Slider } from '../ui/Slider';

const RepartitionSalaire = ({ salaire, repartition, onUpdate }) => {
  const [localRepartition, setLocalRepartition] = useState(repartition);

  // Calcul total alloué
  const totalAlloue = useMemo(() => {
    return Object.values(localRepartition).reduce((sum, val) => sum + val, 0);
  }, [localRepartition]);

  // Écart vs salaire
  const ecart = useMemo(() => {
    return salaire - totalAlloue;
  }, [salaire, totalAlloue]);

  // Mise à jour avec validation
  const handleSliderChange = useCallback((key, value) => {
    const newRepartition = {
      ...localRepartition,
      [key]: value
    };
    
    const newTotal = Object.values(newRepartition).reduce((sum, val) => sum + val, 0);
    
    // Validation : ne pas dépasser salaire
    if (newTotal <= salaire) {
      setLocalRepartition(newRepartition);
      onUpdate(newRepartition);
    }
  }, [localRepartition, salaire, onUpdate]);

  return (
    <div className="repartition-salaire">
      <div className="salaire-display">
        <h2>Salaire Net : {formatCurrency(salaire)}</h2>
        <div className={`ecart-indicator ${ecart >= 0 ? 'positive' : 'negative'}`}>
          {ecart >= 0 
            ? `✅ ${formatCurrency(ecart)} disponible`
            : `⚠️ Dépassement de ${formatCurrency(Math.abs(ecart))}`
          }
        </div>
      </div>

      <div className="sliders-container">
        {Object.entries(localRepartition).map(([key, value]) => (
          <div key={key} className="slider-group">
            <label>{getLabel(key)}</label>
            <Slider
              value={value}
              min={0}
              max={salaire}
              step={10}
              onChange={(val) => handleSliderChange(key, val)}
            />
            <div className="slider-value">
              {formatCurrency(value)} ({((value / salaire) * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Graphique répartition */}
      <RepartitionChart repartition={localRepartition} />
    </div>
  );
};
```

## 🔒 SÉCURITÉ & VALIDATION

### Validation Données Planificateur

**Fichier**: `src/utils/planificateurValidation.js`

```javascript
import { z } from 'zod';

export const repartitionSchema = z.object({
  loyer: z.number().nonnegative().max(10000),
  investissementOr: z.number().nonnegative().max(10000),
  investissementBourse: z.number().nonnegative().max(10000),
  cashAccumulation: z.number().nonnegative().max(10000),
  loisirs: z.number().nonnegative().max(10000),
  surplus: z.number()
}).refine((data) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  return total >= 0; // Peut être inférieur au salaire (sous-allocation OK)
}, {
  message: "Total répartition invalide"
});
```

## ⏱️ ESTIMATION TOTALE RÉVISÉE

**40 heures** de développement pour module complet niveau production avec toutes optimisations.

**Détail**:
- Phase 1-2 : Structure + Répartition Salaire (11h) - FONDATION
- Phase 3 : Planification Loisirs (10h) - CORE
- Phase 4 : Planification 3 Ans (10h) - ESSENTIEL
- Phase 5-6 : Synchronisation + Interface (7h) - AVANCÉ
- Tests & Optimisations : (2h) - QUALITÉ

## 🚀 PRIORITÉS

1. **Phase 1-2** : Structure + Répartition Salaire (11h) - FONDATION
2. **Phase 3** : Planification Loisirs (10h) - CORE
3. **Phase 4** : Planification 3 Ans (10h) - ESSENTIEL
4. **Phase 5-6** : Synchronisation + Interface (7h) - AVANCÉ
5. **Tests & Qualité** : Tests + Monitoring (2h) - PRODUCTION

