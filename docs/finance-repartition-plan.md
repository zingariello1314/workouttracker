## Refactor complet – Répartition Salaire & Catégories dynamiques

### 1. Objectif global

- **But**: passer d’un modèle figé (5 catégories codées en dur + Surplus) à un modèle **100 % dynamique** de répartition du salaire, où:
  - toutes les lignes (y compris Loyer / Or / Bourse / Cash / Loisirs) sont techniquement des **catégories**,
  - chaque catégorie a un **type** (Investissement, Loisirs, Épargne / Sécurité, Charges fixes, Autre, Surplus),
  - les autres sous‑onglets Finance (Charges fixes, Analytics, Sync, Achats loisirs, etc.) ne dépendent plus de clés magiques (`loyer`, `investissementOr`, …) mais de ces **types métier**.
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

> **Remarque**: Surplus devient **une catégorie** avec `type: 'surplus'` et `fixed: true`. On continue à le calculer côté logique, pas éditable par l’utilisateur.

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
  montant: legacy.investissementOr ?? 0,
  fixed: true,
  order: 2,
});

// Bourse
// Cash
// Loisirs
// Surplus (type 'surplus')
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
```

  - `calculateFaisabilite` utilise `getTotalByType('loisirs')` pour le budget loisirs global.
  - `updateRepartition` ne reçoit plus un objet plat mais directement un `RepartitionV2` (catégories à jour).

#### 3.2. `planificateurSync`

- Mettre à jour:
  - `propagateRepartitionChange` pour transmettre les **totaux par type** (`investissement`, `loisirs`, `epargne`, `charges`) plutôt que des champs individuels.
  - `getNotifications` pour détecter les changements de montants **par type** (ex: augmentation globale de l’enveloppe “Investissement”, quelle que soit la catégorie fine).

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

- **Actuel**: lit directement `repartition.loyer`, `investissementOr`, etc.
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

5. **Autres sous‑onglets Finance**
   - `ChargesFixes`: passer en agrégations par `category.type`.
   - `PlanificateurAnalytics`: agrégations par `type` + nouvelles slices pie chart.
   - `SyncInterface`: totaux par type pour Investissements, Budget, Shopping.
   - `CrossModuleNotifications`: détection des changements par type.

6. **Tests / validation**
   - Cas legacy: utilisateur avec ancienne répartition (sans `categories`) → migration transparente.
   - Cas mixtes: répartition avec anciennes clés + anciennes `categories`.
   - Cas full‑V2: uniquement des catégories (y compris les équivalents de Loyer/Or/Bourse/Cash/Loisirs).
   - Vérifier:
     - cohérence des totaux,
     - Surplus toujours `salaire - totalAlloue`,
     - intégrité des autres onglets (aucun NaN, aucun plantage).

---

### 6. Bénéfices finaux

- Modèle **unifié** pour toutes les catégories de budget.
- Ajout / suppression / renommage / retagging d’une catégorie **sans toucher 10 fichiers**.
- Analytics, Charges fixes, Sync & co reposent sur des **types métier** stables, pas sur des clés magiques.
- Expérience utilisateur cohérente:
  - Surplus toujours correct,
  - catégories clairement typées,
  - possibilité d’adapter la structure de son budget à sa vie réelle (abos, projets, caisse noire, etc.) tout en gardant les mêmes graphiques et analyses.

