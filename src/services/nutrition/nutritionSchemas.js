/**
 * nutritionSchemas.js
 * 
 * Schémas Zod pour validation type-safe des données nutrition
 * 
 * ✅ PHASE 10.2 : Validation robuste avec Zod partout
 * 
 * - Validation complète des structures de données
 * - Limites de taille et plages de valeurs pour protection DoS
 * - Validation des types et formats (dates, nombres, etc.)
 * - Support données optionnelles et valeurs par défaut
 * - Messages d'erreur descriptifs pour debugging
 * 
 * @module services/nutrition/nutritionSchemas
 */

import { z } from 'zod';

// ==================== HELPERS ====================

/**
 * Regex pour validation format date YYYY-MM-DD
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validation date avec format strict YYYY-MM-DD
 */
const dateStringSchema = z.string()
  .regex(DATE_REGEX, 'Format date invalide. Doit être YYYY-MM-DD')
  .refine((date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Date invalide');

/**
 * Validation ISO timestamp (date + heure)
 */
const isoTimestampSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Format timestamp invalide. Doit être ISO 8601')
  .refine((ts) => {
    const d = new Date(ts);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Timestamp invalide');

/**
 * Schéma pour valeurs nutritionnelles (positives ou nulles)
 */
const nutritionValueSchema = z.number()
  .nonnegative('Les valeurs nutritionnelles doivent être positives ou nulles')
  .max(10000, 'Valeur nutritionnelle trop élevée (>10,000)'); // Protection DoS

/**
 * Schéma pour ratios/macros (0-100%)
 */
const percentageSchema = z.number()
  .min(0, 'Le pourcentage doit être >= 0')
  .max(100, 'Le pourcentage doit être <= 100');

// ==================== SCHEMAS DAILY MEAL ====================

/**
 * Schéma pour un repas individuel dans dailyMeal
 */
const mealReferenceSchema = z.object({
  id: z.string().min(1, 'ID repas requis'),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Type de repas invalide (breakfast, lunch, dinner, snack)' })
  }).optional(),
  name: z.string().max(200, 'Nom repas trop long (>200 caractères)').optional()
}).optional();

/**
 * Schéma pour dailyTotals (totaux calculés avec métadonnées)
 * 
 * ✅ PHASE 10.2 : Ajouté pour compatibilité avec données existantes
 */
const dailyTotalsSchema = z.object({
  calories: nutritionValueSchema.optional(),
  protein: nutritionValueSchema.optional(),
  carbs: nutritionValueSchema.optional(),
  fat: nutritionValueSchema.optional(),
  fiber: nutritionValueSchema.optional(),
  sugar: nutritionValueSchema.optional(),
  sodium: nutritionValueSchema.optional(),
  
  // Scores et ratios (optionnels)
  complianceScore: z.number().min(0).max(100).optional(),
  proteinPercent: percentageSchema.optional(),
  carbsPercent: percentageSchema.optional(),
  fatPercent: percentageSchema.optional(),
  
  // Hydratation (optionnel, peut être intégré dans dailyTotals)
  waterIntake: z.number().nonnegative().max(20000).optional(),
  targetWater: z.number().positive().max(20000).optional(),
  complianceWater: z.number().optional()
}).optional();

/**
 * Schéma principal pour DailyMeal
 * 
 * Représente les données d'un jour complet (totaux, programme actif, etc.)
 */
export const dailyMealSchema = z.object({
  // Clé primaire
  date: dateStringSchema,
  
  // Programme actif (optionnel, peut être null dans données existantes)
  programId: z.string()
    .min(1, 'ID programme invalide')
    .nullable()
    .optional()
    .transform(val => val === null ? undefined : val), // Normaliser null → undefined
  
  // ✅ Champs existants dans IndexedDB (compatibilité ascendante)
  isCatchup: z.boolean().optional(), // Indique si c'est un "catch-up" (rattrapage)
  mealIds: z.array(z.string()).optional(), // Tableau d'IDs de repas (références)
  dailyTotals: dailyTotalsSchema, // Totaux calculés avec métadonnées
  
  // Totaux nutritionnels (optionnels, calculés automatiquement)
  // Note: Ces champs peuvent être dupliqués avec dailyTotals, mais on les garde pour compatibilité
  totalCalories: nutritionValueSchema.optional(),
  totalProtein: nutritionValueSchema.optional(),
  totalCarbs: nutritionValueSchema.optional(),
  totalFat: nutritionValueSchema.optional(),
  totalFiber: nutritionValueSchema.optional(),
  totalSugar: nutritionValueSchema.optional(),
  totalSodium: nutritionValueSchema.optional(),
  
  // État/complétude
  isComplete: z.boolean().optional(),
  
  // Références repas (optionnel, pour compatibilité)
  meals: z.array(mealReferenceSchema).optional(),
  
  // Notes/journal (optionnel)
  notes: z.string().max(5000, 'Notes trop longues (>5000 caractères)').optional(),
  
  // Métadonnées
  lastModified: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema.optional(),
  
  // ✅ OPTIMISATION Phase 15.3 : Version pour optimistic locking (détection modifications concurrentes)
  version: z.number().int().nonnegative('La version doit être un entier positif ou nul').optional().default(0),

  // Multi-utilisateur (IndexedDB scoppé par compte)
  userId: z.string().min(1, 'userId invalide').optional()
}).strict(); // Interdit champs non définis (mais on a ajouté tous les champs existants)

// ==================== SCHEMAS MEAL ====================

/**
 * Schéma pour nutrition d'un aliment (par 100g)
 */
const nutritionPer100Schema = z.object({
  calories: nutritionValueSchema.optional(),
  protein: nutritionValueSchema.optional(),
  carbs: nutritionValueSchema.optional(),
  fat: nutritionValueSchema.optional(),
  fiber: nutritionValueSchema.optional(),
  sugar: nutritionValueSchema.optional(),
  sodium: nutritionValueSchema.optional(),
  
  // Micronutriments optionnels
  vitaminC: nutritionValueSchema.optional(),
  calcium: nutritionValueSchema.optional(),
  iron: nutritionValueSchema.optional(),
  vitaminA: nutritionValueSchema.optional(),
  vitaminD: nutritionValueSchema.optional(),
  vitaminE: nutritionValueSchema.optional(),
  vitaminK: nutritionValueSchema.optional(),
  thiamin: nutritionValueSchema.optional(),
  riboflavin: nutritionValueSchema.optional(),
  niacin: nutritionValueSchema.optional(),
  vitaminB6: nutritionValueSchema.optional(),
  folate: nutritionValueSchema.optional(),
  vitaminB12: nutritionValueSchema.optional(),
  magnesium: nutritionValueSchema.optional(),
  phosphorus: nutritionValueSchema.optional(),
  potassium: nutritionValueSchema.optional(),
  zinc: nutritionValueSchema.optional()
}).optional();

/**
 * Schéma pour un aliment dans un repas
 */
const foodItemSchema = z.object({
  id: z.string().min(1, 'ID aliment requis'),
  name: z.string().min(1, 'Nom aliment requis').max(200, 'Nom aliment trop long (>200 caractères)'),
  quantity: z.number().positive('La quantité doit être positive').max(10000, 'Quantité trop élevée (>10kg)'),
  unit: z.enum(['g', 'kg', 'ml', 'l', 'piece', 'cup', 'tbsp', 'tsp'], {
    errorMap: () => ({ message: 'Unité invalide (g, kg, ml, l, piece, cup, tbsp, tsp)' })
  }).default('g'),
  
  // Nutrition par 100g (optionnel)
  nutritionPer100: nutritionPer100Schema,
  
  // Nutrition calculée pour cette quantité (optionnel)
  nutrition: z.object({
    calories: nutritionValueSchema.optional(),
    protein: nutritionValueSchema.optional(),
    carbs: nutritionValueSchema.optional(),
    fat: nutritionValueSchema.optional(),
    fiber: nutritionValueSchema.optional(),
    sugar: nutritionValueSchema.optional(),
    sodium: nutritionValueSchema.optional()
  }).optional(),

  // Format plat utilisé par MealEntryForm / FoodSearch (legacy + UI actuelle)
  caloriesPer100: nutritionValueSchema.optional(),
  proteinPer100: nutritionValueSchema.optional(),
  carbsPer100: nutritionValueSchema.optional(),
  fatPer100: nutritionValueSchema.optional(),
  fiberPer100: nutritionValueSchema.optional(),
  sugarPer100: nutritionValueSchema.optional(),
  sodiumPer100: nutritionValueSchema.optional(),
  calories: nutritionValueSchema.optional(),
  protein: nutritionValueSchema.optional(),
  carbs: nutritionValueSchema.optional(),
  fat: nutritionValueSchema.optional(),
  
  // Source aliment (optionnel)
  source: z.enum(['manual', 'openfoodfacts', 'usda', 'favorite', 'unknown', 'custom', 'voice', 'detection'], {
    errorMap: () => ({ message: 'Source invalide' })
  }).optional(),
  sourceId: z.string().max(200, 'ID source trop long').optional().nullable(),
  
  // Métadonnées
  brand: z.string().max(100, 'Marque trop longue (>100 caractères)').optional(),
  barcode: z.string().max(50, 'Code-barres trop long (>50 caractères)').optional(),
  nutriScore: z.string().max(3, 'Nutri-Score trop long').optional().nullable(),

  // Reconnaissance photo (MobileNet / FoodPhotoScanner)
  className: z.string().max(200).optional(),
  confidence: z.number().min(0).max(1).optional(),
  imageUrl: z.union([z.string().max(2000), z.null()]).optional(),
  estimatedPortion: z.number().positive('Portion estimée invalide').max(10000).optional(),
  estimatedCalories: nutritionValueSchema.optional(),

  needsManualInput: z.boolean().optional()
}).strict();

/**
 * Schéma principal pour Meal
 * 
 * Représente un repas individuel (petit-déjeuner, déjeuner, dîner, collation)
 */
export const mealSchema = z.object({
  // Clé primaire
  id: z.string().min(1, 'ID repas requis'),
  
  // Date et type
  date: dateStringSchema,
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Type de repas invalide (breakfast, lunch, dinner, snack)' })
  }),
  
  // Référence dailyMeal (optionnel, pour cohérence)
  dailyMealId: z.string().optional(),
  
  // Nom du repas (optionnel)
  name: z.string().max(200, 'Nom repas trop long (>200 caractères)').optional(),
  
  // Aliments composant le repas
  foods: z.array(foodItemSchema)
    .min(1, 'Un repas doit contenir au moins un aliment')
    .max(100, 'Un repas ne peut pas contenir plus de 100 aliments'), // Protection DoS
  
  // Totaux nutritionnels (optionnels, calculés automatiquement)
  totalCalories: nutritionValueSchema.optional(),
  totalProtein: nutritionValueSchema.optional(),
  totalCarbs: nutritionValueSchema.optional(),
  totalFat: nutritionValueSchema.optional(),
  totalFiber: nutritionValueSchema.optional(),
  totalSugar: nutritionValueSchema.optional(),
  totalSodium: nutritionValueSchema.optional(),
  
  // Notes/journal (optionnel ; null accepté depuis l’UI)
  notes: z.preprocess(
    (v) => (v === null || v === '') ? undefined : v,
    z.string().max(2000, 'Notes trop longues (>2000 caractères)').optional()
  ),
  
  // Métadonnées
  timestamp: isoTimestampSchema.optional(),
  lastModified: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema.optional(),
  
  // ✅ OPTIMISATION Phase 15.3 : Version pour optimistic locking (détection modifications concurrentes)
  version: z.number().int().nonnegative('La version doit être un entier positif ou nul').optional().default(0),

  // Multi-utilisateur
  userId: z.string().min(1, 'userId invalide').optional()
}).strict();

