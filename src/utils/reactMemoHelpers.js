/**
 * reactMemoHelpers.js
 * 
 * ✅ OPTIMISATION : Helpers pour comparaisons React.memo optimisées
 * 
 * Fournit des fonctions utilitaires pour créer des fonctions de comparaison
 * robustes et performantes pour React.memo, évitant les re-renders inutiles.
 * 
 * Impact attendu : Économie 20-40% supplémentaires sur re-renders
 * 
 * @module utils/reactMemoHelpers
 * @see ../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 1.1
 */

/**
 * Compare deux valeurs primitives ou références
 * 
 * @param {*} a - Première valeur
 * @param {*} b - Seconde valeur
 * @returns {boolean} True si égales
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  return false;
}

/**
 * Compare deux objets de manière shallow (premier niveau seulement)
 * 
 * @param {Object} a - Premier objet
 * @param {Object} b - Second objet
 * @param {Array<string>} keys - Clés à comparer (optionnel, compare toutes si non fourni)
 * @returns {boolean} True si objets égaux
 */
function shallowEqualObjects(a, b, keys = null) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysToCompare = keys || Object.keys(a);
  
  for (const key of keysToCompare) {
    if (!(key in b)) return false;
    if (a[key] !== b[key]) return false;
  }

  return true;
}

/**
 * Compare deux arrays de manière shallow (références et longueur)
 * 
 * @param {Array} a - Premier array
 * @param {Array} b - Second array
 * @param {Function} itemComparator - Fonction de comparaison pour chaque item (optionnel)
 * @returns {boolean} True si arrays égaux
 */
function shallowEqualArrays(a, b, itemComparator = null) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  if (itemComparator) {
    return a.every((item, index) => itemComparator(item, b[index]));
  }

  // Comparaison par référence (shallow)
  return a.every((item, index) => item === b[index]);
}

/**
 * Compare deux objets imbriqués de manière optimisée
 * 
 * Compare seulement les propriétés spécifiées, en profondeur limitée
 * pour éviter les comparaisons coûteuses.
 * 
 * @param {Object} a - Premier objet
 * @param {Object} b - Second objet
 * @param {Object} config - Configuration de comparaison
 * @param {Array<string>} config.paths - Chemins de propriétés à comparer (ex: ['dailyTotals.calories'])
 * @param {number} config.maxDepth - Profondeur maximale (défaut: 2)
 * @returns {boolean} True si objets égaux selon les chemins spécifiés
 */
function deepEqualPaths(a, b, config = {}) {
  const { paths = [], maxDepth = 2 } = config;

  if (a === b) return true;
  if (a == null || b == null) return a === b;

  // Si pas de chemins spécifiés, comparaison shallow
  if (paths.length === 0) {
    return shallowEqualObjects(a, b);
  }

  // Comparer chaque chemin spécifié
  for (const path of paths) {
    const keys = path.split('.');
    let valueA = a;
    let valueB = b;
    let depth = 0;

    for (const key of keys) {
      if (depth >= maxDepth) break;
      
      valueA = valueA?.[key];
      valueB = valueB?.[key];
      depth++;

      if (valueA === undefined && valueB === undefined) continue;
      if (valueA === null && valueB === null) continue;
      if (valueA !== valueB) return false;
    }
  }

  return true;
}

/**
 * Crée une fonction de comparaison pour React.memo optimisée pour props nutrition
 * 
 * ✅ OPTIMISATION : Comparaison intelligente qui ignore les callbacks qui changent souvent
 * 
 * @param {Object} config - Configuration
 * @param {Array<string>} config.primitiveProps - Props primitives à comparer (ex: ['dateStr', 'isOpen'])
 * @param {Array<string>} config.objectProps - Props objets à comparer shallow (ex: ['dailyMeal', 'activeProgram'])
 * @param {Array<string>} config.arrayProps - Props arrays à comparer (ex: ['meals'])
 * @param {Object} config.deepPaths - Chemins profonds à comparer (ex: { dailyMeal: ['dailyTotals.calories'] })
 * @param {Array<string>} config.ignoreProps - Props à ignorer (ex: ['onClose', 'onSave'] pour callbacks)
 * @returns {Function} Fonction de comparaison pour React.memo
 */
