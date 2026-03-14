## Refactor complet – Répartition Salaire & Catégories dynamiques

### 0. Cartographie des onglets Finance et dépendances

Cette section recense **tous les onglets et sous-onglets** du module Finance et indique s’ils dépendent de la **répartition salaire** (stock `REPARTITION` / `usePlanificateur`). Seuls ceux marqués **Oui** doivent être adaptés au nouveau modèle `RepartitionV2`.

| Niveau | Onglet / Sous-onglet | Fichier principal | Dépend de la répartition salaire ? |
|--------|----------------------|-------------------|-------------------------------------|
| **Onglet Finance** | Bourse | `BourseSubTab.jsx` | **Non** |
| | Budget Personnel | `BudgetSubTab.jsx` | **Oui – consommateur** : catégories et plafonds doivent être alignés sur les catégories Planificateur (voir § « Source unique de vérité »). |
| | Investissements Divers | `InvestissementsSubTab.jsx` | **Oui – consommateur** : objectifs mensuels Or / Bourse / Cash viennent du Planificateur (catégories fines investissement_or, investissement_bourse, epargne_cash). L’allocation % (actions/crypto/cash) reste un concept à part. |
| | Smart Shopping | `SmartShoppingSubTab.jsx` | **Oui – consommateur** : budget « courses » = montant de la catégorie Planificateur dédiée (ex. sous-type `courses` ou catégorie « Courses »). |
| | **Planificateur** | `PlanificateurSubTab.jsx` | **Oui** – **source unique de vérité** pour toutes les enveloppes (répartition salaire). |
| | Synthèse | `SyntheseSubTab.jsx` | **Non** (patrimoine / `useSynthese` ; pas de lecture répartition) |
| **Planificateur >** | Répartition Salaire | `RepartitionSalaireSubTab.jsx` | **Oui** (écran principal répartition) |
| | | `RepartitionInterface.jsx` | **Oui** (graphique + sliders) |
| | Planification Loisirs | `PlanificationLoisirsSubTab.jsx` | **Oui** (budget loisirs) |
| | | `LoisirsBudget.jsx` / `LoisirsInterface.jsx` | **Oui** (via `usePlanificateur`) |
| | | `AchatsLoisirsList.jsx` / `AchatLoisirForm.jsx` | **Oui** (`calculateFaisabilite` = budget loisirs) |
| | Planification 3 ans | `Planification3AnsSubTab.jsx` | **Oui** (`repartition`, `budgetLoisirs`) |
| | | `Timeline3Ans.jsx` | **Oui** (reçoit `budgetLoisirs`) |
| | | `ChargesFixes.jsx` | **Oui** (loyer, or, bourse, cash, categories) |
| | | `EpargneLoisirs.jsx` | **Oui** (objectifs dérivés des achats loisirs) |
| | Synchronisation | `SynchronisationSubTab.jsx` | **Oui** (surveille `repartition`) |
| | | `SyncInterface.jsx` | **Oui** (DCA Or/Bourse, Cash, Budget loisirs) |
| | | `PlanificateurAnalytics.jsx` | **Oui** (pie chart + totaux) |
| | | `CrossModuleNotifications.jsx` | **Oui** (deltas loisirs, or, bourse, cash, surplus) |

**Hors composants UI :**

| Fichier | Rôle | Dépendance |
|---------|------|------------|
| `usePlanificateur.js` | Hook central planificateur | **Source** : expose `repartition`, `updateRepartition`, `calculateFaisabilite` (loisirs) |
| `planificateurStorage.js` | IndexedDB répartition | **Source** : `getRepartition`, `saveRepartition`, `getDefaultRepartition` |
| `planificateurSync.js` | Sync DCA / budget vers autres modules | **Oui** : `propagateRepartitionChange`, `getNotifications` (champs legacy) |
| `useSidebarData.js` | Données sidebar (cartes Finance) | **Oui** : `salaire`, `repartition` ; `monthlySavings` = `repartition?.epargne` (à dériver du type `epargne`) |
| `planificateurUtils.js` | `REPARTITION_ITEMS`, `REPARTITION_GROUPS`, `REPARTITION_TYPE_LABELS` | **Oui** : constantes par clé fixe → à faire évoluer vers types |