// ==================== SCHEMAS PROGRAM ====================

/**
 * Schéma pour objectifs nutritionnels d'un programme
 */
const nutritionGoalsSchema = z.object({
  calories: z.number().int().positive('Les calories doivent être positives').max(10000, 'Objectif calories trop élevé (>10,000)').optional(),
  protein: z.number().int().positive('Les protéines doivent être positives').max(1000, 'Objectif protéines trop élevé (>1kg)').optional(),
  carbs: z.number().int().positive('Les glucides doivent être positifs').max(1000, 'Objectif glucides trop élevé (>1kg)').optional(),
  fat: z.number().int().positive('Les lipides doivent être positifs').max(1000, 'Objectif lipides trop élevé (>1kg)').optional(),
  fiber: z.number().int().positive('Les fibres doivent être positives').max(200, 'Objectif fibres trop élevé (>200g)').optional(),
  
  // Ratios macros (optionnels, pourcentage)
  proteinRatio: percentageSchema.optional(),
  carbsRatio: percentageSchema.optional(),
  fatRatio: percentageSchema.optional()
}).passthrough().optional(); // ✅ Optionnel ; passthrough pour champs métiers additionnels

/**
 * Schéma principal pour Program
 * 
 * Représente un programme nutritionnel (cutting, bulking, maintenance, etc.)
 */