export function createNutritionMemoComparator(config = {}) {
  const {
    primitiveProps = [],
    objectProps = [],
    arrayProps = [],
    deepPaths = {},
    ignoreProps = []
  } = config;

  return (prevProps, nextProps) => {
    // ✅ Comparer props primitives
    for (const prop of primitiveProps) {
      if (ignoreProps.includes(prop)) continue;
      if (prevProps[prop] !== nextProps[prop]) return false;
    }

    // ✅ Comparer props objets (shallow)
    for (const prop of objectProps) {
      if (ignoreProps.includes(prop)) continue;
      
      const prev = prevProps[prop];
      const next = nextProps[prop];

      // Si les deux sont null/undefined, égal
      if (prev == null && next == null) continue;
      
      // Si un seul est null/undefined, différent
      if (prev == null || next == null) return false;

      // Si chemins profonds spécifiés pour cette prop
      if (deepPaths[prop]) {
        if (!deepEqualPaths(prev, next, { paths: deepPaths[prop] })) {
          return false;
        }
      } else {
        // Comparaison shallow par défaut
        if (prev !== next) return false;
      }
    }

    // ✅ Comparer props arrays
    for (const prop of arrayProps) {
      if (ignoreProps.includes(prop)) continue;
      
      const prev = prevProps[prop];
      const next = nextProps[prop];

      // Si comparateur personnalisé fourni dans config
      const customComparator = config.arrayComparators?.[prop];
      if (customComparator) {
        if (!shallowEqualArrays(prev, next, customComparator)) {
          return false;
        }
      } else {
        if (!shallowEqualArrays(prev, next)) {
          return false;
        }
      }
    }

    // ✅ Ignorer les props non spécifiées (callbacks, etc.)
    // Si on arrive ici, toutes les props importantes sont égales
    return true;
  };
}

/**
 * Crée une fonction de comparaison simple pour props primitives uniquement
 * 
 * @param {Array<string>} props - Noms des props à comparer
 * @returns {Function} Fonction de comparaison pour React.memo
 */
export function createSimpleMemoComparator(props) {
  return (prevProps, nextProps) => {
    return props.every(prop => prevProps[prop] === nextProps[prop]);
  };
}

/**
 * Compare deux meals pour MealList
 * 
 * @param {Object} mealA - Premier meal
 * @param {Object} mealB - Second meal
 * @returns {boolean} True si meals égaux
 */
export function compareMeals(mealA, mealB) {
  if (mealA === mealB) return true;
  if (!mealA || !mealB) return false;

  return (
    mealA.id === mealB.id &&
    mealA.type === mealB.type &&
    mealA.totalCalories === mealB.totalCalories &&
    mealA.totalProtein === mealB.totalProtein &&
    mealA.totalCarbs === mealB.totalCarbs &&
    mealA.totalFat === mealB.totalFat &&
    mealA.timestamp === mealB.timestamp
  );
}

/**
 * Compare deux dailyTotals pour DailyTotalsCard
 * 
 * @param {Object} totalsA - Premiers totaux
 * @param {Object} totalsB - Seconds totaux
 * @returns {boolean} True si totaux égaux
 */
export function compareDailyTotals(totalsA, totalsB) {
  if (totalsA === totalsB) return true;
  if (!totalsA || !totalsB) return false;

  return (
    totalsA.calories === totalsB.calories &&
    totalsA.protein === totalsB.protein &&
    totalsA.carbs === totalsB.carbs &&
    totalsA.fat === totalsB.fat &&
    totalsA.complianceScore === totalsB.complianceScore &&
    totalsA.waterIntake === totalsB.waterIntake &&
    totalsA.targetCalories === totalsB.targetCalories &&
    totalsA.targetProtein === totalsB.targetProtein &&
    totalsA.targetCarbs === totalsB.targetCarbs &&
    totalsA.targetFat === totalsB.targetFat
  );
}