**À ne pas confondre :** en **Investissements Divers**, il y a deux notions : (1) la **répartition du salaire** (combien j’alloue par mois à l’Or, à la Bourse, au Cash) → c’est le Planificateur, source unique ; (2) l’**allocation d’actifs** (répartition en % entre actions / crypto / cash dans le sous-onglet Bourse & Crypto), stockée dans le module Investissements. Le présent plan unifie (1) et fait consommer (1) par Budget, Investissements (objectifs mensuels) et Smart Shopping.

---

### 0.1. Source unique de vérité et coordination des onglets

- **Principe** : le **Planificateur** (répartition salaire) est l’**unique source de vérité** pour « combien j’alloue par mois » à chaque poste. Les onglets **Budget Personnel**, **Investissements Divers** et **Smart Shopping** ne définissent pas leurs propres enveloppes indépendantes : ils **consomment** les catégories du Planificateur.
- **Coordination** :
  - **Budget Personnel** : les catégories de dépenses (et leurs plafonds) doivent être **alignées** sur les catégories du Planificateur. Une catégorie Planificateur « Courses » avec 200 € → le Budget doit avoir une catégorie « Courses » avec plafond 200 € (sync ou lien par id).
  - **Investissements Divers** : les objectifs mensuels **Or**, **Bourse**, **Cash** (liquidités) viennent des catégories Planificateur avec les sous-types correspondants (`or`, `bourse`, `cash`). Aujourd’hui `planificateurSync` propage déjà `investissementOr`, `investissementBourse`, `cashAccumulation` vers les stores Investissements ; après refactor, on dérive ces montants depuis les catégories (sous-type ou id fixe).
  - **Smart Shopping** : le **budget courses** (mensuel / restant) doit venir d’une catégorie Planificateur dédiée (ex. type loisirs + sous-type `courses`, ou catégorie dont le label est « Courses »). Plus de budget Smart Shopping découplé : lecture seule depuis le Planificateur (ou sync bidirectionnelle si on autorise des dépenses « consommées » dans Smart Shopping).
- **Catégories fines (sous-types)** : pour que chaque onglet sache **quelle** ligne de la répartition l’alimente, on introduit des **sous-types** (ou `slug`) par catégorie, par ex. :
  - Investissement : `or`, `bourse`, `cash` (et éventuellement autres perso).
  - Loisirs : `courses`, `sorties`, `hobby`, etc.
  - Charges : `loyer`, `abonnements`, `assurance`, etc.
  - Épargne : `precaution`, `projet`, etc.
  Ainsi, Investissements Divers sait que « objectif mensuel Or » = catégorie avec `type: 'investissement'` et `subType: 'or'` ; Smart Shopping que « budget courses » = catégorie avec `subType: 'courses'` (ou type loisirs + slug courses) ; Budget que les catégories affichées = toutes les catégories Planificateur (ou un sous-ensemble avec plafond = montant).

---

### 1. Objectif global

- **But**: passer d’un modèle figé (5 catégories codées en dur + Surplus) à un modèle **100 % dynamique** de répartition du salaire, où:
  - toutes les lignes (y compris Loyer / Or / Bourse / Cash / Loisirs) sont techniquement des **catégories**,
  - chaque catégorie a un **type** (Investissement, Loisirs, Épargne / Sécurité, Charges fixes, Autre, Surplus),
  - les autres sous‑onglets Finance (Charges fixes, Analytics, Sync, Achats loisirs, etc.) ne dépendent plus de clés magiques (`loyer`, `investissementOr`, …) mais de ces **types métier** ;
  - **Budget Personnel**, **Investissements Divers** (objectifs mensuels Or/Bourse/Cash) et **Smart Shopping** (budget courses) sont **coordonnés** au Planificateur : même liste de catégories / mêmes montants, via des **sous-types** (or, bourse, cash, courses, loyer, etc.) pour lier chaque ligne à l’onglet concerné.
- **Résultat attendu côté UX**:
  - un bloc Répartition où toutes les lignes sont uniformes: `emoji + nom + type + montant`,
  - possibilité de:
    - renommer une catégorie,
    - changer son emoji,
    - **changer son type** (sauf pour Surplus qui reste spécial),
    - créer / supprimer des catégories,
  - Surplus = `Salaire − somme(montants de toutes les catégories ≠ Surplus)`, mis à jour en direct.

---

### 2. Nouveau modèle de données

#### 2.1. Structure de base en mémoire

- **Actuel** (simplifié):