const planProfileSchema = z.object({
  heightCm: z.number().min(120).max(230).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  age: z.number().int().min(14).max(100).optional(),
  baselineWeightKg: z.number().positive().optional(),
  targetWeightKg: z.number().positive().max(400).optional(),
  targetWeightDeltaKg: z.number().min(-80).max(80).optional(),
  bodyFatPercent: z.number().min(3).max(65).nullable().optional(),
  activityFactor: z.number().min(1).max(2.6).optional(),
  impedanceSourceDate: dateStringSchema.optional().nullable(),
  estimatedBmr: z.number().optional(),
  estimatedTdee: z.number().optional(),
  estimateNote: z.string().max(2000).optional(),
  lastAdaptiveAt: isoTimestampSchema.optional()
}).optional();

const mealPlanSlotFoodSchema = z.object({
  foodId: z.string(),
  name: z.string(),
  approximateGrams: z.number().optional(),
  notes: z.string().max(500).optional(),
  kcalRounded: z.number().optional(),
  proteinRounded: z.number().optional()
});

const mealPlanSlotSchema = z.object({
  slot: z.string().max(40),
  label: z.string().max(80),
  foods: z.array(mealPlanSlotFoodSchema).max(24)
});

const mealPlanPreferencesSchema = z.object({
  lovedFoodIds: z.array(z.string()).max(200).optional(),
  avoidedFoodIds: z.array(z.string()).max(200).optional(),
  openFoodIds: z.array(z.string()).max(200).optional(),
  selectedBankFoodIds: z.array(z.string()).max(120).optional(),
  maxWeeklyFoodVariety: z.number().int().min(5).max(100).optional(),
  selectedExerciseKeys: z.array(z.string()).max(400).optional(),
  selectedSportProgramId: z.string().max(120).optional(),
  snacksPerDay: z.number().int().min(1).max(2).optional(),
  generatedMealPlan: z.array(mealPlanSlotSchema).max(12).optional()
}).optional();