```ts
type Repartition = {
  id: string;                // 'current'
  loyer: number;
  investissementOr: number;
  investissementBourse: number;
  cashAccumulation: number;
  loisirs: number;
  surplus: number;
  categories?: CustomCategory[]; // déjà introduit
  updatedAt: string;
};
```

- **Cible**:

```ts
type RepartitionCategoryType =
  | 'investissement'
  | 'loisirs'
  | 'epargne'
  | 'charges'
  | 'surplus'
  | 'autre';

type RepartitionCategory = {
  id: string;                  // ex: 'cat_loyer', 'cat_or', 'cat_custom_xxx'
  key?: string;                // conservé pour rétro‑compat (optionnel)
  label: string;               // ex: 'Loyer', 'Or', 'Épargne de précaution'
  emoji: string;               // ex: '🏠', '🥇'
  type: RepartitionCategoryType;
  subType?: string;            // catégorie fine : or, bourse, cash, courses, loyer, etc. (voir § 0.1)
  montant: number;
  fixed?: boolean;             // pour les anciennes lignes “de base” (loyer, or, bourse…)
  order?: number;              // ordre d’affichage (optionnel)
};

type RepartitionV2 = {
  id: string;                  // 'current'
  salaireNetMensuel: number;   // optionnel, peut rester dans store SALAIRE
  categories: RepartitionCategory[];
  updatedAt: string;
};
```

#### 2.1.1. Mapping sous-types → onglets consommateurs

| `subType` (ex.) | Type | Consommateur | Usage |
|-----------------|------|--------------|--------|
| `loyer` | charges | Budget, Planificateur 3 ans | Plafond dépenses / charges fixes |
| `or` | investissement | Investissements Divers (Or) | Objectif mensuel DCA Or |
| `bourse` | investissement | Investissements Divers (Bourse/Crypto) | Objectif mensuel DCA Bourse |
| `cash` | epargne | Investissements Divers (Liquidités) | Objectif mensuel liquidités |
| `courses` | loisirs | Smart Shopping, Budget | Budget courses mensuel ; plafond catégorie dépenses |
| `sorties`, `hobby` | loisirs | Budget | Plafonds catégories dépenses |
| `precaution`, `projet` | epargne | Budget, Sidebar | Épargne / monthlySavings |

Les catégories sans `subType` (ou `autre`) restent utilisées pour l’affichage Planificateur et, si besoin, pour le Budget comme catégories génériques (plafond = montant).

> **Remarque**: Surplus devient **une catégorie** avec `type: 'surplus'` et `fixed: true`. Dans `planificateurUtils.js`, ajouter `surplus: 'Surplus'` à `REPARTITION_TYPE_LABELS` pour l'affichage. On continue à le calculer côté logique, pas éditable par l’utilisateur.

#### 2.2. Migration depuis l’ancien modèle

- **Source**: en base IndexedDB, store `REPARTITION` contient aujourd’hui:
  - les champs numériquement nommés (`loyer`, `investissementOr`, …),
  - éventuellement `categories` (déjà utilisé pour les catégories perso).
- **Migration à appliquer dans `planificateurStorage.getRepartition`**:
  - Si l’objet lu **ne contient pas** `categories` **ou** ne respecte pas `RepartitionCategory`:
    - Construire `categories` à partir des anciens champs:

```ts
const legacy = data as LegacyRepartition;
const categories: RepartitionCategory[] = [];

// Loyer
categories.push({
  id: 'cat_loyer',
  key: 'loyer',
  label: 'Loyer',
  emoji: '🏠',
  type: 'charges',
  subType: 'loyer',
  montant: legacy.loyer ?? 0,
  fixed: true,
  order: 1,
});

// Or
categories.push({
  id: 'cat_investissementOr',
  key: 'investissementOr',
  label: 'Or',
  emoji: '🥇',
  type: 'investissement',
  subType: 'or',
  montant: legacy.investissementOr ?? 0,
  fixed: true,
  order: 2,
});

// Bourse, Cash, Loisirs (avec subType pour coordination Budget / Investissements / Smart Shopping)
categories.push({ id: 'cat_bourse', key: 'investissementBourse', label: 'Bourse', emoji: '📈', type: 'investissement', subType: 'bourse', montant: legacy.investissementBourse ?? 0, fixed: true, order: 3 });
categories.push({ id: 'cat_cash', key: 'cashAccumulation', label: 'Cash', emoji: '💰', type: 'epargne', subType: 'cash', montant: legacy.cashAccumulation ?? 0, fixed: true, order: 4 });
categories.push({ id: 'cat_loisirs', key: 'loisirs', label: 'Loisirs', emoji: '🎮', type: 'loisirs', montant: legacy.loisirs ?? 0, fixed: true, order: 5 });
// Surplus : catégorie calculée, type 'surplus', fixed true
```

  - Fusionner les anciennes `categories` (si présentes) en leur donnant un `type` par défaut (`'autre'` ou `'loisirs'` selon besoin).
  - Retourner un objet `RepartitionV2` **seul** vers le reste du code (plus de champ racine `loyer`, etc. côté hook).
  - `saveRepartition` valide uniquement `RepartitionV2`.

---

### 3. Adaptation des hooks & services

#### 3.1. `usePlanificateur`

- **Actuel**:
  - expose `repartition` avec structure legacy,
  - calcule la faisabilité (`calculateFaisabilite`) en supposant `repartition.loisirs`.
- **Cible**:
  - `repartition` est de type `RepartitionV2`,
  - ajouter des **helpers**:

```ts
const getCategoriesByType = (type: RepartitionCategoryType) =>
  repartition?.categories.filter(c => c.type === type) ?? [];

const getTotalByType = (type: RepartitionCategoryType) =>
  getCategoriesByType(type).reduce((s, c) => s + c.montant, 0);

const getCategoryBySubType = (subType: string) =>
  repartition?.categories.find(c => c.subType === subType) ?? null;

const getMontantBySubType = (subType: string) =>
  getCategoryBySubType(subType)?.montant ?? 0;
```

  - `calculateFaisabilite` utilise `getTotalByType('loisirs')` pour le budget loisirs global.
  - `updateRepartition` ne reçoit plus un objet plat mais directement un `RepartitionV2` (catégories à jour).
  - **Coordination onglets** : `getCategoryBySubType` / `getMontantBySubType` permettent à Budget, Investissements et Smart Shopping de récupérer le montant alloué à une catégorie fine (`or`, `bourse`, `cash`, `courses`, etc.).

#### 3.2. `planificateurSync`

- Mettre à jour:
  - `propagateRepartitionChange(RepartitionV2)` : Investissements → Or/Bourse/Cash via `getMontantBySubType('or'|'bourse'|'cash')` ; Budget → sync catégories (plafond = montant) ; Smart Shopping → budget courses = `getMontantBySubType('courses')`.
  - `getNotifications` pour détecter les changements par type et par sous-type (ex. Budget Or modifié, Budget courses modifié).

---

### 4. Adaptation des composants UI

#### 4.1. `RepartitionSalaireSubTab.jsx`

- **Responsabilité**: écran principal de configuration.
- **Changements**:
  1. **Source de vérité** = `repartition.categories` (tableau), plus de champs à plat.
  2. Pour l’UI:
     - Séparer en deux vues logiques:
       - `categoriesAffichees = categories.filter(c => c.type !== 'surplus')`
       - `surplusCategory = categories.find(c => c.type === 'surplus')`
     - Calcul:

```ts
const totalAlloue = categoriesAffichees.reduce((s, c) => s + c.montant, 0);
const surplus = salaire - totalAlloue;
```

     - Mettre à jour `surplusCategory.montant = surplus` à chaque changement.
  3. **Création de catégorie**:
     - formulaire existant (Nom, Emoji, Type, Montant) → ajoute un `RepartitionCategory` dans `categories`.
  4. **Édition d’une catégorie fixe** (Loyer, Or, Bourse, etc.):
     - slider + input numérique modifient `category.montant` (aucune différence entre fixe / custom dans la logique, `fixed` ne sert qu’à l’UI / protection éventuelle).
  5. **Suppression / désactivation**:
     - option: autoriser la suppression **seulement** des catégories non `fixed`.
     - pour les fixes, on se contente de pouvoir les mettre à 0.

#### 4.2. `RepartitionInterface.jsx`

- Déjà partiellement adapté (gestion Surplus & catégories perso), à finaliser avec le nouveau modèle:
  - Itérer uniquement sur `repartition.categories`:

```jsx
const displayCategories = useMemo(
  () => repartition.categories.filter(c => c.type !== 'surplus'),
  [repartition]
);
const surplusCategory = repartition.categories.find(c => c.type === 'surplus');
```

  - Un composant `CategoryRow` reçoit directement `RepartitionCategory` + `onChangeMontant`.
  - Pour l’affichage du “groupe”:
    - utiliser `REPARTITION_TYPE_LABELS[category.type]`.
  - Ajouter une mini‑annotation pour les catégories `fixed` (par ex. badge “système” discret).