const programGoalPreprocess = (g) => {
  if (g == null || g === '') return undefined;
  if (typeof g !== 'string') return g;
  const aliases = {
    bulk: 'bulking',
    cut: 'cutting',
    maintain: 'maintenance',
    stabilization: 'maintenance'
  };
  return aliases[g] ?? g;
};

export const programSchema = z.object({
  // Clé primaire
  id: z.string().min(1, 'ID programme requis'),
  
  // Nom et description
  name: z.string().min(1, 'Nom programme requis').max(100, 'Nom programme trop long (>100 caractères)'),
  description: z.string().max(2000, 'Description trop longue (>2000 caractères)').optional(),
  
  // Objectifs (aliases UI : bulk → bulking, etc.)
  goal: z.preprocess(
    programGoalPreprocess,
    z.enum(['cutting', 'bulking', 'maintenance', 'recomp', 'custom', 'lean_bulk'], {
      errorMap: () => ({
        message: 'Objectif invalide (cutting, bulking, maintenance, recomp, custom, lean_bulk)'
      })
    }).optional()
  ),
  
  // Objectifs nutritionnels
  nutritionGoals: nutritionGoalsSchema,
  
  // Dates (optionnel)
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  
  // État actif
  isActive: z.boolean().optional(),
  
  // Notes/journal (optionnel)
  notes: z.string().max(5000, 'Notes trop longues (>5000 caractères)').optional(),
  
  // Métadonnées
  lastModified: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema.optional(),
  
  // ✅ OPTIMISATION Phase 15.3 : Version pour optimistic locking (détection modifications concurrentes)
  version: z.number().int().nonnegative('La version doit être un entier positif ou nul').optional().default(0),

  userId: z.string().min(1, 'userId invalide').optional(),

  /** Programme saisi à la main vs généré (assistant repas + impédance requise) */
  creationMode: z.enum(['manual', 'generated']).optional(),

  // Assistant programme (profil + banque + exercices)
  planProfile: planProfileSchema,
  mealPlanPreferences: mealPlanPreferencesSchema,

  // Champs directs (formulaire legacy)
  targetCalories: nutritionValueSchema.optional(),
  targetProtein: nutritionValueSchema.optional(),
  targetCarbs: nutritionValueSchema.optional(),
  targetFat: nutritionValueSchema.optional(),
  adjustForWorkout: z.boolean().optional(),
  workoutDayCalories: nutritionValueSchema.optional().nullable(),
  restDayCalories: nutritionValueSchema.optional().nullable(),
  duration: z.number().int().min(1).max(730).optional(),
  isArchived: z.boolean().optional(),

  targetProteinPercent: percentageSchema.optional(),
  targetCarbsPercent: percentageSchema.optional(),
  targetFatPercent: percentageSchema.optional(),
  targetWater: nutritionValueSchema.optional()
}).strict();

// ==================== SCHEMAS FAVORITE FOOD ====================

/**
 * Schéma principal pour FavoriteFood
 * 
 * Représente un aliment favori (sauvegardé pour réutilisation rapide)
 */
export const favoriteFoodSchema = z.object({
  // Clé primaire
  id: z.string().min(1, 'ID aliment favori requis'),
  
  // Nom et description
  name: z.string().min(1, 'Nom aliment requis').max(200, 'Nom aliment trop long (>200 caractères)'),
  brand: z.string().max(100, 'Marque trop longue (>100 caractères)').optional(),
  
  // Nutrition par 100g (optionnel)
  nutritionPer100: nutritionPer100Schema,
  
  // Source aliment (optionnel)
  source: z.enum(['manual', 'openfoodfacts', 'usda', 'custom'], {
    errorMap: () => ({ message: 'Source invalide (manual, openfoodfacts, usda, custom)' })
  }).optional(),
  sourceId: z.string().max(100, 'ID source trop long (>100 caractères)').optional().nullable(),
  
  // Code-barres (optionnel)
  barcode: z.string().max(50, 'Code-barres trop long (>50 caractères)').optional(),

  // Index / filtres UI
  category: z.string().max(100).optional(),
  isFavorite: z.boolean().optional(),

  userId: z.string().min(1, 'userId invalide').optional(),
  
  // Métadonnées d'utilisation
  lastUsed: dateStringSchema.optional(),
  usageCount: z.number().int().nonnegative('Usage count doit être >= 0').optional(),
  
  // Notes/journal (optionnel)
  notes: z.string().max(1000, 'Notes trop longues (>1000 caractères)').optional(),
  
  // Métadonnées
  lastModified: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema.optional()
}).strict();

// ==================== SCHEMAS HYDRATION LOG ====================

/**
 * Schéma pour une entrée individuelle d'hydratation
 */
const hydrationEntrySchema = z.object({
  id: z.string().min(1, 'ID entrée hydratation requis'),
  timestamp: isoTimestampSchema,
  amount: z.number().positive('La quantité d\'eau doit être positive').max(5000, 'Quantité d\'eau trop élevée (>5L)'),
  type: z.enum(['manual', 'bottle', 'glass', 'cup', 'exercise', 'other'], {
    errorMap: () => ({ message: 'Type d\'entrée invalide (manual, bottle, glass, cup, exercise, other)' })
  }).optional(),
  notes: z.string().max(500, 'Notes trop longues (>500 caractères)').optional()
}).strict();

/**
 * Schéma principal pour HydrationLog
 * 
 * Représente l'hydratation d'un jour complet
 */
export const hydrationLogSchema = z.object({
  // Clé primaire
  date: dateStringSchema,
  
  // Totaux
  waterIntake: z.number().nonnegative('L\'apport d\'eau doit être >= 0').max(20000, 'Apport d\'eau trop élevé (>20L)'), // ml
  targetWater: z.number().positive('L\'objectif d\'eau doit être positif').max(20000, 'Objectif d\'eau trop élevé (>20L)').optional(), // ml, défaut: 2000
  
  // Entrées détaillées (optionnel)
  entries: z.array(hydrationEntrySchema)
    .max(200, 'Un jour ne peut pas contenir plus de 200 entrées d\'hydratation') // Protection DoS
    .optional(),
  
  // Notes/journal (optionnel)
  notes: z.string().max(2000, 'Notes trop longues (>2000 caractères)').optional(),
  
  // Métadonnées
  lastModified: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema.optional(),

  userId: z.string().min(1, 'userId invalide').optional()
}).strict();

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Valide un DailyMeal avec schéma Zod
 * 
 * @param {Object} dailyMeal - Objet DailyMeal à valider
 * @returns {Object} Objet validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateDailyMeal(dailyMeal) {
  return dailyMealSchema.parse(dailyMeal);
}