#### 4.3. `ChargesFixes.jsx`

- **Actuel**: lit directement `repartition.loyer`, `investissementOr`, etc., et `repartition.netMensuel` pour les pourcentages.
- **Cible**:
  - Utiliser les helpers:

```ts
const categoriesCharges = categories.filter(c => c.type === 'charges');
const categoriesInvestissement = categories.filter(c => c.type === 'investissement');
const categoriesEpargne = categories.filter(c => c.type === 'epargne');
```

  - Construire les cartes :
    - `Loyer` = première catégorie `charges` marquée `fixed` (sinon “Charges Fixes – Autres”).
    - Pour les autres, reprendre `category.label` / `category.emoji`.
  - **Pourcentage du salaire** : utiliser le salaire fourni par le parent (Planification3Ans) ou `usePlanificateur().salaire.netMensuel`, pas `repartition.netMensuel` (en V2 le salaire est dans le store Salaire, pas dans Répartition).

#### 4.4. `PlanificateurAnalytics.jsx`

- Adapter:
  - l’évolution de la répartition :
    - `loisirs` = `sum(c.montant, type='loisirs')`,
    - `investissements` = `sum(c.montant, type='investissement')`,
    - `epargne` = `sum(c.montant, type='epargne')`.
  - le `repartitionData` (pie chart) :
    - ajouter une slice par catégorie:

```ts
const repartitionData = categories
  .filter(c => c.type !== 'surplus' && c.montant > 0)
  .map(c => ({
    name: c.label,
    value: c.montant,
    color: couleurParType[c.type]
  }))
  .concat(surplusCategory?.montant > 0 ? [{
    name: 'Surplus',
    value: surplusCategory.montant,
    color: '#64748b'
  }] : []);
```

#### 4.5. `SyncInterface.jsx`

- Remplacer l’utilisation directe des champs par des agrégats:
  - Investissements:

```ts
const totalInvestissement = categories
  .filter(c => c.type === 'investissement')
  .reduce((s, c) => s + c.montant, 0);
```

  - Loisirs / Budget courses:

```ts
const totalLoisirs = categories
  .filter(c => c.type === 'loisirs')
  .reduce((s, c) => s + c.montant, 0);
```

#### 4.6. `CrossModuleNotifications.jsx`

- Comparer les **totaux par type** entre `previousRepartition` et `repartition`:

```ts
const totalLoisirsAvant = sum(prev.categories, type='loisirs');
const totalLoisirsApres = sum(curr.categories, type='loisirs');
const diff = totalLoisirsApres - totalLoisirsAvant;
```

  - Générer les notifications à partir de ces deltas, plus robustes qu’en comparant champ par champ.

#### 4.7. `useSidebarData.js` (Sidebar – cartes Finance)

- **Actuel** : `monthlySavings = repartition?.epargne || 0` (clé qui n’existe pas en legacy → souvent 0).
- **Cible** : dériver l’épargne du total des catégories de type `epargne` :

```ts
const monthlySavings = repartition?.categories
  ? repartition.categories
      .filter(c => c.type === 'epargne')
      .reduce((s, c) => s + (c.montant || 0), 0)
  : 0;
```

- Si on garde temporairement un champ legacy `repartition.epargne` en migration, on peut faire `repartition.epargne ?? getTotalByType('epargne')` côté hook qui fournit les données à la sidebar (ou exposer un `getTotalByType` depuis `usePlanificateur` et l’utiliser ici).

#### 4.8. `planificateurUtils.js`

- **REPARTITION_ITEMS** : aujourd’hui une liste de clés fixes (`loyer`, `investissementOr`, …). Après refactor, la source de vérité est `repartition.categories`. Deux options :
  - **Option A** : garder `REPARTITION_ITEMS` uniquement pour la **migration** et pour le rendu des catégories fixes (avec un `key` ou `id` qui matche une catégorie). Chaque ligne affichée vient de `categories` ; les métadonnées (couleur, icône) peuvent être dérivées de `REPARTITION_TYPE_LABELS` + une map `type → couleur/icône`.
  - **Option B** : supprimer `REPARTITION_ITEMS` et ne s’appuyer que sur `repartition.categories` + une config par type (ex. `REPARTITION_TYPE_CONFIG[type]` avec `label`, `color`, `icon`). Les catégories fixes ont déjà `label`, `emoji` dans la donnée.