/**
 * Valide un Meal avec schéma Zod
 * 
 * @param {Object} meal - Objet Meal à valider
 * @returns {Object} Objet validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateMeal(meal) {
  return mealSchema.parse(meal);
}

/**
 * Valide un Program avec schéma Zod
 * 
 * @param {Object} program - Objet Program à valider
 * @returns {Object} Objet validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateProgram(program) {
  return programSchema.parse(program);
}

/**
 * Valide un FavoriteFood avec schéma Zod
 * 
 * @param {Object} favoriteFood - Objet FavoriteFood à valider
 * @returns {Object} Objet validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateFavoriteFood(favoriteFood) {
  return favoriteFoodSchema.parse(favoriteFood);
}

/**
 * Valide un HydrationLog avec schéma Zod
 * 
 * @param {Object} hydrationLog - Objet HydrationLog à valider
 * @returns {Object} Objet validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateHydrationLog(hydrationLog) {
  return hydrationLogSchema.parse(hydrationLog);
}

/**
 * Valide un objet avec schéma Zod de manière sûre (catch erreurs)
 * 
 * @param {z.ZodSchema} schema - Schéma Zod à utiliser
 * @param {Object} data - Données à valider
 * @returns {Object|null} Objet validé ou null si erreur
 */
export function safeValidate(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[safeValidate] Erreur validation Zod:', error.errors);
      return null;
    }
    throw error;
  }
}

// ==================== SCHEMAS API EXTERNES ====================

/**
 * Schéma pour produit OpenFoodFacts formaté
 * 
 * ✅ PHASE 10.3 : Validation données externes (APIs)
 * 
 * Structure retournée par formatProductData dans openFoodFactsService.js
 */
export const openFoodFactsProductSchema = z.object({
  // Identifiants
  id: z.string().min(1, 'ID produit requis'),
  name: z.string().min(1, 'Nom produit requis').max(500, 'Nom produit trop long (>500 caractères)'),
  brand: z.string().max(200, 'Marque trop longue (>200 caractères)').optional(),
  
  // Nutrition (par 100g) - utilise nutritionPer100Schema existant
  nutritionPer100: nutritionPer100Schema,
  
  // Scores nutritionnels (optionnels)
  nutriScore: z.enum(['A', 'B', 'C', 'D', 'E']).nullable().optional(),
  novaGroup: z.number().int().min(1).max(4).nullable().optional(), // 1-4 (ultra-transformé)
  ecoScore: z.enum(['A', 'B', 'C', 'D', 'E']).nullable().optional(),
  
  // Sécurité (optionnels)
  allergens: z.array(z.string()).max(50, 'Trop d\'allergènes (>50)').optional(),
  additives: z.array(z.string()).max(100, 'Trop d\'additifs (>100)').optional(),
  
  // Images (optionnels)
  imageUrl: z.string().url('URL image invalide').max(1000, 'URL trop longue (>1000 caractères)').nullable().optional(),
  
  // Quantité produit
  quantity: z.number().positive('La quantité doit être positive').max(10000, 'Quantité trop élevée (>10kg)').optional(),
  
  // Source (fixe pour OpenFoodFacts)
  source: z.literal('openfoodfacts'),
  sourceId: z.string().min(1, 'ID source requis').max(100, 'ID source trop long (>100 caractères)'),
  
  // Métadonnées supplémentaires (optionnels)
  categories: z.array(z.string()).max(50, 'Trop de catégories (>50)').optional(),
  labels: z.array(z.string()).max(50, 'Trop de labels (>50)').optional(),
  packaging: z.array(z.string()).max(50, 'Trop de packaging (>50)').optional()
}).strict();

/**
 * Schéma pour aliment USDA formaté
 * 
 * ✅ PHASE 10.3 : Validation données externes (APIs)
 * 
 * Structure retournée par formatFood dans usdaService.js
 */
export const usdaFoodSchema = z.object({
  // Identifiants
  id: z.string().min(1, 'ID aliment requis').startsWith('usda_', 'ID USDA doit commencer par usda_'),
  name: z.string().min(1, 'Nom aliment requis').max(500, 'Nom aliment trop long (>500 caractères)'),
  brand: z.string().max(200, 'Marque trop longue (>200 caractères)').optional(),
  
  // Nutrition (par 100g) - utilise nutritionPer100Schema existant
  nutritionPer100: nutritionPer100Schema,
  
  // Catégorie (optionnel)
  category: z.string().max(200, 'Catégorie trop longue (>200 caractères)').optional(),
  
  // Source (fixe pour USDA)
  source: z.literal('usda'),
  sourceId: z.string().min(1, 'ID source requis').max(100, 'ID source trop long (>100 caractères)'),
  
  // Métadonnées (optionnels)
  dataType: z.string().max(50, 'DataType trop long (>50 caractères)').nullable().optional(),
  publicationDate: z.string().max(50, 'Date publication trop longue (>50 caractères)').nullable().optional()
}).strict();