- **REPARTITION_GROUPS** : peut être remplacé par le **type** (`charges`, `investissement`, `epargne`, `loisirs`, `autre`, `surplus`).
- **REPARTITION_TYPE_LABELS** : déjà aligné sur les types ; ajouter `surplus: 'Surplus'` si absent. Ajouter une map **subType → onglet** (ou `REPARTITION_SUBTYPE_CONFIG`) pour les catégories fines (or, bourse, cash, courses, etc.).

#### 4.9. Budget Personnel – alignement avec les catégories Planificateur

- **Objectif** : les catégories de dépenses du Budget (store `budget_categories`) et leurs plafonds doivent être **coordonnés** avec les catégories du Planificateur. Pas deux listes indépendantes.
- **Options d’implémentation** :
  - **Option A – Sync unidirectionnelle** : au chargement (ou via `planificateurSync`), créer/mettre à jour les catégories Budget à partir de `repartition.categories` : une entrée Budget par catégorie Planificateur (hors surplus), avec `planificateurCategoryId`, `label`, `plafondMensuel = category.montant`. Les dépenses restent dans le store Budget ; le plafond est lu depuis le Planificateur.
  - **Option B – Source unique** : le Budget n’a plus de store `categories` propre ; il affiche les catégories Planificateur (filtrées par type, ex. charges + loisirs + epargne) et le plafond = `category.montant`. Les dépenses sont rattachées à un `planificateurCategoryId`.
- **Fichiers concernés** : `budgetStorage.js` (structure catégorie avec `planificateurCategoryId` et/ou sync), `useBudget.js` (exposer catégories depuis Planificateur ou sync), `planificateurSync.updateBudgetPersonnel` (implémenter la sync réelle : créer/mettre à jour les catégories Budget à partir de `repartition.categories`).
- **Création de catégorie** : si l’utilisateur crée une catégorie dans le Planificateur (ex. « Courses » avec `subType: 'courses'`), elle doit apparaître dans le Budget avec le même plafond. Inversement, une catégorie créée dans le Budget peut être considérée comme une catégorie Planificateur (type `autre` ou selon choix) pour garder une seule source de vérité à long terme.

#### 4.10. Investissements Divers – objectifs mensuels depuis le Planificateur

- **Objectif** : les montants « objectif mensuel » Or, Bourse (DCA), Liquidités (cash) sont **lus depuis** les catégories Planificateur avec `subType: 'or'`, `'bourse'`, `'cash'`, au lieu de champs legacy.
- **Actuel** : `planificateurSync.updateInvestissements(repartition)` écrit `repartition.investissementOr`, `investissementBourse`, `cashAccumulation` dans les stores Investissements. Après refactor : lire `getMontantBySubType('or')`, `getMontantBySubType('bourse')`, `getMontantBySubType('cash')` depuis la répartition V2 et propager ces valeurs.
- **Affichage** : les sous-onglets Or, Liquidités, Bourse & Crypto peuvent continuer à lire `or.objectifMensuel`, `liquidites.objectifMensuel`, `bourseCrypto.dca.montants` ; ces valeurs sont alimentées par `planificateurSync` à partir des catégories Planificateur. Aucune saisie locale d’objectif mensuel qui contredirait le Planificateur.
- **Fichiers** : `planificateurSync.js` (déjà prévu), `investissementsStorage.js` (inchangé côté structure, alimenté par sync), composants Investissements (OrPhysiqueSubTab, LiquiditesSubTab, BourseCryptoSubTab) : s’ils affichent un « objectif » éditable, le faire pointer vers le Planificateur (lien « Modifier dans Planificateur » ou lecture seule depuis Planificateur).

#### 4.11. Smart Shopping – budget courses depuis le Planificateur