/**
 * Schéma pour produit/aliment générique (OpenFoodFacts ou USDA)
 * 
 * ✅ PHASE 10.3 : Union type pour accepter les deux formats
 */
export const externalFoodProductSchema = z.union([
  openFoodFactsProductSchema,
  usdaFoodSchema
]);

/**
 * Schéma pour réponse API OpenFoodFacts (recherche)
 * 
 * ✅ PHASE 10.3 : Validation réponse brute API avant formatage
 */
export const openFoodFactsSearchResponseSchema = z.object({
  products: z.array(z.any()) // Produits bruts (seront validés après formatage)
    .max(100, 'Trop de produits dans la réponse (>100)') // Protection DoS
    .optional()
}).passthrough(); // Accepter champs supplémentaires de l'API

/**
 * Schéma pour réponse API OpenFoodFacts (code-barres)
 * 
 * ✅ PHASE 10.3 : Validation réponse brute API avant formatage
 */
export const openFoodFactsBarcodeResponseSchema = z.object({
  status: z.number().int().min(0).max(1), // 0 = non trouvé, 1 = trouvé
  product: z.any().optional() // Produit brut (sera validé après formatage)
}).passthrough(); // Accepter champs supplémentaires de l'API

/**
 * Schéma pour réponse API USDA (recherche)
 * 
 * ✅ PHASE 10.3 : Validation réponse brute API avant formatage
 */
export const usdaSearchResponseSchema = z.object({
  foods: z.array(z.any()) // Aliments bruts (seront validés après formatage)
    .max(200, 'Trop d\'aliments dans la réponse (>200)') // Protection DoS
    .optional()
}).passthrough(); // Accepter champs supplémentaires de l'API

/**
 * Schéma pour réponse API USDA (FDC ID)
 * 
 * ✅ PHASE 10.3 : Validation réponse brute API avant formatage
 */
export const usdaFoodResponseSchema = z.object({
  fdcId: z.number().int().positive('FDC ID doit être positif'),
  description: z.string().optional(),
  brandOwner: z.string().optional(),
  foodNutrients: z.array(z.any()).optional(), // Nutriments bruts (seront extraits)
  foodCategory: z.object({
    description: z.string().optional()
  }).optional(),
  dataType: z.string().optional(),
  publicationDate: z.string().optional()
}).passthrough(); // Accepter champs supplémentaires de l'API

// ==================== VALIDATION FUNCTIONS API EXTERNES ====================

/**
 * Valide un produit OpenFoodFacts formaté avec schéma Zod
 * 
 * @param {Object} product - Produit formaté à valider
 * @returns {Object} Produit validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateOpenFoodFactsProduct(product) {
  return openFoodFactsProductSchema.parse(product);
}

/**
 * Valide un aliment USDA formaté avec schéma Zod
 * 
 * @param {Object} food - Aliment formaté à valider
 * @returns {Object} Aliment validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateUSDAFood(food) {
  return usdaFoodSchema.parse(food);
}

/**
 * Valide un produit/aliment externe (OpenFoodFacts ou USDA) avec schéma Zod
 * 
 * @param {Object} product - Produit/aliment formaté à valider
 * @returns {Object} Produit/aliment validé et normalisé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateExternalFoodProduct(product) {
  return externalFoodProductSchema.parse(product);
}

/**
 * Valide une réponse API OpenFoodFacts (recherche) avec schéma Zod
 * 
 * @param {Object} response - Réponse brute API à valider
 * @returns {Object} Réponse validée
 * @throws {z.ZodError} Si validation échoue
 */
export function validateOpenFoodFactsSearchResponse(response) {
  return openFoodFactsSearchResponseSchema.parse(response);
}

/**
 * Valide une réponse API OpenFoodFacts (code-barres) avec schéma Zod
 * 
 * @param {Object} response - Réponse brute API à valider
 * @returns {Object} Réponse validée
 * @throws {z.ZodError} Si validation échoue
 */