- **Objectif** : le budget « courses » (mensuel, restant) affiché dans Smart Shopping = montant de la catégorie Planificateur avec `subType: 'courses'` (ou type loisirs + label « Courses »).
- **Actuel** : Smart Shopping a un store propre (`budget`: { mensuel, depenseCeMois, restant }). On passe à une **lecture** du budget courses depuis le Planificateur : `getMontantBySubType('courses')` ou équivalent.
- **Implémentation** :
  - Au chargement de Smart Shopping : récupérer la répartition (via `usePlanificateur` ou un service), calculer `budgetCoursesMensuel = getMontantBySubType('courses')`. Afficher ce montant comme plafond mensuel.
  - Les dépenses « courses » du mois (depenseCeMois) peuvent rester dans le store Smart Shopping ou être agrégées depuis les dépenses Budget rattachées à la catégorie courses. Le **restant** = budgetCoursesMensuel − depenseCeMois.
  - Si l’utilisateur n’a pas de catégorie « Courses » dans le Planificateur : proposer d’en créer une (lien vers Planificateur) ou utiliser le total loisirs par défaut.
- **Fichiers** : `useSmartShopping.js` ou composant Smart Shopping : consommer `usePlanificateur().getMontantBySubType('courses')` (ou `repartition` + helper) ; `planificateurSync` : lors d’un changement de répartition, mettre à jour le contexte Smart Shopping (ou recalcul côté client à chaque affichage).

---

### 5. Étapes de mise en œuvre (ordre conseillé)

1. **Backend / stockage**
   - Introduire `RepartitionCategory`, `RepartitionV2` dans `planificateurStorage.js`.
   - Implémenter `repartitionSchema` V2 + `customCategorySchema`.
   - Ajouter la **migration legacy → V2** dans `getRepartition`.
   - Adapter `saveRepartition` pour n’accepter que V2.

2. **Hook `usePlanificateur`**
   - Retourner `repartition` au nouveau format (uniquement `categories`).
   - Ajouter les helpers `getCategoriesByType`, `getTotalByType`.
   - Mettre à jour `updateRepartition` pour propager `RepartitionV2`.
   - Adapter `calculateFaisabilite` sur `getTotalByType('loisirs')`.

3. **Répartition Salaire**
   - Réécrire `RepartitionSalaireSubTab` pour qu’il travaille **uniquement** avec `categories`.
   - S’assurer que:
     - Surplus est recalculé à chaque changement,
     - la création d’une catégorie ajoute bien une entrée dans `categories` avec `type` choisi.

4. **Interface graphique `RepartitionInterface`**
   - Utiliser la nouvelle liste `categories`:
     - rendu d’une ligne par catégorie (fixe ou custom),
     - dernière ligne Surplus (lecture seule).
   - Afficher `REPARTITION_TYPE_LABELS[category.type]` sous le nom.

5. **Autres sous‑onglets Planificateur**
   - `ChargesFixes`, `PlanificateurAnalytics`, `SyncInterface`, `CrossModuleNotifications` : agrégations par type / sous-type.

6. **Coordination Budget / Investissements / Smart Shopping**
   - Implémenter `planificateurSync` : propagation Or, Bourse, Cash vers Investissements ; sync catégories Budget (plafond = montant) ; budget courses Smart Shopping = `getMontantBySubType('courses')`.
   - Budget : ajouter `planificateurCategoryId` aux catégories et/ou sync depuis `repartition.categories`.
   - Investissements : objectifs mensuels en lecture depuis Planificateur (alimentés par sync).
   - Smart Shopping : consommer `getMontantBySubType('courses')` pour le budget courses.

7. **Tests / validation**
   - Cas legacy : utilisateur avec ancienne répartition (sans `categories`) → migration transparente.
   - Cas mixtes : répartition avec anciennes clés + anciennes `categories`.
   - Cas full‑V2 : uniquement des catégories (y compris les équivalents de Loyer/Or/Bourse/Cash/Loisirs), avec `subType` pour or, bourse, cash, courses.
   - Vérifier : cohérence des totaux, Surplus = salaire − totalAlloue, intégrité de tous les onglets (Planificateur, Budget, Investissements, Smart Shopping), pas de NaN ni plantage.
   - Vérifier la coordination : modifier une catégorie « Courses » dans le Planificateur → Smart Shopping affiche le nouveau budget ; modifier Or/Bourse/Cash → Investissements affiche les nouveaux objectifs.

#### 5.7. Liste exhaustive des fichiers à modifier

| Fichier | Modification principale |
|---------|-------------------------|
| `src/services/finance/planificateurStorage.js` | Schéma V2, migration dans `getRepartition`, `saveRepartition` et `getDefaultRepartition` ne retournent que V2. |
| `src/hooks/usePlanificateur.js` | `repartition` en `RepartitionV2` ; ajout `getCategoriesByType`, `getTotalByType` ; `calculateFaisabilite` basé sur `getTotalByType('loisirs')`. |
| `src/services/finance/planificateurSync.js` | `propagateRepartitionChange` et `getNotifications` basés sur totaux par type (investissement, loisirs, epargne, charges). |
| `src/components/finance/planificateur/RepartitionSalaireSubTab.jsx` | Source de vérité = `repartition.categories` ; formulaire ajout/édition avec `type` ; plus de clés fixes en état local. |
| `src/components/finance/planificateur/RepartitionInterface.jsx` | Itérer sur `repartition.categories` ; surplus = catégorie calculée ; utiliser `REPARTITION_TYPE_LABELS` / config par type. |
| `src/components/finance/planificateur/ChargesFixes.jsx` | Construire les charges à partir de `categories.filter(c => c.type === 'charges')` + investissement/épargne si affichés ; plus de `repartition.loyer` etc. |
| `src/components/finance/planificateur/PlanificateurAnalytics.jsx` | Pie chart et totaux à partir de `categories` et totaux par type ; surplus = slice dérivée. |
| `src/components/finance/planificateur/SyncInterface.jsx` | Totaux investissement / loisirs via `getTotalByType` ou somme sur `categories` par type. |
| `src/components/finance/planificateur/SynchronisationSubTab.jsx` | Détection des changements par totaux par type (loisirs, investissement Or/Bourse, etc.) au lieu de champs directs. |
| `src/components/finance/planificateur/CrossModuleNotifications.jsx` | Comparer totaux par type entre ancienne et nouvelle répartition ; messages génériques par type. |
| `src/components/finance/planificateur/Planification3AnsSubTab.jsx` | `budgetLoisirs` = `getTotalByType('loisirs')` (ou somme catégories type loisirs). |
| `src/hooks/useSidebarData.js` | `monthlySavings` = total des catégories `type === 'epargne'` (ou helper exposé par `usePlanificateur`). |
| `src/utils/planificateurUtils.js` | Faire évoluer ou remplacer `REPARTITION_ITEMS` / `REPARTITION_GROUPS` ; ajouter `surplus` à `REPARTITION_TYPE_LABELS` ; optionnel : `REPARTITION_TYPE_CONFIG` ou map subType → onglet. |
| `src/services/finance/budgetStorage.js` | Catégories avec `planificateurCategoryId` et/ou sync depuis `repartition.categories` ; plafond = montant Planificateur. |
| `src/hooks/useBudget.js` | Exposer catégories alignées Planificateur (via sync ou lecture `usePlanificateur().repartition.categories`). |
| `src/services/finance/planificateurSync.js` | `updateBudgetPersonnel` : sync réelle des catégories Budget ; `updateInvestissements` : utiliser `getMontantBySubType('or'|'bourse'|'cash')` ; ajouter mise à jour budget courses Smart Shopping. |
| Composants Smart Shopping (budget) | Consommer `usePlanificateur().getMontantBySubType('courses')` pour le budget courses mensuel / restant. |
| Composants Investissements (Or, Liquidités, Bourse/Crypto) | Objectifs mensuels en lecture seule depuis données propagées par `planificateurSync` ; lien « Modifier dans Planificateur » si édition souhaitée. |

Aucune modification nécessaire pour : **Bourse** (sous-onglet cours/portefeuille), **Synthèse**. En **Investissements**, l’allocation % (actions/crypto/cash) reste gérée localement ; seuls les **objectifs mensuels** (Or, Bourse, Cash) viennent du Planificateur.

---

### 6. Bénéfices finaux

- **Source unique de vérité** : une seule répartition (Planificateur) alimente Budget, Investissements (objectifs mensuels) et Smart Shopping (budget courses). Plus d’incohérence entre « ce que j’alloue » et « ce que l’onglet affiche ». **Catégories fines** (subType : or, bourse, cash, courses, etc.) : chaque onglet consomme la bonne ligne.
- Modèle **unifié** pour toutes les catégories de budget.
- Ajout / suppression / renommage / retagging d’une catégorie **sans toucher 10 fichiers**.
- Analytics, Charges fixes, Sync & co reposent sur des **types métier** stables, pas sur des clés magiques.
- Expérience utilisateur cohérente:
  - Surplus toujours correct,
  - catégories clairement typées,
  - possibilité d’adapter la structure de son budget à sa vie réelle (abos, projets, caisse noire, etc.) tout en gardant les mêmes graphiques et analyses.