export function validateOpenFoodFactsBarcodeResponse(response) {
  return openFoodFactsBarcodeResponseSchema.parse(response);
}

/**
 * Valide une réponse API USDA (recherche) avec schéma Zod
 * 
 * @param {Object} response - Réponse brute API à valider
 * @returns {Object} Réponse validée
 * @throws {z.ZodError} Si validation échoue
 */
export function validateUSDASearchResponse(response) {
  return usdaSearchResponseSchema.parse(response);
}

/**
 * Valide une réponse API USDA (FDC ID) avec schéma Zod
 * 
 * @param {Object} response - Réponse brute API à valider
 * @returns {Object} Réponse validée
 * @throws {z.ZodError} Si validation échoue
 */
export function validateUSDAFoodResponse(response) {
  return usdaFoodResponseSchema.parse(response);
}

// ==================== SCHÉMAS POUR CALCULS ====================

/**
 * ✅ PHASE 10.5 : Schéma pour validation meal dans calculs
 * 
 * Version simplifiée et optimisée pour calculs (pas besoin de tous les champs)
 * Accepte meals partiels (seulement champs nécessaires pour calculs)
 */
export const mealForCalculationSchema = z.object({
  totalCalories: z.number().nonnegative().finite().default(0),
  totalProtein: z.number().nonnegative().finite().default(0),
  totalCarbs: z.number().nonnegative().finite().default(0),
  totalFat: z.number().nonnegative().finite().default(0),
  waterIntake: z.number().nonnegative().finite().optional()
}).passthrough(); // Accepter autres champs (id, date, etc.) sans validation

/**
 * ✅ PHASE 10.5 : Schéma pour validation programme dans calculs
 * 
 * Version simplifiée pour calculs (seulement targets nécessaires)
 */
export const programForCalculationSchema = z.object({
  targetCalories: z.number().positive().finite().min(500).max(10000).optional(),
  targetProtein: z.number().positive().finite().min(10).max(500).optional(),
  targetCarbs: z.number().positive().finite().min(10).max(1000).optional(),
  targetFat: z.number().positive().finite().min(10).max(500).optional(),
  targetWater: z.number().positive().finite().min(500).max(20000).optional()
}).passthrough(); // Accepter autres champs (id, name, etc.) sans validation

/**
 * ✅ PHASE 10.5 : Schéma pour validation plage de dates
 */
export const dateRangeSchema = z.object({
  startDate: z.string().regex(DATE_REGEX, 'Format startDate invalide. Doit être YYYY-MM-DD'),
  endDate: z.string().regex(DATE_REGEX, 'Format endDate invalide. Doit être YYYY-MM-DD')
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: 'startDate doit être <= endDate'
});

/**
 * ✅ PHASE 10.5 : Valide un meal pour utilisation dans calculs
 * 
 * @param {Object} meal - Meal à valider
 * @returns {Object} Meal validé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateMealForCalculation(meal) {
  return mealForCalculationSchema.parse(meal);
}

/**
 * ✅ PHASE 10.5 : Valide un programme pour utilisation dans calculs
 * 
 * @param {Object} program - Programme à valider
 * @returns {Object} Programme validé
 * @throws {z.ZodError} Si validation échoue
 */
export function validateProgramForCalculation(program) {
  return programForCalculationSchema.parse(program);
}

/**
 * ✅ PHASE 10.5 : Valide une plage de dates
 * 
 * @param {Object} range - Plage de dates à valider
 * @returns {Object} Plage validée
 * @throws {z.ZodError} Si validation échoue
 */
export function validateDateRange(range) {
  return dateRangeSchema.parse(range);
}

// ==================== EXPORTS ====================

// Note: Les schémas suivants sont déjà exportés avec 'export const' ci-dessus :
// - dailyMealSchema, mealSchema, programSchema, favoriteFoodSchema, hydrationLogSchema
// - openFoodFactsProductSchema, usdaFoodSchema, externalFoodProductSchema
// - openFoodFactsSearchResponseSchema, openFoodFactsBarcodeResponseSchema
// - usdaSearchResponseSchema, usdaFoodResponseSchema
// On exporte ici uniquement les schémas internes non exportés directement.

export {
  nutritionPer100Schema,
  foodItemSchema,
  nutritionGoalsSchema,
  hydrationEntrySchema,
  dailyTotalsSchema
};


